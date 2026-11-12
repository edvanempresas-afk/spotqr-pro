import { NextRequest, NextResponse } from 'next/server';
import {
  getDynamicQRBySlug,
  updateQRAutoRenew,
  recordPayment,
  expireDueQRsIfAny,
  reconcileCloudSlugMigrations,
  syncDbFromCloud,
  persistSliceToCloud,
} from '@/lib/db';
import {
  getActiveMercadoPagoConfig,
  getOrCreateMercadoPagoCustomer,
  saveCustomerCardOnMercadoPago,
  chargeMercadoPagoCard,
  isValidCpf,
} from '@/lib/mercadopago';
import { isProStillValid } from '@/lib/pro-status';
import { getAuthenticatedClientUser } from '@/lib/client-auth';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';
import { AutoRenewConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

function canAccessStore(
  qr: NonNullable<ReturnType<typeof getDynamicQRBySlug>>,
  clientUser: ReturnType<typeof getAuthenticatedClientUser>,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (!clientUser) return false;
  if (qr.ownerId && qr.ownerId === clientUser.id) return true;
  if (
    qr.ownerEmail &&
    qr.ownerEmail.toLowerCase() === clientUser.email.toLowerCase()
  ) {
    return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  await syncDbFromCloud();
  if (expireDueQRsIfAny()) {
    await reconcileCloudSlugMigrations();
    await persistSliceToCloud('qrs');
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'Slug é obrigatório.' }, { status: 400 });
  }

  const clientUser = getAuthenticatedClientUser(req);
  const isAdmin = isAdminRequestAuthenticated(req);
  const qr = getDynamicQRBySlug(slug);
  if (!qr) {
    return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
  }
  if (!canAccessStore(qr, clientUser, isAdmin)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  return NextResponse.json({
    slug: qr.slug,
    isPaid: isProStillValid(qr),
    proExpiresAt: qr.proExpiresAt || null,
    autoRenew: qr.autoRenew || null,
  });
}

export async function POST(req: NextRequest) {
  try {
    await syncDbFromCloud();
    expireDueQRsIfAny();

    const clientUser = getAuthenticatedClientUser(req);
    const isAdmin = isAdminRequestAuthenticated(req);
    if (!clientUser && !isAdmin) {
      return NextResponse.json(
        { error: 'Faça login para salvar seu cartão de renovação automática.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      slug,
      cardToken,
      holderName,
      cpf,
      cardBrand,
      cardLast4,
      expiryMonth,
      expiryYear,
      paymentMethodId,
      chargeNow,
    } = body;

    if (!slug || !cardToken) {
      return NextResponse.json(
        { error: 'Token seguro do cartão e slug da loja são obrigatórios.' },
        { status: 400 }
      );
    }

    const qr = getDynamicQRBySlug(String(slug));
    if (!qr) {
      return NextResponse.json(
        { error: 'Loja / QR Code não encontrado.' },
        { status: 404 }
      );
    }
    if (!canAccessStore(qr, clientUser, isAdmin)) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    if (cpf && !isValidCpf(String(cpf))) {
      return NextResponse.json(
        { error: 'CPF inválido. Verifique os 11 dígitos do titular do cartão.' },
        { status: 400 }
      );
    }

    const payerEmail =
      clientUser?.email || qr.ownerEmail || 'cliente@spotqr.pro';
    const payerName =
      String(holderName || clientUser?.name || qr.title || 'Cliente SpotQR').trim();

    // 1. Get/create Mercado Pago Customer and save tokenized card (zero raw card storage)
    const customerRes = await getOrCreateMercadoPagoCustomer(
      payerEmail,
      payerName
    );
    if (!customerRes.ok || !customerRes.customerId) {
      return NextResponse.json(
        {
          error:
            customerRes.error ||
            'Não foi possível registrar seu perfil recorrente no Mercado Pago.',
        },
        { status: 400 }
      );
    }

    const savedCardRes = await saveCustomerCardOnMercadoPago(
      customerRes.customerId,
      String(cardToken)
    );
    if (!savedCardRes.ok || !savedCardRes.cardId) {
      return NextResponse.json(
        {
          error:
            savedCardRes.error ||
            'Não foi possível salvar este cartão para cobrança recorrente.',
        },
        { status: 400 }
      );
    }

    const { priceReais } = getActiveMercadoPagoConfig();
    const currentlyValidPro = isProStillValid(qr);
    const shouldChargeNow = Boolean(chargeNow) || !currentlyValidPro;

    let paymentId: string | undefined;
    if (shouldChargeNow) {
      const chargeRes = await chargeMercadoPagoCard({
        slug: qr.slug,
        amount: priceReais,
        email: payerEmail,
        fullName: payerName,
        cpf: cpf ? String(cpf) : undefined,
        cardToken: String(cardToken),
        paymentMethodId: savedCardRes.paymentMethodId || paymentMethodId,
        customerId: customerRes.customerId,
        description: `SpotQR PRO Mensalidade (${qr.slug})`,
      });

      if (!chargeRes.ok || chargeRes.status !== 'approved') {
        return NextResponse.json(
          {
            error:
              chargeRes.error ||
              'Pagamento não aprovado pela operadora do cartão.',
          },
          { status: 402 }
        );
      }
      paymentId = chargeRes.paymentId;
      recordPayment(
        paymentId || `mp_card_${Date.now()}`,
        qr.slug,
        'approved',
        priceReais,
        payerName,
        payerEmail
      );
    }

    const refreshedQR = getDynamicQRBySlug(qr.slug) || qr;
    const nextBillingAt =
      refreshedQR.proExpiresAt ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const autoRenew: AutoRenewConfig = {
      enabled: true,
      provider: 'mercadopago_card',
      mpCustomerId: customerRes.customerId,
      mpCardId: savedCardRes.cardId,
      mpPaymentMethodId: savedCardRes.paymentMethodId || paymentMethodId,
      cardBrand: savedCardRes.brand || cardBrand || 'Cartão',
      cardLast4: savedCardRes.last4 || cardLast4 || '****',
      holderName: payerName,
      expiryMonth: savedCardRes.expiryMonth || expiryMonth,
      expiryYear: savedCardRes.expiryYear || expiryYear,
      status: 'active',
      nextBillingAt,
      graceStartedAt: null,
      graceEndsAt: null,
      retryCount: 0,
      executedSlots: [],
      lastAttemptAt: shouldChargeNow ? new Date().toISOString() : null,
      lastError: null,
      history: refreshedQR.autoRenew?.history || [],
    };

    if (shouldChargeNow) {
      autoRenew.history = [
        {
          timestamp: new Date().toISOString(),
          slotLabel: 'Ativação / Renovação Cartão',
          status: 'approved' as const,
          paymentId,
          amount: priceReais,
        },
        ...(autoRenew.history || []),
      ].slice(0, 15);
    }

    const updatedQR = updateQRAutoRenew(qr.slug, autoRenew);

    await Promise.all([
      persistSliceToCloud('qrs'),
      persistSliceToCloud('payments'),
      persistSliceToCloud('notifications'),
    ]);

    return NextResponse.json({
      success: true,
      chargedNow: shouldChargeNow,
      qr: updatedQR,
      autoRenew,
    });
  } catch (err) {
    console.error('Error configuring recurring card:', err);
    return NextResponse.json(
      { error: 'Erro interno ao configurar cartão recorrente.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  await syncDbFromCloud();
  const clientUser = getAuthenticatedClientUser(req);
  const isAdmin = isAdminRequestAuthenticated(req);
  if (!clientUser && !isAdmin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'Slug é obrigatório.' }, { status: 400 });
  }

  const qr = getDynamicQRBySlug(slug);
  if (!qr) {
    return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
  }
  if (!canAccessStore(qr, clientUser, isAdmin)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  if (qr.autoRenew) {
    updateQRAutoRenew(slug, {
      ...qr.autoRenew,
      enabled: false,
      status: 'canceled',
    });
    await persistSliceToCloud('qrs');
  }

  return NextResponse.json({ success: true });
}

