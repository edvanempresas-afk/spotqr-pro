import { NextRequest, NextResponse } from 'next/server';
import {
  getDynamicQRBySlug,
  isFriendlySlugAvailable,
  updateFriendlySlugForQR,
  expireDueQRsIfAny,
  reconcileCloudSlugMigrations,
  syncDbFromCloud,
  persistSliceToCloud,
} from '@/lib/db';
import { generateFriendlySlugSuggestions } from '@/lib/slugs';
import { isProStillValid } from '@/lib/pro-status';
import { getAuthenticatedClientUser } from '@/lib/client-auth';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await syncDbFromCloud();
  if (expireDueQRsIfAny()) {
    await reconcileCloudSlugMigrations();
    await persistSliceToCloud('qrs');
  }

  const { searchParams } = new URL(req.url);
  const currentSlug = searchParams.get('slug') || '';
  const candidate = searchParams.get('candidate') || '';

  const qr = currentSlug ? getDynamicQRBySlug(currentSlug) : null;
  const title = searchParams.get('title') || qr?.title || currentSlug || 'minha-loja';
  const mode = qr?.type === 'catalog' ? 'catalog' : 'menu';

  const suggestions = generateFriendlySlugSuggestions(
    title,
    currentSlug,
    (cand) => isFriendlySlugAvailable(cand, currentSlug).available,
    mode
  );

  const check = candidate
    ? isFriendlySlugAvailable(candidate, currentSlug)
    : null;

  return NextResponse.json({
    currentSlug,
    originalSlug: qr?.originalSlug || currentSlug,
    isPro: qr ? isProStillValid(qr) : false,
    suggestions,
    check,
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
        { error: 'Faça login para personalizar o link da sua loja.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const currentSlug = String(body.currentSlug || '').trim();
    const newSlug = String(body.newSlug || '').trim();

    if (!currentSlug || !newSlug) {
      return NextResponse.json(
        { error: 'Informe o link atual e o novo link amigável desejado.' },
        { status: 400 }
      );
    }

    const existing = getDynamicQRBySlug(currentSlug);
    if (!existing) {
      return NextResponse.json(
        { error: 'Loja não encontrada.' },
        { status: 404 }
      );
    }

    if (
      !isAdmin &&
      existing.ownerId !== clientUser?.id &&
      existing.ownerEmail?.toLowerCase() !== clientUser?.email?.toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'Você só pode alterar o link das suas próprias lojas.' },
        { status: 403 }
      );
    }

    if (!isProStillValid(existing)) {
      return NextResponse.json(
        {
          error:
            'A personalização de link amigável é exclusiva para assinantes do Plano PRO.',
        },
        { status: 403 }
      );
    }

    const result = updateFriendlySlugForQR(currentSlug, newSlug);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Este link já está em uso.' },
        { status: 409 }
      );
    }

    await reconcileCloudSlugMigrations();
    await Promise.all([
      persistSliceToCloud('qrs'),
      persistSliceToCloud('redirects'),
    ]);

    return NextResponse.json({
      success: true,
      qr: result.qr,
      previousSlug: result.previousSlug,
    });
  } catch (err) {
    console.error('Error updating friendly slug:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar link amigável.' },
      { status: 500 }
    );
  }
}

