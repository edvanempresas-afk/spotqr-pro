import { NextRequest, NextResponse } from 'next/server';
import { syncDbFromCloud, findUserByReferralCode, getDeveloperSettings } from '@/lib/db';
import { getActiveMercadoPagoConfig } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await syncDbFromCloud();
  const { priceReais, publicKey } = getActiveMercadoPagoConfig();
  const devSettings = getDeveloperSettings();
  const mpAffiliatePointUrl =
    (devSettings?.mpAffiliatePointUrl || '').trim() ||
    'https://www.mercadopago.com.br/point';
  const proPriceReais = Number.isFinite(priceReais) && priceReais > 0 ? priceReais : 25.9;

  const url = new URL(req.url);
  const refParam = url.searchParams.get('ref') || '';
  const refCookie = req.cookies.get('spotqr_ref')?.value || '';
  const effectiveRef = (refParam || refCookie).trim().toLowerCase();

  let hasValidReferral = false;
  if (effectiveRef) {
    const affiliate = findUserByReferralCode(effectiveRef);
    if (affiliate) {
      hasValidReferral = true;
    }
  }

  return NextResponse.json(
    {
      proPriceReais,
      referralPriceReais: 25.5,
      hasValidReferral,
      mpPublicKey: publicKey,
      mpAffiliatePointUrl,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
      },
    }
  );
}

