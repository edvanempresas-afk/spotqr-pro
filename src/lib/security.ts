import crypto from 'crypto';

const LEGACY_PASSWORD_SECRET = 'spotqr-client-salt-2026';

/**
 * Hashes a user password with a random 16-byte salt using Node's scrypt KDF.
 */
export function hashPasswordSecure(passwordPlain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(passwordPlain, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function computeLegacyHmacHash(passwordPlain: string): string {
  return crypto
    .createHmac('sha256', LEGACY_PASSWORD_SECRET)
    .update(passwordPlain)
    .digest('hex');
}

/**
 * Verifies a plaintext password against either modern `scrypt:...` hashes
 * or legacy 64-char HMAC hashes in constant time.
 */
export function verifyPasswordSecure(
  passwordPlain: string,
  storedHash: string
): boolean {
  if (!passwordPlain || !storedHash) return false;

  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, expectedHex] = parts;
    if (!salt || !expectedHex) return false;
    try {
      const derived = crypto.scryptSync(passwordPlain, salt, 64);
      const expectedBuf = Buffer.from(expectedHex, 'hex');
      if (derived.length !== expectedBuf.length) return false;
      return crypto.timingSafeEqual(derived, expectedBuf);
    } catch {
      return false;
    }
  }

  const legacyCandidate = computeLegacyHmacHash(passwordPlain);
  if (legacyCandidate.length !== storedHash.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(legacyCandidate, 'utf-8'),
      Buffer.from(storedHash, 'utf-8')
    );
  } catch {
    return false;
  }
}

export function normalizeSecurityCode(code: string): string {
  return (code || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function hashSecurityToken(tokenPlain: string): string {
  return crypto
    .createHash('sha256')
    .update(normalizeSecurityCode(tokenPlain))
    .digest('hex');
}

export function verifySecurityToken(
  tokenPlain: string,
  storedHash?: string
): boolean {
  if (!tokenPlain || !storedHash) return false;
  const candidate = hashSecurityToken(tokenPlain);
  if (candidate.length !== storedHash.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(candidate, 'utf-8'),
      Buffer.from(storedHash, 'utf-8')
    );
  } catch {
    return false;
  }
}

export function generateFormattedSecurityCode(prefix: string): {
  plain: string;
  hash: string;
  hint: string;
} {
  const raw = crypto.randomBytes(6).toString('hex').toUpperCase();
  const plain = `${prefix}-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(
    8,
    12
  )}`;
  return {
    plain,
    hash: hashSecurityToken(plain),
    hint: raw.slice(8, 12),
  };
}

export function normalizePhoneDigits(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits.slice(2);
  }
  return digits;
}

export function phonesMatch(a?: string, b?: string): boolean {
  const da = normalizePhoneDigits(a);
  const db = normalizePhoneDigits(b);
  if (da.length < 8 || db.length < 8) return false;
  return da.slice(-8) === db.slice(-8);
}

export function normalizePixKeyForCompare(pixKey?: string): string {
  return (pixKey || '').trim().toLowerCase();
}

export function isTimestampActiveFuture(iso?: string | null): boolean {
  if (!iso) return false;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) && ms > Date.now();
}

interface RateBucket {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __spotqrRateBuckets: Record<string, RateBucket> | undefined;
}

export function checkAndConsumeRateLimit(
  bucketKey: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  if (!globalThis.__spotqrRateBuckets) {
    globalThis.__spotqrRateBuckets = {};
  }
  const now = Date.now();
  const current = globalThis.__spotqrRateBuckets[bucketKey];

  if (!current || now >= current.resetAt) {
    globalThis.__spotqrRateBuckets[bucketKey] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= maxAttempts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clearRateLimit(bucketKey: string): void {
  if (globalThis.__spotqrRateBuckets) {
    delete globalThis.__spotqrRateBuckets[bucketKey];
  }
}

