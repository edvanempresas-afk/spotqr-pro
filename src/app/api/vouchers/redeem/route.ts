import { NextRequest, NextResponse } from 'next/server';
import {
  redeemProVoucher,
  syncDbFromCloud,
  persistSliceToCloud,
} from '@/lib/db';
import { getAuthenticatedClientUser } from '@/lib/client-auth';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await syncDbFromCloud();
    const clientUser = getAuthenticatedClientUser(req);
    const isAdmin = isAdminRequestAuthenticated(req);

    if (!clientUser && !isAdmin) {
      return NextResponse.json(
        {
          error:
            'Entre ou crie sua conta gratuita para vincular este voucher PRO ao seu cardápio ou catálogo.',
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const code = String(body.code || '').trim();
    const slug = body.slug ? String(body.slug).trim() : undefined;

    if (!code) {
      return NextResponse.json(
        { error: 'Digite o código voucher antes de confirmar.' },
        { status: 400 }
      );
    }

    const activeUser = clientUser || {
      id: 'admin',
      name: 'Administrador SpotQR',
      businessName: 'SpotQR Pro Admin',
      email: 'dev@spotqr.pro',
    };

    try {
      const result = redeemProVoucher({
        code,
        userId: activeUser.id,
        userEmail: activeUser.email,
        userName: activeUser.name,
        businessName: activeUser.businessName,
        slug,
      });

      await Promise.all([
        persistSliceToCloud('vouchers'),
        persistSliceToCloud('qrs'),
        persistSliceToCloud('users'),
        persistSliceToCloud('notifications'),
      ]);

      return NextResponse.json({
        success: true,
        days: result.voucher.days,
        code: result.voucher.code,
        slug: result.slug,
        storeName: result.storeName,
        proExpiresAt: result.proExpiresAt,
        creditOnly: result.creditOnly,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || 'Código inválido ou já utilizado.' },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('Error in POST /api/vouchers/redeem:', err);
    return NextResponse.json(
      { error: 'Erro ao validar o código voucher.' },
      { status: 500 }
    );
  }
}

