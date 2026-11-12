import {
  getAllDynamicQRs,
  recordPayment,
  updateQRAutoRenew,
  downgradeQRToFreePublic,
  createDeveloperNotification,
  expireDueQRsIfAny,
  persistSliceToCloud,
  reconcileCloudSlugMigrations,
} from './db';
import {
  getActiveMercadoPagoConfig,
  createSavedCardTokenOnMercadoPago,
  chargeMercadoPagoCard,
} from './mercadopago';
import {
  PRO_GRACE_RETRY_DAYS,
  PRO_MAX_RETRY_ATTEMPTS,
} from './pro-status';
import { AutoRenewConfig } from './types';

export interface BrasiliaSlotInfo {
  brtDate: string;
  brtHour: number;
  slot: '10h' | '18h';
  slotKey: string;
}

export function getBrasiliaSlotInfo(
  nowMs: number = Date.now(),
  slotOverride?: '10h' | '18h'
): BrasiliaSlotInfo {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date(nowMs));

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value || '00';
  const brtDate = `${get('year')}-${get('month')}-${get('day')}`;
  const rawHour = Number(get('hour'));
  const brtHour = Number.isFinite(rawHour) ? rawHour % 24 : 10;

  const slot: '10h' | '18h' =
    slotOverride || (brtHour >= 18 ? '18h' : '10h');
  return {
    brtDate,
    brtHour,
    slot,
    slotKey: `${brtDate}-${slot}`,
  };
}

export interface BillingCycleSummary {
  slotKey: string;
  checkedCount: number;
  chargedApprovedCount: number;
  retriedFailedCount: number;
  downgradedToFreeCount: number;
  details: Array<{
    slug: string;
    outcome: 'approved' | 'failed_retry' | 'downgraded_free' | 'skipped';
    reason?: string;
    retryCount?: number;
  }>;
}

/**
 * Executes the scheduled recurring billing cycle:
 * - Designed to run twice daily at 10:00 and 18:00 BRT (13:00 & 21:00 UTC on Vercel Cron)
 * - Attempts charge on due subscriptions with saved cards
 * - On failure, retries twice daily (10h & 18h) for up to 5 consecutive days (10 attempts max)
 * - After 5 consecutive days without success, downgrades store to Free, locks PRO features/video, and reverts friendly link
 */
