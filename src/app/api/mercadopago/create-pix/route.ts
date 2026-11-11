import { NextRequest, NextResponse } from 'next/server';
import { createPixPayment } from '@/lib/mercadopago';
import { saveDynamicQR, recordPayment, getDynamicQRBySlug } from '@/lib/db';
import { DynamicQRRecord } from '@/lib/types';
import { getAuthenticatedClientUser } from '@/lib/client-auth';

export async function POST(request: NextRequest) {
  try {
    const clientUser = getAuthenticatedClientUser(request);
    const body = await request.json();
    const { slug, email, name, title, targetUrl, type, qrConfig } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug do QR Code é obrigatório.' },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-');

    const payerEmail = clientUser?.email || email || 'cliente@spotqr.pro';
    const payerName =
      clientUser?.name || name || title || 'Cliente SpotQR Pro';
    const originUrl = request.nextUrl?.origin || 'http://localhost:3000';

    // 1. Create Pix Payment & Checkout Pro Preference via Mercado Pago / Mercado Livre
    const pixData = await createPixPayment(
      cleanSlug,
      payerEmail,
      payerName,
      originUrl
    );

    const existing = getDynamicQRBySlug(cleanSlug);

    // 2. Register QR in DB linked to the client account
    const qrRecord: DynamicQRRecord = {
      id: existing?.id || `qr_${Date.now()}`,
      slug: cleanSlug,
      title:
        title ||
        existing?.title ||
        clientUser?.businessName ||
        `QR Dinâmico ${cleanSlug}`,
      targetUrl:
        targetUrl ||
        existing?.targetUrl ||
        `/${type === 'catalog' ? 'catalogo' : 'cardapio'}/${cleanSlug}`,
      type: type || existing?.type || 'menu',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scansCount: existing?.scansCount || 0,
      isPaid: existing?.isPaid || false,
      paymentId: pixData.paymentId,
      qrConfig: qrConfig || existing?.qrConfig || {},
      linkedMenuId: cleanSlug,
      ownerId: clientUser?.id || existing?.ownerId,
      ownerEmail: clientUser?.email || existing?.ownerEmail || payerEmail,
    };

    saveDynamicQR(qrRecord);
    recordPayment(
      pixData.paymentId,
      cleanSlug,
      'pending',
      pixData.amount,
      payerName,
      payerEmail
    );

    return NextResponse.json({
      success: true,
      payment: pixData,
      slug: cleanSlug,
    });
  } catch (error) {
    console.error('Error generating Pix payment:', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar a cobrança Pix no momento.' },
      { status: 500 }
    );
  }
}
