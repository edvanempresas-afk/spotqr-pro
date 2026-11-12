import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';
import {
  adminSetUserPixLock,
  adminSetUserSuspended,
  approvePasswordResetByAdmin,
  getAdminSecurityOverview,
  persistSliceToCloud,
  rejectPasswordResetByAdmin,
  syncDbFromCloud,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await syncDbFromCloud();
    if (!isAdminRequestAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Acesso restrito ao desenvolvedor.' },
        { status: 401 }
      );
    }
    const overview = getAdminSecurityOverview();
    return NextResponse.json(overview);
  } catch (err) {
    console.error('Error in GET /api/admin/security:', err);
    return NextResponse.json(
      { error: 'Erro ao carregar módulo de segurança.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await syncDbFromCloud();
    if (!isAdminRequestAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Acesso restrito ao desenvolvedor.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const action = String(body.action || '');

    if (action === 'approve_reset') {
      const requestId = String(body.requestId || '');
      const result = approvePasswordResetByAdmin(requestId);
      await persistSliceToCloud('resets');
      return NextResponse.json({
        success: true,
        plainCode: result.plainCode,
        request: result.request,
      });
    }

    if (action === 'reject_reset') {
      const requestId = String(body.requestId || '');
      const reqRecord = rejectPasswordResetByAdmin(requestId);
      await persistSliceToCloud('resets');
      return NextResponse.json({ success: true, request: reqRecord });
    }

    if (action === 'unlock_pix' || action === 'lock_pix') {
      const userId = String(body.userId || '');
      const user = adminSetUserPixLock(userId, action === 'lock_pix');
      await persistSliceToCloud('users');
      return NextResponse.json({
        success: true,
        pixLockedUntil: user.pixLockedUntil || null,
      });
    }

    if (action === 'toggle_suspend') {
      const userId = String(body.userId || '');
      const suspended = Boolean(body.suspended);
      const user = adminSetUserSuspended(userId, suspended);
      await persistSliceToCloud('users');
      return NextResponse.json({
        success: true,
        isSuspended: Boolean(user.isSuspended),
      });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao executar ação de segurança.' },
      { status: 400 }
    );
  }
}