export async function runRecurringBillingCycle(options?: {
  nowMs?: number;
  slotOverride?: '10h' | '18h';
  forceSlot?: boolean;
  targetSlug?: string;
}): Promise<BillingCycleSummary> {
  const nowMs = options?.nowMs || Date.now();
  const slotInfo = getBrasiliaSlotInfo(nowMs, options?.slotOverride);
  const { priceReais } = getActiveMercadoPagoConfig();

  const summary: BillingCycleSummary = {
    slotKey: slotInfo.slotKey,
    checkedCount: 0,
    chargedApprovedCount: 0,
    retriedFailedCount: 0,
    downgradedToFreeCount: 0,
    details: [],
  };

  let didMutate = expireDueQRsIfAny(nowMs);
  const qrs = getAllDynamicQRs().filter(
    (q) =>
      q.slug !== 'demo-restaurante' &&
      q.slug !== 'demo-catalogo' &&
      (!options?.targetSlug || q.slug === options.targetSlug)
  );

  for (const qr of qrs) {
    const auto = qr.autoRenew;
    if (!auto || !auto.enabled) continue;
    summary.checkedCount++;

    const nextBillingMs = new Date(auto.nextBillingAt).getTime();
    if (Number.isFinite(nextBillingMs) && nowMs < nextBillingMs) {
      summary.details.push({
        slug: qr.slug,
        outcome: 'skipped',
        reason: 'Ainda antes da data de renovação.',
      });
      continue;
    }

    const executedSlots = Array.isArray(auto.executedSlots)
      ? [...auto.executedSlots]
      : [];
    const graceStartedAt =
      auto.graceStartedAt || new Date(nowMs).toISOString();
    const graceEndsAt =
      auto.graceEndsAt ||
      new Date(
        new Date(graceStartedAt).getTime() +
          PRO_GRACE_RETRY_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();
    const graceEndsMs = new Date(graceEndsAt).getTime();

    // Already exceeded 5-day retry limit -> immediate downgrade
    if (
      (auto.retryCount || 0) >= PRO_MAX_RETRY_ATTEMPTS ||
      (Number.isFinite(graceEndsMs) && nowMs >= graceEndsMs)
    ) {
      downgradeQRToFreePublic(qr.slug, true);
      summary.downgradedToFreeCount++;
      didMutate = true;
      summary.details.push({
        slug: qr.slug,
        outcome: 'downgraded_free',
        retryCount: auto.retryCount || 0,
        reason: '5 dias consecutivos sem êxito na cobrança.',
      });
      continue;
    }

    // Avoid duplicate charge in the same 10h or 18h slot of the same day unless forceSlot is set
    if (!options?.forceSlot && executedSlots.includes(slotInfo.slotKey)) {
      summary.details.push({
        slug: qr.slug,
        outcome: 'skipped',
        reason: `Tentativa já executada neste turno (${slotInfo.slotKey}).`,
      });
      continue;
    }

    // Outside 10h window if run too early (< 10:00 BRT) unless cron/force
    if (!options?.slotOverride && !options?.forceSlot && slotInfo.brtHour < 10) {
      summary.details.push({
        slug: qr.slug,
        outcome: 'skipped',
        reason: 'Aguardando janela das 10h (Brasília).',
      });
      continue;
    }

    let chargeOk = false;
    let chargePaymentId: string | undefined;
    let failureReason = 'Cartão recusado ou sem saldo disponível.';

    if (!auto.mpCardId || !auto.mpCustomerId) {
      failureReason = 'Cartão salvo inválido ou removido.';
    } else {
      const tokenRes = await createSavedCardTokenOnMercadoPago(auto.mpCardId);
      if (!tokenRes.ok || !tokenRes.token) {
        failureReason =
          tokenRes.error ||
          'Não foi possível validar o cartão salvo para cobrança.';
      } else {
        const payRes = await chargeMercadoPagoCard({
          slug: qr.slug,
          amount: priceReais,
          email: qr.ownerEmail || 'cliente@spotqr.pro',
          fullName: auto.holderName || qr.title,
          cardToken: tokenRes.token,
          paymentMethodId: auto.mpPaymentMethodId,
          customerId: auto.mpCustomerId,
          description: `Renovação Mensal SpotQR PRO (${qr.slug})`,
        });
        chargeOk = payRes.ok && payRes.status === 'approved';
        chargePaymentId = payRes.paymentId;
        if (!chargeOk && payRes.error) {
          failureReason = payRes.error;
        }
      }
    }

    const nowIso = new Date(nowMs).toISOString();
    if (chargeOk) {
      const paymentId =
        chargePaymentId || `auto_mp_${qr.slug}_${Date.now()}`;
      recordPayment(
        paymentId,
        qr.slug,
        'approved',
        priceReais,
        auto.holderName || qr.title,
        qr.ownerEmail || ''
      );
      summary.chargedApprovedCount++;
      didMutate = true;
      summary.details.push({
        slug: qr.slug,
        outcome: 'approved',
        retryCount: 0,
      });
    } else {
      const nextRetryCount = (auto.retryCount || 0) + 1;
      const dayNumber = Math.min(
        PRO_GRACE_RETRY_DAYS,
        Math.ceil(nextRetryCount / 2)
      );
      if (!executedSlots.includes(slotInfo.slotKey)) {
        executedSlots.push(slotInfo.slotKey);
      }

      const history = Array.isArray(auto.history) ? [...auto.history] : [];
      history.unshift({
        timestamp: nowIso,
        slotLabel: `Dia ${dayNumber}/${PRO_GRACE_RETRY_DAYS} • ${slotInfo.slot}`,
        status: 'failed',
        paymentId: chargePaymentId,
        reason: failureReason,
        amount: priceReais,
      });

      const updatedAutoRenew: AutoRenewConfig = {
        ...auto,
        status: 'past_due',
        graceStartedAt,
        graceEndsAt,
        retryCount: nextRetryCount,
        executedSlots,
        lastAttemptAt: nowIso,
        lastError: failureReason,
        history: history.slice(0, 15),
      };

      updateQRAutoRenew(qr.slug, updatedAutoRenew);
      didMutate = true;

      if (
        nextRetryCount >= PRO_MAX_RETRY_ATTEMPTS ||
        (Number.isFinite(graceEndsMs) && nowMs >= graceEndsMs)
      ) {
        downgradeQRToFreePublic(qr.slug, true);
        createDeveloperNotification({
          type: 'subscription_pending',
          title: `⬇️ PRO Rebaixado para Free (${qr.title})`,
          message: `Após ${nextRetryCount} tentativas em 5 dias (10h e 18h), /${qr.slug} voltou para o plano Free.`,
          slug: qr.slug,
          clientName: qr.title,
        });
        summary.downgradedToFreeCount++;
        summary.details.push({
          slug: qr.slug,
          outcome: 'downgraded_free',
          retryCount: nextRetryCount,
          reason: failureReason,
        });
      } else {
        summary.retriedFailedCount++;
        summary.details.push({
          slug: qr.slug,
          outcome: 'failed_retry',
          retryCount: nextRetryCount,
          reason: failureReason,
        });
      }
    }
  }

  if (didMutate) {
    await reconcileCloudSlugMigrations();
    await Promise.all([
      persistSliceToCloud('qrs'),
      persistSliceToCloud('payments'),
      persistSliceToCloud('redirects'),
      persistSliceToCloud('notifications'),
    ]);
  }

  return summary;
}

