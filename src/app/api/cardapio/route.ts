import { NextRequest, NextResponse } from 'next/server';
import {
  getMenuBySlug,
  saveMenu,
  getDynamicQRBySlug,
  resolveEffectiveSlug,
  saveDynamicQR,
  expireDueQRsIfAny,
  reconcileCloudSlugMigrations,
  consumeUserProCreditIfActive,
  syncDbFromCloud,
  syncMenuFromCloud,
  persistMenuToCloud,
  persistSliceToCloud,
} from '@/lib/db';
import { isProStillValid } from '@/lib/pro-status';
import { RestaurantMenu, DynamicQRRecord } from '@/lib/types';
import { getAuthenticatedClientUser } from '@/lib/client-auth';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const modeParam = searchParams.get('mode') === 'catalog' ? 'catalog' : 'menu';
  const titleParam = searchParams.get('title') || undefined;

  if (!slug) {
    return NextResponse.json({ error: 'Slug é obrigatório' }, { status: 400 });
  }

  await syncDbFromCloud();
  if (expireDueQRsIfAny()) {
    await reconcileCloudSlugMigrations();
    await persistSliceToCloud('qrs');
  }
  const effectiveSlug = resolveEffectiveSlug(slug);
  await syncMenuFromCloud(effectiveSlug);

  const menu = getMenuBySlug(effectiveSlug, modeParam, titleParam);
  if (!menu) {
    return NextResponse.json(
      { error: 'Cardápio ou catálogo não encontrado' },
      { status: 404 }
    );
  }

  const qr = getDynamicQRBySlug(effectiveSlug);
  const isPaid = Boolean(
    isProStillValid(qr) ||
      effectiveSlug === 'demo-restaurante' ||
      effectiveSlug === 'demo-catalogo'
  );

  return NextResponse.json(
    {
      ...menu,
      coverVideo: isPaid ? menu.coverVideo : undefined,
      isPaid,
      proGrantType: isPaid ? qr?.proGrantType || null : null,
      proExpiresAt: isPaid ? qr?.proExpiresAt || null : null,
      autoRenewSummary: qr?.autoRenew
        ? {
            enabled: qr.autoRenew.enabled,
            status: qr.autoRenew.status,
            graceEndsAt: qr.autoRenew.graceEndsAt || null,
            retryCount: qr.autoRenew.retryCount || 0,
            lastError: qr.autoRenew.lastError || null,
          }
        : null,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    await syncDbFromCloud();
    const clientUser = getAuthenticatedClientUser(request);
    const isAdmin = isAdminRequestAuthenticated(request);

    if (!clientUser && !isAdmin) {
      return NextResponse.json(
        {
          error:
            'Faça login ou cadastre sua conta de cliente para salvar alterações no cardápio.',
        },
        { status: 401 }
      );
    }

    const body: RestaurantMenu = await request.json();

    if (!body.slug || !body.title) {
      return NextResponse.json(
        { error: 'Título e slug são obrigatórios' },
        { status: 400 }
      );
    }

    const cleanSlug = body.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-');

    await syncMenuFromCloud(cleanSlug);
    expireDueQRsIfAny();
    const existingMenu = getMenuBySlug(
      cleanSlug,
      body.mode === 'catalog' ? 'catalog' : 'menu',
      body.title
    );
    const existingQRBeforeSave = getDynamicQRBySlug(cleanSlug);
    const isEffectivePro = Boolean(
      (existingQRBeforeSave && isProStillValid(existingQRBeforeSave)) ||
        cleanSlug === 'demo-restaurante' ||
        cleanSlug === 'demo-catalogo'
    );

    const incomingCoverVideo =
      typeof body.coverVideo === 'string' ? body.coverVideo.trim() : '';
    const existingCoverVideo = existingMenu?.coverVideo || '';
    if (
      !isEffectivePro &&
      incomingCoverVideo &&
      incomingCoverVideo !== existingCoverVideo
    ) {
      return NextResponse.json(
        {
          error:
            'O Banner em Vídeo Curto Animado é um recurso exclusivo do Plano PRO.',
        },
        { status: 403 }
      );
    }

    const isCatalog = body.mode === 'catalog';
    const updatedMenu: RestaurantMenu = {
      ...body,
      coverVideo: isEffectivePro
        ? incomingCoverVideo || undefined
        : existingCoverVideo || undefined,
      mode: isCatalog ? 'catalog' : 'menu',
      slug: cleanSlug,
      ownerId: clientUser?.id || body.ownerId,
      ownerEmail: clientUser?.email || body.ownerEmail,
      updatedAt: new Date().toISOString(),
    };

    saveMenu(updatedMenu);

    // Ensure a corresponding DynamicQRRecord exists and is linked to this client!
    expireDueQRsIfAny();
    const existingQR = getDynamicQRBySlug(cleanSlug);
    const credit = !existingQR && clientUser
      ? consumeUserProCreditIfActive(clientUser.id, clientUser.email)
      : { isPaid: false };
    const qrType = isCatalog ? 'catalog' : 'menu';
    const routePrefix = isCatalog ? '/catalogo/' : '/cardapio/';
    const baseQrConfig = existingQR?.qrConfig || {
      fgColor: '#0f172a',
      bgColor: '#ffffff',
      cornerColor: body.themeColor || '#16a34a',
      dotStyle: 'rounded',
      frameStyle: 'table_tent',
      frameTopText: isCatalog ? '🛍️ CATÁLOGO DIGITAL' : '📱 CARDÁPIO NA MESA',
      frameText: isCatalog ? 'VER PRODUTOS & PEDIR' : 'VER CARDÁPIO & PEDIR',
      frameColor: body.themeColor || '#16a34a',
      frameTextColor: '#ffffff',
    };
    const syncedLogoUrl =
      typeof body.logoImage === 'string'
        ? body.logoImage
        : baseQrConfig.logoUrl;
    const qrRecord: DynamicQRRecord = {
      ...(existingQR || {}),
      id: existingQR?.id || `qr_${Date.now()}`,
      slug: cleanSlug,
      title: body.title,
      targetUrl: existingQR?.targetUrl || `${routePrefix}${cleanSlug}`,
      type: existingQR?.type === 'catalog' || isCatalog ? 'catalog' : qrType,
      createdAt: existingQR?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scansCount: existingQR?.scansCount || 0,
      isPaid: existingQR ? isProStillValid(existingQR) : credit.isPaid,
      proGrantType: existingQR?.proGrantType || credit.proGrantType,
      proExpiresAt: existingQR?.proExpiresAt ?? credit.proExpiresAt ?? null,
      proVoucherCode: existingQR?.proVoucherCode || credit.proVoucherCode,
      linkedMenuId: cleanSlug,
      ownerId: clientUser?.id || existingQR?.ownerId,
      ownerEmail: clientUser?.email || existingQR?.ownerEmail,
      qrConfig: {
        ...baseQrConfig,
        logoUrl: syncedLogoUrl,
      },
    };
    saveDynamicQR(qrRecord);
    await Promise.all([
      persistMenuToCloud(updatedMenu),
      persistSliceToCloud('qrs'),
      ...(credit.isPaid ? [persistSliceToCloud('users')] : []),
    ]);

    return NextResponse.json({ success: true, menu: updatedMenu });
  } catch (error) {
    console.error('Error saving menu:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar cardápio' },
      { status: 500 }
    );
  }
}
