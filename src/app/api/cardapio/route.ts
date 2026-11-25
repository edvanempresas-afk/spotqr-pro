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
  resolveAccountProEntitlement,
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
  const accountPro = resolveAccountProEntitlement(
    qr?.ownerId || menu.ownerId,
    qr?.ownerEmail || menu.ownerEmail
  );
  const isPaid = Boolean(
    isProStillValid(qr) ||
      accountPro.isPaid ||
      effectiveSlug === 'demo-restaurante' ||
      effectiveSlug === 'demo-catalogo'
  );

  const sanitizedItems = (menu.items || []).map((it) =>
    isPaid
      ? it
      : {
          ...it,
          galleryImages: undefined,
          originalPrice: undefined,
          promoEffect: undefined,
          showPriceSplash: undefined,
          maxInstallments: undefined,
          installmentsHasInterest: undefined,
          installmentsInterestMode: undefined,
          customInstallmentAmount: undefined,
          pixDiscountPercent: undefined,
          freeShipping: undefined,
          trustHighlights: undefined,
          variantGroupTitle: undefined,
          variants: undefined,
        }
  );

  const effectiveGrantType =
    qr && isProStillValid(qr)
      ? qr.proGrantType || null
      : accountPro.isPaid
      ? accountPro.proGrantType || null
      : null;
  const effectiveExpiresAt =
    qr && isProStillValid(qr)
      ? qr.proExpiresAt || null
      : accountPro.isPaid
      ? accountPro.proExpiresAt || null
      : null;

  return NextResponse.json(
    {
      ...menu,
      items: sanitizedItems,
      coverVideo: isPaid ? menu.coverVideo : undefined,
      priceFontStyle: isPaid ? menu.priceFontStyle : undefined,
      priceScale: isPaid ? menu.priceScale : undefined,
      catalogLayoutMode: isPaid ? menu.catalogLayoutMode : undefined,
      isPaid,
      proGrantType: isPaid ? effectiveGrantType : null,
      proExpiresAt: isPaid ? effectiveExpiresAt : null,
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

    const resolvedSaveOwnerId =
      clientUser?.id || existingQRBeforeSave?.ownerId || body.ownerId;
    const resolvedSaveOwnerEmail =
      clientUser?.email || existingQRBeforeSave?.ownerEmail || body.ownerEmail;
    const accountPro = resolveAccountProEntitlement(
      resolvedSaveOwnerId,
      resolvedSaveOwnerEmail
    );

    const isEffectivePro = Boolean(
      (existingQRBeforeSave && isProStillValid(existingQRBeforeSave)) ||
        accountPro.isPaid ||
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

    const existingItemsById = new Map(
      (existingMenu?.items || []).map((it) => [it.id, it])
    );
    const sanitizedIncomingItems = (cleanMenuBody.items || []).map((item) => {
      const cleanGallery = Array.isArray(item.galleryImages)
        ? item.galleryImages
            .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
            .map((u) => u.trim())
            .slice(0, 4)
        : undefined;
      const existingItem = existingItemsById.get(item.id);
      const existingGallery = existingItem?.galleryImages;

      const cleanOriginalPrice =
        typeof item.originalPrice === 'number' &&
        Number.isFinite(item.originalPrice) &&
        item.originalPrice > 0
          ? Number(item.originalPrice.toFixed(2))
          : undefined;
      const cleanPromoEffect =
        item.promoEffect === 'neon' ||
        item.promoEffect === 'christmas' ||
        item.promoEffect === 'flash_gold' ||
        item.promoEffect === 'none'
          ? item.promoEffect
          : undefined;
      const cleanMaxInstallments =
        typeof item.maxInstallments === 'number' &&
        Number.isFinite(item.maxInstallments) &&
        item.maxInstallments >= 2
          ? Math.min(24, Math.floor(item.maxInstallments))
          : undefined;
      const cleanInterestMode =
        item.installmentsInterestMode === 'no_interest' ||
        item.installmentsInterestMode === 'with_interest' ||
        item.installmentsInterestMode === 'hide'
          ? item.installmentsInterestMode
          : undefined;
      const cleanCustomInstallmentAmount =
        typeof item.customInstallmentAmount === 'number' &&
        Number.isFinite(item.customInstallmentAmount) &&
        item.customInstallmentAmount > 0
          ? Number(item.customInstallmentAmount.toFixed(2))
          : undefined;
      const cleanPixDiscountPercent =
        typeof item.pixDiscountPercent === 'number' &&
        Number.isFinite(item.pixDiscountPercent) &&
        item.pixDiscountPercent >= 1
          ? Math.min(70, Math.round(item.pixDiscountPercent))
          : undefined;
      const cleanTrustHighlights = Array.isArray(item.trustHighlights)
        ? item.trustHighlights
            .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
            .map((t) => t.trim().slice(0, 42))
            .slice(0, 4)
        : undefined;
      const cleanVariants = Array.isArray(item.variants)
        ? item.variants
            .filter((v) => v && typeof v.label === 'string' && v.label.trim().length > 0)
            .slice(0, 20)
            .map((v) => ({
              id: String(v.id || `var-${Math.random().toString(36).slice(2, 8)}`),
              label: v.label.trim().slice(0, 40),
              groupLabel:
                typeof v.groupLabel === 'string' && v.groupLabel.trim()
                  ? v.groupLabel.trim().slice(0, 30)
                  : undefined,
              price:
                typeof v.price === 'number' && Number.isFinite(v.price) && v.price > 0
                  ? Number(v.price.toFixed(2))
                  : undefined,
              colorHex:
                typeof v.colorHex === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v.colorHex.trim())
                  ? v.colorHex.trim()
                  : undefined,
              imageUrl:
                typeof v.imageUrl === 'string' && v.imageUrl.trim()
                  ? v.imageUrl.trim()
                  : undefined,
              isAvailable: v.isAvailable !== false,
            }))
        : undefined;

      return {
        ...item,
        galleryImages: isEffectivePro
          ? cleanGallery && cleanGallery.length > 0
            ? cleanGallery
            : undefined
          : existingGallery,
        originalPrice: isEffectivePro ? cleanOriginalPrice : existingItem?.originalPrice,
        promoEffect: isEffectivePro ? cleanPromoEffect : existingItem?.promoEffect,
        showPriceSplash: isEffectivePro
          ? Boolean(item.showPriceSplash)
          : existingItem?.showPriceSplash,
        maxInstallments: isEffectivePro
          ? cleanMaxInstallments
          : existingItem?.maxInstallments,
        installmentsHasInterest: isEffectivePro
          ? cleanInterestMode
            ? cleanInterestMode === 'with_interest'
            : Boolean(item.installmentsHasInterest)
          : existingItem?.installmentsHasInterest,
        installmentsInterestMode: isEffectivePro
          ? cleanInterestMode
          : existingItem?.installmentsInterestMode,
        customInstallmentAmount: isEffectivePro
          ? cleanCustomInstallmentAmount
          : existingItem?.customInstallmentAmount,
        pixDiscountPercent: isEffectivePro
          ? cleanPixDiscountPercent
          : existingItem?.pixDiscountPercent,
        freeShipping: isEffectivePro
          ? Boolean(item.freeShipping)
          : existingItem?.freeShipping,
        trustHighlights: isEffectivePro
          ? cleanTrustHighlights && cleanTrustHighlights.length > 0
            ? cleanTrustHighlights
            : undefined
          : existingItem?.trustHighlights,
        variantGroupTitle: isEffectivePro
          ? typeof item.variantGroupTitle === 'string' && item.variantGroupTitle.trim()
            ? item.variantGroupTitle.trim().slice(0, 30)
            : undefined
          : existingItem?.variantGroupTitle,
        variants: isEffectivePro
          ? cleanVariants && cleanVariants.length > 0
            ? cleanVariants
            : undefined
          : existingItem?.variants,
      };
    });

    const cleanPriceFontStyle =
      cleanMenuBody.priceFontStyle === 'modern' ||
      cleanMenuBody.priceFontStyle === 'impact' ||
      cleanMenuBody.priceFontStyle === 'classic' ||
      cleanMenuBody.priceFontStyle === 'digital'
        ? cleanMenuBody.priceFontStyle
        : undefined;
    const cleanPriceScale =
      cleanMenuBody.priceScale === 'normal' ||
      cleanMenuBody.priceScale === 'large' ||
      cleanMenuBody.priceScale === 'xlarge'
        ? cleanMenuBody.priceScale
        : undefined;
    const cleanCatalogLayoutMode =
      cleanMenuBody.catalogLayoutMode === 'grid_2col' ||
      cleanMenuBody.catalogLayoutMode === 'list'
        ? cleanMenuBody.catalogLayoutMode
        : undefined;

    const updatedMenu: RestaurantMenu = {
      ...cleanMenuBody,
      items: sanitizedIncomingItems,
      coverVideo: isEffectivePro
        ? incomingCoverVideo || undefined
        : existingCoverVideo || undefined,
      priceFontStyle: isEffectivePro
        ? cleanPriceFontStyle
        : existingMenu?.priceFontStyle,
      priceScale: isEffectivePro ? cleanPriceScale : existingMenu?.priceScale,
      catalogLayoutMode: isEffectivePro
        ? cleanCatalogLayoutMode
        : existingMenu?.catalogLayoutMode,
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
    const credit =
      !accountPro.isPaid && !existingQR && clientUser
        ? consumeUserProCreditIfActive(clientUser.id, clientUser.email)
        : { isPaid: false };
    const resolvedQrIsPaid = Boolean(
      (existingQR && isProStillValid(existingQR)) ||
        accountPro.isPaid ||
        credit.isPaid
    );
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
      isPaid: resolvedQrIsPaid,
      proGrantType:
        existingQR?.proGrantType ||
        accountPro.proGrantType ||
        credit.proGrantType,
      proExpiresAt:
        existingQR && isProStillValid(existingQR)
          ? existingQR.proExpiresAt ?? null
          : accountPro.isPaid
          ? accountPro.proExpiresAt ?? null
          : credit.proExpiresAt ?? null,
      proGrantedAt: existingQR?.proGrantedAt || accountPro.proGrantedAt,
      proGrantedHours: existingQR?.proGrantedHours || accountPro.proGrantedHours,
      proVoucherCode:
        existingQR?.proVoucherCode ||
        accountPro.proVoucherCode ||
        credit.proVoucherCode,
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
