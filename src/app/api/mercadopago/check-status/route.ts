import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '@/lib/mercadopago';
import {
  getPayment,
  recordPayment,
  getDynamicQRBySlug,
  expireDueQRsIfAny,
  syncDbFromCloud,
  persistSliceToCloud,
} from '@/lib/db';
import { isProStillValid } from '@/lib/pro-status';

export async function GET(request: Request) {
  await syncDbFromCloud();
  if (expireDueQRsIfAny()) {
    await persistSliceToCloud('qrs');
  }
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('paymentId');
  const slug = searchParams.get('slug');

  if (!paymentId && !slug) {
    return NextResponse.json(
      { error: 'Parâmetros insuficientes' },
      { status: 400 }
    );
  }

  // Check DB status first
  if (paymentId) {
    const localPayment = getPayment(paymentId);
    if (localPayment && localPayment.status === 'approved') {
      return NextResponse.json({ status: 'approved' });
    }
  }

  if (slug) {
    const qr = getDynamicQRBySlug(slug);
    if (isProStillValid(qr)) {
      return NextResponse.json({ status: 'approved' });
    }
  }

  // If connected to live Mercado Pago API
  if (paymentId) {
    const remote = await checkPaymentStatus(paymentId);
    if (remote.status === 'approved') {
      const targetSlug = slug || remote.externalReference;
      if (targetSlug) {
        recordPayment(paymentId, targetSlug, 'approved', 10.9);
        await Promise.all([
          persistSliceToCloud('payments'),
          persistSliceToCloud('qrs'),
          persistSliceToCloud('notifications'),
        ]);
      }
      return NextResponse.json({ status: 'approved' });
    }
    return NextResponse.json({ status: remote.status });
  }

  return NextResponse.json({ status: 'pending' });
}
