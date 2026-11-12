import type { Metadata } from 'next';
import DigitalShowcasePage from '@/components/DigitalShowcasePage';
import { buildShowcaseMetadata } from '@/lib/showcase-metadata';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return buildShowcaseMetadata(params.slug, 'catalog');
}

export default function DigitalCatalogPage({
  params,
}: {
  params: { slug: string };
}) {
  return <DigitalShowcasePage slug={params.slug} defaultMode="catalog" />;
}

