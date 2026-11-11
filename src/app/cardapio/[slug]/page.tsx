import DigitalShowcasePage from '@/components/DigitalShowcasePage';

export default function DigitalMenuPage({
  params,
}: {
  params: { slug: string };
}) {
  return <DigitalShowcasePage slug={params.slug} defaultMode="menu" />;
}
