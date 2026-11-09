import { NextResponse } from 'next/server';
import { checkPaymentStatus } from '@/lib/mercadopago';
import { recordPayment, getPayment } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Mercado Pago sends notifications for payment actions
    if (
      body.type === 'payment' ||
      body.action === 'payment.created' ||
      body.action === 'payment.updated'
    ) {
      const paymentId = body.data?.id || body.id;
      if (paymentId) {
        const result = await checkPaymentStatus(String(paymentId));
        if (result.status === 'approved') {
          const existing = getPayment(String(paymentId));
          const slug =
            result.externalReference || existing?.slug || 'unknown';
          recordPayment(String(paymentId), slug, 'approved', 10.9);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
