import type { Metadata } from 'next';
import {
  getDynamicQRBySlug,
  peekExistingMenuBySlug,
  resolveEffectiveSlug,
  syncDbFromCloud,
  syncMenuFromCloud,
} from '@/lib/db';
import type { RestaurantMenu } from '@/lib/types';

type ShowcaseMode = NonNullable<RestaurantMenu['mode']>;

export async function loadShowcaseBrandingBySlug(slug: string) {
  await syncDbFromCloud();
  const effectiveSlug = resolveEffectiveSlug(slug);
  await syncMenuFromCloud(effectiveSlug);

  const menu = peekExistingMenuBySlug(effectiveSlug);
  const dynQr = getDynamicQRBySlug(effectiveSlug);
  const rawLogo = (menu?.logoImage || dynQr?.qrConfig?.logoUrl || '').trim();
  const rawCover = (menu?.coverImage || '').trim();

  return { effectiveSlug, menu, dynQr, rawLogo, rawCover };
}

function resolveShareImageUrl(
  effectiveSlug: string,
  rawLogo: string,
  rawCover: string,
  updatedAt?: string
): string {
  if (rawLogo) {
    if (rawLogo.startsWith('data:')) {
      const version = updatedAt
        ? encodeURIComponent(String(Date.parse(updatedAt) || updatedAt))
        : '1';
      return `/api/showcase-logo/${encodeURIComponent(effectiveSlug)}?v=${version}`;
    }
    if (/^https?:\/\//i.test(rawLogo) || rawLogo.startsWith('/')) {
      return rawLogo;
    }
  }

  if (
    rawCover &&
    !rawCover.startsWith('data:') &&
    (/^https?:\/\//i.test(rawCover) || rawCover.startsWith('/'))
  ) {
    return rawCover;
  }

  return '/og-spotqr.png';
}

export async function buildShowcaseMetadata(
  slug: string,
  defaultMode: ShowcaseMode
): Promise<Metadata> {
  const isCatalog = defaultMode === 'catalog';
  const fallbackTitle = isCatalog
    ? 'Catálogo Digital Online | SpotQR Pro'
    : 'Cardápio Digital Online | SpotQR Pro';
  const fallbackDescription = isCatalog
    ? 'Confira produtos, fotos, preços e faça pedidos direto pelo WhatsApp ou PIX neste Catálogo Digital criado no SpotQR Pro.'
    : 'Veja pratos, fotos, preços e peça direto pelo WhatsApp ou PIX neste Cardápio Digital criado no SpotQR Pro.';

  try {
    const { effectiveSlug, menu, rawLogo, rawCover } =
      await loadShowcaseBrandingBySlug(slug);
    const modeLabel =
      (menu?.mode || defaultMode) === 'catalog'
        ? 'Catálogo Digital SpotQR'
        : 'Cardápio Digital SpotQR';
    const title = menu?.title ? `${menu.title} | ${modeLabel}` : fallbackTitle;
    const description = menu?.description || fallbackDescription;

    const imageUrl = resolveShareImageUrl(
      effectiveSlug,
      rawLogo,
      rawCover,
      menu?.updatedAt
    );
    const routeSegment = isCatalog ? 'catalogo' : 'cardapio';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://www.spotqr.com.br/${routeSegment}/${slug}`,
        siteName: isCatalog
          ? 'SpotQR Pro — Catálogos & Cardápios Digitais'
          : 'SpotQR Pro — Cardápios & Catálogos Digitais',
        locale: 'pt_BR',
        type: 'website',
        images: [
          {
            url: imageUrl,
            alt: menu?.title ? `Logo de ${menu.title}` : title,
          },
        ],
      },
      twitter: {
        card: rawLogo ? 'summary' : 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }
}

