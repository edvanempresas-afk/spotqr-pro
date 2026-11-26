import { MenuItem } from './types';

/**
 * Normaliza o código/numeração individual de um produto (remove '#' inicial duplicado e espaços extras).
 */
export function normalizeProductCode(raw?: string | null): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const cleaned = raw.trim().replace(/^#+/, '').trim().slice(0, 16);
  return cleaned.length > 0 ? cleaned.toUpperCase() : undefined;
}

/**
 * Formata um número inteiro sequencial em 3 dígitos (ex: 1 -> "001").
 */
export function formatSequentialProductCode(seq: number): string {
  const safe = Math.max(1, Math.floor(seq));
  return String(safe).padStart(3, '0');
}

/**
 * Sugere o próximo código numérico disponível para um novo item sem renumerar os itens existentes.
 */
export function suggestNextProductCode(existingItems: MenuItem[]): string {
  let maxNum = existingItems.length;
  const used = new Set<string>();
  for (const it of existingItems) {
    const clean = normalizeProductCode(it.productCode);
    if (!clean) continue;
    used.add(clean);
    if (/^\d+$/.test(clean)) {
      const parsed = parseInt(clean, 10);
      if (Number.isFinite(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }
  let candidateNum = maxNum + 1;
  while (used.has(formatSequentialProductCode(candidateNum))) {
    candidateNum += 1;
  }
  return formatSequentialProductCode(candidateNum);
}

/**
 * Preenche automaticamente códigos sequenciais ("001", "002", ...) apenas em itens
 * que ainda não possuem `productCode` definido, preservando códigos personalizados.
 */
export function assignMissingProductCodes(items: MenuItem[]): MenuItem[] {
  const used = new Set<string>();
  for (const it of items) {
    const clean = normalizeProductCode(it.productCode);
    if (clean) used.add(clean);
  }

  let seqCursor = 1;
  return items.map((item) => {
    const existingClean = normalizeProductCode(item.productCode);
    if (existingClean) {
      return item.productCode === existingClean
        ? item
        : { ...item, productCode: existingClean };
    }
    while (used.has(formatSequentialProductCode(seqCursor))) {
      seqCursor += 1;
    }
    const assigned = formatSequentialProductCode(seqCursor);
    used.add(assigned);
    seqCursor += 1;
    return { ...item, productCode: assigned };
  });
}

/**
 * Resolve o código exibível de um produto (ex: "001" ou código personalizado da loja).
 * Mesmo itens antigos sem `productCode` salvo recebem numeração consistente imediata.
 */
export function resolveItemProductCode(
  item: Pick<MenuItem, 'id' | 'productCode'>,
  allItems?: Pick<MenuItem, 'id' | 'productCode'>[]
): string {
  const explicit = normalizeProductCode(item.productCode);
  if (explicit) return explicit;

  if (Array.isArray(allItems) && allItems.length > 0) {
    const used = new Set<string>();
    for (const entry of allItems) {
      const clean = normalizeProductCode(entry.productCode);
      if (clean) used.add(clean);
    }
    let seqCursor = 1;
    for (const entry of allItems) {
      const clean = normalizeProductCode(entry.productCode);
      let code: string;
      if (clean) {
        code = clean;
      } else {
        while (used.has(formatSequentialProductCode(seqCursor))) {
          seqCursor += 1;
        }
        code = formatSequentialProductCode(seqCursor);
        used.add(code);
        seqCursor += 1;
      }
      if (entry.id === item.id) {
        return code;
      }
    }
  }

  const digits = String(item.id || '').replace(/\D/g, '').slice(-3);
  return digits ? digits.padStart(3, '0') : '001';
}

export function formatProductCodeLabel(code: string): string {
  const clean = normalizeProductCode(code) || '001';
  return `#${clean}`;
}
