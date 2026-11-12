/**
 * Friendly slug normalization, validation, and 3-option generator for PRO stores.
 */

const RESERVED_SLUGS = new Set([
  'demo-restaurante',
  'demo-catalogo',
  'admin',
  'dashboard',
  'login',
  'api',
  'termos',
  'privacidade',
  'r',
  'cardapio',
  'catalogo',
  'precos',
  'gerador',
  'desenvolvedor',
  'spotqr',
  'static',
  'assets',
  'public',
  'favicon',
  'robots',
  'sitemap',
]);

const STOP_WORDS = new Set([
  'e',
  'de',
  'da',
  'do',
  'das',
  'dos',
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'para',
  'com',
  'a',
  'o',
  'as',
  'os',
]);

export function normalizeFriendlySlug(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export function isValidFriendlySlugFormat(slug: string): {
  valid: boolean;
  reason?: string;
} {
  if (!slug || slug.length < 3) {
    return {
      valid: false,
      reason: 'O link amigável precisa ter pelo menos 3 caracteres.',
    };
  }
  if (slug.length > 50) {
    return {
      valid: false,
      reason: 'O link amigável pode ter no máximo 50 caracteres.',
    };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      valid: false,
      reason: 'Use apenas letras minúsculas, números e hífens (-).',
    };
  }
  if (!/[a-z]/.test(slug)) {
    return {
      valid: false,
      reason: 'O link deve conter pelo menos uma letra.',
    };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return {
      valid: false,
      reason: 'Este endereço é reservado pelo sistema. Escolha outro nome.',
    };
  }
  return { valid: true };
}

/**
 * Generates up to 3 clean, human-friendly slug options derived from the store title
 * and current slug (e.g., "Cellis Cristais e Luz" + "cellis-cristais-e-luz-w1x"
 * -> ["cellis-cristais", "cellis-cristais-e-luz", "celliscristais"]).
 */
export function generateFriendlySlugSuggestions(
  title: string,
  currentSlug: string,
  isAvailable: (candidate: string) => boolean,
  mode: 'menu' | 'catalog' = 'catalog'
): string[] {
  const cleanCurrent = normalizeFriendlySlug(currentSlug);
  const titleBase = normalizeFriendlySlug(title);
  // Strip random short suffix like -w1x or -a9b2 appended at starter creation
  const strippedCurrent = cleanCurrent.replace(/-[a-z0-9]{2,4}$/, '');

  const words = (titleBase || strippedCurrent || 'minha-loja')
    .split('-')
    .filter(Boolean);
  const meaningfulWords = words.filter((w) => !STOP_WORDS.has(w));

  const candidates: string[] = [];
  const push = (raw: string) => {
    const s = normalizeFriendlySlug(raw);
    if (!s || s === cleanCurrent) return;
    if (!isValidFriendlySlugFormat(s).valid) return;
    if (!candidates.includes(s)) {
      candidates.push(s);
    }
  };

  // 1. Short 2 meaningful words (e.g. "cellis-cristais")
  if (meaningfulWords.length >= 2) {
    push(meaningfulWords.slice(0, 2).join('-'));
  }

  // 2. Full clean title / stripped random suffix (e.g. "cellis-cristais-e-luz")
  if (titleBase) push(titleBase);
  if (strippedCurrent && strippedCurrent.length >= 3) push(strippedCurrent);

  // 3. First 3 meaningful words without connectors
  if (meaningfulWords.length >= 3) {
    push(meaningfulWords.slice(0, 3).join('-'));
  }

  // 4. Compact glued brand or single brand + prefix/suffix
  if (meaningfulWords.length >= 2) {
    push(meaningfulWords.slice(0, 2).join(''));
  } else if (meaningfulWords.length === 1) {
    push(meaningfulWords[0]);
  }

  const brandAnchor =
    meaningfulWords.slice(0, 2).join('-') || words.slice(0, 2).join('-') || 'loja';
  const modePrefix = mode === 'catalog' ? 'loja' : 'menu';
  push(`${modePrefix}-${brandAnchor}`);
  push(`${brandAnchor}-oficial`);
  push(`${brandAnchor}-digital`);

  // Ensure up to 3 guaranteed available options even if top ones are taken
  const available: string[] = [];
  for (const cand of candidates) {
    if (isAvailable(cand)) {
      available.push(cand);
      if (available.length >= 3) return available;
    }
  }

  let counter = 2;
  while (available.length < 3 && counter < 25) {
    const numbered = normalizeFriendlySlug(`${brandAnchor}-${counter}`);
    if (
      numbered &&
      numbered !== cleanCurrent &&
      isValidFriendlySlugFormat(numbered).valid &&
      !available.includes(numbered) &&
      isAvailable(numbered)
    ) {
      available.push(numbered);
    }
    counter++;
  }

  return available;
}

