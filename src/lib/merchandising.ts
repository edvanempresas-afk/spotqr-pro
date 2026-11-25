import type {
  CatalogLayoutMode,
  InstallmentsInterestMode,
  MenuItem,
  MenuItemVariant,
  PriceFontStyle,
  PriceScale,
  PromoVisualEffect,
} from './types';

export const CATALOG_LAYOUT_OPTIONS: {
  id: CatalogLayoutMode;
  label: string;
  description: string;
}[] = [
  {
    id: 'list',
    label: 'Lista Marketplace (Com Buy Box)',
    description:
      'Card horizontal completo com miniaturas clicáveis no centro e painel de entrega/PIX à direita.',
  },
  {
    id: 'grid_2col',
    label: 'Grade Vitrine (2 Colunas)',
    description:
      'Cards verticais lado a lado no computador/tablet com foto em destaque no topo (estilo loja).',
  },
];

export const TRUST_HIGHLIGHT_SUGGESTIONS: string[] = [
  'Pronta entrega',
  'Garantia 90 dias',
  'Troca fácil',
  'Embalagem p/ presente',
  '100% Algodão',
  'Bivolt / Testado',
  'Serve 2 pessoas',
  'Receita artesanal',
];

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

export interface PixDiscountInfo {
  percent: number;
  pixPrice: number;
  pixPriceFormatted: string;
  savings: number;
  savingsFormatted: string;
}

export function calculatePixDiscountInfo(
  effectivePrice: number,
  pixDiscountPercent?: number,
  currency = 'R$'
): PixDiscountInfo | null {
  if (
    typeof pixDiscountPercent !== 'number' ||
    !Number.isFinite(pixDiscountPercent) ||
    pixDiscountPercent < 1 ||
    pixDiscountPercent > 70 ||
    effectivePrice <= 0
  ) {
    return null;
  }
  const pct = Math.min(70, Math.round(pixDiscountPercent));
  const pixPrice = Number((effectivePrice * (1 - pct / 100)).toFixed(2));
  const savings = Number((effectivePrice - pixPrice).toFixed(2));
  return {
    percent: pct,
    pixPrice,
    pixPriceFormatted: formatMoneyBR(pixPrice, currency),
    savings,
    savingsFormatted: formatMoneyBR(savings, currency),
  };
}

export interface InstallmentDisplayInfo {
  count: number;
  perInstallment: number;
  perInstallmentFormatted: string;
  interestMode: InstallmentsInterestMode;
  hasInterest: boolean;
  interestSuffix: 'sem juros' | 'com juros' | null;
  cashPriceFormatted: string;
  totalCreditFormatted?: string;
}

export function resolveEffectiveInterestMode(
  interestMode?: InstallmentsInterestMode,
  hasInterest?: boolean
): InstallmentsInterestMode {
  if (
    interestMode === 'no_interest' ||
    interestMode === 'with_interest' ||
    interestMode === 'hide'
  ) {
    return interestMode;
  }
  return hasInterest ? 'with_interest' : 'no_interest';
}

export function resolveInstallmentInfo(
  effectivePrice: number,
  maxInstallments?: number,
  hasInterest?: boolean,
  customInstallmentAmount?: number,
  currency = 'R$',
  interestMode?: InstallmentsInterestMode
): InstallmentDisplayInfo | null {
  if (
    typeof maxInstallments !== 'number' ||
    !Number.isFinite(maxInstallments) ||
    maxInstallments < 2 ||
    effectivePrice <= 0
  ) {
    return null;
  }
  const resolvedMode = resolveEffectiveInterestMode(interestMode, hasInterest);
  const isInterest = resolvedMode === 'with_interest';
  const count = Math.min(24, Math.floor(maxInstallments));
  const useCustom =
    isInterest &&
    typeof customInstallmentAmount === 'number' &&
    Number.isFinite(customInstallmentAmount) &&
    customInstallmentAmount > 0;
  const perInstallment = useCustom
    ? customInstallmentAmount!
    : effectivePrice / count;
  if (perInstallment < 1) return null;

  const totalCredit = Number((perInstallment * count).toFixed(2));
  const showTotalCredit =
    isInterest && totalCredit > effectivePrice + 0.05;

  return {
    count,
    perInstallment,
    perInstallmentFormatted: formatMoneyBR(perInstallment, currency),
    interestMode: resolvedMode,
    hasInterest: isInterest,
    interestSuffix:
      resolvedMode === 'with_interest'
        ? 'com juros'
        : resolvedMode === 'no_interest'
        ? 'sem juros'
        : null,
    cashPriceFormatted: formatMoneyBR(effectivePrice, currency),
    totalCreditFormatted: showTotalCredit
      ? formatMoneyBR(totalCredit, currency)
      : undefined,
  };
}

