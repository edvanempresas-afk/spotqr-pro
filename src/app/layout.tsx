import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.spotqr.com.br'),
  applicationName: 'SpotQR Pro',
  title:
    'SpotQR Pro | QR Code com Logo, Cardápio & Catálogo Digital',
  description:
    'Crie QR Codes dinâmicos com logomarca no centro, cardápios digitais para restaurantes e catálogos digitais com pedidos no WhatsApp e PIX para lojas, moda, artesanato e serviços.',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SpotQR Pro | QR Code com Logo, Cardápio & Catálogo Digital',
    description:
      'Crie QR Codes dinâmicos com sua logomarca, cardápios digitais e catálogos online de produtos sem taxas ou comissões — ideal para restaurantes, lojas, moda, artesanato e comércios.',
    url: 'https://www.spotqr.com.br',
    siteName: 'SpotQR Pro — QR Codes, Cardápios & Catálogos Digitais',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/catalogo/cover-loja.jpg',
        width: 1200,
        height: 630,
        alt: 'SpotQR Pro — QR Code Dinâmico com Logo, Cardápio e Catálogo Digital',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpotQR Pro | QR Code com Logo, Cardápio & Catálogo Digital',
    description:
      'Crie QR Codes profissionais com logo no centro, cardápios digitais e catálogos online com carrinho, PIX e WhatsApp sem comissões.',
    images: ['/catalogo/cover-loja.jpg'],
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
    'catalogo digital',
    'catalogo digital gratis',
    'catalogo online para loja',
    'criar catalogo whatsapp',
    'vitrine digital de produtos',
    'catalogo sem comissoes',
    'cardapio digital para restaurante',
    'cardapio digital sem taxas',
    'qr code mesa restaurante',
    'qr code pix oficial',
    'gerador de cardapio digital',
    'gerador de catalogo digital',
    'sistema para loja restaurante e barbearia',
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
  name: 'SpotQR Pro — QR Codes, Cardápios & Catálogos Digitais',
  url: 'https://www.spotqr.com.br',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '10.90',
    priceCurrency: 'BRL',
    description:
      'Assinatura SpotQR PRO com QR Dinâmico, Logomarca no Centro, Cardápio e Catálogo Digital',
  },
  description:
    'Plataforma completa para criar QR Codes dinâmicos com logomarca no centro, cardápios digitais para restaurantes e catálogos digitais de produtos com pedidos via WhatsApp e PIX sem taxas.',
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
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7303283838408346"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
