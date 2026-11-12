import { NextResponse } from 'next/server';
import { syncDbFromCloud } from '@/lib/db';
import { getActiveMercadoPagoConfig } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function GET() {
  await syncDbFromCloud();
  const { priceReais, publicKey } = getActiveMercadoPagoConfig();
  const proPriceReais = Number.isFinite(priceReais) && priceReais > 0 ? priceReais : 10.9;

  return NextResponse.json(
    { proPriceReais, mpPublicKey: publicKey },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
      },
    }
  );
}

