import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.spotqr.com.br'),
  applicationName: 'SpotQR Pro',
  title:
    'SpotQR Pro | Catálogo Digital, QR Code com Logo & Cardápio',
  description:
    'Crie Catálogos Digitais para lojas, roupas, artesanato e produtos com pedidos no WhatsApp e PIX sem taxas, além de Cardápios Digitais e QR Codes dinâmicos com logomarca no centro.',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SpotQR Pro | Catálogo Digital, QR Code com Logo & Cardápio',
    description:
      'Crie Catálogos Digitais online de produtos sem taxas ou comissões, Cardápios Digitais e QR Codes dinâmicos com sua logomarca no centro.',
    url: 'https://www.spotqr.com.br',
    siteName: 'SpotQR Pro — Catálogos Digitais, Cardápios & QR Codes',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-spotqr.png',
        width: 1200,
        height: 630,
        alt: 'SpotQR Pro — Catálogos Digitais, Cardápios & QR Codes com Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpotQR Pro | Catálogo Digital, QR Code com Logo & Cardápio',
    description:
      'Crie Catálogos Digitais online com carrinho, PIX e WhatsApp sem comissões, Cardápios Digitais e QR Codes profissionais com logo no centro.',
    images: ['/og-spotqr.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SpotQR App',
  },
  keywords: [
    'catalogo digital',
    'catalogo digital gratis',
    'catalogo online para loja',
    'criar catalogo whatsapp',
    'vitrine digital de produtos',
    'catalogo sem comissoes',
    'gerador de catalogo digital',
    'gerador de qr code',
    'qr code com logo no centro',
    'qr code dinamico',
    'cardapio digital para restaurante',
    'cardapio digital sem taxas',
    'qr code mesa restaurante',
    'qr code pix oficial',
    'gerador de cardapio digital',
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
  name: 'SpotQR Pro — Catálogos Digitais, Cardápios & QR Codes',
  url: 'https://www.spotqr.com.br',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '10.90',
    priceCurrency: 'BRL',
    description:
      'Assinatura SpotQR PRO com Catálogo Digital, Cardápio, Logomarca no Centro e QR Dinâmico',
  },
  description:
    'Plataforma completa para criar Catálogos Digitais de produtos com pedidos via WhatsApp e PIX sem taxas, Cardápios Digitais e QR Codes dinâmicos com logomarca no centro.',
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
