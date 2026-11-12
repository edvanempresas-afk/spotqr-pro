import { NextRequest, NextResponse } from 'next/server';
import {
  createProVoucher,
  getAllProVouchers,
  deleteProVoucher,
  syncDbFromCloud,
  persistSliceToCloud,
} from '@/lib/db';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await syncDbFromCloud();
    if (!isAdminRequestAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Acesso restrito ao desenvolvedor.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ vouchers: getAllProVouchers() });
  } catch (err) {
    console.error('Error in GET /api/admin/vouchers:', err);
    return NextResponse.json(
      { error: 'Erro ao carregar vouchers.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await syncDbFromCloud();
    if (!isAdminRequestAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Acesso restrito ao desenvolvedor.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const days = Math.round(Number(body.days) || 0);
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Informe uma quantidade válida de dias (entre 1 e 365 dias).' },
        { status: 400 }
      );
    }

    const voucher = createProVoucher({
      days,
      recipientHint: body.recipientHint,
    });

    await persistSliceToCloud('vouchers');
    return NextResponse.json({
      success: true,
      voucher,
      vouchers: getAllProVouchers(),
    });
  } catch (err) {
    console.error('Error in POST /api/admin/vouchers:', err);
    return NextResponse.json(
      { error: 'Erro ao gerar voucher PRO.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await syncDbFromCloud();
    if (!isAdminRequestAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Acesso restrito ao desenvolvedor.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID do voucher é obrigatório.' },
        { status: 400 }
      );
    }

    const deleted = deleteProVoucher(id);
    if (deleted) {
      await persistSliceToCloud('vouchers');
    }

    return NextResponse.json({
      success: deleted,
      vouchers: getAllProVouchers(),
    });
  } catch (err) {
    console.error('Error in DELETE /api/admin/vouchers:', err);
    return NextResponse.json(
      { error: 'Erro ao excluir voucher.' },
      { status: 500 }
    );
  }
}

