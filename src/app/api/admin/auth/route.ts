import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminCredentials,
  isAdminRequestAuthenticated,
  verifyCredentials,
} from '@/lib/admin-auth';
import {
  saveDeveloperSettings,
  syncDbFromCloud,
  persistSliceToCloud,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await syncDbFromCloud();
  const isAuthenticated = isAdminRequestAuthenticated(req);
  if (!isAuthenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const { validUsername } = getAdminCredentials();
  return NextResponse.json({
    authenticated: true,
    username: validUsername,
  });
}

export async function POST(req: NextRequest) {
  try {
    await syncDbFromCloud();
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Informe seu usuário/e-mail e sua senha de acesso.' },
        { status: 400 }
      );
    }

    const isValid = verifyCredentials(String(username), String(password));
    if (!isValid) {
      return NextResponse.json(
        {
          error:
            'Credenciais inválidas. Verifique seu usuário/e-mail e senha de desenvolvedor.',
        },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken();
    const response = NextResponse.json({
      authenticated: true,
      message: 'Login realizado com sucesso.',
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (err) {
    console.error('Error in POST /api/admin/auth:', err);
    return NextResponse.json(
      { error: 'Erro interno ao processar login.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await syncDbFromCloud();
    if (!isAdminRequestAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Acesso negado. Faça login primeiro.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newUsername, newPassword } = body;
    const { validPassword } = getAdminCredentials();

    if (currentPassword !== validPassword) {
      return NextResponse.json(
        { error: 'A senha atual informada está incorreta.' },
        { status: 400 }
      );
    }

    if (!newPassword || String(newPassword).length < 4) {
      return NextResponse.json(
        { error: 'A nova senha deve ter pelo menos 4 caracteres.' },
        { status: 400 }
      );
    }

    saveDeveloperSettings({
      adminUsername: newUsername ? String(newUsername).trim() : 'admin',
      adminPassword: String(newPassword),
    });
    await persistSliceToCloud('settings');

    const newToken = createAdminSessionToken();
    const response = NextResponse.json({
      success: true,
      message: 'Credenciais de login atualizadas com sucesso!',
    });

    response.cookies.set(ADMIN_COOKIE_NAME, newToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('Error in PUT /api/admin/auth:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar credenciais.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    authenticated: false,
    message: 'Sessão encerrada com segurança.',
  });

  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

