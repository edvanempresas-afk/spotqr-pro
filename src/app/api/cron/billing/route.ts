import { NextRequest, NextResponse } from 'next/server';
import { syncDbFromCloud } from '@/lib/db';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';
import { runRecurringBillingCycle } from '@/lib/billing';

export const dynamic = 'force-dynamic';

function isAuthorizedCron(req: NextRequest): boolean {
  if (isAdminRequestAuthenticated(req)) return true;

  const cronSecret = (process.env.CRON_SECRET || '').trim();
  const authHeader = req.headers.get('authorization') || '';
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Vercel Cron invokes GET with x-vercel-cron header
  if (!cronSecret && req.headers.get('x-vercel-cron')) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  await syncDbFromCloud();
  const { searchParams } = new URL(req.url);
  const slotParam = searchParams.get('slot');
  const slotOverride =
    slotParam === '10' ? '10h' : slotParam === '18' ? '18h' : undefined;

  const summary = await runRecurringBillingCycle({
    slotOverride,
  });

  return NextResponse.json({ ok: true, summary });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequestAuthenticated(req)) {
    return NextResponse.json(
      { error: 'Acesso restrito ao desenvolvedor.' },
      { status: 401 }
    );
  }

  await syncDbFromCloud();
  const body = await req.json().catch(() => ({}));
  const slotOverride =
    body.slot === '10h' || body.slot === '18h' ? body.slot : undefined;

  const summary = await runRecurringBillingCycle({
    slotOverride,
    forceSlot: Boolean(body.forceSlot),
    targetSlug: typeof body.slug === 'string' ? body.slug : undefined,
    nowMs: typeof body.nowMs === 'number' ? body.nowMs : undefined,
  });

  return NextResponse.json({ ok: true, summary });
}

