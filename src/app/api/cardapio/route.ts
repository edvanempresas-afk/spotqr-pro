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
  peekExistingMenuBySlug,
  verifyUserPassword,
  createDeveloperNotification,
} from '@/lib/db';
import { isProStillValid } from '@/lib/pro-status';
import { isTimestampActiveFuture, normalizePixKeyForCompare } from '@/lib/security';
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

    const body: RestaurantMenu & { pixPasswordConfirmation?: string } =
      await request.json();

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
    const persistedExistingMenu = peekExistingMenuBySlug(cleanSlug);
    const existingMenu = getMenuBySlug(
      cleanSlug,
      body.mode === 'catalog' ? 'catalog' : 'menu',
      body.title
    );
    const existingQRBeforeSave = getDynamicQRBySlug(cleanSlug);

    // 1. Strict Ownership Authorization Check (prevents another account overwriting this store or its PIX)
    if (!isAdmin) {
      const storeOwnerId =
        existingQRBeforeSave?.ownerId || persistedExistingMenu?.ownerId;
      const storeOwnerEmail =
        existingQRBeforeSave?.ownerEmail || persistedExistingMenu?.ownerEmail;
      const isDemoSlug =
        cleanSlug === 'demo-restaurante' || cleanSlug === 'demo-catalogo';

      if (isDemoSlug) {
        return NextResponse.json(
          {
            error:
              'Os modelos de demonstração são apenas para visualização. Salve no seu próprio catálogo/cardápio.',
          },
          { status: 403 }
        );
      }

      const matchesOwnerId = Boolean(
        storeOwnerId && clientUser && storeOwnerId === clientUser.id
      );
      const matchesOwnerEmail = Boolean(
        storeOwnerEmail &&
          clientUser &&
          storeOwnerEmail.toLowerCase() === clientUser.email.toLowerCase()
      );
      if ((storeOwnerId || storeOwnerEmail) && !matchesOwnerId && !matchesOwnerEmail) {
        return NextResponse.json(
          {
            error:
              'Você não tem permissão para alterar a loja de outro anunciante.',
          },
          { status: 403 }
        );
      }
    }

    // 2. Anti-PIX-Hijack Protection: changing an existing PIX key requires password verification
    //    and respects 24h post-recovery security lock.
    const previousPix = (
      persistedExistingMenu?.pixKey ||
      existingQRBeforeSave?.qrConfig?.pixKey ||
      ''
    ).trim();
    const nextPix = typeof body.pixKey === 'string' ? body.pixKey.trim() : '';
    const isChangingExistingPix =
      Boolean(previousPix) &&
      normalizePixKeyForCompare(previousPix) !==
        normalizePixKeyForCompare(nextPix);

    if (isChangingExistingPix && !isAdmin && clientUser) {
      if (isTimestampActiveFuture(clientUser.pixLockedUntil)) {
        return NextResponse.json(
          {
            code: 'PIX_SECURITY_LOCK',
            error:
              '🔒 Proteção Anti-Golpe ativa: por segurança, a alteração da Chave PIX fica bloqueada por 24 horas após recuperação de senha. Caso seja o titular e precise liberar antes, solicite ao suporte oficial.',
          },
          { status: 403 }
        );
      }

      const pwdConfirm =
        typeof body.pixPasswordConfirmation === 'string'
          ? body.pixPasswordConfirmation
          : '';
      if (!pwdConfirm || !verifyUserPassword(clientUser, pwdConfirm)) {
        return NextResponse.json(
          {
            code: 'PIX_PASSWORD_REQUIRED',
            error:
              '🔐 Por segurança, digite sua senha de acesso para confirmar a alteração da Chave PIX da loja.',
          },
          { status: 403 }
        );
      }
    }

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
    const { pixPasswordConfirmation: _ignoredConfirm, ...cleanMenuBody } = body;
    void _ignoredConfirm;
    const updatedMenu: RestaurantMenu = {
      ...cleanMenuBody,
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

    if (isChangingExistingPix) {
      createDeveloperNotification({
        type: 'security_alert',
        title: `💳 Alteração de Chave PIX: ${updatedMenu.title}`,
        message: `Chave PIX de /${cleanSlug} alterada por ${
          isAdmin ? 'Admin' : clientUser?.email || 'cliente'
        }. Anterior: "${previousPix}" → Nova: "${nextPix || '(removida)'}".`,
        clientName: updatedMenu.title,
        contact: clientUser?.whatsapp || clientUser?.email,
        slug: cleanSlug,
      });
    }

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
      ...(isChangingExistingPix ? [persistSliceToCloud('notifications')] : []),
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
