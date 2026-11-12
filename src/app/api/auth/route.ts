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
  getDynamicQRsByOwner,
  expireDueQRsIfAny,
  syncDbFromCloud,
  syncMenuFromCloud,
  peekExistingMenuBySlug,
  persistSliceToCloud,
  isCloudPersistenceConfigured,
} from '@/lib/db';
import { isProStillValid } from '@/lib/pro-status';
import {
  checkAndConsumeRateLimit,
  clearRateLimit,
  isTimestampActiveFuture,
} from '@/lib/security';

export const dynamic = 'force-dynamic';

function sanitizeClientUser<T extends { passwordHash?: string; recoveryCodeHash?: string }>(
  user: T
) {
  const { passwordHash, recoveryCodeHash, ...safeUser } = user;
  void passwordHash;
  void recoveryCodeHash;
  return safeUser;
}

export async function GET(req: NextRequest) {
  await syncDbFromCloud();
  if (expireDueQRsIfAny()) {
    await persistSliceToCloud('qrs');
  }
  const clientUser = getAuthenticatedClientUser(req);
  const isAdmin = isAdminRequestAuthenticated(req);
  const cloudPersistenceEnabled = isCloudPersistenceConfigured();

  if (clientUser) {
    const safeUser = sanitizeClientUser(clientUser);
    const hasBackupRecoveryCode = Boolean(clientUser.recoveryCodeHash);
    const userQRs = getDynamicQRsByOwner(clientUser.id, clientUser.email).filter(
      (q) => q.slug !== 'demo-restaurante' && q.slug !== 'demo-catalogo'
    );
    const userStores = (
      await Promise.all(
        userQRs.map(async (q) => {
          await syncMenuFromCloud(q.slug);
          const m = peekExistingMenuBySlug(q.slug);
          const storeType: 'menu' | 'catalog' =
            m?.mode === 'catalog' || q.type === 'catalog' ? 'catalog' : 'menu';
          return {
            slug: q.slug,
            type: storeType,
            title: m?.title || q.title || safeUser.businessName || q.slug,
            whatsappPhone:
              m?.whatsappNumber ||
              q.qrConfig?.whatsappPhone ||
              safeUser.whatsapp ||
              '',
            pixKey: m?.pixKey || q.qrConfig?.pixKey || '',
            pixKeyType: q.qrConfig?.pixKeyType || 'email',
            logoUrl: m?.logoImage || q.qrConfig?.logoUrl || '',
            isPro: isProStillValid(q),
            proExpiresAt: q.proExpiresAt || null,
            updatedAt: m?.updatedAt || q.updatedAt,
          };
        })
      )
    ).sort((a, b) => {
      if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
      return (
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
      );
    });
    const activeProQR = userQRs.find((q) => isProStillValid(q)) || null;
    const primaryQR = activeProQR || userQRs[0] || null;
    const primaryStore = userStores[0] || null;
    const creditExpMs = safeUser.proCreditExpiresAt
      ? new Date(safeUser.proCreditExpiresAt).getTime()
      : 0;
    const hasAccountCredit =
      Boolean(safeUser.proCreditExpiresAt) &&
      Number.isFinite(creditExpMs) &&
      Date.now() < creditExpMs;
    const hasActivePro = Boolean(activeProQR || hasAccountCredit || isAdmin);

    return NextResponse.json(
      {
        authenticated: true,
        role: 'client',
        isAdmin,
        cloudPersistenceEnabled,
        hasActivePro,
        activeProSlug: activeProQR?.slug || primaryQR?.slug || null,
        activeProType:
          primaryStore?.type || activeProQR?.type || primaryQR?.type || null,
        activeProTitle:
          primaryStore?.title || activeProQR?.title || null,
        activeProLogoUrl:
          primaryStore?.logoUrl ||
          activeProQR?.qrConfig?.logoUrl ||
          primaryQR?.qrConfig?.logoUrl ||
          null,
        activeProExpiresAt:
          activeProQR?.proExpiresAt ||
          (hasAccountCredit ? safeUser.proCreditExpiresAt : null) ||
          null,
        userStores,
        security: {
          isPixLocked: isTimestampActiveFuture(clientUser.pixLockedUntil),
          pixLockedUntil: clientUser.pixLockedUntil || null,
          hasBackupRecoveryCode,
          recoveryCodeHint: clientUser.recoveryCodeHint || null,
          lastPasswordResetAt: clientUser.lastPasswordResetAt || null,
        },
        user: safeUser,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }

  if (isAdmin) {
    return NextResponse.json(
      {
        authenticated: true,
        role: 'admin',
        isAdmin: true,
        hasActivePro: true,
        cloudPersistenceEnabled,
        user: {
          id: 'admin',
          name: 'Desenvolvedor (Admin)',
          businessName: 'SpotQR Pro Admin',
          email: 'dev@spotqr.pro',
          whatsapp: '',
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }

  return NextResponse.json(
    {
      authenticated: false,
      user: null,
      isAdmin: false,
      cloudPersistenceEnabled,
    },
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
        const created = createClientUser({
          name: String(name),
          businessName: String(businessName || name),
          email: String(email),
          whatsapp: String(whatsapp || ''),
          passwordPlain: String(password),
        }) as ReturnType<typeof createClientUser> & { plainBackupCode?: string };

        await Promise.all([
          persistSliceToCloud('users'),
          persistSliceToCloud('notifications'),
        ]);

        const token = createClientSessionToken(created);
        const { plainBackupCode, ...userRecord } = created;
        const safeUser = sanitizeClientUser(userRecord);

        const res = NextResponse.json({
          authenticated: true,
          role: 'client',
          user: safeUser,
          backupRecoveryCode: plainBackupCode || null,
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

    const cleanLoginEmail = String(email).trim().toLowerCase();
    const rateKey = `login:${cleanLoginEmail}`;
    const rate = checkAndConsumeRateLimit(rateKey, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Muitas tentativas inválidas. Aguarde ${Math.ceil(
            rate.retryAfterSeconds / 60
          )} min ou use "Esqueci minha senha".`,
        },
        { status: 429 }
      );
    }

    // 1. Check if logging in as Developer Admin
    if (verifyCredentials(String(email), String(password))) {
      clearRateLimit(rateKey);
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
            'E-mail/login ou senha incorretos. Se esqueceu a senha, clique em "Esqueci minha senha?".',
        },
        { status: 401 }
      );
    }

    clearRateLimit(rateKey);
    const token = createClientSessionToken(clientUser);
    const safeUser = sanitizeClientUser(clientUser);

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

