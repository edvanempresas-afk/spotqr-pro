import DigitalShowcasePage from '@/components/DigitalShowcasePage';

export default function DigitalCatalogPage({
  params,
}: {
  params: { slug: string };
}) {
  return <DigitalShowcasePage slug={params.slug} defaultMode="catalog" />;
}
