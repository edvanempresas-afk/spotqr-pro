import { generatePixPayload } from './pix-brcode';
import { PixPaymentResponse } from './types';
import { getDeveloperSettings } from './db';

const DEFAULT_MP_ACCESS_TOKEN =
  'APP_USR-4000171423020297-110821-0d5a69a11b676b64931811de85b054a0-244576316';
const DEFAULT_MP_PUBLIC_KEY = 'APP_USR-8b245dbb-b6c0-4335-b46a-ae016ea5071d';

export function getActiveMercadoPagoConfig() {
  const settings = getDeveloperSettings();
  const accessToken = (
    settings.mpAccessToken ||
    process.env.MP_ACCESS_TOKEN ||
    DEFAULT_MP_ACCESS_TOKEN
  ).trim();
  const publicKey = (
    settings.mpPublicKey ||
    process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ||
    DEFAULT_MP_PUBLIC_KEY
  ).trim();
  const pixKey = (settings.mpPixKey || 'pagamentos@spotqr.pro').trim();
  const subscriptionUrl = (settings.mpSubscriptionUrl || '').trim();
  const priceReais = Number(settings.proPriceReais) || 10.9;
  const isLive =
    accessToken.startsWith('APP_USR-') || accessToken.startsWith('TEST-');

  return {
    accessToken,
    publicKey,
    pixKey,
    subscriptionUrl,
    priceReais,
    isLive,
  };
}

export async function createPixPayment(
  slug: string,
  userEmail: string = 'cliente@spotqr.pro',
  userName: string = 'Cliente SpotQR',
  originUrl: string = 'http://localhost:3000'
): Promise<PixPaymentResponse> {
  const { accessToken, pixKey, subscriptionUrl, priceReais, isLive } =
    getActiveMercadoPagoConfig();

  // If Mercado Pago Access Token is configured, call official Mercado Pago / Mercado Livre APIs
  if (isLive) {
    try {
      const idempotencyKey = `qr_${slug}_${Date.now()}`;
      const cleanEmail = userEmail.includes('@')
        ? userEmail.trim()
        : 'cliente@spotqr.pro';
      const firstName = userName.trim().split(' ')[0] || 'Cliente';
      const lastName =
        userName.trim().split(' ').slice(1).join(' ') || 'SpotQR';

      // 1. Create Checkout Pro Preference (Credit Card, Mercado Livre Balance, Pix, Subscriptions)
      let checkoutProUrl = subscriptionUrl || '';
      try {
        const preferencePayload: Record<string, unknown> = {
          items: [
            {
              id: `spotqr-pro-${slug}`,
              title: `Assinatura SpotQR PRO - QR Dinâmico & Cardápio (${slug})`,
              description:
                'Liberação de Logomarca no Centro, QR Code Dinâmico e Cardápio Digital Sem Anúncios.',
              category_id: 'services',
              quantity: 1,
              currency_id: 'BRL',
              unit_price: priceReais,
            },
          ],
          payer: {
            email: cleanEmail,
            name: firstName,
            surname: lastName,
          },
          external_reference: slug,
          statement_descriptor: 'SPOTQR PRO',
          back_urls: {
            success: `${originUrl}/dashboard?mp_status=approved&slug=${slug}`,
            failure: `${originUrl}/dashboard?mp_status=failure&slug=${slug}`,
            pending: `${originUrl}/dashboard?mp_status=pending&slug=${slug}`,
          },
        };

        // Mercado Pago production only allows auto_return on https back_urls
        if (originUrl.startsWith('https://')) {
          preferencePayload.auto_return = 'approved';
        }

        const prefRes = await fetch(
          'https://api.mercadopago.com/checkout/preferences',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(preferencePayload),
          }
        );

        if (prefRes.ok) {
          const prefData = await prefRes.json();
          checkoutProUrl =
            prefData.init_point ||
            prefData.sandbox_init_point ||
            checkoutProUrl;
        }
      } catch (prefErr) {
        console.warn('Checkout Pro preference warning:', prefErr);
      }

      // 2. Create Instant PIX Payment via /v1/payments with full integration quality fields
      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          transaction_amount: priceReais,
          description: `SpotQR Pro - Assinatura PRO (${slug})`,
          payment_method_id: 'pix',
          external_reference: slug,
          statement_descriptor: 'SPOTQR PRO',
          additional_info: {
            items: [
              {
                id: `spotqr-pro-${slug}`,
                title: `Assinatura SpotQR PRO (${slug})`,
                description:
                  'Liberação de Logomarca no Centro, QR Code Dinâmico e Cardápio Digital Sem Anúncios.',
                category_id: 'services',
                quantity: 1,
                unit_price: priceReais,
              },
            ],
            payer: {
              first_name: firstName,
              last_name: lastName,
            },
          },
          payer: {
            email: cleanEmail,
            first_name: firstName,
            last_name: lastName,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const txData = data.point_of_interaction?.transaction_data;

        return {
          paymentId: String(data.id),
          status: data.status === 'approved' ? 'approved' : 'pending',
          qrCodeBase64: txData?.qr_code_base64,
          qrCodeCopyPaste: txData?.qr_code || '',
          ticketUrl: txData?.ticket_url || checkoutProUrl,
          checkoutProUrl: checkoutProUrl || txData?.ticket_url,
          subscriptionUrl: subscriptionUrl || checkoutProUrl,
          isLiveProduction: true,
          expiresAt:
            data.date_of_expiration ||
            new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          amount: priceReais,
        };
      } else {
        const errData = await response.text();
        console.warn(
          'Mercado Pago API warning, falling back to BRCode checkout:',
          errData
        );
      }
    } catch (err) {
      console.error('Error connecting to Mercado Pago API:', err);
    }
  }

  // Fallback / Direct Pix Key Mode: Generates a 100% compliant BRCode Pix payload
  const mockPaymentId = `demo_mp_${Date.now()}`;
  const mockPixPayload = generatePixPayload({
    key: pixKey || 'pagamentos@spotqr.pro',
    name: 'SPOTQR TECNOLOGIA',
    city: 'SAO PAULO',
    amount: priceReais,
    txId: slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20),
  });

  return {
    paymentId: mockPaymentId,
    status: 'pending',
    qrCodeCopyPaste: mockPixPayload,
    checkoutProUrl: subscriptionUrl || '',
    subscriptionUrl: subscriptionUrl || '',
    isLiveProduction: false,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    amount: priceReais,
  };
}

export async function checkPaymentStatus(
  paymentId: string
): Promise<{
  status: 'pending' | 'approved' | 'rejected';
  externalReference?: string;
}> {
  const { accessToken, isLive } = getActiveMercadoPagoConfig();

  // If real MP payment ID (numeric) and token exists
  if (isLive && /^\d+$/.test(paymentId)) {
    try {
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const externalReference = data.external_reference || undefined;
        if (data.status === 'approved')
          return { status: 'approved', externalReference };
        if (data.status === 'rejected' || data.status === 'cancelled')
          return { status: 'rejected', externalReference };
        return { status: 'pending', externalReference };
      }
    } catch (err) {
      console.error('Error checking payment status on Mercado Pago:', err);
    }
  }

  return { status: 'pending' };
}
