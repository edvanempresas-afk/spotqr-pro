import { NextResponse } from 'next/server';
import { getDeveloperSettings, syncDbFromCloud } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  await syncDbFromCloud();
  const settings = getDeveloperSettings();
  const raw = Number(settings?.proPriceReais);
  const proPriceReais = Number.isFinite(raw) && raw > 0 ? raw : 10.9;

  return NextResponse.json(
    { proPriceReais },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
      },
    }
  );
}

