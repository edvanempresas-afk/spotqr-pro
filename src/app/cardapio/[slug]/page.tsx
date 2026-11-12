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
      ? `${menu.title} | Cardápio Digital SpotQR`
      : 'Cardápio Digital Online | SpotQR Pro';
    const description =
      menu?.description ||
      'Veja pratos, fotos, preços e peça direto pelo WhatsApp ou PIX neste Cardápio Digital criado no SpotQR Pro.';
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
        url: `https://www.spotqr.com.br/cardapio/${params.slug}`,
        siteName: 'SpotQR Pro — Cardápios & Catálogos Digitais',
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
      title: 'Cardápio Digital Online | SpotQR Pro',
      description:
        'Confira o cardápio digital completo e faça seu pedido direto no WhatsApp e PIX.',
    };
  }
}

export default function DigitalMenuPage({
  params,
}: {
  params: { slug: string };
}) {
  return <DigitalShowcasePage slug={params.slug} defaultMode="menu" />;
}
