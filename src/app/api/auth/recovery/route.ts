import { NextRequest, NextResponse } from 'next/server';
import {
  CLIENT_COOKIE_NAME,
  createClientSessionToken,
  getAuthenticatedClientUser,
} from '@/lib/client-auth';
import {
  changeUserPassword,
  completePasswordResetWithCode,
  createPasswordResetRequest,
  persistSliceToCloud,
  regenerateBackupRecoveryCodeForUser,
  syncDbFromCloud,
} from '@/lib/db';
import { checkAndConsumeRateLimit, clearRateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await syncDbFromCloud();
    const body = await req.json();
    const action = String(body.action || '');

    if (action === 'request_reset') {
      const email = String(body.email || '').trim().toLowerCase();
      const providedWhatsapp = String(body.whatsapp || '').trim();
      const providedStoreHint = String(body.storeHint || '').trim();
      const providedPixHint = String(body.pixHint || '').trim();

      if (!email || !providedWhatsapp) {
        return NextResponse.json(
          {
            error:
              'Informe o e-mail da conta e o WhatsApp cadastrado para registrar a solicitação.',
          },
          { status: 400 }
        );
      }

      const rate = checkAndConsumeRateLimit(
        `rst_req:${email}`,
        4,
        15 * 60 * 1000
      );
      if (!rate.allowed) {
        return NextResponse.json(
          {
            error: `Muitas solicitações seguidas. Aguarde ${Math.ceil(
              rate.retryAfterSeconds / 60
            )} minutos.`,
          },
          { status: 429 }
        );
      }

      const result = await createPasswordResetRequest({
        email,
        providedWhatsapp,
        providedStoreHint,
        providedPixHint,
      });

      if (result.created) {
        await Promise.all([
          persistSliceToCloud('resets'),
          persistSliceToCloud('notifications'),
        ]);
      }

      // Always return a uniform non-enumerating security response
      return NextResponse.json({
        success: true,
        message:
          'Solicitação registrada com segurança! Se os dados forem de uma conta válida, nossa equipe validará sua identidade pelo WhatsApp oficial cadastrado antes de liberar o código único (evitando que golpistas invadam seu painel ou alterem seu PIX). Se você guardou seu Código Secreto de Recuperação (SPOT-REC-...), pode usá-lo imediatamente na aba ao lado.',
      });
    }

    if (action === 'confirm_reset') {
      const email = String(body.email || '').trim().toLowerCase();
      const code = String(body.code || '').trim();
      const newPassword = String(body.newPassword || '');

      if (!email || !code || !newPassword) {
        return NextResponse.json(
          {
            error:
              'Preencha seu e-mail, o código de recuperação e a nova senha.',
          },
          { status: 400 }
        );
      }

      const rate = checkAndConsumeRateLimit(
        `rst_confirm:${email}`,
        6,
        15 * 60 * 1000
      );
      if (!rate.allowed) {
        return NextResponse.json(
          {
            error:
              'Muitas tentativas com código inválido. Aguarde 15 minutos ou peça um novo código.',
          },
          { status: 429 }
        );
      }

      try {
        const result = completePasswordResetWithCode({
          email,
          code,
          newPassword,
        });
        clearRateLimit(`rst_confirm:${email}`);

        await Promise.all([
          persistSliceToCloud('users'),
          persistSliceToCloud('resets'),
          persistSliceToCloud('notifications'),
        ]);

        const token = createClientSessionToken(result.user);
        const res = NextResponse.json({
          success: true,
          mode: result.mode,
          message:
            'Senha redefinida com sucesso! Sessões antigas foram desconectadas e, por proteção anti-golpe, alterações na Chave PIX permanecem bloqueadas por 24 horas.',
        });

        res.cookies.set(CLIENT_COOKIE_NAME, token, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });

        return res;
      } catch (err: any) {
        await Promise.all([
          persistSliceToCloud('resets'),
          persistSliceToCloud('users'),
        ]);
        return NextResponse.json(
          { error: err.message || 'Não foi possível redefinir a senha.' },
          { status: 400 }
        );
      }
    }

    if (action === 'change_password') {
      const clientUser = getAuthenticatedClientUser(req);
      if (!clientUser) {
        return NextResponse.json(
          { error: 'Faça login para alterar sua senha.' },
          { status: 401 }
        );
      }

      const currentPassword = String(body.currentPassword || '');
      const newPassword = String(body.newPassword || '');

      try {
        const updatedUser = changeUserPassword({
          userId: clientUser.id,
          currentPassword,
          newPassword,
        });
        await persistSliceToCloud('users');

        const token = createClientSessionToken(updatedUser);
        const res = NextResponse.json({
          success: true,
          message: 'Senha alterada com sucesso! Outros aparelhos foram desconectados.',
        });

        res.cookies.set(CLIENT_COOKIE_NAME, token, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });

        return res;
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message || 'Erro ao alterar senha.' },
          { status: 400 }
        );
      }
    }

    if (action === 'regenerate_backup_code') {
      const clientUser = getAuthenticatedClientUser(req);
      if (!clientUser) {
        return NextResponse.json(
          { error: 'Faça login para gerar seu código secreto.' },
          { status: 401 }
        );
      }

      const currentPassword = String(body.currentPassword || '');
      try {
        const result = regenerateBackupRecoveryCodeForUser({
          userId: clientUser.id,
          currentPassword,
        });
        await persistSliceToCloud('users');

        return NextResponse.json({
          success: true,
          code: result.code,
          hint: result.hint,
        });
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message || 'Não foi possível gerar o código secreto.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err) {
    console.error('Error in /api/auth/recovery:', err);
    return NextResponse.json(
      { error: 'Erro interno no módulo de recuperação e segurança.' },
      { status: 500 }
    );
  }
}
