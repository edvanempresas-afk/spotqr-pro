import { NextRequest, NextResponse } from 'next/server';
import {
  expireDueQRsIfAny,
  reconcileCloudSlugMigrations,
  getAdminStoresList,
  grantProToQR,
  revokeProFromQR,
  syncDbFromCloud,
  persistSliceToCloud,
} from '@/lib/db';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';

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

    const expiredAny = expireDueQRsIfAny();
    if (expiredAny) {
      await reconcileCloudSlugMigrations();
      await Promise.all([
        persistSliceToCloud('qrs'),
        persistSliceToCloud('redirects'),
      ]);
    }

    const stores = getAdminStoresList();
    return NextResponse.json({ stores });
  } catch (err) {
    console.error('Error in GET /api/admin/pro-access:', err);
    return NextResponse.json(
      { error: 'Erro ao listar lojas cadastradas.' },
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
    const { action, slug, mode, hours, minutes } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug da loja é obrigatório.' },
        { status: 400 }
      );
    }

    if (action === 'revoke_pro') {
      const updated = revokeProFromQR(slug);
      if (!updated) {
        return NextResponse.json(
          { error: 'Loja não encontrada.' },
          { status: 404 }
        );
      }
      await reconcileCloudSlugMigrations();
      await Promise.all([
        persistSliceToCloud('qrs'),
        persistSliceToCloud('redirects'),
      ]);
      return NextResponse.json({
        success: true,
        qr: updated,
        stores: getAdminStoresList(),
      });
    }

    if (action === 'grant_pro') {
      if (
        mode !== 'indeterminate' &&
        mode !== 'days_30' &&
        mode !== 'hours'
      ) {
        return NextResponse.json(
          { error: 'Selecione uma das 3 opções de liberação PRO.' },
          { status: 400 }
        );
      }

      if (mode === 'hours') {
        const totalMins =
          (Math.max(0, Number(hours) || 0) * 60) +
          Math.max(0, Number(minutes) || 0);
        if (totalMins < 1) {
          return NextResponse.json(
            { error: 'Informe pelo menos 1 hora ou minuto para liberar temporariamente.' },
            { status: 400 }
          );
        }
      }

      const updated = grantProToQR({
        slug,
        mode,
        hours: Number(hours) || 0,
        minutes: Number(minutes) || 0,
      });

      if (!updated) {
        return NextResponse.json(
          { error: 'Loja não encontrada.' },
          { status: 404 }
        );
      }

      await persistSliceToCloud('qrs');
      return NextResponse.json({
        success: true,
        qr: updated,
        stores: getAdminStoresList(),
      });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err) {
    console.error('Error in POST /api/admin/pro-access:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar acesso PRO da loja.' },
      { status: 500 }
    );
  }
}

