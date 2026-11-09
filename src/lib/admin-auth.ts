import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { getDeveloperSettings } from './db';

export const ADMIN_COOKIE_NAME = 'spotqr_admin_session';

const SECRET_SALT =
  process.env.ADMIN_SESSION_SECRET ||
  'spotqr-pro-developer-secret-key-2026-secure';

const DEFAULT_ADMIN_LOGIN = 'edvandonasicmentosilva@gmail.com';
const DEFAULT_ADMIN_PASS = 'Edgatinho1982.';

export function getAdminCredentials() {
  const settings = getDeveloperSettings();
  const validUsername = (
    settings.adminUsername ||
    process.env.ADMIN_USERNAME ||
    DEFAULT_ADMIN_LOGIN
  )
    .trim()
    .toLowerCase();
  const validEmail = (settings.developerEmail || DEFAULT_ADMIN_LOGIN)
    .trim()
    .toLowerCase();
  const validPassword =
    settings.adminPassword || process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASS;

  return {
    validUsername,
    validEmail,
    validPassword,
  };
}

export function createAdminSessionToken(): string {
  const { validUsername, validPassword } = getAdminCredentials();
  return crypto
    .createHmac('sha256', SECRET_SALT)
    .update(`${validUsername}:${validPassword}:authenticated`)
    .digest('hex');
}

export function verifyCredentials(
  inputUser: string,
  inputPassword: string
): boolean {
  const { validUsername, validEmail, validPassword } = getAdminCredentials();
  const cleanUser = (inputUser || '').trim().toLowerCase();
  const isUserMatch =
    cleanUser === validUsername ||
    cleanUser === validEmail ||
    cleanUser === 'edvandonasicmentosilva@gmail.com' ||
    cleanUser === 'edvandonascimentosilva@gmail.com';
  const isPassMatch =
    inputPassword === validPassword || inputPassword.trim() === validPassword;
  return isUserMatch && isPassMatch;
}

export function isAdminRequestAuthenticated(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const headerToken = req.headers.get('x-admin-token');
  const expectedToken = createAdminSessionToken();

  if (cookieToken && cookieToken === expectedToken) {
    return true;
  }
  if (headerToken && headerToken === expectedToken) {
    return true;
  }
  return false;
}
