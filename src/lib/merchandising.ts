import type {
  MenuItem,
  MenuItemVariant,
  PriceFontStyle,
  PriceScale,
  PromoVisualEffect,
} from './types';

export interface PriceFontOption {
  id: PriceFontStyle;
  label: string;
  description: string;
  fontFamily: string;
  className: string;
}

export const PRICE_FONT_OPTIONS: PriceFontOption[] = [
  {
    id: 'modern',
    label: 'Moderna Clean',
    description: 'Nítida, equilibrada e fácil de ler em qualquer tela',
    fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
    className: 'font-sans font-extrabold tracking-tight',
  },
  {
    id: 'impact',
    label: 'Impacto Marketplace',
    description: 'Números pesados estilo grande varejo (alta conversão)',
    fontFamily: "'Arial Black', 'Impact', 'Segoe UI', sans-serif",
    className: 'font-black tracking-tighter',
  },
  {
    id: 'classic',
    label: 'Clássica Editorial',
    description: 'Tipografia serifada elegante para moda, vinhos e presentes',
    fontFamily: "Georgia, 'Times New Roman', Times, serif",
    className: 'font-bold tracking-normal',
  },
  {
    id: 'digital',
    label: 'Etiqueta Digital',
    description: 'Estilo painel eletrônico / precificador técnico tabular',
    fontFamily: "'Courier New', ui-monospace, SFMono-Regular, Menlo, monospace",
    className: 'font-mono font-extrabold tracking-tight tabular-nums',
  },
];

export const PRICE_SCALE_OPTIONS: { id: PriceScale; label: string; sizeClasses: string }[] = [
  {
    id: 'normal',
    label: 'Padrão Legível',
    sizeClasses: 'text-lg sm:text-xl leading-none',
  },
  {
    id: 'large',
    label: 'Grande Destaque (Recomendado)',
    sizeClasses: 'text-xl sm:text-2xl leading-none',
  },
  {
    id: 'xlarge',
    label: 'Super Vitrine XL',
    sizeClasses: 'text-2xl sm:text-[1.7rem] leading-none',
  },
];

export const PROMO_EFFECT_OPTIONS: {
  id: PromoVisualEffect;
  label: string;
  badgeText: string;
  description: string;
}[] = [
  {
    id: 'none',
    label: 'Sem borda animada',
    badgeText: 'Padrão',
    description: 'Card limpo padrão da vitrine',
  },
  {
    id: 'neon',
    label: 'Neon Pulsante',
    badgeText: '⚡ NEON',
    description: 'Contorno luminoso estilo vitrine gamer / eletrônicos',
  },
  {
    id: 'christmas',
    label: 'Pisca-Pisca Natalino',
    badgeText: '🎄 NATAL',
    description: 'Luzinhas festivas piscando ao redor do anúncio',
  },
  {
    id: 'flash_gold',
    label: 'Oferta VIP Ouro',
    badgeText: '✨ VIP',
    description: 'Destaque dourado premium para ofertas especiais',
  },
];

export function resolvePriceFontOption(style?: PriceFontStyle): PriceFontOption {
  return PRICE_FONT_OPTIONS.find((f) => f.id === style) || PRICE_FONT_OPTIONS[0];
}

export function resolvePriceScaleClasses(scale?: PriceScale, isPro?: boolean): string {
  // Base price size bumped above the old text-sm/text-base for much better readability
  if (!isPro) return 'text-lg sm:text-xl leading-none';
  const found = PRICE_SCALE_OPTIONS.find((s) => s.id === scale) || PRICE_SCALE_OPTIONS[1];
  return found.sizeClasses;
}

export function calculateDiscountPercent(
  currentPrice: number,
  originalPrice?: number
): number | null {
  if (
    typeof originalPrice !== 'number' ||
    !Number.isFinite(originalPrice) ||
    originalPrice <= currentPrice ||
    currentPrice < 0
  ) {
    return null;
  }
  const pct = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  return pct >= 1 ? pct : null;
}

export function formatMoneyBR(value: number, currency = 'R$'): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${currency} ${safe.toFixed(2).replace('.', ',')}`;
}

export function formatInstallmentLabel(
  effectivePrice: number,
  maxInstallments?: number,
  currency = 'R$'
): string | null {
  if (
    typeof maxInstallments !== 'number' ||
    !Number.isFinite(maxInstallments) ||
    maxInstallments < 2 ||
    effectivePrice <= 0
  ) {
    return null;
  }
  const count = Math.min(24, Math.floor(maxInstallments));
  const perInstallment = effectivePrice / count;
  if (perInstallment < 1) return null;
  return `ou até ${count}x de ${formatMoneyBR(perInstallment, currency)} sem juros`;
}

export function getActiveItemVariants(item: MenuItem, isPro: boolean): MenuItemVariant[] {
  if (!isPro || !Array.isArray(item.variants) || item.variants.length === 0) {
    return [];
  }
  return item.variants.filter((v) => v && v.label.trim().length > 0);
}

export function resolveVariantEffectivePrice(
  item: MenuItem,
  variant?: MenuItemVariant | null
): number {
  if (variant && typeof variant.price === 'number' && variant.price > 0) {
    return variant.price;
  }
  return Number(item.price) || 0;
}

export function buildVariantPreset(
  preset: 'voltage_br' | 'colors_basic' | 'sizes_clothes' | 'storage_tech'
): { groupTitle: string; variants: MenuItemVariant[] } {
  const ts = Date.now().toString(36);
  switch (preset) {
    case 'voltage_br':
      return {
        groupTitle: 'Voltagem',
        variants: [
          { id: `var-${ts}-110`, label: '110V', groupLabel: 'Voltagem', isAvailable: true },
          { id: `var-${ts}-220`, label: '220V', groupLabel: 'Voltagem', isAvailable: true },
        ],
      };
    case 'colors_basic':
      return {
        groupTitle: 'Cor',
        variants: [
          {
            id: `var-${ts}-blk`,
            label: 'Preto',
            groupLabel: 'Cor',
            colorHex: '#18181b',
            isAvailable: true,
          },
          {
            id: `var-${ts}-wht`,
            label: 'Branco',
            groupLabel: 'Cor',
            colorHex: '#f8fafc',
            isAvailable: true,
          },
          {
            id: `var-${ts}-blu`,
            label: 'Azul',
            groupLabel: 'Cor',
            colorHex: '#2563eb',
            isAvailable: true,
          },
        ],
      };
    case 'sizes_clothes':
      return {
        groupTitle: 'Tamanho',
        variants: [
          { id: `var-${ts}-p`, label: 'P', groupLabel: 'Tamanho', isAvailable: true },
          { id: `var-${ts}-m`, label: 'M', groupLabel: 'Tamanho', isAvailable: true },
          { id: `var-${ts}-g`, label: 'G', groupLabel: 'Tamanho', isAvailable: true },
          { id: `var-${ts}-gg`, label: 'GG', groupLabel: 'Tamanho', isAvailable: true },
        ],
      };
    case 'storage_tech':
      return {
        groupTitle: 'Capacidade',
        variants: [
          { id: `var-${ts}-128`, label: '128GB', groupLabel: 'Capacidade', isAvailable: true },
          { id: `var-${ts}-256`, label: '256GB', groupLabel: 'Capacidade', isAvailable: true },
        ],
      };
  }
}
