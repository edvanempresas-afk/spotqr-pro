import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://spotqr.com.br'),
  title:
    'SpotQR Pro | Gerador de QR Code Dinâmico com Logomarca & Cardápio Digital',
  description:
    'Crie QR Codes dinâmicos com a sua logomarca no centro e cardápio digital para mesas, balcões e delivery. Altere links e preços sem reimprimir adesivos.',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SpotQR Pro | QR Code Dinâmico com Logo & Cardápio Digital',
    description:
      'Crie QR Codes profissionais com sua logomarca e cardápios digitais sem taxas. O segredo dos restaurantes e comércios mais lucrativos.',
    url: 'https://spotqr.com.br',
    siteName: 'SpotQR Pro',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpotQR Pro | QR Code Dinâmico com Logo & Cardápio Digital',
    description:
      'Crie displays sofisticados para mesas, balcões, PIX e Wi-Fi. Mude preços e links quando quiser.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SpotQR App',
  },
  keywords: [
    'gerador de qr code',
    'qr code com logo no centro',
    'qr code dinamico',
    'cardapio digital para restaurante',
    'cardapio digital sem taxas',
    'qr code mesa restaurante',
    'qr code pix oficial',
    'gerador de cardapio digital',
    'sistema para restaurante e barbearia',
  ],
  authors: [{ name: 'SpotQR Pro Tecnologia' }],
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'SpotQR Pro',
  url: 'https://spotqr.com.br',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '10.90',
    priceCurrency: 'BRL',
    description: 'Assinatura SpotQR PRO com QR Dinâmico e Logomarca no Centro',
  },
  description:
    'Gerador de QR Code dinâmico com logomarca no centro e sistema de cardápio digital para mesas e delivery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