export function formatInstallmentLabel(
  effectivePrice: number,
  maxInstallments?: number,
  currency = 'R$',
  hasInterest?: boolean,
  customInstallmentAmount?: number,
  interestMode?: InstallmentsInterestMode
): string | null {
  const info = resolveInstallmentInfo(
    effectivePrice,
    maxInstallments,
    hasInterest,
    customInstallmentAmount,
    currency,
    interestMode
  );
  if (!info) return null;
  return info.interestSuffix
    ? `${info.count}x de ${info.perInstallmentFormatted} ${info.interestSuffix}`
    : `${info.count}x de ${info.perInstallmentFormatted}`;
}

export type CartInstallmentSummary =
  | {
      kind: 'installments';
      isMixedUpsell: boolean;
      count: number;
      perParcelFormatted: string;
      cashTotalFormatted: string;
      shortLabel: string;
      interestSuffix: 'com juros' | 'sem juros' | null;
      whatsappTotalLabel: string;
    }
  | {
      kind: 'mixed_cash_only';
      cashTotalFormatted: string;
      parcelableTotalFormatted: string;
      parcelableInstallmentLabel: string | null;
      cashOnlyTotalFormatted: string;
      hasDeliveryFeeInCash: boolean;
      cashOnlyItemCount: number;
    };

export interface CartInstallmentEntryInput {
  item: MenuItem;
  quantity: number;
  unitPrice?: number;
}

/**
 * Resolves checkout/WhatsApp installment behavior for homogeneous or mixed carts:
 * - All parcelable (or mixed with allowMixedCartInstallments=true): extends shared installment count to order total.
 * - Mixed with allowMixedCartInstallments=false: keeps cash total upfront while surfacing transparent split breakdown.
 */
