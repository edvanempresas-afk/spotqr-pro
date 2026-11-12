import { MenuItem, ProductStockMode } from './types';

export interface ItemStockInfo {
  stockMode: ProductStockMode;
  /** Maximum quantity allowed per order (`Infinity` when unlimited, `0` when out of stock). */
  maxQuantity: number;
  canOrder: boolean;
  isUnique: boolean;
  isLimited: boolean;
  badgeText: string | null;
}

/**
 * Resolves the effective ordering cap and storefront stock label for a catalog or menu item.
 */
export function getItemStockInfo(item: MenuItem): ItemStockInfo {
  const stockMode: ProductStockMode = item.stockMode || 'unlimited';

  if (!item.isAvailable) {
    return {
      stockMode,
      maxQuantity: 0,
      canOrder: false,
      isUnique: stockMode === 'unique',
      isLimited: stockMode === 'limited',
      badgeText: 'Esgotado',
    };
  }

  if (stockMode === 'unique') {
    return {
      stockMode,
      maxQuantity: 1,
      canOrder: true,
      isUnique: true,
      isLimited: false,
      badgeText: 'Peça Única',
    };
  }

  if (stockMode === 'limited') {
    const rawQty = Number(item.stockQuantity);
    const qty = Number.isFinite(rawQty) ? Math.max(0, Math.floor(rawQty)) : 1;
    if (qty <= 0) {
      return {
        stockMode,
        maxQuantity: 0,
        canOrder: false,
        isUnique: false,
        isLimited: true,
        badgeText: 'Esgotado',
      };
    }
    return {
      stockMode,
      maxQuantity: qty,
      canOrder: true,
      isUnique: false,
      isLimited: true,
      badgeText: qty === 1 ? 'Última unidade' : `Restam ${qty} unid.`,
    };
  }

  return {
    stockMode: 'unlimited',
    maxQuantity: Infinity,
    canOrder: true,
    isUnique: false,
    isLimited: false,
    badgeText: null,
  };
}

