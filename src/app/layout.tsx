import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title:
    'SpotQR Pro | Gerador de QR Code Dinâmico com Logomarca & Cardápio Digital',
  description:
    'Crie QR Codes estilizados com logo e moldura para mesas, balcões, PIX, Wi-Fi e WhatsApp. Atualize o link de destino sem precisar reimprimir adesivos ou acrílicos.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SpotQR App',
  },
  keywords: [
    'gerador de qr code',
    'qr code dinamico',
    'qr code com logo',
    'cardapio digital',
    'qr code mesa restaurante',
    'qr code pix',
    'qr code wifi',
    'menu qr',
  ],
  authors: [{ name: 'SpotQR Pro' }],
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
      </head>
      <body className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
