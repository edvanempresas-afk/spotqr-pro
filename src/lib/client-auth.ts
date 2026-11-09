import crypto from 'crypto';
import { NextRequest } from 'next/server';
import {
  getClientUserById,
  getClientUserByEmail,
  hashClientPassword,
} from './db';
import { ClientUser } from './types';

export const CLIENT_COOKIE_NAME = 'spotqr_client_session';

const CLIENT_SECRET =
  process.env.CLIENT_SESSION_SECRET ||
  'spotqr-client-session-secret-key-2026';

export function createClientSessionToken(userId: string): string {
  const sig = crypto
    .createHmac('sha256', CLIENT_SECRET)
    .update(userId)
    .digest('hex');
  return `${userId}.${sig}`;
}

export function verifyClientSessionToken(token: string): string | null {
  if (!token || !token.includes('.')) return null;
  const [userId, sig] = token.split('.');
  const expectedSig = crypto
    .createHmac('sha256', CLIENT_SECRET)
    .update(userId)
    .digest('hex');
  if (sig === expectedSig) {
    return userId;
  }
  return null;
}

export function getAuthenticatedClientUser(
  req: NextRequest
): ClientUser | null {
  const cookieToken = req.cookies.get(CLIENT_COOKIE_NAME)?.value;
  if (!cookieToken) return null;
  const userId = verifyClientSessionToken(cookieToken);
  if (!userId) return null;
  return getClientUserById(userId);
}

export function verifyClientCredentials(
  email: string,
  passwordPlain: string
): ClientUser | null {
  const user = getClientUserByEmail(email);
  if (!user) return null;
  const hashed = hashClientPassword(passwordPlain);
  if (user.passwordHash === hashed) {
    return user;
  }
  return null;
}

