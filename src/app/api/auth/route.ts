import { NextRequest, NextResponse } from 'next/server';
import {
  CLIENT_COOKIE_NAME,
  createClientSessionToken,
  getAuthenticatedClientUser,
  verifyClientCredentials,
} from '@/lib/client-auth';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  isAdminRequestAuthenticated,
  verifyCredentials,
} from '@/lib/admin-auth';
import {
  createClientUser,
  syncDbFromCloud,
  persistSliceToCloud,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await syncDbFromCloud();
  const clientUser = getAuthenticatedClientUser(req);
  const isAdmin = isAdminRequestAuthenticated(req);

  if (clientUser) {
    const { passwordHash, ...safeUser } = clientUser;
    return NextResponse.json({
      authenticated: true,
      role: 'client',
      isAdmin,
      user: safeUser,
    });
  }

  if (isAdmin) {
    return NextResponse.json({
      authenticated: true,
      role: 'admin',
      isAdmin: true,
      user: {
        id: 'admin',
        name: 'Desenvolvedor (Admin)',
        businessName: 'SpotQR Pro Admin',
        email: 'dev@spotqr.pro',
        whatsapp: '',
      },
    });
  }

  return NextResponse.json(
    { authenticated: false, user: null, isAdmin: false },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    await syncDbFromCloud();
    const body = await req.json();
    const { action, name, businessName, email, whatsapp, password } = body;

    if (action === 'register') {
      if (!name || !email || !password) {
        return NextResponse.json(
          {
            error:
              'Preencha seu nome, seu e-mail (login) e sua senha para criar sua conta.',
          },
          { status: 400 }
        );
      }

      if (String(password).length < 4) {
        return NextResponse.json(
          { error: 'A senha deve ter pelo menos 4 caracteres.' },
          { status: 400 }
        );
      }

      try {
        const newUser = createClientUser({
          name: String(name),
          businessName: String(businessName || name),
          email: String(email),
          whatsapp: String(whatsapp || ''),
          passwordPlain: String(password),
        });

        await Promise.all([
          persistSliceToCloud('users'),
          persistSliceToCloud('notifications'),
        ]);

        const token = createClientSessionToken(newUser);
        const { passwordHash, ...safeUser } = newUser;

        const res = NextResponse.json({
          authenticated: true,
          role: 'client',
          user: safeUser,
          redirectUrl: '/dashboard',
        });

        res.cookies.set(CLIENT_COOKIE_NAME, token, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 dias
        });

        return res;
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message || 'Erro ao cadastrar conta de cliente.' },
          { status: 400 }
        );
      }
    }

    // Default action: 'login'
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Informe seu e-mail/usuário e sua senha.' },
        { status: 400 }
      );
    }

    // 1. Check if logging in as Developer Admin
    if (verifyCredentials(String(email), String(password))) {
      const adminToken = createAdminSessionToken();
      const res = NextResponse.json({
        authenticated: true,
        role: 'admin',
        isAdmin: true,
        user: {
          id: 'admin',
          name: 'Desenvolvedor (Admin)',
          businessName: 'SpotQR Pro Admin',
          email: String(email),
        },
        redirectUrl: '/admin',
      });

      res.cookies.set(ADMIN_COOKIE_NAME, adminToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    // 2. Check if logging in as Client User
    const clientUser = verifyClientCredentials(String(email), String(password));
    if (!clientUser) {
      return NextResponse.json(
        {
          error:
            'E-mail/login ou senha incorretos. Se ainda não tem conta, clique em "Criar Minha Conta".',
        },
        { status: 401 }
      );
    }

    const token = createClientSessionToken(clientUser);
    const { passwordHash, ...safeUser } = clientUser;

    const res = NextResponse.json({
      authenticated: true,
      role: 'client',
      user: safeUser,
      redirectUrl: '/dashboard',
    });

    res.cookies.set(CLIENT_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (err) {
    console.error('Error in POST /api/auth:', err);
    return NextResponse.json(
      { error: 'Erro interno ao processar autenticação.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({
    authenticated: false,
    message: 'Sessão encerrada.',
  });

  res.cookies.set(CLIENT_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return res;
}

