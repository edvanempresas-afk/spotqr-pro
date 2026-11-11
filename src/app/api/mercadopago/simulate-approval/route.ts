import { NextResponse } from 'next/server';
import {
  recordPayment,
  getDynamicQRBySlug,
  saveDynamicQR,
  syncDbFromCloud,
  persistSliceToCloud,
} from '@/lib/db';

export async function POST(request: Request) {
  try {
    await syncDbFromCloud();
    const { paymentId, slug } = await request.json();

    if (!paymentId || !slug) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    // Mark as approved in DB
    recordPayment(paymentId, slug, 'approved', 10.90);

    const qr = getDynamicQRBySlug(slug);
    if (qr) {
      qr.isPaid = true;
      qr.paymentId = paymentId;
      qr.updatedAt = new Date().toISOString();
      saveDynamicQR(qr);
    }

    await Promise.all([
      persistSliceToCloud('payments'),
      persistSliceToCloud('qrs'),
      persistSliceToCloud('notifications'),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Pagamento Pix simulado e aprovado com sucesso!',
      status: 'approved',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao simular aprovação' }, { status: 500 });
  }
}

