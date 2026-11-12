import crypto from 'crypto';
import { NextRequest } from 'next/server';
import {
  getClientUserById,
  getClientUserByEmail,
  verifyUserPassword,
  restoreClientUserFromSession,
} from './db';
import { ClientUser } from './types';

export const CLIENT_COOKIE_NAME = 'spotqr_client_session';

const CLIENT_SECRET =
  process.env.CLIENT_SESSION_SECRET ||
  'spotqr-client-session-secret-key-2026';

type SessionProfilePayload = Omit<
  ClientUser,
  'passwordHash' | 'recoveryCodeHash'
>;

function signString(payload: string): string {
  return crypto
    .createHmac('sha256', CLIENT_SECRET)
    .update(payload)
    .digest('hex');
}

export function createClientSessionToken(
  userOrId: string | ClientUser | SessionProfilePayload
): string {
  if (typeof userOrId === 'string') {
    const sig = signString(userOrId);
    return `${userOrId}.${sig}`;
  }

  const safeProfile: SessionProfilePayload = {
    id: userOrId.id,
    name: userOrId.name,
    businessName: userOrId.businessName,
    email: userOrId.email,
    whatsapp: userOrId.whatsapp,
    createdAt: userOrId.createdAt,
    sessionVersion: userOrId.sessionVersion ?? 1,
  };
  const encoded = Buffer.from(JSON.stringify(safeProfile), 'utf-8').toString(
    'base64url'
  );
  const sig = signString(encoded);
  return `v2.${encoded}.${sig}`;
}

export function verifyClientSessionToken(token: string): {
  userId: string;
  profile?: SessionProfilePayload;
} | null {
  if (!token || !token.includes('.')) return null;

  // Stateless v2 token: v2.<base64url>.<hmac>
  if (token.startsWith('v2.')) {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [, encoded, sig] = parts;
    const expectedSig = signString(encoded);
    if (sig !== expectedSig) return null;
    try {
      const profile: SessionProfilePayload = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf-8')
      );
      if (!profile?.id || !profile?.email) return null;
      return { userId: profile.id, profile };
    } catch {
      return null;
    }
  }

  // Legacy v1 token: <userId>.<hmac>
  const [userId, sig] = token.split('.');
  const expectedSig = signString(userId);
  if (sig === expectedSig) {
    return { userId };
  }
  return null;
}

export function getAuthenticatedClientUser(
  req: NextRequest
): ClientUser | null {
  const cookieToken = req.cookies.get(CLIENT_COOKIE_NAME)?.value;
  if (!cookieToken) return null;
  const verified = verifyClientSessionToken(cookieToken);
  if (!verified) return null;

  const byId = getClientUserById(verified.userId);
  if (byId) {
    if (byId.isSuspended) return null;
    if (
      verified.profile &&
      (byId.sessionVersion ?? 1) !== (verified.profile.sessionVersion ?? 1)
    ) {
      return null;
    }
    return byId;
  }

  if (verified.profile) {
    const restored = restoreClientUserFromSession(verified.profile);
    if (restored.isSuspended) return null;
    if ((restored.sessionVersion ?? 1) !== (verified.profile.sessionVersion ?? 1)) {
      return null;
    }
    return restored;
  }
  return null;
}

export function verifyClientCredentials(
  email: string,
  passwordPlain: string
): ClientUser | null {
  const user = getClientUserByEmail(email);
  if (!user || user.isSuspended || !user.passwordHash) return null;
  if (verifyUserPassword(user, passwordPlain)) {
    return user;
  }
  return null;
}

