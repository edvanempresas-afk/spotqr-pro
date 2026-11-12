/**
 * Shared helpers for checking PRO plan expiration and formatting countdowns/IDs.
 */

export function isProStillValid(
  record?: {
    slug?: string;
    isPaid?: boolean;
    proExpiresAt?: string | null;
  } | null,
  nowMs: number = Date.now()
): boolean {
  if (!record) return false;
  if (
    record.slug === 'demo-restaurante' ||
    record.slug === 'demo-catalogo'
  ) {
    return true;
  }
  if (!record.isPaid) return false;
  if (record.proExpiresAt) {
    const expiresMs = new Date(record.proExpiresAt).getTime();
    if (Number.isFinite(expiresMs) && nowMs >= expiresMs) {
      return false;
    }
  }
  return true;
}

export function getRemainingProMs(
  proExpiresAt?: string | null,
  nowMs: number = Date.now()
): number | null {
  if (!proExpiresAt) return null;
  const expiresMs = new Date(proExpiresAt).getTime();
  if (!Number.isFinite(expiresMs)) return null;
  return Math.max(0, expiresMs - nowMs);
}

export function formatRemainingProTime(
  proExpiresAt?: string | null,
  nowMs: number = Date.now()
): string {
  if (!proExpiresAt) return 'Tempo indeterminado';
  const diff = getRemainingProMs(proExpiresAt, nowMs);
  if (diff === null) return 'Tempo indeterminado';
  if (diff <= 0) return 'Expirado';

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days >= 1) {
    return `${days}d ${String(hours).padStart(2, '0')}h`;
  }
  if (hours >= 1) {
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(
      2,
      '0'
    )}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(
    2,
    '0'
  )}s`;
}

export function computeStableStoreCode(record: {
  id?: string;
  slug: string;
  storeCode?: string;
}): string {
  if (record.storeCode && /^\d+$/.test(record.storeCode)) {
    return record.storeCode;
  }
  const seed = `${record.id || ''}:${record.slug}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const num = 100000 + (Math.abs(hash) % 900000);
  return String(num);
}