export function resolveCartInstallmentSummary(params: {
  entries: CartInstallmentEntryInput[];
  isPro: boolean;
  acceptsCreditCard: boolean;
  allowMixedCartInstallments: boolean;
  deliveryFee: number;
  currency?: string;
}): CartInstallmentSummary | null {
  const {
    entries,
    isPro,
    acceptsCreditCard,
    allowMixedCartInstallments,
    deliveryFee,
    currency = 'R$',
  } = params;

  if (!isPro || !acceptsCreditCard || entries.length === 0) return null;

  const parcelableEntries = entries.filter(
    (c) =>
      typeof c.item.maxInstallments === 'number' &&
      Number.isFinite(c.item.maxInstallments) &&
      c.item.maxInstallments >= 2
  );
  if (parcelableEntries.length === 0) return null;

  const cashOnlyEntries = entries.filter(
    (c) =>
      typeof c.item.maxInstallments !== 'number' ||
      !Number.isFinite(c.item.maxInstallments) ||
      c.item.maxInstallments < 2
  );

  const sharedCount = Math.min(
    ...parcelableEntries.map((c) => Math.min(24, Math.floor(c.item.maxInstallments!)))
  );
  if (sharedCount < 2) return null;

  const sumEntries = (list: CartInstallmentEntryInput[]) =>
    list.reduce(
      (acc, c) =>
        acc +
        c.quantity *
          (typeof c.unitPrice === 'number' ? c.unitPrice : Number(c.item.price) || 0),
      0
    );

  const parcelableSubtotal = Number(sumEntries(parcelableEntries).toFixed(2));
  const cashOnlySubtotal = Number(sumEntries(cashOnlyEntries).toFixed(2));
  const safeDelivery = Math.max(0, Number(deliveryFee || 0));
  const cardTotal = Number((parcelableSubtotal + cashOnlySubtotal + safeDelivery).toFixed(2));
  if (cardTotal <= 0) return null;

  const modes = new Set(
    parcelableEntries.map((c) =>
      resolveEffectiveInterestMode(
        c.item.installmentsInterestMode,
        c.item.installmentsHasInterest
      )
    )
  );
  const sharedInterestSuffix: 'com juros' | 'sem juros' | null =
    modes.size === 1
      ? Array.from(modes)[0] === 'with_interest'
        ? 'com juros'
        : Array.from(modes)[0] === 'no_interest'
        ? 'sem juros'
        : null
      : null;

  const allParcelableHaveMatchingCustom =
    parcelableEntries.every(
      (c) =>
        Math.min(24, Math.floor(c.item.maxInstallments!)) === sharedCount &&
        resolveEffectiveInterestMode(
          c.item.installmentsInterestMode,
          c.item.installmentsHasInterest
        ) === 'with_interest' &&
        typeof c.item.customInstallmentAmount === 'number' &&
        c.item.customInstallmentAmount > 0
    );

  const hasCashOnlyItems = cashOnlyEntries.length > 0;

  if (hasCashOnlyItems && !allowMixedCartInstallments) {
    const parcelablePerParcel =
      allParcelableHaveMatchingCustom
        ? parcelableEntries.reduce(
            (acc, c) =>
              acc + c.quantity * Number(c.item.customInstallmentAmount || 0),
            0
          )
        : parcelableSubtotal / sharedCount;
    const parcelableInstallmentLabel =
      parcelablePerParcel >= 1
        ? `${sharedCount}x de ${formatMoneyBR(parcelablePerParcel, currency)}${
            sharedInterestSuffix ? ` ${sharedInterestSuffix}` : ''
          }`
        : null;
    const cashAndFeeTotal = Number((cashOnlySubtotal + safeDelivery).toFixed(2));
    return {
      kind: 'mixed_cash_only',
      cashTotalFormatted: formatMoneyBR(cardTotal, currency),
      parcelableTotalFormatted: formatMoneyBR(parcelableSubtotal, currency),
      parcelableInstallmentLabel,
      cashOnlyTotalFormatted: formatMoneyBR(cashAndFeeTotal, currency),
      hasDeliveryFeeInCash: safeDelivery > 0,
      cashOnlyItemCount: cashOnlyEntries.reduce((acc, c) => acc + c.quantity, 0),
    };
  }

  const canUseCustomOnTotal =
    !hasCashOnlyItems && safeDelivery === 0 && allParcelableHaveMatchingCustom;
  const perParcel = canUseCustomOnTotal
    ? parcelableEntries.reduce(
        (acc, c) =>
          acc + c.quantity * Number(c.item.customInstallmentAmount || 0),
        0
      )
    : cardTotal / sharedCount;

  if (perParcel < 1) return null;

  const perParcelFormatted = formatMoneyBR(perParcel, currency);
  const creditTotalFormatted = formatMoneyBR(
    canUseCustomOnTotal ? perParcel * sharedCount : cardTotal,
    currency
  );
  const shortLabel = `${sharedCount}x de ${perParcelFormatted}`;

  return {
    kind: 'installments',
    isMixedUpsell: hasCashOnlyItems,
    count: sharedCount,
    perParcelFormatted,
    cashTotalFormatted: creditTotalFormatted,
    shortLabel,
    interestSuffix: sharedInterestSuffix,
    whatsappTotalLabel: `${shortLabel} = ${creditTotalFormatted}${
      sharedInterestSuffix ? ` (${sharedInterestSuffix})` : ''
    }`,
  };
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
