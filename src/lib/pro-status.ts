/**
 * Shared helpers for checking PRO plan expiration and formatting countdowns/IDs.
 */

import { AutoRenewConfig } from './types';

export const PRO_RENEWAL_WARNING_DAYS = 10;
export const PRO_GRACE_RETRY_DAYS = 5;
export const PRO_MAX_RETRY_ATTEMPTS = 10; // 5 consecutive days x 2 slots/day (10h & 18h)

export function getEffectiveProExpiryIso(record?: {
  proExpiresAt?: string | null;
  autoRenew?: Pick<
    AutoRenewConfig,
    'enabled' | 'status' | 'graceEndsAt'
  > | null;
} | null): string | null {
  if (!record) return null;
  if (
    record.autoRenew?.enabled &&
    (record.autoRenew.status === 'past_due' ||
      record.autoRenew.status === 'active')
  ) {
    if (record.autoRenew.graceEndsAt) {
      return record.autoRenew.graceEndsAt;
    }
    if (record.proExpiresAt) {
      const baseMs = new Date(record.proExpiresAt).getTime();
      if (Number.isFinite(baseMs)) {
        return new Date(
          baseMs + PRO_GRACE_RETRY_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();
      }
    }
  }
  return record.proExpiresAt ?? null;
}

export function isProStillValid(
  record?: {
    slug?: string;
    isPaid?: boolean;
    proExpiresAt?: string | null;
    autoRenew?: Pick<
      AutoRenewConfig,
      'enabled' | 'status' | 'graceEndsAt'
    > | null;
  } | null,
  nowMs: number = Date.now()
): boolean {
  if (!record) return false;
  if (
    record.slug === 'demo-restaurante' ||
    record.slug === 'demo-catalogo'
  ) {
    return true;
  }
  if (!record.isPaid) return false;
  const effectiveExpiry = getEffectiveProExpiryIso(record);
  if (effectiveExpiry) {
    const expiresMs = new Date(effectiveExpiry).getTime();
    if (Number.isFinite(expiresMs) && nowMs >= expiresMs) {
      return false;
    }
  }
  return true;
}

export interface ProRenewalAlert {
  kind: 'expiring_soon' | 'past_due';
  daysRemaining: number;
  hoursRemaining: number;
  headline: string;
  subtext: string;
  retryCount: number;
  maxRetries: number;
}

export function getProRenewalAlert(
  record?: {
    slug?: string;
    isPaid?: boolean;
    proExpiresAt?: string | null;
    autoRenew?: Pick<
      AutoRenewConfig,
      'enabled' | 'status' | 'graceEndsAt' | 'retryCount' | 'lastError'
    > | null;
  } | null,
  nowMs: number = Date.now()
): ProRenewalAlert | null {
  if (
    !record ||
    record.slug === 'demo-restaurante' ||
    record.slug === 'demo-catalogo'
  ) {
    return null;
  }
  if (!isProStillValid(record, nowMs)) return null;

  if (record.autoRenew?.enabled && record.autoRenew.status === 'past_due') {
    const graceDiff = getRemainingProMs(record.autoRenew.graceEndsAt, nowMs) || 0;
    const daysRemaining = Math.max(0, Math.ceil(graceDiff / 86400000));
    const hoursRemaining = Math.max(1, Math.ceil(graceDiff / 3600000));
    const retryCount = record.autoRenew.retryCount || 0;
    return {
      kind: 'past_due',
      daysRemaining,
      hoursRemaining,
      headline:
        daysRemaining >= 1
          ? `Falha na renovação automática: seu PRO será bloqueado em ${daysRemaining} ${
              daysRemaining === 1 ? 'dia' : 'dias'
            }, renove agora mesmo`
          : `Últimas ${hoursRemaining}h para renovar seu PRO antes de voltar para o Free`,
      subtext: `Tentativas automáticas no cartão às 10h e às 18h por até ${PRO_GRACE_RETRY_DAYS} dias consecutivos (${retryCount}/${PRO_MAX_RETRY_ATTEMPTS} realizadas).${
        record.autoRenew.lastError ? ` Motivo: ${record.autoRenew.lastError}` : ''
      }`,
      retryCount,
      maxRetries: PRO_MAX_RETRY_ATTEMPTS,
    };
  }

  const remainingMs = getRemainingProMs(record.proExpiresAt, nowMs);
  if (remainingMs === null || remainingMs <= 0) return null;

  const warningWindowMs = PRO_RENEWAL_WARNING_DAYS * 24 * 60 * 60 * 1000;
  if (remainingMs > warningWindowMs) return null;

  const daysRemaining = Math.ceil(remainingMs / 86400000);
  const hoursRemaining = Math.max(1, Math.ceil(remainingMs / 3600000));

  const headline =
    remainingMs >= 24 * 60 * 60 * 1000
      ? `Seu PRO acaba em ${daysRemaining} ${
          daysRemaining === 1 ? 'dia' : 'dias'
        }, renove agora mesmo`
      : `Seu PRO acaba em ${hoursRemaining}h, renove agora mesmo`;

  const subtext = record.autoRenew?.enabled
    ? `Renovação automática ativa no cartão •••• ${
        record.autoRenew?.status === 'active' ? 'programada para o vencimento' : ''
      }. Caso prefira, antecipe sua renovação via PIX ou atualize o cartão.`
    : 'Ao fim do prazo, os anúncios retornam, o vídeo animado volta para foto estática e o link amigável volta ao endereço anterior.';

  return {
    kind: 'expiring_soon',
    daysRemaining,
    hoursRemaining,
    headline,
    subtext,
    retryCount: 0,
    maxRetries: PRO_MAX_RETRY_ATTEMPTS,
  };
}

export function getRemainingProMs(
  proExpiresAt?: string | null,
  nowMs: number = Date.now()
): number | null {
  if (!proExpiresAt) return null;
  const expiresMs = new Date(proExpiresAt).getTime();
  if (!Number.isFinite(expiresMs)) return null;
  return Math.max(0, expiresMs - nowMs);
}

export function formatRemainingProTime(
  proExpiresAt?: string | null,
  nowMs: number = Date.now()
): string {
  if (!proExpiresAt) return 'Tempo indeterminado';
  const diff = getRemainingProMs(proExpiresAt, nowMs);
  if (diff === null) return 'Tempo indeterminado';
  if (diff <= 0) return 'Expirado';

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days >= 1) {
    return `${days}d ${String(hours).padStart(2, '0')}h`;
  }
  if (hours >= 1) {
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(
      2,
      '0'
    )}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(
    2,
    '0'
  )}s`;
}

export function computeStableStoreCode(record: {
  id?: string;
  slug: string;
  storeCode?: string;
}): string {
  if (record.storeCode && /^\d+$/.test(record.storeCode)) {
    return record.storeCode;
  }
  const seed = `${record.id || ''}:${record.slug}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const num = 100000 + (Math.abs(hash) % 900000);
  return String(num);
}

