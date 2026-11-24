import {
  FlavorPricingRule,
  MenuFlavor,
  MenuFlavorGroup,
  MenuItem,
  RestaurantMenu,
  SelectedExtraItem,
  SelectedFlavorItem,
  SelectedSizeItem,
} from './types';

export const UNGROUPED_FLAVOR_GROUP_ID = '__ungrouped__';

/**
 * Returns flavor groups including a synthetic "Sabores Gerais" group only when
 * legacy flavors exist without an explicit groupId.
 */
export function resolveFlavorGroupsWithLegacy(
  flavorGroups: MenuFlavorGroup[] | undefined,
  flavors: MenuFlavor[] | undefined
): MenuFlavorGroup[] {
  const explicit = [...(flavorGroups || [])];
  const validIds = new Set(explicit.map((g) => g.id));
  const hasOrphaned = (flavors || []).some(
    (fl) => !fl.groupId || !validIds.has(fl.groupId)
  );
  if (hasOrphaned) {
    explicit.push({
      id: UNGROUPED_FLAVOR_GROUP_ID,
      name: 'Sabores Gerais (Sem Grupo)',
      icon: '🍽️',
    });
  }
  return explicit;
}

export function getFlavorsInGroup(
  flavors: MenuFlavor[] | undefined,
  groupId: string,
  validGroupIds?: Set<string>
): MenuFlavor[] {
  const all = flavors || [];
  if (groupId === UNGROUPED_FLAVOR_GROUP_ID) {
    return all.filter(
      (fl) => !fl.groupId || (validGroupIds && !validGroupIds.has(fl.groupId))
    );
  }
  return all.filter((fl) => fl.groupId === groupId);
}

export const FLAVOR_PRICING_LABELS: Record<
  FlavorPricingRule,
  { title: string; short: string; description: string }
> = {
  highest: {
    title: 'Pelo Sabor Mais Caro (Padrão Pizzarias)',
    short: 'Sabor mais caro',
    description:
      'Ao misturar sabores, vale o valor do sabor mais caro escolhido (ou o preço base do tamanho, o que for maior).',
  },
  average: {
    title: 'Média Proporcional dos Sabores',
    short: 'Média dos sabores',
    description:
      'Soma o valor dos sabores escolhidos e divide pela quantidade de sabores (ex: 1/2 R$ 40 + 1/2 R$ 60 = R$ 50).',
  },
  sum: {
    title: 'Preço do Tamanho + Soma de Cada Sabor',
    short: 'Base + soma dos sabores',
    description:
      'Ideal para pastelarias, açaís e monte-o-seu: soma o preço base/tamanho com o valor adicional de cada recheio.',
  },
};

/**
 * Resolves the list of available flavors for a menu item, pulling from
 * either menu categories or the store's dedicated flavors list.
 */
export function resolveItemAvailableFlavors(
  item: MenuItem,
  menu: RestaurantMenu | null | undefined
): MenuFlavor[] {
  if (!item.allowFlavors || !menu) return [];

  const sourceMode = item.flavorSourceMode || 'category';
  if (sourceMode === 'category') {
    const catIds = new Set(item.flavorCategoryIds || []);
    if (catIds.size === 0) return [];
    return (menu.items || [])
      .filter(
        (candidate) =>
          candidate.id !== item.id &&
          catIds.has(candidate.category) &&
          candidate.isAvailable !== false
      )
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        description: candidate.description,
        price: typeof candidate.price === 'number' ? candidate.price : 0,
        imageUrl: candidate.imageUrl,
        isAvailable: candidate.isAvailable,
      }));
  }

  if (Array.isArray(item.flavorGroupIds) && item.flavorGroupIds.length > 0) {
    const selectedGroupSet = new Set(item.flavorGroupIds);
    const excludedSet = new Set(item.excludedFlavorIds || []);
    const validIds = new Set((menu.flavorGroups || []).map((g) => g.id));

    return (menu.flavors || []).filter((fl) => {
      if (fl.isAvailable === false || excludedSet.has(fl.id)) return false;
      const inSelectedExplicit = Boolean(fl.groupId && selectedGroupSet.has(fl.groupId));
      const inSelectedLegacy =
        selectedGroupSet.has(UNGROUPED_FLAVOR_GROUP_ID) &&
        (!fl.groupId || !validIds.has(fl.groupId));
      return inSelectedExplicit || inSelectedLegacy;
    });
  }

  const allowedSet = new Set(item.allowedFlavorIds || []);
  return (menu.flavors || []).filter(
    (fl) => allowedSet.has(fl.id) && fl.isAvailable !== false
  );
}

