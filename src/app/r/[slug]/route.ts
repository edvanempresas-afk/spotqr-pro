import { NextResponse } from 'next/server';
import {
  getDynamicQRBySlug,
  resolveEffectiveSlug,
  incrementQRScan,
  expireDueQRsIfAny,
  reconcileCloudSlugMigrations,
  syncDbFromCloud,
  persistSliceToCloud,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  await syncDbFromCloud();
  if (expireDueQRsIfAny()) {
    await reconcileCloudSlugMigrations();
    await persistSliceToCloud('qrs');
  }
  const { slug } = params;
  const resolvedSlug = resolveEffectiveSlug(slug);
  const qr = getDynamicQRBySlug(resolvedSlug);

  if (!qr) {
    return new Response(
      `<!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>QR Code Não Encontrado | SpotQR Pro</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-white min-h-screen flex items-center justify-center p-4">
          <div class="max-w-md w-full bg-slate-800/80 backdrop-blur border border-slate-700 rounded-3xl p-8 text-center shadow-2xl">
            <div class="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
            <h1 class="text-2xl font-bold mb-2">QR Code Não Encontrado</h1>
            <p class="text-slate-400 text-sm mb-6">Este endereço não existe ou foi removido pelo criador.</p>
            <a href="/" class="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition">Criar Meu QR Code</a>
          </div>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 404,
      }
    );
  }

  // Count scan
  incrementQRScan(resolvedSlug);
  await persistSliceToCloud('qrs');

  // If not yet paid (in demo or pending activation), we can still allow or show notice
  let destination = qr.targetUrl;

  if (qr.type === 'catalog') {
    const origin = new URL(request.url).origin;
    destination = `${origin}/catalogo/${resolvedSlug}`;
  } else if (qr.type === 'menu' || qr.linkedMenuId) {
    const origin = new URL(request.url).origin;
    destination = `${origin}/cardapio/${resolvedSlug}`;
  }

  // If destination is relative, prefix with origin
  if (destination.startsWith('/')) {
    const origin = new URL(request.url).origin;
    destination = `${origin}${destination}`;
  }

  return NextResponse.redirect(destination, 307);
}

