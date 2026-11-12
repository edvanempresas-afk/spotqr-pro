import type { Metadata } from 'next';
import DigitalShowcasePage from '@/components/DigitalShowcasePage';
import {
  peekExistingMenuBySlug,
  resolveEffectiveSlug,
  syncDbFromCloud,
  syncMenuFromCloud,
} from '@/lib/db';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    await syncDbFromCloud();
    const effectiveSlug = resolveEffectiveSlug(params.slug);
    await syncMenuFromCloud(effectiveSlug);
    const menu = peekExistingMenuBySlug(effectiveSlug);
    const title = menu?.title
      ? `${menu.title} | Catálogo Digital SpotQR`
      : 'Catálogo Digital Online | SpotQR Pro';
    const description =
      menu?.description ||
      'Confira produtos, fotos, preços e faça pedidos direto pelo WhatsApp ou PIX neste Catálogo Digital criado no SpotQR Pro.';
    const imageUrl =
      menu?.coverImage && !menu.coverImage.startsWith('data:')
        ? menu.coverImage
        : '/catalogo/cover-loja.jpg';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://www.spotqr.com.br/catalogo/${params.slug}`,
        siteName: 'SpotQR Pro — Catálogos & Cardápios Digitais',
        locale: 'pt_BR',
        type: 'website',
        images: [{ url: imageUrl }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: 'Catálogo Digital Online | SpotQR Pro',
      description:
        'Veja o catálogo digital interativo de produtos e faça seu pedido direto no WhatsApp e PIX.',
    };
  }
}

export default function DigitalCatalogPage({
  params,
}: {
  params: { slug: string };
}) {
  return <DigitalShowcasePage slug={params.slug} defaultMode="catalog" />;
}