/**
 * Computes effective maximum flavors allowed for an item given an optional size.
 */
export function resolveEffectiveMaxFlavors(
  item: MenuItem,
  selectedSize?: SelectedSizeItem | { maxFlavors?: number } | null
): number {
  const sizeMax =
    selectedSize && 'maxFlavors' in selectedSize && typeof selectedSize.maxFlavors === 'number'
      ? selectedSize.maxFlavors
      : undefined;
  const rawMax = sizeMax ?? item.maxFlavors ?? 1;
  return Math.max(1, Math.min(8, Math.floor(rawMax || 1)));
}

/**
 * Unified unit price calculation across Editor preview, Storefront Modal, Cart, and Order API.
 */
export function calculateCustomizedUnitPrice(params: {
  baseItemPrice: number;
  selectedSize?: SelectedSizeItem | null;
  selectedFlavors?: SelectedFlavorItem[];
  flavorPricingRule?: FlavorPricingRule;
  selectedExtras?: SelectedExtraItem[];
}): {
  baseOrSizePrice: number;
  flavorsContribution: number;
  extrasContribution: number;
  unitPrice: number;
} {
  const baseOrSizePrice = Math.max(
    0,
    Number(
      params.selectedSize
        ? params.selectedSize.price
        : params.baseItemPrice
    ) || 0
  );

  const flavors = Array.isArray(params.selectedFlavors)
    ? params.selectedFlavors
    : [];
  const rule: FlavorPricingRule = params.flavorPricingRule || 'highest';

  let itemPlusFlavorPrice = baseOrSizePrice;

  if (flavors.length > 0) {
    const flavorPrices = flavors.map((f) => Math.max(0, Number(f.price) || 0));
    if (rule === 'sum') {
      const sumFlavors = flavorPrices.reduce((acc, p) => acc + p, 0);
      itemPlusFlavorPrice = baseOrSizePrice + sumFlavors;
    } else if (rule === 'average') {
      const avgFlavor =
        flavorPrices.reduce((acc, p) => acc + p, 0) / flavorPrices.length;
      const nonZeroAvg = flavorPrices.some((p) => p > 0) ? avgFlavor : 0;
      itemPlusFlavorPrice =
        baseOrSizePrice > 0 && nonZeroAvg === 0
          ? baseOrSizePrice
          : nonZeroAvg > 0
          ? Math.max(baseOrSizePrice, nonZeroAvg)
          : baseOrSizePrice;
    } else {
      // 'highest'
      const maxFlavor = Math.max(...flavorPrices);
      itemPlusFlavorPrice = Math.max(baseOrSizePrice, maxFlavor);
    }
  }

  const extras = Array.isArray(params.selectedExtras) ? params.selectedExtras : [];
  const extrasContribution = extras.reduce(
    (acc, ex) => acc + Math.max(0, Number(ex.price) || 0),
    0
  );

  const unitPrice = Number((itemPlusFlavorPrice + extrasContribution).toFixed(2));
  return {
    baseOrSizePrice,
    flavorsContribution: Number(
      Math.max(0, itemPlusFlavorPrice - baseOrSizePrice).toFixed(2)
    ),
    extrasContribution: Number(extrasContribution.toFixed(2)),
    unitPrice,
  };
}
