import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.spotqr.com.br'),
  applicationName: 'SpotQR Pro',
  title:
    'SpotQR Pro | Catálogos, Cardápios & Programa Indique e Ganhe Renda Extra',
  description:
    'Crie Catálogos Digitais, Cardápios e QR Codes com Logo. Ganhe dinheiro nas horas vagas com o Indique & Ganhe: comissão fácil de R$ 10,00 no PIX por indicação, com saque rápido e desconto VIP para o seu indicado.',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SpotQR Pro | Catálogos, Cardápios & Indique e Ganhe Renda Extra',
    description:
      'Crie Catálogos Digitais online e QR Codes dinâmicos com logo. Conheça também o Programa Indique & Ganhe: comissão fácil de R$ 10,00 no PIX nas horas vagas!',
    url: 'https://www.spotqr.com.br',
    siteName: 'SpotQR Pro — Catálogos Digitais, Cardápios & Renda Extra',
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
    title: 'SpotQR Pro | Catálogos, Cardápios & Indique e Ganhe Renda Extra',
    description:
      'Crie Catálogos Digitais online sem comissões e ganhe dinheiro nas horas vagas com o Programa Indique & Ganhe (comissão fácil de R$ 10 via PIX).',
    images: ['/og-spotqr.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SpotQR App',
  },
  keywords: [
    'comissao facil',
    'comissão facil',
    'indique e ganhe',
    'indique e ganhe dinheiro',
    'ganhar dinheiro nas horas vagas',
    'renda extra no pix',
    'como ganhar dinheiro na internet',
    'programa de afiliados pix',
    'afiliados que pagam no pix',
    'ganhar dinheiro indicando amigos',
    'renda extra facil online',
    'trabalhar nas horas vagas',
    'ganhar 10 reais no pix',
    'renda extra sem investimento',
    'indique e ganhe 2026',
    'afiliado mercado pago pix',
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

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'SpotQR Pro — Catálogos Digitais, Cardápios & QR Codes',
    url: 'https://www.spotqr.com.br',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '25.90',
      priceCurrency: 'BRL',
      description:
        'Assinatura SpotQR PRO com Catálogo Digital, Cardápio, Logomarca no Centro e QR Dinâmico',
    },
    description:
      'Plataforma completa para criar Catálogos Digitais de produtos com pedidos via WhatsApp e PIX sem taxas, Cardápios Digitais e QR Codes dinâmicos com logomarca no centro.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: 'Programa Indique & Ganhe SpotQR Pro — Renda Extra no PIX',
    description:
      'Programa de afiliados com comissão fácil de R$ 10,00 via PIX por indicação. Ganhe dinheiro nas horas vagas indicando novos assinantes para a plataforma.',
    url: 'https://www.spotqr.com.br/regras-indique-e-ganhe',
    provider: {
      '@type': 'Organization',
      name: 'SpotQR Pro',
      url: 'https://www.spotqr.com.br',
    },
    offers: {
      '@type': 'Offer',
      price: '10.00',
      priceCurrency: 'BRL',
      description: 'Bônus de comissão em dinheiro pago via PIX por assinante PRO indicado',
    },
  },
];

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
