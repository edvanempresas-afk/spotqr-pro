import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';
import {
  syncDbFromCloud,
  persistSliceToCloud,
  getPendingAffiliatePayouts,
  recordAffiliatePayout,
  getAllAffiliatePayouts,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await syncDbFromCloud();
    if (!isAdminRequestAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Acesso restrito ao administrador.' },
        { status: 401 }
      );
    }

    const pendingPayouts = getPendingAffiliatePayouts();
    const payoutHistory = getAllAffiliatePayouts();

    const totalPendingAmount = pendingPayouts.reduce(
      (sum, p) => sum + p.totalAmount,
      0
    );
    const totalPaidAmount = payoutHistory.reduce(
      (sum, p) => sum + p.totalAmount,
      0
    );

    return NextResponse.json({
      success: true,
      pendingPayouts,
      payoutHistory,
      summary: {
        totalPendingAmount,
        totalPaidAmount,
        pendingAffiliatesCount: pendingPayouts.length,
        totalPayoutsCount: payoutHistory.length,
      },
    });
  } catch (err: any) {
    console.error('Error fetching admin affiliates:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro ao carregar dados de afiliados.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await syncDbFromCloud();
    if (!isAdminRequestAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Acesso restrito ao administrador.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, affiliateId, receiptUrl, receiptName, adminNotes } = body;

    if (action === 'pay_affiliate') {
      if (!affiliateId) {
        return NextResponse.json(
          { error: 'ID do afiliado é obrigatório.' },
          { status: 400 }
        );
      }

      if (!receiptUrl || !String(receiptUrl).trim()) {
        return NextResponse.json(
          { error: 'É obrigatório anexar o comprovante do PIX para concluir o pagamento.' },
          { status: 400 }
        );
      }

      const payout = recordAffiliatePayout(
        affiliateId,
        String(receiptUrl),
        receiptName ? String(receiptName) : 'comprovante_pix.png',
        adminNotes ? String(adminNotes) : undefined
      );

      await Promise.all([
        persistSliceToCloud('conversions'),
        persistSliceToCloud('payouts'),
        persistSliceToCloud('notifications'),
      ]);

      const pendingPayouts = getPendingAffiliatePayouts();
      const payoutHistory = getAllAffiliatePayouts();

      return NextResponse.json({
        success: true,
        message: 'Pagamento registrado com sucesso e comprovante arquivado!',
        payout,
        pendingPayouts,
        payoutHistory,
      });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error recording affiliate payout:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro ao processar pagamento do afiliado.' },
      { status: 500 }
    );
  }
}
