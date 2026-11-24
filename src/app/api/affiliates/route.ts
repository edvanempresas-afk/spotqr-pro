import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClientUser } from '@/lib/client-auth';
import {
  syncDbFromCloud,
  persistSliceToCloud,
  getAffiliateDashboardData,
  updateUserPix,
  getOrCreateUserReferralCode,
} from '@/lib/db';
import { PixKeyType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await syncDbFromCloud();
    const clientUser = getAuthenticatedClientUser(req);
    if (!clientUser) {
      return NextResponse.json(
        { error: 'Acesso restrito. Faça login para acessar o programa de afiliados.' },
        { status: 401 }
      );
    }

    const data = getAffiliateDashboardData(clientUser.id);
    if (!data) {
      return NextResponse.json(
        { error: 'Perfil de afiliado não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error('Error fetching affiliate data:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro ao carregar dados do programa.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await syncDbFromCloud();
    const clientUser = getAuthenticatedClientUser(req);
    if (!clientUser) {
      return NextResponse.json(
        { error: 'Acesso restrito. Faça login para configurar sua chave PIX.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, pixKey, pixType } = body;

    if (action === 'save_pix') {
      const cleanPix = String(pixKey || '').trim();
      const validTypes: PixKeyType[] = ['cpf', 'cnpj', 'phone', 'email', 'random'];
      const resolvedType: PixKeyType = validTypes.includes(pixType) ? pixType : 'email';

      if (!cleanPix) {
        return NextResponse.json(
          { error: 'Digite uma chave PIX válida para receber suas comissões.' },
          { status: 400 }
        );
      }

      const updatedUser = updateUserPix(clientUser.id, cleanPix, resolvedType);
      await persistSliceToCloud('users');

      const data = getAffiliateDashboardData(clientUser.id);
      return NextResponse.json({
        success: true,
        message: 'Chave PIX salva com sucesso! Seu link de indicação já está ativo.',
        ...data,
      });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error updating affiliate pix:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro ao atualizar chave PIX.' },
      { status: 500 }
    );
  }
}
