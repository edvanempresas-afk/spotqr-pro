'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  MessageCircle,
  Wifi,
  MapPin,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
  Search,
  Bell,
  QrCode,
  Clock,
  Bike,
  Store,
  Truck,
  ZoomIn,
  ZoomOut,
  CreditCard,
  AlertCircle,
  ArrowUp,
  Layers,
  Camera,
} from 'lucide-react';
import '@/app/merchandising.css';
import {
  RestaurantMenu,
  MenuItem,
  MenuItemVariant,
  MenuExtra,
  MenuFlavor,
  SelectedExtraItem,
  SelectedFlavorItem,
  SelectedSizeItem,
  SelectedVariantItem,
  FlavorPricingRule,
} from '@/lib/types';
import { getItemStockInfo } from '@/lib/stock';
import { resolveItemAvailableFlavors } from '@/lib/flavors';
import {
  calculateDiscountPercent,
  calculatePixDiscountInfo,
  formatMoneyBR,
  getActiveItemVariants,
  resolveCartInstallmentSummary,
  resolveInstallmentInfo,
  resolvePriceFontOption,
  resolvePriceScaleClasses,
  resolveVariantEffectivePrice,
} from '@/lib/merchandising';
import { isProStillValid } from '@/lib/pro-status';
import {
  getAcceptedPaymentOptions,
  getAcceptedPaymentsList,
  resolveCardFeeNotice,
} from '@/lib/payments';
import { resolveShowcaseTheme } from '@/lib/theme';
import { generatePixPayload } from '@/lib/pix-brcode';
import { renderPixQrDataUrl } from '@/lib/qr-canvas';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import AutoPlayLoopVideo from '@/components/AutoPlayLoopVideo';
import TableQrScannerModal from '@/components/TableQrScannerModal';
import { ChristmasCardDecor } from '@/components/ChristmasCardDecor';
import {
  ChristmasPageSkin,
  ChristmasFooterScene,
} from '@/components/ChristmasPageSkin';
import { RetailPriceTag } from '@/components/RetailPriceTag';
import { ShowcaseBuyBox } from '@/components/ShowcaseBuyBox';
import ShowcaseCustomizeModal, {
  CustomizedSelectionPayload,
} from '@/components/ShowcaseCustomizeModal';

function extractItemPhotos(
  targetItem: MenuItem | null | undefined,
  allowExtra: boolean,
  preferredVariant?: MenuItemVariant | null
): string[] {
  if (!targetItem) return [];
  const photos: string[] = [];
  const pushUnique = (raw?: string | null) => {
    if (typeof raw === 'string' && raw.trim() && !photos.includes(raw.trim())) {
      photos.push(raw.trim());
    }
  };

  if (allowExtra && preferredVariant?.imageUrl) {
    pushUnique(preferredVariant.imageUrl);
  }
  pushUnique(targetItem.imageUrl);

  if (allowExtra && Array.isArray(targetItem.galleryImages)) {
    for (const url of targetItem.galleryImages) {
      pushUnique(url);
    }
  }
  if (allowExtra && Array.isArray(targetItem.variants)) {
    for (const v of targetItem.variants) {
      if (v && v.isAvailable !== false && v.imageUrl) {
        pushUnique(v.imageUrl);
      }
    }
  }
  return photos;
}

interface CartItem {
  cartKey: string;
  item: MenuItem;
  quantity: number;
  selectedSize?: SelectedSizeItem;
  selectedVariant?: SelectedVariantItem;
  selectedFlavors?: SelectedFlavorItem[];
  flavorPricingRule?: FlavorPricingRule;
  selectedExtras?: MenuExtra[];
  unitPrice: number;
}

interface ClosedPixOrder {
  amount: number;
  subtotal: number;
  deliveryFee: number;
  itemsCount: number;
  txId: string;
  whatsappUrl: string;
}

type OrderMode = 'table' | 'delivery' | 'pickup';

interface DigitalShowcasePageProps {
  slug: string;
  defaultMode?: 'menu' | 'catalog';
}

export default function DigitalShowcasePage({
  slug,
  defaultMode = 'menu',
}: DigitalShowcasePageProps) {
  const [menu, setMenu] = useState<
    (RestaurantMenu & { isPaid?: boolean; proExpiresAt?: string | null }) | null
  >(null);
  const [proClockMs, setProClockMs] = useState<number>(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customizingProduct, setCustomizingProduct] = useState<MenuItem | null>(
    null
  );
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [previewPhotoOverrides, setPreviewPhotoOverrides] = useState<
    Record<string, string>
  >({});

  // Order details
  const [orderMode, setOrderMode] = useState<OrderMode>(
    defaultMode === 'catalog' ? 'delivery' : 'table'
  );
  const [tableNumber, setTableNumber] = useState('');
  const [tableScannedFromQr, setTableScannedFromQr] = useState(false);
  const [isTableScannerOpen, setIsTableScannerOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [needsChange, setNeedsChange] = useState<boolean>(false);
  const [changeForAmount, setChangeForAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutFieldErrors, setCheckoutFieldErrors] = useState<{
    table?: string;
    name?: string;
    address?: string;
  }>({});

  // Quick actions & post-checkout PIX order lock
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [closedPixOrder, setClosedPixOrder] = useState<ClosedPixOrder | null>(
    null
  );
  const [pixQrUrl, setPixQrUrl] = useState('');
  const [pixQrEmbeddedLogo, setPixQrEmbeddedLogo] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Product photo zoom / lightbox
  const [zoomedItem, setZoomedItem] = useState<MenuItem | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [photoZoomScale, setPhotoZoomScale] = useState<number>(1);
  const [videoCoverFailed, setVideoCoverFailed] = useState(false);

  useEffect(() => {
    setVideoCoverFailed(false);
  }, [menu?.coverVideo]);

  const openPhotoZoom = (item: MenuItem, initialIndex = 0) => {
    setZoomedItem(item);
    setActivePhotoIndex(initialIndex);
    setPhotoZoomScale(1);
  };

  const closePhotoZoom = () => {
    setZoomedItem(null);
    setActivePhotoIndex(0);
    setPhotoZoomScale(1);
  };

  useEffect(() => {
    if (!zoomedItem) return;
    const isZoomPro = Boolean(
      isProStillValid({
        slug,
        isPaid: menu?.isPaid,
        proExpiresAt: menu?.proExpiresAt,
      })
    );
    const chosenId = selectedVariants[zoomedItem.id];
    const zoomVar =
      isZoomPro && Array.isArray(zoomedItem.variants)
        ? zoomedItem.variants.find((v) => v.id === chosenId) ||
          zoomedItem.variants.find((v) => v.isAvailable !== false) ||
          null
        : null;
    const total = extractItemPhotos(zoomedItem, isZoomPro, zoomVar).length;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePhotoZoom();
      } else if (e.key === 'ArrowRight' && total > 1) {
        setActivePhotoIndex((prev) => (prev + 1) % total);
        setPhotoZoomScale(1);
      } else if (e.key === 'ArrowLeft' && total > 1) {
        setActivePhotoIndex((prev) => (prev - 1 + total) % total);
        setPhotoZoomScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedItem, menu?.isPaid, menu?.proExpiresAt, slug, selectedVariants]);

  // Read ?mesa=XX from URL if customer scanned a numbered table plaque
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    if (loading || !menu) {
      setIsNearBottom(false);
      return;
    }

    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const nearBottom =
        scrollY > 180 && scrollY + windowHeight >= docHeight - 380;
      setIsNearBottom(nearBottom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    const rafId = window.requestAnimationFrame(handleScroll);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [loading, menu, activeCategory, searchQuery]);

  const scrollToProducts = (catId?: string) => {
    if (catId !== undefined) {
      setActiveCategory(catId);
    }
    if (typeof document !== 'undefined') {
      const el = document.getElementById('catalogo-produtos');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mesaParam =
        urlParams.get('mesa') ||
        urlParams.get('table') ||
        urlParams.get('m');
      if (mesaParam && mesaParam.trim()) {
        const cleanMesa = mesaParam.trim();
        const formatted = cleanMesa.toLowerCase().startsWith('mesa')
          ? cleanMesa
          : `Mesa ${cleanMesa}`;
        setTableNumber(formatted);
        setTableScannedFromQr(true);
        setOrderMode('table');
      }
    }
  }, []);

  useEffect(() => {
    async function loadMenu() {
      const searchParams =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : null;
      const isPreviewParam = searchParams?.get('preview') === '1';
      const hasMesaParam = Boolean(searchParams?.get('mesa'));

      let localDraft: (RestaurantMenu & { isPaid?: boolean }) | null = null;
      if (typeof window !== 'undefined') {
        try {
          const rawDraft = localStorage.getItem(
            `spotqr_live_showcase_${slug}`
          );
          if (rawDraft) {
            localDraft = JSON.parse(rawDraft);
          }
        } catch {
          localDraft = null;
        }
      }

      try {
        const res = await fetch(
          `/api/cardapio?slug=${encodeURIComponent(
            slug
          )}&mode=${defaultMode}&t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const data = await res.json();
          const draftTime = localDraft?.updatedAt
            ? new Date(localDraft.updatedAt).getTime()
            : 0;
          const serverTime = data?.updatedAt
            ? new Date(data.updatedAt).getTime()
            : 0;

          // If user clicked "Ver ao Vivo" OR local draft is newer than container state, use local draft immediately
          const shouldUseLocal =
            Boolean(localDraft) &&
            (isPreviewParam || draftTime > serverTime);

          const finalMenu = shouldUseLocal
            ? {
                ...localDraft!,
                isPaid: data.isPaid,
                proExpiresAt: data.proExpiresAt || null,
              }
            : data;

          setMenu(finalMenu);

          // Self-heal cold serverless container if owner visits their edited page
          if (shouldUseLocal) {
            fetch('/api/cardapio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(finalMenu),
            }).catch(() => {});
          }

          const resolvedMode = finalMenu.mode || defaultMode;
          if (resolvedMode === 'catalog' && !hasMesaParam) {
            setOrderMode('delivery');
          }
        } else if (localDraft) {
          setMenu(localDraft);
        }
      } catch (err) {
        console.error('Error loading showcase:', err);
        if (localDraft) {
          setMenu(localDraft);
        }
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, [slug, defaultMode]);

  const isCatalog = (menu?.mode || defaultMode) === 'catalog';
  const defaultFulfill = !isCatalog;
  const allowDelivery = menu?.allowDelivery ?? defaultFulfill;
  const allowPickup = menu?.allowPickup ?? defaultFulfill;
  const allowOnSite = menu?.allowOnSite ?? defaultFulfill;
  const imageOnLeft = menu?.productImagePosition === 'left';

  const enabledModes = useMemo<OrderMode[]>(() => {
    const list: OrderMode[] = [];
    if (isCatalog) {
      if (allowDelivery) list.push('delivery');
      if (allowPickup) list.push('pickup');
      if (allowOnSite) list.push('table');
    } else {
      if (allowOnSite) list.push('table');
      if (allowDelivery) list.push('delivery');
      if (allowPickup) list.push('pickup');
    }
    return list;
  }, [isCatalog, allowDelivery, allowPickup, allowOnSite]);

  useEffect(() => {
    if (enabledModes.length > 0 && !enabledModes.includes(orderMode)) {
      setOrderMode(enabledModes[0]);
    }
  }, [enabledModes, orderMode]);

  const acceptedPaymentIds = getAcceptedPaymentsList(menu);
  const acceptedPaymentOptions = useMemo(
    () => getAcceptedPaymentOptions(menu),
    [menu]
  );
  const acceptsPix = acceptedPaymentIds.includes('pix');
  const acceptsCreditCard = acceptedPaymentIds.includes('credit_card');
  const cardFeeNotice = resolveCardFeeNotice(menu);
  const hasPixKey = Boolean(menu?.pixKey?.trim());
  const selectedPaymentOption =
    acceptedPaymentOptions.find((opt) => opt.whatsappLabel === paymentMethod) ||
    null;
  const isPixSelected = selectedPaymentOption?.id === 'pix';
  const isCreditCardSelected = selectedPaymentOption?.id === 'credit_card';
  const isDebitCardSelected = selectedPaymentOption?.id === 'debit_card';
  const isAnyCardSelected = isCreditCardSelected || isDebitCardSelected;
  const isCashSelected = selectedPaymentOption?.id === 'cash';
  const isDeliveryOrPickup =
    enabledModes.length > 0 &&
    (orderMode === 'delivery' || orderMode === 'pickup');
  const showCashChangeOption = isDeliveryOrPickup && isCashSelected;

  useEffect(() => {
    if (!showCashChangeOption) {
      setNeedsChange(false);
      setChangeForAmount('');
    }
  }, [showCashChangeOption]);

  useEffect(() => {
    if (acceptedPaymentOptions.length === 0) {
      setPaymentMethod('A combinar pelo WhatsApp');
      return;
    }
    const validLabels = acceptedPaymentOptions.map((o) => o.whatsappLabel);
    if (!validLabels.includes(paymentMethod)) {
      setPaymentMethod(acceptedPaymentOptions[0].whatsappLabel);
    }
  }, [acceptedPaymentOptions, paymentMethod]);

  useEffect(() => {
    if (!menu?.isPaid || !menu?.proExpiresAt) return;
    const expMs = new Date(menu.proExpiresAt).getTime();
    if (!Number.isFinite(expMs)) return;
    const delay = expMs - Date.now();
    if (delay <= 0) {
      setProClockMs(Date.now());
      setMenu((prev) =>
        prev ? { ...prev, isPaid: false, proExpiresAt: null } : prev
      );
      return;
    }
    const timer = setTimeout(() => {
      setProClockMs(Date.now());
      setMenu((prev) =>
        prev ? { ...prev, isPaid: false, proExpiresAt: null } : prev
      );
    }, Math.min(delay + 200, 2147483647));
    return () => clearTimeout(timer);
  }, [menu?.isPaid, menu?.proExpiresAt]);

  const isPro = Boolean(
    isProStillValid(
      {
        slug,
        isPaid: menu?.isPaid,
        proExpiresAt: menu?.proExpiresAt,
      },
      proClockMs
    )
  );

  const theme = useMemo(
    () =>
      resolveShowcaseTheme(
        menu?.themeMode,
        menu?.themeColor,
        isCatalog ? '#10b981' : '#16a34a'
      ),
    [menu?.themeMode, menu?.themeColor, isCatalog]
  );
  const isLight = theme.isLight;
  const pageBgClass = isLight
    ? 'bg-slate-50 text-slate-900'
    : 'bg-[#090d14] text-slate-100';
  const surfaceCardClass = isLight
    ? 'bg-white border-slate-200/90'
    : 'bg-[#121929] border-slate-800';
  const modalBoxClass = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-[#121929] border-slate-700 text-white';
  const modalSubBarClass = isLight
    ? 'bg-slate-50 border-slate-200'
    : 'bg-[#0d1320] border-slate-800';
  const inputFieldClass = isLight
    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500'
    : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-400';
  const mutedTextClass = isLight ? 'text-slate-600' : 'text-slate-400';
  const labelTextClass = isLight ? 'text-slate-700' : 'text-slate-300';
  const headingTextClass = isLight ? 'text-slate-900' : 'text-white';
  const pillMutedClass = isLight
    ? 'bg-slate-100 border-slate-200 text-slate-700'
    : 'bg-slate-800 border-slate-700 text-slate-300';
  const subtleOnSolidClass =
    theme.accentTextOnSolid === '#0f172a'
      ? 'bg-black/10 hover:bg-black/20'
      : 'bg-white/15 hover:bg-white/25';

  const getItemAllowedExtras = (targetItem: MenuItem): MenuExtra[] => {
    if (!targetItem.allowExtras || !menu?.extras || menu.extras.length === 0) {
      return [];
    }
    const allowedSet = new Set(targetItem.allowedExtraIds || []);
    return menu.extras.filter(
      (ex) => allowedSet.has(ex.id) && ex.isAvailable !== false
    );
  };

  const getItemAllowedFlavors = (targetItem: MenuItem): MenuFlavor[] =>
    resolveItemAvailableFlavors(targetItem, menu);

  const activePriceFont = resolvePriceFontOption(
    isPro ? menu?.priceFontStyle : 'modern'
  );
  const activePriceScaleClass = resolvePriceScaleClasses(
    menu?.priceScale,
    isPro
  );

  const resolveSelectedVariant = (targetItem: MenuItem): MenuItemVariant | null => {
    const variants = getActiveItemVariants(targetItem, isPro);
    if (variants.length === 0) return null;
    const chosenId = selectedVariants[targetItem.id];
    const found = chosenId ? variants.find((v) => v.id === chosenId) : null;
    if (found && found.isAvailable !== false) return found;
    return variants.find((v) => v.isAvailable !== false) || null;
  };

  const toSelectedVariantItem = (
    targetItem: MenuItem,
    variant: MenuItemVariant | null
  ): SelectedVariantItem | undefined => {
    if (!variant) return undefined;
    return {
      id: variant.id,
      label: variant.label,
      groupLabel: variant.groupLabel || targetItem.variantGroupTitle,
      price:
        typeof variant.price === 'number' && variant.price > 0
          ? variant.price
          : undefined,
    };
  };

  const formatItemStartingPriceLabel = (targetItem: MenuItem): string => {
    const currency = menu?.currency || 'R$';
    if (targetItem.sizes && targetItem.sizes.length > 0) {
      const nonZeroSizes = targetItem.sizes
        .map((s) => Number(s.price) || 0)
        .filter((p) => p > 0);
      if (nonZeroSizes.length > 0) {
        return `A partir de ${formatMoneyBR(Math.min(...nonZeroSizes), currency)}`;
      }
    }
    const chosenVar = resolveSelectedVariant(targetItem);
    const effectivePrice = resolveVariantEffectivePrice(targetItem, chosenVar);
    if (targetItem.allowFlavors && effectivePrice === 0) {
      const flPrices = getItemAllowedFlavors(targetItem)
        .map((f) => Number(f.price) || 0)
        .filter((p) => p > 0);
      if (flPrices.length > 0) {
        return `A partir de ${formatMoneyBR(Math.min(...flPrices), currency)}`;
      }
      return 'Monte seus sabores';
    }
    return formatMoneyBR(effectivePrice, currency);
  };

  const addToCart = (item: MenuItem) => {
    const stock = getItemStockInfo(item);
    if (!stock.canOrder || stock.maxQuantity <= 0) return;

    const allVariants = getActiveItemVariants(item, isPro);
    const chosenVariant = resolveSelectedVariant(item);
    if (allVariants.length > 0 && !chosenVariant) return;

    setClosedPixOrder(null);

    const availableExtras = getItemAllowedExtras(item);
    const availableFlavors = getItemAllowedFlavors(item);
    const hasSizes = Boolean(item.sizes && item.sizes.length > 0);
    const needsCustomModal =
      availableExtras.length > 0 ||
      hasSizes ||
      (Boolean(item.allowFlavors) && availableFlavors.length > 0);

    if (needsCustomModal) {
      setCustomizingProduct(item);
      return;
    }

    const selectedVariantObj = toSelectedVariantItem(item, chosenVariant);
    const targetCartKey = selectedVariantObj
      ? `${item.id}:var_${selectedVariantObj.id}`
      : item.id;
    const effectiveUnitPrice = resolveVariantEffectivePrice(item, chosenVariant);

    setCart((prev) => {
      const totalItemQty = Object.values(prev)
        .filter((c) => c.item.id === item.id)
        .reduce((sum, c) => sum + c.quantity, 0);
      if (totalItemQty >= stock.maxQuantity) {
        return prev;
      }
      const existing = prev[targetCartKey];
      const currentQty = existing ? existing.quantity : 0;
      return {
        ...prev,
        [targetCartKey]: {
          cartKey: targetCartKey,
          item,
          quantity: currentQty + 1,
          selectedVariant: selectedVariantObj,
          unitPrice: effectiveUnitPrice,
        },
      };
    });
  };

  const handleConfirmCustomizedItem = (selection: CustomizedSelectionPayload) => {
    const {
      item,
      quantity,
      selectedSize,
      selectedVariant,
      selectedFlavors,
      selectedExtras,
      unitPrice,
    } = selection;
    const stock = getItemStockInfo(item);
    if (!stock.canOrder || stock.maxQuantity <= 0) {
      setCustomizingProduct(null);
      return;
    }

    const sizeKey = selectedSize?.id || 'default';
    const variantKey = selectedVariant?.id ? `var_${selectedVariant.id}` : '';
    const flavorsKey = (selectedFlavors || [])
      .map((f) => f.id)
      .sort()
      .join('+');
    const extrasKey = (selectedExtras || [])
      .map((e) => e.id)
      .sort()
      .join('+');
    const compositeParts = [
      variantKey,
      sizeKey !== 'default' ? `sz_${sizeKey}` : '',
      flavorsKey ? `fl_${flavorsKey}` : '',
      extrasKey ? `ex_${extrasKey}` : '',
    ].filter(Boolean);
    const cartKey =
      compositeParts.length > 0
        ? `${item.id}:${compositeParts.join('|')}`
        : item.id;

    setCart((prev) => {
      const currentTotalItemQty = Object.values(prev)
        .filter((c) => c.item.id === item.id)
        .reduce((sum, c) => sum + c.quantity, 0);

      const allowedToAdd = Math.min(
        quantity,
        Math.max(0, stock.maxQuantity - currentTotalItemQty)
      );
      if (allowedToAdd <= 0) return prev;

      const existing = prev[cartKey];
      const newQty = existing ? existing.quantity + allowedToAdd : allowedToAdd;

      return {
        ...prev,
        [cartKey]: {
          cartKey,
          item,
          quantity: newQty,
          selectedSize,
          selectedVariant,
          selectedFlavors,
          flavorPricingRule:
            selectedFlavors && selectedFlavors.length > 0
              ? item.flavorPricingRule || 'highest'
              : undefined,
          selectedExtras,
          unitPrice,
        },
      };
    });

    setCustomizingProduct(null);
  };

  const removeFromCart = (cartKey: string) => {
    setClosedPixOrder(null);
    setCart((prev) => {
      const existing = prev[cartKey];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[cartKey];
        return next;
      }
      return {
        ...prev,
        [cartKey]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  };

  const incrementCartItem = (cartKey: string) => {
    setClosedPixOrder(null);
    setCart((prev) => {
      const existing = prev[cartKey];
      if (!existing) return prev;
      const stock = getItemStockInfo(existing.item);
      const totalItemQty = Object.values(prev)
        .filter((c) => c.item.id === existing.item.id)
        .reduce((sum, c) => sum + c.quantity, 0);
      if (totalItemQty >= stock.maxQuantity) return prev;

      return {
        ...prev,
        [cartKey]: {
          ...existing,
          quantity: existing.quantity + 1,
        },
      };
    });
  };

  const getEffectiveCartUnitPrice = (c: CartItem): number => {
    const raw = typeof c.unitPrice === 'number' ? c.unitPrice : c.item.price;
    if (
      isPro &&
      isPixSelected &&
      typeof c.item.pixDiscountPercent === 'number' &&
      c.item.pixDiscountPercent >= 1
    ) {
      const pct = Math.min(70, Math.round(c.item.pixDiscountPercent));
      return Number((raw * (1 - pct / 100)).toFixed(2));
    }
    return raw;
  };

  const totalItems = Object.values(cart).reduce((acc, c) => acc + c.quantity, 0);
  const subtotalPrice = Object.values(cart).reduce(
    (acc, c) => acc + c.quantity * getEffectiveCartUnitPrice(c),
    0
  );
  const deliveryFee =
    enabledModes.includes('delivery') && orderMode === 'delivery'
      ? Number(menu?.deliveryFee || 0)
      : 0;
  const totalPrice = subtotalPrice + deliveryFee;
  const cartInstallmentSummary = useMemo(
    () =>
      resolveCartInstallmentSummary({
        entries: Object.values(cart),
        isPro,
        acceptsCreditCard,
        allowMixedCartInstallments: Boolean(menu?.allowMixedCartInstallments),
        deliveryFee,
        currency: menu?.currency || 'R$',
      }),
    [
      cart,
      isPro,
      acceptsCreditCard,
      menu?.allowMixedCartInstallments,
      deliveryFee,
      menu?.currency,
    ]
  );
  const parseBrlAmount = (raw: string): number => {
    const cleaned = raw.replace(/[^\d.,]/g, '').trim();
    if (!cleaned) return 0;
    const normalized = cleaned.includes(',')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned;
    const num = Number(normalized);
    return Number.isFinite(num) && num > 0 ? num : 0;
  };
  const parsedChangeFor = parseBrlAmount(changeForAmount);
  const changeReturnAmount =
    parsedChangeFor >= totalPrice ? parsedChangeFor - totalPrice : 0;
  const canPayPixAtCheckout =
    acceptsPix && hasPixKey && isPixSelected && totalItems > 0 && totalPrice > 0;

  // Generate PIX payload strictly locked to the closed cart/order total
  const pixPayload = useMemo(() => {
    const cleanKey = menu?.pixKey?.trim();
    if (!cleanKey || !closedPixOrder || closedPixOrder.amount <= 0) {
      return '';
    }
    return generatePixPayload({
      key: cleanKey,
      name: menu?.title || (isCatalog ? 'Loja' : 'Restaurante'),
      city: 'SAO PAULO',
      amount: closedPixOrder.amount,
      txId: closedPixOrder.txId,
    });
  }, [menu?.pixKey, menu?.title, isCatalog, closedPixOrder]);

  useEffect(() => {
    let active = true;
    if (closedPixOrder && pixPayload) {
      renderPixQrDataUrl({
        payload: pixPayload,
        logoUrl: menu?.logoImage,
        isPro,
      })
        .then(({ dataUrl, hasEmbeddedLogo }) => {
          if (!active) return;
          setPixQrUrl(dataUrl);
          setPixQrEmbeddedLogo(hasEmbeddedLogo);
        })
        .catch(() => {});
    } else {
      setPixQrUrl('');
      setPixQrEmbeddedLogo(false);
    }
    return () => {
      active = false;
    };
  }, [closedPixOrder, pixPayload, menu?.logoImage, isPro]);

  const handleCopyWifi = () => {
    if (menu?.wifiInfo) {
      navigator.clipboard.writeText(menu.wifiInfo);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2500);
    }
  };

  const handlePrimaryAssist = () => {
    if (!menu?.whatsappNumber) return;
    const cleanNumber = menu.whatsappNumber.replace(/\D/g, '');
    const msg = isCatalog
      ? `Olá! Estou vendo o catálogo digital de *${menu.title}* e gostaria de tirar uma dúvida / fazer um pedido.`
      : `🔔 *CHAMADO DE GARÇOM*\n\n` +
        `*Mesa:* ${tableNumber || 'Mesa não identificada'}\n` +
        `*Restaurante:* ${menu.title}\n` +
        `────────────────────\n` +
        `Olá! Estou na *${tableNumber || 'minha mesa'}* no *${menu.title}* e gostaria de chamar o garçom / atendimento, por favor.`;
    window.open(
      `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const isMadeToOrderBadge = (badge?: string): boolean =>
    typeof badge === 'string' && badge.trim().toLowerCase() === 'sob encomenda';

  const getItemProductionDays = (item: MenuItem): number => {
    if (!isMadeToOrderBadge(item.badge)) return 0;
    const parsed = Math.round(Number(item.productionDays) || 0);
    return parsed > 0 ? Math.min(365, parsed) : 0;
  };

  const formatProductionDaysLabel = (days: number): string =>
    `Pronto em ${days} ${days === 1 ? 'dia' : 'dias'}`;

  const buildWhatsAppOrderUrl = (
    orderCode?: string,
    includePixSummary: boolean = false
  ): string => {
    if (!menu?.whatsappNumber) return '';

    const itemsSummary = Object.values(cart)
      .map((c) => {
        const prodDays = getItemProductionDays(c.item);
        const prodDaysInfo =
          prodDays > 0
            ? ` (Sob encomenda • ${formatProductionDaysLabel(prodDays).toLowerCase()})`
            : '';
        const effUnit = getEffectiveCartUnitPrice(c);
        const lineTotal = (c.quantity * effUnit).toFixed(2);
        const pixTag =
          isPro &&
          isPixSelected &&
          typeof c.item.pixDiscountPercent === 'number' &&
          c.item.pixDiscountPercent >= 1
            ? ` (c/ -${Math.round(c.item.pixDiscountPercent)}% PIX)`
            : '';
        const sizeLabel = c.selectedSize ? ` [${c.selectedSize.name}]` : '';
        let line = `• ${c.quantity}x ${c.item.name}${sizeLabel}${prodDaysInfo}${pixTag} — R$ ${lineTotal}`;
        if (c.selectedVariant) {
          line += `\n   ↳ *${c.selectedVariant.groupLabel || 'Opção'}:* ${c.selectedVariant.label}`;
        }
        if (c.selectedFlavors && c.selectedFlavors.length > 0) {
          const totalFl = c.selectedFlavors.length;
          const flavorsStr = c.selectedFlavors
            .map((fl, fIdx) =>
              totalFl > 1 ? `${fIdx + 1}º ${fl.name}` : fl.name
            )
            .join(' + ');
          line += `\n   ↳ *Sabores (${totalFl}):* ${flavorsStr}`;
        }
        if (c.selectedExtras && c.selectedExtras.length > 0) {
          const extrasStr = c.selectedExtras
            .map((ex) => `+ ${ex.name} (+R$ ${Number(ex.price).toFixed(2)})`)
            .join(', ');
          line += `\n   ↳ *Adicionais:* ${extrasStr}`;
        }
        return line;
      })
      .join('\n');

    const hasActiveModes = enabledModes.length > 0;
    const activeMode = hasActiveModes ? orderMode : null;

    const modeTitle = !activeMode
      ? '🛍️ *NOVO PEDIDO / ORÇAMENTO*'
      : isCatalog
      ? activeMode === 'delivery'
        ? '📦 *PEDIDO PARA ENTREGA / ENVIO*'
        : activeMode === 'pickup'
        ? '🏪 *PEDIDO PARA RETIRADA NA LOJA*'
        : '🛍️ *PEDIDO PRESENCIAL / BALCÃO*'
      : activeMode === 'table'
      ? '🍽️ *PEDIDO NA MESA*'
      : activeMode === 'delivery'
      ? '🛵 *PEDIDO PARA ENTREGA (DELIVERY)*'
      : '🛍️ *PEDIDO PARA RETIRADA NO BALCÃO*';

    const resolvedPaymentText =
      acceptedPaymentOptions.length > 0
        ? paymentMethod || acceptedPaymentOptions[0].whatsappLabel
        : 'A combinar pelo WhatsApp';

    let message =
      `${modeTitle}\n` +
      `*${isCatalog ? 'Loja / Marca' : 'Estabelecimento'}:* ${menu.title}\n` +
      `────────────────────\n`;

    if (orderCode) {
      message += `*Código do Pedido:* #${orderCode}\n`;
    }

    if (!activeMode) {
      message += `*Forma de Pagamento:* ${resolvedPaymentText}\n`;
    } else if (activeMode === 'table') {
      message += `*${isCatalog ? 'Stand / Ref' : 'Mesa'}:* ${
        tableNumber || 'Presencial'
      }\n`;
      if (isCatalog || acceptedPaymentOptions.length > 0) {
        message += `*Forma de Pagamento:* ${resolvedPaymentText}\n`;
      }
    } else if (activeMode === 'delivery') {
      message += `*Endereço de Entrega:* ${deliveryAddress || 'A combinar'}\n`;
      message += `*Forma de Pagamento:* ${resolvedPaymentText}\n`;
    } else {
      message += `*Modalidade:* ${
        isCatalog ? 'Retirada na Loja' : 'Retirada no Balcão'
      }\n`;
      message += `*Forma de Pagamento:* ${resolvedPaymentText}\n`;
    }

    if (showCashChangeOption) {
      if (needsChange && parsedChangeFor >= totalPrice) {
        message += `*Troco:* Sim, troco para *R$ ${parsedChangeFor.toFixed(
          2
        )}* (levar *R$ ${changeReturnAmount.toFixed(2)}* de troco)\n`;
      } else if (needsChange) {
        message += `*Troco:* Sim, preciso de troco\n`;
      } else {
        message += `*Troco:* Não precisa de troco (valor exato)\n`;
      }
    }

    if (customerName) {
      message += `*Cliente:* ${customerName}\n`;
    }

    message += `\n*Itens do Pedido:*\n${itemsSummary}\n`;
    if (deliveryFee > 0) {
      message += `\n*Subtotal:* R$ ${subtotalPrice.toFixed(2)}`;
      message += `\n*${isCatalog ? 'Frete / Entrega' : 'Taxa de Entrega'}:* R$ ${deliveryFee.toFixed(2)}`;
    }
    if (
      cartInstallmentSummary?.kind === 'installments' &&
      isCreditCardSelected
    ) {
      message += `\n*TOTAL: ${cartInstallmentSummary.whatsappTotalLabel}*\n`;
    } else {
      message += `\n*TOTAL: R$ ${totalPrice.toFixed(2)}*\n`;
      if (
        cartInstallmentSummary?.kind === 'mixed_cash_only' &&
        isCreditCardSelected
      ) {
        message += `*Carrinho Misto (Cartão):* Parceláveis ${cartInstallmentSummary.parcelableTotalFormatted}${
          cartInstallmentSummary.parcelableInstallmentLabel
            ? ` (até ${cartInstallmentSummary.parcelableInstallmentLabel})`
            : ''
        } + À vista${
          cartInstallmentSummary.hasDeliveryFeeInCash ? '/entrega' : ''
        } ${cartInstallmentSummary.cashOnlyTotalFormatted} (combinar à vista ou entrada + parcelas).\n`;
      }
    }

    if (cardFeeNotice && isAnyCardSelected) {
      message += `\n*Obs. Pagamento no Cartão:* ${cardFeeNotice}\n`;
    }

    if (includePixSummary && isPixSelected) {
      message += `\n*Pagamento via PIX:* Gerado no valor exato de *R$ ${totalPrice.toFixed(2)}* (vou enviar o comprovante abaixo).\n`;
    }

    if (notes) {
      message += `\n*Observações / Detalhes:* ${notes}\n`;
    }

    message += `\n_Enviado via ${
      isCatalog ? 'Catálogo Digital' : 'Cardápio Digital'
    } SpotQR Pro_`;

    const cleanNumber = menu.whatsappNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleConfirmCheckout = async () => {
    if (!menu || checkoutSubmitting) return;
    setCheckoutError(null);
    setCheckoutFieldErrors({});

    const itemsList = Object.values(cart);
    if (itemsList.length === 0) return;

    const activeOrderMode = enabledModes.length > 0 ? orderMode : 'direct';
    const fieldErrors: { table?: string; name?: string; address?: string } = {};

    if (activeOrderMode === 'table') {
      if (!isCatalog && !tableNumber.trim()) {
        fieldErrors.table =
          'Informe o número da sua mesa ou use o leitor de QR Code.';
      }
      if (!customerName.trim()) {
        fieldErrors.name =
          'Informe o seu nome para identificarmos o seu pedido.';
      }
    } else if (activeOrderMode === 'delivery') {
      if (!deliveryAddress.trim()) {
        fieldErrors.address =
          'Informe o endereço completo para a entrega.';
      }
      if (!customerName.trim()) {
        fieldErrors.name = 'Informe o seu nome para identificarmos o pedido.';
      }
    } else if (activeOrderMode === 'pickup') {
      if (!customerName.trim()) {
        fieldErrors.name =
          'Informe o seu nome para identificarmos seu pedido na retirada.';
      }
    } else if (!customerName.trim()) {
      fieldErrors.name = 'Informe o seu nome para enviar o pedido.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      setCheckoutFieldErrors(fieldErrors);
      setCheckoutError(
        fieldErrors.table ||
          fieldErrors.address ||
          fieldErrors.name ||
          'Preencha os campos obrigatórios para finalizar.'
      );
      return;
    }

    if (showCashChangeOption && needsChange) {
      if (parsedChangeFor <= 0) {
        setCheckoutError(
          'Informe para qual valor você precisa de troco (ex: R$ 50 ou R$ 100).'
        );
        return;
      }
      if (parsedChangeFor < totalPrice) {
        setCheckoutError(
          `O valor para troco (R$ ${parsedChangeFor.toFixed(
            2
          )}) precisa ser maior ou igual ao total do pedido (R$ ${totalPrice.toFixed(
            2
          )}).`
        );
        return;
      }
    }

    setCheckoutSubmitting(true);
    let orderId = `PED${Date.now().toString().slice(-6)}`;

    try {
      const resolvedPaymentText =
        acceptedPaymentOptions.length > 0
          ? paymentMethod || acceptedPaymentOptions[0].whatsappLabel
          : 'A combinar pelo WhatsApp';
      const orderPaymentLabel = showCashChangeOption
        ? needsChange && parsedChangeFor >= totalPrice
          ? `${resolvedPaymentText} (Troco p/ R$ ${parsedChangeFor.toFixed(
              2
            )} • levar R$ ${changeReturnAmount.toFixed(2)})`
          : `${resolvedPaymentText} (Sem troco)`
        : resolvedPaymentText;

      const res = await fetch('/api/cardapio/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          slug: menu.slug,
          customerName: customerName.trim(),
          customerPhone: undefined,
          orderMode: activeOrderMode,
          tableNumber:
            activeOrderMode === 'table' ? tableNumber.trim() : undefined,
          deliveryAddress:
            activeOrderMode === 'delivery'
              ? deliveryAddress.trim()
              : undefined,
          paymentMethod: orderPaymentLabel,
          items: itemsList.map((c) => ({
            id: c.item.id,
            quantity: c.quantity,
            selectedSize: c.selectedSize,
            selectedVariant: c.selectedVariant,
            selectedFlavors: c.selectedFlavors,
            flavorPricingRule: c.flavorPricingRule,
            selectedExtras: c.selectedExtras?.map((ex) => ({
              id: ex.id,
              name: ex.name,
              price: ex.price,
            })),
          })),
          deliveryFee: deliveryFee > 0 ? deliveryFee : 0,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCheckoutError(
          data.error || 'Não foi possível registrar o pedido no momento.'
        );
        setCheckoutSubmitting(false);
        return;
      }

      if (data.orderId) {
        orderId = data.orderId;
      }

      if (Array.isArray(data.updatedItems)) {
        setMenu((prev) =>
          prev ? { ...prev, items: data.updatedItems } : prev
        );
      }
    } catch (err) {
      console.warn(
        'Não foi possível registrar pedido no servidor, prosseguindo com WhatsApp fallback:',
        err
      );
    } finally {
      setCheckoutSubmitting(false);
    }

    if (canPayPixAtCheckout) {
      const whatsappUrl = buildWhatsAppOrderUrl(orderId, true);
      setCopiedPix(false);
      setIsCartOpen(false);
      setClosedPixOrder({
        amount: Number(totalPrice.toFixed(2)),
        subtotal: Number(subtotalPrice.toFixed(2)),
        deliveryFee: Number(deliveryFee.toFixed(2)),
        itemsCount: totalItems,
        txId: orderId,
        whatsappUrl,
      });
      setCart({});
      setNeedsChange(false);
      setChangeForAmount('');
      return;
    }

    const url = buildWhatsAppOrderUrl(orderId, false);
    if (url) {
      window.open(url, '_blank');
      setCart({});
      setNeedsChange(false);
      setChangeForAmount('');
      setIsCartOpen(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isLight ? 'bg-slate-50 text-slate-500' : 'bg-[#0b0f17] text-slate-400'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 rounded-full animate-spin"
            style={{
              borderColor: theme.accentHex,
              borderTopColor: 'transparent',
            }}
          />
          <p className="text-xs">
            {isCatalog
              ? 'Carregando catálogo digital...'
              : 'Carregando cardápio digital...'}
          </p>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${
          isLight ? 'bg-slate-50' : 'bg-[#0b0f17]'
        }`}
      >
        <div
          className={`max-w-md w-full border rounded-3xl p-8 text-center ${surfaceCardClass}`}
        >
          <h2 className={`text-xl font-bold mb-2 ${headingTextClass}`}>
            {isCatalog ? 'Catálogo não encontrado' : 'Cardápio não encontrado'}
          </h2>
          <p className={`text-xs mb-6 ${mutedTextClass}`}>
            Esta vitrine digital ainda não foi configurada.
          </p>
          <Link
            href="/"
            style={{
              backgroundColor: theme.accentHex,
              color: theme.accentTextOnSolid,
            }}
            className="inline-block px-5 py-2.5 font-semibold text-xs rounded-xl shadow-sm hover:brightness-105 transition"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  const filteredItems = menu.items.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const fallbackCover = isCatalog
    ? '/catalogo/cover-loja.jpg'
    : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80';

  const renderCartActionControl = (targetItem: MenuItem) => {
    const matchingEntries = Object.values(cart).filter(
      (c) => c.item.id === targetItem.id
    );
    const totalItemInCart = matchingEntries.reduce(
      (sum, c) => sum + c.quantity,
      0
    );
    const allVariants = getActiveItemVariants(targetItem, isPro);
    const activeVariant = resolveSelectedVariant(targetItem);
    const allVariantsUnavailable = allVariants.length > 0 && !activeVariant;
    const itemStock = getItemStockInfo(targetItem);
    const itemReachedMax = totalItemInCart >= itemStock.maxQuantity;
    const availableExtras = getItemAllowedExtras(targetItem);
    const availableFlavors = getItemAllowedFlavors(targetItem);
    const hasSizes = Boolean(targetItem.sizes && targetItem.sizes.length > 0);
    const hasFlavors = Boolean(targetItem.allowFlavors && availableFlavors.length > 0);
    const hasExtras = availableExtras.length > 0;
    const hasCustomization = hasExtras || hasFlavors || hasSizes;

    if (!itemStock.canOrder || allVariantsUnavailable) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold border px-3 py-1.5 rounded-xl shrink-0 ${
            isLight
              ? 'text-rose-700 bg-rose-50 border-rose-200'
              : 'text-rose-400/90 bg-rose-500/10 border-rose-500/25'
          }`}
        >
          Indisponível
        </span>
      );
    }

    const activeVariantEntry =
      !hasCustomization && activeVariant
        ? cart[`${targetItem.id}:var_${activeVariant.id}`]
        : null;
    const activeStepperCount =
      !hasCustomization && activeVariant
        ? activeVariantEntry?.quantity || 0
        : totalItemInCart;

    if (activeStepperCount > 0) {
      return (
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div
            style={{
              backgroundColor: theme.accentHex,
              color: theme.accentTextOnSolid,
              borderColor: theme.accentBorder,
            }}
            className="inline-flex items-center gap-1.5 rounded-xl px-1.5 py-1 shadow-md border"
          >
            <ShoppingCart className="w-3.5 h-3.5 stroke-[2.3] ml-1 shrink-0 opacity-85" />
            <button
              type="button"
              onClick={() => {
                if (activeVariantEntry) {
                  removeFromCart(activeVariantEntry.cartKey);
                } else if (matchingEntries.length === 1) {
                  removeFromCart(matchingEntries[0].cartKey || targetItem.id);
                } else {
                  setIsCartOpen(true);
                }
              }}
              aria-label={`Remover 1 ${targetItem.name} do carrinho`}
              className={`p-1 rounded-lg transition ${subtleOnSolidClass}`}
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.6]" />
            </button>
            <span className="text-xs font-extrabold px-1 min-w-[1.25rem] text-center">
              {activeStepperCount}
            </span>
            <button
              type="button"
              onClick={() => addToCart(targetItem)}
              disabled={itemReachedMax}
              aria-label={`Adicionar mais 1 ${targetItem.name} ao carrinho`}
              title={
                itemReachedMax
                  ? itemStock.isUnique
                    ? 'Peça única — máximo 1 unidade'
                    : `Estoque máximo disponível: ${itemStock.maxQuantity}`
                  : hasCustomization
                  ? 'Montar mais uma opção'
                  : 'Adicionar mais uma unidade'
              }
              className={`p-1 rounded-lg transition ${
                itemReachedMax ? 'opacity-35 cursor-not-allowed' : subtleOnSolidClass
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.6]" />
            </button>
          </div>
          {itemReachedMax ? (
            <span
              className={`text-[9px] font-bold ${
                isLight ? 'text-amber-700' : 'text-amber-300'
              }`}
            >
              {itemStock.isUnique
                ? 'Peça única (máx. 1)'
                : `Máx. ${itemStock.maxQuantity} disp.`}
            </span>
          ) : hasFlavors || hasSizes ? (
            <span
              className={`text-[9px] font-bold ${
                isLight ? 'text-amber-700' : 'text-amber-300'
              }`}
            >
              🍕 Tamanhos &amp; Sabores
            </span>
          ) : hasExtras ? (
            <span
              className={`text-[9px] font-bold ${
                isLight ? 'text-emerald-700' : 'text-emerald-300'
              }`}
            >
              + Adicionais disponíveis
            </span>
          ) : totalItemInCart > activeStepperCount ? (
            <span
              className={`text-[9px] font-bold ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {totalItemInCart} total na sacola
            </span>
          ) : null}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          type="button"
          onClick={() => addToCart(targetItem)}
          disabled={itemReachedMax}
          aria-label={`Adicionar ${targetItem.name} ao carrinho`}
          style={{
            backgroundColor: theme.accentHex,
            color: theme.accentTextOnSolid,
            borderColor: theme.accentBorder,
          }}
          className={`group/add shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold shadow-md border transition-all whitespace-nowrap ${
            itemReachedMax
              ? 'opacity-45 cursor-not-allowed'
              : 'hover:brightness-105 active:scale-[0.97]'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5 stroke-[2.4] shrink-0 transition-transform group-hover/add:-rotate-6 group-hover/add:scale-110" />
          <span>{hasFlavors || hasSizes ? 'Montar' : 'Adicionar'}</span>
          {!hasFlavors && !hasSizes && hasExtras && (
            <span className="text-[10px] font-medium opacity-90">
              (Opções)
            </span>
          )}
          {(hasFlavors || hasSizes) && (
            <span className="text-[10px] font-medium opacity-90">
              (Sabores)
            </span>
          )}
          <span
            className={`inline-flex items-center justify-center w-4 h-4 rounded-md ${
              theme.accentTextOnSolid === '#0f172a' ? 'bg-black/15' : 'bg-white/20'
            }`}
          >
            <Plus className="w-3 h-3 stroke-[2.8]" />
          </span>
        </button>
        {totalItemInCart > 0 && activeVariant && (
          <span
            className={`text-[9px] font-bold ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            {totalItemInCart} de outra opção na sacola
          </span>
        )}
      </div>
    );
  };

  const renderProductThumbnail = (
    targetItem: MenuItem,
    extraClass = '',
    sizeMode: 'standard' | 'pro_list' | 'grid_hero' = 'standard'
  ) => {
    const activeVariant = resolveSelectedVariant(targetItem);
    const photos = extractItemPhotos(targetItem, isPro, activeVariant);
    if (photos.length === 0) return null;
    const hasMultiple = photos.length > 1;
    const overrideUrl = isPro ? previewPhotoOverrides[targetItem.id] : undefined;
    const overrideIdx =
      overrideUrl && photos.includes(overrideUrl)
        ? photos.indexOf(overrideUrl)
        : 0;
    const displayPhoto = photos[overrideIdx] || photos[0];
    const dimClass =
      sizeMode === 'grid_hero'
        ? 'w-full h-52 sm:h-56'
        : sizeMode === 'pro_list'
        ? 'w-full h-52 sm:w-44 sm:h-44 md:w-48 md:h-48'
        : 'w-20 h-20 sm:w-24 sm:h-24';

    return (
      <button
        type="button"
        onClick={() => openPhotoZoom(targetItem, overrideIdx)}
        aria-label={
          hasMultiple
            ? `Ver ${photos.length} fotos de ${targetItem.name}`
            : `Ampliar foto de ${targetItem.name}`
        }
        title={
          hasMultiple
            ? `Clique para ver todos os ${photos.length} ângulos / fotos`
            : 'Clique para ampliar e ver a foto em detalhes'
        }
        className={`group/img relative ${dimClass} rounded-xl overflow-hidden border shadow-md shrink-0 cursor-zoom-in transition focus:outline-none ${
          isLight
            ? 'border-slate-200 hover:border-slate-400'
            : 'border-slate-700/60 hover:border-slate-500'
        } ${extraClass}`}
      >
        <img
          src={displayPhoto}
          alt={targetItem.name}
          className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-105"
        />
        {hasMultiple && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-white/20 text-[9px] font-extrabold text-white shadow">
            📷 {photos.length}
          </span>
        )}
        <span className="absolute bottom-1.5 right-1.5 inline-flex items-center justify-center w-5 h-5 rounded-md bg-black/75 backdrop-blur-sm border border-white/20 text-white group-hover/img:scale-110 transition shadow">
          <ZoomIn className="w-3 h-3" />
        </span>
      </button>
    );
  };

  const renderPaymentSelector = () => {
    const cardFeeBanner =
      cardFeeNotice && isAnyCardSelected ? (
        <div
          className={`mt-2 px-3 py-2 rounded-xl border flex items-start gap-2 text-[11px] font-bold ${
            isLight
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-amber-500/12 border-amber-500/35 text-amber-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-snug">
            Aviso da loja no cartão: {cardFeeNotice}
          </span>
        </div>
      ) : null;

    if (acceptedPaymentOptions.length === 0) {
      return (
        <div
          className={`border rounded-xl px-3 py-2.5 text-xs flex items-center justify-between gap-2 ${
            isLight
              ? 'bg-slate-100 border-slate-200'
              : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          <span className={`font-semibold ${mutedTextClass}`}>
            Forma de Pagamento:
          </span>
          <span
            className="font-bold"
            style={{ color: theme.readableAccentText }}
          >
            💬 A combinar pelo WhatsApp
          </span>
        </div>
      );
    }

    if (acceptedPaymentOptions.length === 1) {
      const onlyOpt = acceptedPaymentOptions[0];
      return (
        <div>
          <div
            style={{
              backgroundColor: theme.accentSoftBg,
              borderColor: theme.accentBorder,
            }}
            className="border rounded-xl px-3 py-2.5 text-xs flex items-center justify-between gap-2"
          >
            <span className={`font-semibold ${labelTextClass}`}>
              Pagamento aceito pela loja:
            </span>
            <span
              className="font-extrabold"
              style={{ color: theme.readableAccentText }}
            >
              {onlyOpt.icon} {onlyOpt.label}
            </span>
          </div>
          {cardFeeBanner}
        </div>
      );
    }

    return (
      <div>
        <label className={`text-xs font-semibold block mb-1.5 ${labelTextClass}`}>
          Forma de Pagamento:
        </label>
        <div className="flex flex-wrap gap-2">
          {acceptedPaymentOptions.map((opt) => {
            const selected = paymentMethod === opt.whatsappLabel;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPaymentMethod(opt.whatsappLabel)}
                style={
                  selected
                    ? {
                        backgroundColor: theme.accentHex,
                        color: theme.accentTextOnSolid,
                        borderColor: theme.accentHex,
                      }
                    : undefined
                }
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                  selected
                    ? 'shadow-sm'
                    : isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-200/70'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
        {cardFeeBanner}
      </div>
    );
  };

  return (
    <div
      className={`relative min-h-screen overflow-x-clip pb-28 transition-colors ${pageBgClass}`}
    >
      {/* Skin Natalina em toda a página (Topo, Diagonais dos Cantos e Laterais) — Liberada para Free e PRO */}
      {Boolean(menu.christmasPageSkin) && <ChristmasPageSkin variant="page" />}

      {/* Cover Banner (PRO animated video when enabled & valid, or static image fallback) */}
      <div className="relative w-full h-44 sm:h-56 bg-slate-900 overflow-hidden">
        {isPro && menu.coverVideo && !videoCoverFailed ? (
          <AutoPlayLoopVideo
            src={menu.coverVideo}
            poster={menu.coverImage || fallbackCover}
            onError={() => setVideoCoverFailed(true)}
            className={`w-full h-full object-cover ${
              isLight ? 'opacity-85' : 'opacity-60'
            }`}
          />
        ) : (
          <img
            src={menu.coverImage || fallbackCover}
            alt={menu.title}
            className={`w-full h-full object-cover ${
              isLight ? 'opacity-85' : 'opacity-60'
            }`}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: isLight
              ? 'linear-gradient(to top, #f8fafc 0%, rgba(248, 250, 252, 0.35) 55%, transparent 100%)'
              : 'linear-gradient(to top, #090d14 0%, rgba(9, 13, 20, 0.4) 55%, transparent 100%)',
          }}
        />

        {/* Back button: hidden on PRO showcases; restored automatically if PRO expires */}
        {!isPro && (
          <Link
            href="/"
            className={`absolute z-30 px-3 py-2 bg-black/60 backdrop-blur-md rounded-xl text-slate-100 hover:text-white border border-white/15 flex items-center gap-1.5 text-xs font-semibold ${
              menu.christmasPageSkin
                ? 'top-6 left-6 sm:top-8 sm:left-8'
                : 'top-4 left-4'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Criador de QR</span>
          </Link>
        )}

        {/* Table badge if detected from URL */}
        {tableNumber && (
          <div
            style={{
              backgroundColor: theme.accentHex,
              color: theme.accentTextOnSolid,
            }}
            className={`absolute z-30 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-lg flex items-center gap-1.5 ${
              menu.christmasPageSkin
                ? 'top-6 right-6 sm:top-8 sm:right-8'
                : 'top-4 right-4'
            }`}
          >
            <span>📍 {tableNumber}</span>
          </div>
        )}
      </div>

      {/* Main 3-Column Container: Left Ad | Showcase | Right Ad */}
      <div className="max-w-[1440px] mx-auto px-4 -mt-16 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT LATERAL AD (Only on Free / Non-PRO Showcases) */}
        {!isPro && (
          <div className="hidden lg:block lg:col-span-3 sticky top-6 pt-16">
            <AdBanner
              format="skyscraper"
              side="left"
              isPro={isPro}
              themeMode={theme.themeMode}
            />
          </div>
        )}

        {/* CENTER SHOWCASE COLUMN */}
        <div
          className={
            !isPro
              ? 'lg:col-span-6 w-full max-w-3xl mx-auto'
              : 'lg:col-span-8 lg:col-start-3 w-full max-w-3xl mx-auto'
          }
        >
          <div
            className={`border rounded-3xl p-5 sm:p-6 backdrop-blur-md ${
              isLight
                ? 'bg-white/95 border-slate-200/90 shadow-xl'
                : 'bg-[#121929]/95 border-slate-800/90 shadow-2xl'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div
                style={{
                  borderColor: theme.accentBorder,
                  backgroundColor: menu.logoImage
                    ? isLight
                      ? '#f8fafc'
                      : '#020617'
                    : theme.accentSoftBg,
                  color: theme.readableAccentText,
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-md overflow-hidden"
              >
                {menu.logoImage ? (
                  <img
                    src={menu.logoImage}
                    alt={`Logo de ${menu.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : isCatalog ? (
                  <ShoppingBag className="w-8 h-8" />
                ) : (
                  <Utensils className="w-8 h-8" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex flex-col items-center sm:flex-row sm:flex-wrap sm:items-center sm:justify-start gap-1.5 sm:gap-2">
                  <h1
                    className={`text-xl sm:text-2xl font-extrabold tracking-tight ${headingTextClass}`}
                  >
                    {menu.title}
                  </h1>
                  {menu.isOpen !== false ? (
                    <span
                      className={`border text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        isLight
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {isCatalog ? '● Loja Aberta' : '● Aberto Agora'}
                    </span>
                  ) : (
                    <span
                      className={`border text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        isLight
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      ● Fechado
                    </span>
                  )}
                </div>

                <p className={`text-xs leading-relaxed max-w-xl ${mutedTextClass}`}>
                  {menu.description}
                </p>

                {/* Info Badges */}
                <div
                  className={`flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1.5 text-xs ${mutedTextClass}`}
                >
                  {menu.openingHours && (
                    <span className="flex items-center gap-1">
                      <Clock
                        className={`w-3.5 h-3.5 ${
                          isLight ? 'text-amber-600' : 'text-amber-400'
                        }`}
                      />
                      <span>{menu.openingHours}</span>
                    </span>
                  )}
                  {menu.address && (
                    <span className="flex items-center gap-1">
                      <MapPin
                        className="w-3.5 h-3.5"
                        style={{ color: theme.readableAccentText }}
                      />
                      <span>{menu.address}</span>
                    </span>
                  )}
                  {allowDelivery && (
                    <span
                      style={{
                        backgroundColor: theme.accentSoftBg,
                        borderColor: theme.accentBorder,
                        color: theme.readableAccentText,
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold"
                    >
                      <Truck className="w-3 h-3" />
                      <span>{isCatalog ? 'Fazemos Envio / Entrega' : 'Delivery'}</span>
                    </span>
                  )}
                  {allowPickup && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${pillMutedClass}`}
                    >
                      <Store
                        className={`w-3 h-3 ${
                          isLight ? 'text-amber-600' : 'text-amber-400'
                        }`}
                      />
                      <span>Retirada no Local</span>
                    </span>
                  )}
                  {allowOnSite && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${pillMutedClass}`}
                    >
                      {isCatalog ? (
                        <ShoppingBag
                          className="w-3 h-3"
                          style={{ color: theme.readableAccentText }}
                        />
                      ) : (
                        <Utensils
                          className="w-3 h-3"
                          style={{ color: theme.readableAccentText }}
                        />
                      )}
                      <span>{isCatalog ? 'Presencial' : 'Pedidos na Mesa'}</span>
                    </span>
                  )}
                  {acceptedPaymentOptions.length > 0 && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${pillMutedClass}`}
                    >
                      <CreditCard
                        className="w-3 h-3 shrink-0"
                        style={{ color: theme.readableAccentText }}
                      />
                      <span>
                        Aceita:{' '}
                        {acceptedPaymentOptions
                          .map((opt) => opt.shortLabel)
                          .join(' • ')}
                      </span>
                    </span>
                  )}
                  {menu.wifiInfo && (
                    <button
                      onClick={handleCopyWifi}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Wifi
                        className="w-3.5 h-3.5"
                        style={{ color: theme.readableAccentText }}
                      />
                      <span>
                        {copiedWifi ? '✅ Wi-Fi Copiado!' : `Wi-Fi: ${menu.wifiInfo}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Assistance Bar (Waiter/Seller) — Só exibe se o lojista aceitar atendimento na mesa + ativou o botão + cliente leu o QR da mesa */}
            {(() => {
              const allowCallWaiter = menu?.allowCallWaiter !== false;
              const hasTableScanned =
                tableScannedFromQr && Boolean(tableNumber && tableNumber.trim());
              const canShowCallWaiter =
                !isCatalog &&
                allowOnSite &&
                allowCallWaiter &&
                hasTableScanned &&
                Boolean(menu?.whatsappNumber);
              const canShowSellerChat =
                isCatalog &&
                allowCallWaiter &&
                Boolean(menu?.whatsappNumber);

              if (!canShowCallWaiter && !canShowSellerChat) return null;

              return (
                <div
                  className={`mt-5 pt-4 border-t grid grid-cols-1 gap-3 ${
                    isLight ? 'border-slate-200' : 'border-slate-800/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={handlePrimaryAssist}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      isLight
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-sm'
                    }`}
                  >
                    {isCatalog ? (
                      <>
                        <MessageCircle
                          className="w-4 h-4"
                          style={{ color: theme.readableAccentText }}
                        />
                        <span>Falar com Vendedor</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                        <span>Chamar Garçom • {tableNumber}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Search Input */}
          <div className="mt-4 relative">
            <Search
              className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isCatalog
                  ? 'Buscar produto, modelo 3D, roupa ou peça artesanal...'
                  : 'Buscar prato, ingrediente ou bebida...'
              }
              className={`w-full border rounded-2xl pl-11 pr-4 py-3 text-xs outline-none transition ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-slate-400'
                  : 'bg-[#121929] border-slate-800 text-white placeholder:text-slate-500 focus:border-slate-600'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${
                  isLight
                    ? 'text-slate-400 hover:text-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sticky Category Tabs */}
          <div
            id="catalogo-produtos"
            className={`sticky top-0 z-30 backdrop-blur-md py-3.5 border-b my-3 flex gap-2 overflow-x-auto no-scrollbar ${
              isLight
                ? 'bg-slate-50/95 border-slate-200/90'
                : 'bg-[#090d14]/95 border-slate-800/80'
            }`}
          >
            <button
              onClick={() => setActiveCategory('all')}
              style={
                activeCategory === 'all'
                  ? {
                      backgroundColor: theme.accentHex,
                      color: theme.accentTextOnSolid,
                    }
                  : undefined
              }
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'shadow-sm'
                  : isLight
                  ? 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos ({menu.items.length})
            </button>
            {menu.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={
                  activeCategory === cat.id
                    ? {
                        backgroundColor: theme.accentHex,
                        color: theme.accentTextOnSolid,
                      }
                    : undefined
                }
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'shadow-sm'
                    : isLight
                    ? 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {(() => {
            const activeLayoutMode: 'list' | 'grid_2col' =
              isPro && menu.catalogLayoutMode === 'grid_2col' ? 'grid_2col' : 'list';
            return (
              <div
                className={
                  activeLayoutMode === 'grid_2col'
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch'
                    : 'space-y-4'
                }
              >
                {filteredItems.length === 0 ? (
                  <div
                    className={`${
                      activeLayoutMode === 'grid_2col' ? 'md:col-span-2' : ''
                    } text-center py-12 rounded-2xl border ${
                      isLight
                        ? 'bg-white border-slate-200 shadow-sm'
                        : 'bg-[#121929]/40 border-slate-800/60'
                    }`}
                  >
                    <p className={`text-sm ${mutedTextClass}`}>
                      {menu.items.length === 0
                        ? isCatalog
                          ? 'Em breve! Este catálogo está sendo preparado com novos produtos.'
                          : 'Em breve! Este cardápio está sendo preparado com novos itens.'
                        : 'Nenhum item encontrado para sua busca.'}
                    </p>
                  </div>
                ) : (
                  filteredItems.map((item, index) => {
                    const stock = getItemStockInfo(item);
                    const prodDays = getItemProductionDays(item);
                    const activeVariants = getActiveItemVariants(item, isPro);
                    const selectedVariant = resolveSelectedVariant(item);
                    const itemPhotos = extractItemPhotos(item, isPro, selectedVariant);
                    const effectivePrice = resolveVariantEffectivePrice(item, selectedVariant);
                    const discountPct = isPro
                      ? calculateDiscountPercent(effectivePrice, item.originalPrice)
                      : null;
                    const installmentInfo =
                      isPro && acceptsCreditCard
                        ? resolveInstallmentInfo(
                            effectivePrice,
                            item.maxInstallments,
                            item.installmentsHasInterest,
                            item.customInstallmentAmount,
                            menu.currency || 'R$',
                            item.installmentsInterestMode
                          )
                        : null;
                    const pixDiscountInfo = isPro
                      ? calculatePixDiscountInfo(
                          effectivePrice,
                          item.pixDiscountPercent,
                          menu.currency || 'R$'
                        )
                      : null;
                    const activeHighlights =
                      isPro && Array.isArray(item.trustHighlights)
                        ? item.trustHighlights.filter(Boolean).slice(0, 4)
                        : [];
                    const promoEffect =
                      isPro && stock.canOrder ? item.promoEffect || 'none' : 'none';
                    const promoFrameClass =
                      promoEffect === 'neon'
                        ? 'promo-card-neon'
                        : promoEffect === 'christmas'
                        ? 'promo-card-christmas'
                        : promoEffect === 'flash_gold'
                        ? 'promo-card-flash-gold'
                        : '';
                    const cartActionControl = renderCartActionControl(item);

                    const activePhotoUrl =
                      (isPro ? previewPhotoOverrides[item.id] : undefined) ||
                      itemPhotos[0];

                    const renderMiniThumbnailsStrip = () => {
                      if (!isPro || itemPhotos.length <= 1) return null;
                      return (
                        <div className="w-full flex flex-wrap items-center justify-center gap-1.5 pt-1">
                          {itemPhotos.slice(0, 5).map((pUrl, pIdx) => {
                            const isCurrentThumb = activePhotoUrl === pUrl;
                            return (
                              <button
                                key={`${item.id}-mini-${pIdx}`}
                                type="button"
                                onClick={() => {
                                  const matchingVar = activeVariants.find(
                                    (v) =>
                                      v.imageUrl &&
                                      v.imageUrl.trim() === pUrl &&
                                      v.isAvailable !== false
                                  );
                                  if (matchingVar) {
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [item.id]: matchingVar.id,
                                    }));
                                  }
                                  setPreviewPhotoOverrides((prev) => ({
                                    ...prev,
                                    [item.id]: pUrl,
                                  }));
                                }}
                                title={`Ver ângulo/foto ${pIdx + 1}`}
                                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                                  isCurrentThumb
                                    ? 'border-emerald-400 ring-1 ring-emerald-400/50 scale-105'
                                    : isLight
                                    ? 'border-slate-200 opacity-75 hover:opacity-100'
                                    : 'border-slate-700 opacity-75 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={pUrl}
                                  alt={`${item.name} foto ${pIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            );
                          })}
                        </div>
                      );
                    };

                    const renderCardBadgesRow = () => (
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-sm sm:text-base font-bold ${headingTextClass}`}
                        >
                          {item.name}
                        </h3>
                        {(() => {
                          const catName =
                            menu.categories.find(
                              (c) =>
                                c.id === item.category ||
                                c.name === item.category
                            )?.name || item.category;
                          return catName ? (
                            <span
                              className={`border text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                isLight
                                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
                              }`}
                              title={`Categoria: ${catName}`}
                            >
                              <Layers className="w-2.5 h-2.5 opacity-70" />
                              <span>{catName}</span>
                            </span>
                          ) : null;
                        })()}
                        {promoEffect === 'christmas' && (
                          <span className="border text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 border-rose-500/35 text-rose-400">
                            🎄 Especial Natal
                          </span>
                        )}
                        {promoEffect === 'neon' && (
                          <span className="border text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 border-cyan-500/35 text-cyan-300">
                            ⚡ Destaque
                          </span>
                        )}
                        {item.badge && stock.canOrder && (
                          <span
                            className={`border text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isLight
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {stock.canOrder && prodDays > 0 && (
                          <span
                            className={`border text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isLight
                                ? 'bg-orange-50 border-orange-200 text-orange-700'
                                : 'bg-orange-500/15 border-orange-500/35 text-orange-300'
                            }`}
                          >
                            ⏱️ {formatProductionDaysLabel(prodDays)}
                          </span>
                        )}
                        {stock.canOrder && stock.isUnique && (
                          <span
                            className={`border text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isLight
                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                : 'bg-purple-500/15 border-purple-500/35 text-purple-300'
                            }`}
                          >
                            💎 Peça Única
                          </span>
                        )}
                        {stock.canOrder && stock.isLimited && stock.badgeText && (
                          <span
                            className={`border text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isLight
                                ? 'bg-sky-50 border-sky-200 text-sky-700'
                                : 'bg-sky-500/15 border-sky-500/35 text-sky-300'
                            }`}
                          >
                            📦 {stock.badgeText}
                          </span>
                        )}
                        {!stock.canOrder && (
                          <span
                            className={`border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isLight
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                            }`}
                          >
                            Esgotado
                          </span>
                        )}
                      </div>
                    );

                    const renderVariantSelector = () => {
                      if (!isPro || activeVariants.length === 0 || !stock.canOrder) {
                        return null;
                      }
                      return (
                        <div className="pt-1 space-y-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider block ${mutedTextClass}`}
                          >
                            {item.variantGroupTitle || 'Opção'}:{' '}
                            <strong className={headingTextClass}>
                              {selectedVariant?.label || 'Indisponível'}
                            </strong>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeVariants.map((variant) => {
                              const isSelectedVar = selectedVariant?.id === variant.id;
                              const isVarAvailable = variant.isAvailable !== false;
                              return (
                                <button
                                  key={variant.id}
                                  type="button"
                                  disabled={!isVarAvailable}
                                  onClick={() => {
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [item.id]: variant.id,
                                    }));
                                    setPreviewPhotoOverrides((prev) => {
                                      if (!prev[item.id]) return prev;
                                      const next = { ...prev };
                                      delete next[item.id];
                                      return next;
                                    });
                                  }}
                                  style={
                                    isSelectedVar
                                      ? {
                                          backgroundColor: theme.accentHex,
                                          color: theme.accentTextOnSolid,
                                          borderColor: theme.accentHex,
                                        }
                                      : undefined
                                  }
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                    !isVarAvailable
                                      ? 'opacity-40 line-through cursor-not-allowed border-slate-700 text-slate-500'
                                      : isSelectedVar
                                      ? 'shadow-sm'
                                      : isLight
                                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                                      : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-slate-500'
                                  }`}
                                >
                                  {variant.colorHex && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                                      style={{ backgroundColor: variant.colorHex }}
                                    />
                                  )}
                                  <span>{variant.label}</span>
                                  {typeof variant.price === 'number' &&
                                    variant.price > 0 &&
                                    variant.price !== item.price && (
                                      <span className="opacity-80 text-[10px]">
                                        ({formatMoneyBR(variant.price, menu.currency || 'R$')})
                                      </span>
                                    )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    };

                    const renderHighlightsRow = () => {
                      if (activeHighlights.length === 0 || !stock.canOrder) return null;
                      return (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {activeHighlights.map((hl) => (
                            <span
                              key={hl}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                isLight
                                  ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
                                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                              }`}
                            >
                              ✓ {hl}
                            </span>
                          ))}
                        </div>
                      );
                    };

                    const acceptedPaymentSummaryStr = acceptedPaymentOptions
                      .map((o) => `${o.icon} ${o.shortLabel}`)
                      .join(' • ');
                    const effectivePriceFormattedStr = formatMoneyBR(
                      effectivePrice,
                      menu.currency || 'R$'
                    );
                    const openCurrentZoom = () => {
                      const idx = Math.max(0, itemPhotos.indexOf(activePhotoUrl || ''));
                      openPhotoZoom(item, idx);
                    };

                    return (
                      <React.Fragment key={item.id}>
                        {activeLayoutMode === 'grid_2col' ? (
                          <div
                            className={`border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 h-full transition shadow-sm ${
                              promoEffect === 'christmas' ? 'mt-3 mb-4 overflow-visible' : ''
                            } ${
                              isLight
                                ? 'bg-white border-slate-200/90'
                                : 'bg-[#121929]/75 border-slate-800/80'
                            } ${
                              stock.canOrder
                                ? isLight
                                  ? 'hover:border-slate-300 hover:shadow-md'
                                  : 'hover:border-slate-700'
                                : 'opacity-60 grayscale-[40%]'
                            } ${promoFrameClass}`}
                          >
                            {promoEffect === 'christmas' && <ChristmasCardDecor />}
                            <div className="space-y-2.5">
                              {itemPhotos.length > 0 && (
                                <div className="space-y-2">
                                  {renderProductThumbnail(item, '', 'grid_hero')}
                                  {renderMiniThumbnailsStrip()}
                                </div>
                              )}
                              {renderCardBadgesRow()}
                              {item.description && (
                                <p className={`text-xs line-clamp-3 leading-relaxed ${mutedTextClass}`}>
                                  {item.description}
                                </p>
                              )}
                              {renderHighlightsRow()}
                              {stock.canOrder && prodDays > 0 && (
                                <p
                                  className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                                    isLight ? 'text-orange-700' : 'text-orange-300'
                                  }`}
                                >
                                  <span>⏱️</span>
                                  <span>
                                    Prazo de produção: {prodDays} {prodDays === 1 ? 'dia' : 'dias'}
                                  </span>
                                </p>
                              )}
                              {renderVariantSelector()}
                            </div>

                            <div className="space-y-2.5 pt-1">
                              <RetailPriceTag
                                formattedPrice={formatItemStartingPriceLabel(item)}
                                originalPrice={isPro ? item.originalPrice : undefined}
                                discountPct={discountPct}
                                showSplash={Boolean(isPro && item.showPriceSplash)}
                                installmentInfo={installmentInfo}
                                currency={menu.currency || 'R$'}
                                priceScaleClass={activePriceScaleClass}
                                priceFont={activePriceFont}
                                accentTextColor={theme.readableAccentText}
                                isLight={isLight}
                                mutedTextClass={mutedTextClass}
                              />
                              <ShowcaseBuyBox
                                item={item}
                                isPro={isPro}
                                isCatalog={isCatalog}
                                allowDelivery={allowDelivery}
                                allowPickup={allowPickup}
                                stockCanOrder={stock.canOrder}
                                stockIsUnique={stock.isUnique}
                                stockIsLimited={stock.isLimited}
                                stockMaxQuantity={stock.maxQuantity}
                                prodDays={prodDays}
                                pixDiscountInfo={pixDiscountInfo}
                                acceptedPaymentSummary={acceptedPaymentSummaryStr}
                                cardFeeNotice={cardFeeNotice}
                                effectivePriceFormatted={effectivePriceFormattedStr}
                                storeOpen={menu.isOpen !== false}
                                whatsappNumber={menu.whatsappNumber}
                                storeTitle={menu.title}
                                selectedVariantLabel={selectedVariant?.label}
                                hasPhotos={itemPhotos.length > 0}
                                isLight={isLight}
                                layoutMode="grid_2col"
                                onOpenZoom={openCurrentZoom}
                                cartActionControl={cartActionControl}
                              />
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`border rounded-2xl p-4 sm:p-5 flex ${
                              isPro ? 'flex-col md:flex-row' : 'flex-row'
                            } gap-4 sm:gap-5 items-stretch justify-between transition shadow-sm ${
                              promoEffect === 'christmas' ? 'my-4 overflow-visible' : ''
                            } ${
                              isLight
                                ? 'bg-white border-slate-200/90'
                                : 'bg-[#121929]/75 border-slate-800/80'
                            } ${
                              stock.canOrder
                                ? isLight
                                  ? 'hover:border-slate-300 hover:shadow-md'
                                  : 'hover:border-slate-700'
                                : 'opacity-60 grayscale-[40%]'
                            } ${promoFrameClass}`}
                          >
                            {promoEffect === 'christmas' && <ChristmasCardDecor />}

                            {isPro ? (
                              <>
                                {/* Galeria Ampliada + Miolo Central Equilibrado */}
                                <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch sm:items-start">
                                  {imageOnLeft && itemPhotos.length > 0 && (
                                    <div className="w-full sm:w-44 md:w-48 flex flex-col items-center gap-2 shrink-0">
                                      {renderProductThumbnail(item, '', 'pro_list')}
                                      {itemPhotos.length > 1 ? (
                                        renderMiniThumbnailsStrip()
                                      ) : (
                                        <span className={`text-[10px] font-medium text-center ${mutedTextClass}`}>
                                          🔍 Toque na foto p/ ampliar
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5 h-full">
                                    <div className="space-y-2">
                                      {renderCardBadgesRow()}
                                      {item.description && (
                                        <p
                                          className={`text-xs line-clamp-3 leading-relaxed ${mutedTextClass}`}
                                        >
                                          {item.description}
                                        </p>
                                      )}
                                      {renderHighlightsRow()}
                                      {stock.canOrder && prodDays > 0 && (
                                        <p
                                          className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                                            isLight ? 'text-orange-700' : 'text-orange-300'
                                          }`}
                                        >
                                          <span>⏱️</span>
                                          <span>
                                            Prazo de produção: fica pronto em {prodDays}{' '}
                                            {prodDays === 1 ? 'dia' : 'dias'}
                                          </span>
                                        </p>
                                      )}
                                      {renderVariantSelector()}
                                    </div>

                                    <div className="pt-1 space-y-2">
                                      <RetailPriceTag
                                        formattedPrice={formatItemStartingPriceLabel(item)}
                                        originalPrice={item.originalPrice}
                                        discountPct={discountPct}
                                        showSplash={Boolean(item.showPriceSplash)}
                                        installmentInfo={installmentInfo}
                                        currency={menu.currency || 'R$'}
                                        priceScaleClass={activePriceScaleClass}
                                        priceFont={activePriceFont}
                                        accentTextColor={theme.readableAccentText}
                                        isLight={isLight}
                                        mutedTextClass={mutedTextClass}
                                      />
                                      {acceptedPaymentSummaryStr && (
                                        <p className={`text-[10px] font-semibold ${mutedTextClass}`}>
                                          Aceita: {acceptedPaymentSummaryStr}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {!imageOnLeft && itemPhotos.length > 0 && (
                                    <div className="w-full sm:w-44 md:w-48 flex flex-col items-center gap-2 shrink-0">
                                      {renderProductThumbnail(item, '', 'pro_list')}
                                      {itemPhotos.length > 1 ? (
                                        renderMiniThumbnailsStrip()
                                      ) : (
                                        <span className={`text-[10px] font-medium text-center ${mutedTextClass}`}>
                                          🔍 Toque na foto p/ ampliar
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Coluna Direita PRO: Buy Box Comercial (PIX, Frete Grátis, Entrega, Dúvida WhatsApp & Comprar) */}
                                <ShowcaseBuyBox
                                  item={item}
                                  isPro={isPro}
                                  isCatalog={isCatalog}
                                  allowDelivery={allowDelivery}
                                  allowPickup={allowPickup}
                                  stockCanOrder={stock.canOrder}
                                  stockIsUnique={stock.isUnique}
                                  stockIsLimited={stock.isLimited}
                                  stockMaxQuantity={stock.maxQuantity}
                                  prodDays={prodDays}
                                  pixDiscountInfo={pixDiscountInfo}
                                  acceptedPaymentSummary={acceptedPaymentSummaryStr}
                                  cardFeeNotice={cardFeeNotice}
                                  effectivePriceFormatted={effectivePriceFormattedStr}
                                  storeOpen={menu.isOpen !== false}
                                  whatsappNumber={menu.whatsappNumber}
                                  storeTitle={menu.title}
                                  selectedVariantLabel={selectedVariant?.label}
                                  hasPhotos={itemPhotos.length > 0}
                                  isLight={isLight}
                                  layoutMode="list"
                                  onOpenZoom={openCurrentZoom}
                                  cartActionControl={cartActionControl}
                                />
                              </>
                            ) : (
                              <>
                                {imageOnLeft &&
                                  renderProductThumbnail(item, 'self-start sm:self-center', 'standard')}

                                <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                                  <div className="space-y-1.5">
                                    {renderCardBadgesRow()}
                                    <p
                                      className={`text-xs line-clamp-2 leading-relaxed ${mutedTextClass}`}
                                    >
                                      {item.description}
                                    </p>
                                    {stock.canOrder && prodDays > 0 && (
                                      <p
                                        className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                                          isLight ? 'text-orange-700' : 'text-orange-300'
                                        }`}
                                      >
                                        <span>⏱️</span>
                                        <span>
                                          Prazo de produção: fica pronto em {prodDays}{' '}
                                          {prodDays === 1 ? 'dia' : 'dias'}
                                        </span>
                                      </p>
                                    )}
                                  </div>

                                  <div className="pt-1.5 flex flex-wrap items-end justify-between gap-2.5">
                                    <RetailPriceTag
                                      formattedPrice={formatItemStartingPriceLabel(item)}
                                      originalPrice={undefined}
                                      discountPct={null}
                                      showSplash={false}
                                      installmentInfo={null}
                                      currency={menu.currency || 'R$'}
                                      priceScaleClass={activePriceScaleClass}
                                      priceFont={activePriceFont}
                                      accentTextColor={theme.readableAccentText}
                                      isLight={isLight}
                                      mutedTextClass={mutedTextClass}
                                    />
                                    {(imageOnLeft || itemPhotos.length === 0) && (
                                      <div className="ml-auto">{cartActionControl}</div>
                                    )}
                                  </div>
                                </div>

                                {!imageOnLeft && itemPhotos.length > 0 && (
                                  <div className="flex flex-col items-end justify-between gap-2.5 shrink-0">
                                    {renderProductThumbnail(item, '', 'standard')}
                                    {cartActionControl}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* STRATEGIC AD FOR FREE SHOWCASES */}
                        {!isPro &&
                          ((index + 1) % 2 === 0 ||
                            (filteredItems.length === 1 && index === 0)) && (
                            <AdBanner
                              format="in-feed"
                              isPro={isPro}
                              offerIndexOverride={Math.floor(index / 2)}
                              themeMode={theme.themeMode}
                              className="my-3"
                            />
                          )}
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            );
          })()}

          {/* Bottom Interactive Cart & Category Hub (preenche o espaço vago do rodapé) */}
          <div
            className={`mt-10 p-5 sm:p-6 rounded-3xl border shadow-lg space-y-5 ${surfaceCardClass}`}
          >
            {/* Carrinho / Sacola Card at Bottom */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                isLight
                  ? 'bg-slate-50 border-slate-200/90'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  style={{
                    backgroundColor: `${theme.accentHex}20`,
                    borderColor: `${theme.accentHex}40`,
                    color: theme.accentHex,
                  }}
                  className="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm"
                >
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-extrabold ${headingTextClass}`}>
                      {isCatalog
                        ? 'Seu Carrinho de Compras'
                        : 'Sua Comanda / Pedido'}
                    </h3>
                    <span
                      style={{
                        backgroundColor:
                          totalItems > 0
                            ? theme.accentHex
                            : isLight
                            ? '#e2e8f0'
                            : '#1e293b',
                        color:
                          totalItems > 0
                            ? theme.accentTextOnSolid
                            : isLight
                            ? '#475569'
                            : '#94a3b8',
                      }}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-black"
                    >
                      {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${mutedTextClass}`}>
                    {totalItems === 0
                      ? 'Nenhum item adicionado ainda. Escolha seus produtos acima ou selecione uma categoria abaixo para pedir via WhatsApp / PIX.'
                      : cartInstallmentSummary?.kind === 'installments'
                      ? `Parcelamento no cartão: ${cartInstallmentSummary.shortLabel} (Total ${cartInstallmentSummary.cashTotalFormatted})${
                          cartInstallmentSummary.isMixedUpsell
                            ? ' — parcelamento estendido ao total do pedido'
                            : ''
                        } • Toque no botão ao lado para revisar endereço, forma de pagamento e fechar o pedido.`
                      : cartInstallmentSummary?.kind === 'mixed_cash_only'
                      ? `Total atual: ${cartInstallmentSummary.cashTotalFormatted} (contém ${cartInstallmentSummary.cashOnlyItemCount} item somente à vista) • Parceláveis: ${cartInstallmentSummary.parcelableTotalFormatted}${
                          cartInstallmentSummary.parcelableInstallmentLabel
                            ? ` (${cartInstallmentSummary.parcelableInstallmentLabel})`
                            : ''
                        } + À vista${
                          cartInstallmentSummary.hasDeliveryFeeInCash
                            ? '/entrega'
                            : ''
                        }: ${cartInstallmentSummary.cashOnlyTotalFormatted}.`
                      : `Total atual: R$ ${totalPrice.toFixed(
                          2
                        )} • Toque no botão ao lado para revisar endereço, forma de pagamento e fechar o pedido.`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                style={
                  totalItems > 0
                    ? {
                        backgroundColor: theme.accentHex,
                        color: theme.accentTextOnSolid,
                      }
                    : undefined
                }
                className={`px-5 py-3 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 shrink-0 ${
                  totalItems > 0
                    ? 'hover:brightness-105 active:scale-95'
                    : isLight
                    ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-750'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {totalItems > 0
                    ? `Fechar Pedido (${
                        cartInstallmentSummary?.kind === 'installments'
                          ? cartInstallmentSummary.shortLabel
                          : `R$ ${totalPrice.toFixed(2)}`
                      })`
                    : 'Abrir Carrinho'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Categorias daquela Página */}
            {menu.categories.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <h4
                      className={`text-xs font-bold uppercase tracking-wider ${labelTextClass}`}
                    >
                      Categorias deste {isCatalog ? 'Catálogo' : 'Cardápio'}
                    </h4>
                  </div>
                  <span className={`text-[11px] ${mutedTextClass}`}>
                    Toque para navegar
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => scrollToProducts('all')}
                    style={
                      activeCategory === 'all'
                        ? {
                            backgroundColor: theme.accentHex,
                            color: theme.accentTextOnSolid,
                          }
                        : undefined
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeCategory === 'all'
                        ? 'shadow-sm'
                        : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>Todos os Produtos</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeCategory === 'all'
                          ? 'bg-black/20 text-current'
                          : isLight
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {menu.items.length}
                    </span>
                  </button>

                  {menu.categories.map((cat) => {
                    const catCount = menu.items.filter(
                      (it) => it.category === cat.id
                    ).length;
                    const isSelected = activeCategory === cat.id;
                    return (
                      <button
                        key={`bottom-cat-${cat.id}`}
                        type="button"
                        onClick={() => scrollToProducts(cat.id)}
                        style={
                          isSelected
                            ? {
                                backgroundColor: theme.accentHex,
                                color: theme.accentTextOnSolid,
                              }
                            : undefined
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'shadow-sm'
                            : isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-black/20 text-current'
                              : isLight
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {catCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Atalhos: Voltar ao Topo & WhatsApp */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/40 text-xs">
              <button
                type="button"
                onClick={scrollToTop}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold border transition ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Voltar ao Topo</span>
              </button>

              {menu.whatsappNumber && (
                <a
                  href={`https://wa.me/${menu.whatsappNumber.replace(
                    /\D/g,
                    ''
                  )}?text=${encodeURIComponent(
                    `Olá! Estou olhando o ${
                      isCatalog ? 'catálogo' : 'cardápio'
                    } de ${menu.title} e gostaria de tirar uma dúvida.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Dúvidas? Fale pelo WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Free watermark at bottom if not PRO */}
          {!isPro && (
            <div
              className={`mt-8 text-center text-xs text-slate-500 py-4 border-t ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <p>
                {isCatalog
                  ? 'Catálogo Digital criado com SpotQR.'
                  : 'Cardápio Digital criado com SpotQR.'}
              </p>
              <Link
                href={`/?ref=${menu.slug}`}
                style={{ color: theme.readableAccentText }}
                className="font-bold underline underline-offset-2"
              >
                {isCatalog
                  ? '🎁 Crie o catálogo da sua loja com 15% de Desconto VIP'
                  : '🎁 Crie o cardápio do seu restaurante com 15% de Desconto VIP'}
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT LATERAL AD (Only on Free / Non-PRO Showcases) */}
        {!isPro && (
          <div className="hidden lg:block lg:col-span-3 sticky top-6 pt-16">
            <AdBanner
              format="skyscraper"
              side="right"
              isPro={isPro}
              themeMode={theme.themeMode}
            />
          </div>
        )}
      </div>

      {/* Cenário Natalino de Rodapé (Presépio à esquerda, Árvore ao centro, Papai Noel decolando à direita) — Free e PRO */}
      {Boolean(menu.christmasPageSkin) && (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 mt-8 relative z-20">
          <ChristmasFooterScene />
        </div>
      )}

      {/* Floating Bottom Cart / Category Navigation Bar */}
      {totalItems > 0 && !isNearBottom ? (
        <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: theme.accentHex,
              color: theme.accentTextOnSolid,
            }}
            className="w-full p-4 rounded-2xl shadow-xl flex items-center justify-between transition-all hover:brightness-105 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  theme.accentTextOnSolid === '#0f172a'
                    ? 'bg-black/15'
                    : 'bg-white/20'
                }`}
              >
                {totalItems}
              </div>
              <div className="text-left">
                <span className="text-xs opacity-85 block">
                  {isCatalog ? 'Ver Carrinho / Pedido' : 'Ver Comanda / Sacola'}
                </span>
                <span className="text-sm font-extrabold block leading-tight">
                  {cartInstallmentSummary?.kind === 'installments'
                    ? cartInstallmentSummary.shortLabel
                    : `R$ ${totalPrice.toFixed(2)}`}
                </span>
                {cartInstallmentSummary?.kind === 'mixed_cash_only' && (
                  <span className="text-[10px] opacity-85 block leading-tight mt-0.5">
                    Contém item somente à vista
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
              <span>Fechar Pedido</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      ) : isNearBottom ? (
        /* Floating category & cart teaser when reaching end of page with empty cart */
        <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 animate-slide-up">
          <div
            className={`p-2 rounded-2xl shadow-2xl border flex items-center justify-between gap-2 backdrop-blur-lg ${
              isLight
                ? 'bg-white/95 border-slate-200 text-slate-800'
                : 'bg-[#101726]/95 border-slate-700/80 text-white'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition hover:bg-slate-500/10 shrink-0"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-500" />
              <span>Carrinho (0)</span>
            </button>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => scrollToProducts('all')}
                style={
                  activeCategory === 'all'
                    ? {
                        backgroundColor: theme.accentHex,
                        color: theme.accentTextOnSolid,
                      }
                    : undefined
                }
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                  activeCategory === 'all'
                    ? 'shadow-sm'
                    : isLight
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                Todos ({menu.items.length})
              </button>
              {menu.categories.slice(0, 3).map((cat) => (
                <button
                  key={`dock-cat-${cat.id}`}
                  type="button"
                  onClick={() => scrollToProducts(cat.id)}
                  style={
                    activeCategory === cat.id
                      ? {
                          backgroundColor: theme.accentHex,
                          color: theme.accentTextOnSolid,
                        }
                      : undefined
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                    activeCategory === cat.id
                      ? 'shadow-sm'
                      : isLight
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              title="Voltar ao início"
              className={`p-2 rounded-xl transition shrink-0 ${
                isLight
                  ? 'hover:bg-slate-100 text-slate-600'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Post-Checkout PIX Payment Modal (strictly locked to closed cart order total) */}
      {closedPixOrder && closedPixOrder.amount > 0 && pixPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            className={`relative w-full max-w-sm border rounded-3xl p-6 text-center shadow-2xl space-y-4 ${modalBoxClass}`}
          >
            <button
              onClick={() => setClosedPixOrder(null)}
              aria-label="Fechar janela de pagamento PIX"
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition ${
                isLight
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div
              style={{
                backgroundColor: theme.accentSoftBg,
                color: theme.readableAccentText,
              }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
            >
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <span
                style={{
                  backgroundColor: theme.accentSoftBg,
                  borderColor: theme.accentBorder,
                  color: theme.readableAccentText,
                }}
                className="inline-block border text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase mb-2"
              >
                Pedido #{closedPixOrder.txId} • {closedPixOrder.itemsCount}{' '}
                {closedPixOrder.itemsCount === 1 ? 'item' : 'itens'}
              </span>
              <h3 className={`text-lg font-extrabold ${headingTextClass}`}>
                Pague o Pedido via PIX
              </h3>
              <p className={`text-xs mt-1 ${mutedTextClass}`}>
                PIX oficial para <strong className={headingTextClass}>{menu.title}</strong>{' '}
                com o valor exato do seu carrinho
              </p>
            </div>

            {/* Locked exact amount summary */}
            <div
              style={{
                backgroundColor: theme.accentSoftBg,
                borderColor: theme.accentBorder,
              }}
              className="border rounded-2xl px-4 py-3"
            >
              <span className={`text-[10px] uppercase tracking-wider font-bold block ${mutedTextClass}`}>
                Valor exato travado no PIX:
              </span>
              <strong
                className="text-2xl font-black block mt-0.5"
                style={{ color: theme.readableAccentText }}
              >
                R$ {closedPixOrder.amount.toFixed(2)}
              </strong>
              {closedPixOrder.deliveryFee > 0 && (
                <span className={`text-[11px] block mt-0.5 ${mutedTextClass}`}>
                  Subtotal R$ {closedPixOrder.subtotal.toFixed(2)} +{' '}
                  {isCatalog ? 'Entrega' : 'Taxa'} R$ {closedPixOrder.deliveryFee.toFixed(2)}
                </span>
              )}
            </div>

            {pixQrUrl && (
              <div className="space-y-1.5">
                <div
                  className={`relative bg-white p-1.5 rounded-2xl inline-block mx-auto ${
                    isLight ? 'border border-slate-200 shadow-md' : 'shadow-lg'
                  }`}
                >
                  <img
                    src={pixQrUrl}
                    alt={`QR Code PIX no valor de R$ ${closedPixOrder.amount.toFixed(2)}`}
                    className="w-48 h-48 object-contain"
                  />
                  {isPro && menu.logoImage && !pixQrEmbeddedLogo && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md border border-slate-100 overflow-hidden">
                        <img
                          src={menu.logoImage}
                          alt={`Logo de ${menu.title}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {isPro && menu.logoImage && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider block"
                    style={{ color: theme.readableAccentText }}
                  >
                    ✦ PRO • PIX Oficial com Logomarca
                  </span>
                )}
              </div>
            )}

            <p className={`text-[11px] leading-relaxed ${mutedTextClass}`}>
              O QR Code e o Copia e Cola já incluem automaticamente o valor exato de{' '}
              <strong className={headingTextClass}>
                R$ {closedPixOrder.amount.toFixed(2)}
              </strong>
              . Após pagar, envie o comprovante no WhatsApp para confirmar seu pedido.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pixPayload);
                  setCopiedPix(true);
                  setTimeout(() => setCopiedPix(false), 2500);
                }}
                style={{
                  backgroundColor: theme.accentHex,
                  color: theme.accentTextOnSolid,
                }}
                className="w-full py-3 rounded-xl text-xs font-bold transition hover:brightness-105 flex items-center justify-center gap-2"
              >
                {copiedPix ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>PIX Copia e Cola Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>
                      Copiar PIX Copia e Cola (R$ {closedPixOrder.amount.toFixed(2)})
                    </span>
                  </>
                )}
              </button>

              {closedPixOrder.whatsappUrl && (
                <button
                  type="button"
                  onClick={() => window.open(closedPixOrder.whatsappUrl, '_blank')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  }`}
                >
                  <MessageCircle
                    className="w-4 h-4"
                    style={{ color: theme.readableAccentText }}
                  />
                  <span>Enviar Pedido + Comprovante no WhatsApp</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setClosedPixOrder(null);
                  setIsCartOpen(true);
                }}
                className={`w-full py-1.5 text-[11px] font-semibold transition ${mutedTextClass} hover:underline`}
              >
                ← Voltar e alterar itens do pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Item Customization Modal (Sizes + Multi-Flavor + Extras) */}
      <ShowcaseCustomizeModal
        item={customizingProduct}
        selectedVariant={
          customizingProduct
            ? toSelectedVariantItem(
                customizingProduct,
                resolveSelectedVariant(customizingProduct)
              )
            : undefined
        }
        availableExtras={
          customizingProduct ? getItemAllowedExtras(customizingProduct) : []
        }
        availableFlavors={
          customizingProduct ? getItemAllowedFlavors(customizingProduct) : []
        }
        maxRemainingStock={(() => {
          if (!customizingProduct) return 999;
          const stock = getItemStockInfo(customizingProduct);
          const alreadyInCart = Object.values(cart)
            .filter((c) => c.item.id === customizingProduct.id)
            .reduce((sum, c) => sum + c.quantity, 0);
          return Math.max(0, stock.maxQuantity - alreadyInCart);
        })()}
        isLight={isLight}
        accentHex={theme.accentHex}
        accentTextOnSolid={theme.accentTextOnSolid}
        readableAccentText={theme.readableAccentText}
        onClose={() => setCustomizingProduct(null)}
        onConfirm={handleConfirmCustomizedItem}
      />

      {/* Cart & WhatsApp Checkout Drawer/Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
          <div
            className={`relative w-full max-w-lg border rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] flex flex-col ${modalBoxClass}`}
          >
            <div
              className={`shrink-0 flex items-center justify-between pb-4 border-b ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag
                  className="w-5 h-5"
                  style={{ color: theme.readableAccentText }}
                />
                <h3 className={`text-base font-bold ${headingTextClass}`}>
                  Finalizar Pedido
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className={`p-1.5 rounded-lg transition ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Mode Selector (only renders modes explicitly enabled by owner) */}
            {enabledModes.length > 0 && (
              <div
                className={`shrink-0 grid gap-2 my-3 p-1.5 rounded-2xl border ${
                  isLight
                    ? 'bg-slate-100 border-slate-200'
                    : 'bg-slate-900 border-slate-800'
                } ${
                  enabledModes.length === 1
                    ? 'grid-cols-1'
                    : enabledModes.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-3'
                }`}
              >
                {enabledModes.map((modeKey) => {
                  const isActive = orderMode === modeKey;
                  const meta =
                    modeKey === 'delivery'
                      ? {
                          icon: isCatalog ? Truck : Bike,
                          label: isCatalog ? 'Entrega / Envio' : 'Delivery',
                        }
                      : modeKey === 'pickup'
                      ? {
                          icon: Store,
                          label: isCatalog ? 'Retirar na Loja' : 'Retirada',
                        }
                      : {
                          icon: isCatalog ? ShoppingBag : Utensils,
                          label: isCatalog ? 'Presencial' : 'Na Mesa',
                        };
                  const ModeIcon = meta.icon;
                  return (
                    <button
                      key={modeKey}
                      type="button"
                      onClick={() => {
                        setOrderMode(modeKey);
                        setCheckoutFieldErrors({});
                        setCheckoutError(null);
                      }}
                      style={
                        isActive
                          ? {
                              backgroundColor: theme.accentHex,
                              color: theme.accentTextOnSolid,
                            }
                          : undefined
                      }
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        isActive
                          ? 'shadow-sm'
                          : isLight
                          ? 'text-slate-600 hover:text-slate-900'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ModeIcon className="w-3.5 h-3.5" />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-3">
              {Object.values(cart).map((c) => {
                const stock = getItemStockInfo(c.item);
                const totalItemQty = Object.values(cart)
                  .filter((itemC) => itemC.item.id === c.item.id)
                  .reduce((sum, itemC) => sum + itemC.quantity, 0);
                const reachedMax = totalItemQty >= stock.maxQuantity;
                const effectiveUnitPrice = c.unitPrice ?? c.item.price;

                return (
                  <div
                    key={c.cartKey || c.item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <h4 className={`text-xs font-bold ${headingTextClass}`}>
                        {c.item.name}
                        {c.selectedSize ? ` (${c.selectedSize.name})` : ''}
                        {c.selectedVariant ? ` — ${c.selectedVariant.label}` : ''}
                      </h4>

                      {/* Selected Variant chip */}
                      {c.selectedVariant && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                              isLight
                                ? 'bg-sky-50 border-sky-200 text-sky-900'
                                : 'bg-sky-500/15 border-sky-500/30 text-sky-200'
                            }`}
                          >
                            {c.selectedVariant.groupLabel
                              ? `${c.selectedVariant.groupLabel}: `
                              : ''}
                            {c.selectedVariant.label}
                          </span>
                        </div>
                      )}

                      {/* Selected Flavors chips */}
                      {c.selectedFlavors && c.selectedFlavors.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.selectedFlavors.map((fl, fIdx) => (
                            <span
                              key={`${fl.id}-${fIdx}`}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                isLight
                                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                                  : 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                              }`}
                            >
                              {c.selectedFlavors && c.selectedFlavors.length > 1
                                ? `${fIdx + 1}º Sabor: `
                                : 'Sabor: '}
                              {fl.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Selected Extras chips */}
                      {c.selectedExtras && c.selectedExtras.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.selectedExtras.map((extra) => (
                            <span
                              key={extra.id}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                isLight
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              }`}
                            >
                              + {extra.name} (+R$ {Number(extra.price).toFixed(2)})
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {(() => {
                          const cartEffUnit = getEffectiveCartUnitPrice(c);
                          const hasPixLineDiscount = cartEffUnit < effectiveUnitPrice;
                          return (
                            <>
                              {hasPixLineDiscount && (
                                <span
                                  className={`text-[10px] line-through font-semibold ${mutedTextClass}`}
                                >
                                  R$ {(effectiveUnitPrice * c.quantity).toFixed(2)}
                                </span>
                              )}
                              <span
                                className="text-[11px] font-semibold"
                                style={{ color: theme.readableAccentText }}
                              >
                                R$ {(cartEffUnit * c.quantity).toFixed(2)}
                                {hasPixLineDiscount ? ' (PIX)' : ''}
                              </span>
                            </>
                          );
                        })()}
                        {(stock.isUnique || stock.isLimited) && (
                          <span
                            className={`text-[10px] font-semibold ${
                              isLight ? 'text-amber-700' : 'text-amber-300'
                            }`}
                          >
                            {stock.isUnique
                              ? '• Peça única (máx. 1)'
                              : `• Limite: ${stock.maxQuantity} unid.`}
                          </span>
                        )}
                        {getItemProductionDays(c.item) > 0 && (
                          <span
                            className={`text-[10px] font-semibold ${
                              isLight ? 'text-orange-700' : 'text-orange-300'
                            }`}
                          >
                            • {formatProductionDaysLabel(getItemProductionDays(c.item))}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-2 rounded-lg px-2 py-1 shrink-0 ${
                        isLight
                          ? 'bg-white border border-slate-200'
                          : 'bg-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => removeFromCart(c.cartKey || c.item.id)}
                        className={`p-0.5 transition ${
                          isLight
                            ? 'text-slate-500 hover:text-slate-900'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span
                        className={`text-xs font-bold px-1 ${headingTextClass}`}
                      >
                        {c.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => incrementCartItem(c.cartKey || c.item.id)}
                        disabled={reachedMax}
                        title={
                          reachedMax
                            ? 'Quantidade máxima disponível atingida'
                            : 'Adicionar mais 1'
                        }
                        className={`p-0.5 transition ${
                          reachedMax
                            ? isLight
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-600 cursor-not-allowed'
                            : isLight
                            ? 'text-slate-500 hover:text-slate-900'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic Fields by Mode */}
              <div className="pt-2 space-y-3">
                {enabledModes.length === 0 && (
                  <div>
                    <label
                      className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                    >
                      Seu Nome <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setCheckoutFieldErrors((p) => ({ ...p, name: undefined }));
                        setCheckoutError(null);
                      }}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass} ${
                        checkoutFieldErrors.name
                          ? 'border-rose-500 ring-1 ring-rose-500/40'
                          : ''
                      }`}
                    />
                    {checkoutFieldErrors.name && (
                      <p className="text-[11px] text-rose-400 font-semibold mt-1">
                        {checkoutFieldErrors.name}
                      </p>
                    )}
                  </div>
                )}

                {enabledModes.includes('table') && orderMode === 'table' && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                        >
                          {isCatalog ? (
                            'Balcão / Stand (opcional):'
                          ) : (
                            <>
                              Número da Mesa{' '}
                              <span className="text-rose-400">*</span>
                            </>
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            isCatalog ? 'Ex: Balcão Principal' : 'Ex: Mesa 04'
                          }
                          value={tableNumber}
                          onChange={(e) => {
                            const v = e.target.value;
                            setTableNumber(v);
                            if (!v.trim()) setTableScannedFromQr(false);
                            setCheckoutFieldErrors((p) => ({
                              ...p,
                              table: undefined,
                            }));
                            setCheckoutError(null);
                          }}
                          className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass} ${
                            checkoutFieldErrors.table
                              ? 'border-rose-500 ring-1 ring-rose-500/40'
                              : ''
                          }`}
                        />
                        {checkoutFieldErrors.table && (
                          <p className="text-[11px] text-rose-400 font-semibold mt-1">
                            {checkoutFieldErrors.table}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                        >
                          Seu Nome <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Carlos"
                          value={customerName}
                          onChange={(e) => {
                            setCustomerName(e.target.value);
                            setCheckoutFieldErrors((p) => ({
                              ...p,
                              name: undefined,
                            }));
                            setCheckoutError(null);
                          }}
                          className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass} ${
                            checkoutFieldErrors.name
                              ? 'border-rose-500 ring-1 ring-rose-500/40'
                              : ''
                          }`}
                        />
                        {checkoutFieldErrors.name && (
                          <p className="text-[11px] text-rose-400 font-semibold mt-1">
                            {checkoutFieldErrors.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isCatalog && (
                      <button
                        type="button"
                        onClick={() => setIsTableScannerOpen(true)}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-[11px] font-bold transition ${
                          tableScannedFromQr && tableNumber.trim()
                            ? isLight
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : isLight
                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {tableScannedFromQr && tableNumber.trim()
                            ? `✅ QR Code da ${tableNumber} lido • Ler outra mesa (opcional)`
                            : '📷 Ler QR Code da Mesa (opcional)'}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {enabledModes.includes('delivery') && orderMode === 'delivery' && (
                  <div className="space-y-3">
                    <div>
                      <label
                        className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                      >
                        Endereço Completo para Entrega / Envio{' '}
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Rua, Número, Bairro, Cidade / CEP"
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          setCheckoutFieldErrors((p) => ({
                            ...p,
                            address: undefined,
                          }));
                          setCheckoutError(null);
                        }}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass} ${
                          checkoutFieldErrors.address
                            ? 'border-rose-500 ring-1 ring-rose-500/40'
                            : ''
                        }`}
                      />
                      {checkoutFieldErrors.address && (
                        <p className="text-[11px] text-rose-400 font-semibold mt-1">
                          {checkoutFieldErrors.address}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                      >
                        Seu Nome <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setCheckoutFieldErrors((p) => ({
                            ...p,
                            name: undefined,
                          }));
                          setCheckoutError(null);
                        }}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass} ${
                          checkoutFieldErrors.name
                            ? 'border-rose-500 ring-1 ring-rose-500/40'
                            : ''
                        }`}
                      />
                      {checkoutFieldErrors.name && (
                        <p className="text-[11px] text-rose-400 font-semibold mt-1">
                          {checkoutFieldErrors.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {enabledModes.includes('pickup') && orderMode === 'pickup' && (
                  <div>
                    <label
                      className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                    >
                      Seu Nome para Retirada{' '}
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setCheckoutFieldErrors((p) => ({
                          ...p,
                          name: undefined,
                        }));
                        setCheckoutError(null);
                      }}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass} ${
                        checkoutFieldErrors.name
                          ? 'border-rose-500 ring-1 ring-rose-500/40'
                          : ''
                      }`}
                    />
                    {checkoutFieldErrors.name && (
                      <p className="text-[11px] text-rose-400 font-semibold mt-1">
                        {checkoutFieldErrors.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Accepted Payment Methods (strictly configured by advertiser) */}
                {renderPaymentSelector()}

                {/* Change (Troco) selector for Delivery & Pickup when paying in Cash */}
                {showCashChangeOption && (
                  <div
                    className={`p-3.5 rounded-2xl border space-y-2.5 ${
                      isLight
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-emerald-950/20 border-emerald-500/30'
                    }`}
                  >
                    <label
                      className={`text-xs font-bold block ${
                        isLight ? 'text-emerald-900' : 'text-emerald-200'
                      }`}
                    >
                      💵 Pagamento em dinheiro: vai precisar de troco?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNeedsChange(false);
                          setChangeForAmount('');
                          setCheckoutError(null);
                        }}
                        style={
                          !needsChange
                            ? {
                                backgroundColor: theme.accentHex,
                                color: theme.accentTextOnSolid,
                                borderColor: theme.accentHex,
                              }
                            : undefined
                        }
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition ${
                          !needsChange
                            ? 'shadow-sm'
                            : isLight
                            ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        Não (valor exato)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNeedsChange(true);
                          setCheckoutError(null);
                        }}
                        style={
                          needsChange
                            ? {
                                backgroundColor: theme.accentHex,
                                color: theme.accentTextOnSolid,
                                borderColor: theme.accentHex,
                              }
                            : undefined
                        }
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition ${
                          needsChange
                            ? 'shadow-sm'
                            : isLight
                            ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        Sim, preciso de troco
                      </button>
                    </div>

                    {needsChange && (
                      <div className="space-y-2 pt-1">
                        <div>
                          <label
                            className={`text-[11px] font-semibold block mb-1 ${labelTextClass}`}
                          >
                            Troco para quanto? (R$)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder={`Ex: ${Math.ceil((totalPrice + 10) / 10) * 10},00`}
                            value={changeForAmount}
                            onChange={(e) => {
                              setChangeForAmount(e.target.value);
                              setCheckoutError(null);
                            }}
                            className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none ${inputFieldClass}`}
                          />
                        </div>

                        {(() => {
                          const quickBills = [20, 50, 100, 200].filter(
                            (v) => v > totalPrice
                          );
                          if (quickBills.length === 0) return null;
                          return (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[10px] font-semibold ${mutedTextClass}`}
                              >
                                Atalhos:
                              </span>
                              {quickBills.map((bill) => (
                                <button
                                  key={bill}
                                  type="button"
                                  onClick={() => {
                                    setChangeForAmount(`${bill},00`);
                                    setCheckoutError(null);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                                    parsedChangeFor === bill
                                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                                      : isLight
                                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                                  }`}
                                >
                                  R$ {bill}
                                </button>
                              ))}
                            </div>
                          );
                        })()}

                        {parsedChangeFor > 0 && parsedChangeFor >= totalPrice && (
                          <p
                            className={`text-[11px] font-bold ${
                              isLight ? 'text-emerald-700' : 'text-emerald-300'
                            }`}
                          >
                            ✓ Troco calculado: R$ {changeReturnAmount.toFixed(2)} (troco para o valor de R$ {parsedChangeFor.toFixed(2)})
                          </p>
                        )}
                        {parsedChangeFor > 0 && parsedChangeFor < totalPrice && (
                          <p className="text-[11px] font-semibold text-amber-400">
                            ⚠️ Informe um valor igual ou maior que o total do pedido (R$ {totalPrice.toFixed(2)}).
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label
                    className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                  >
                    {isCatalog
                      ? 'Tamanho, Cor ou Personalização (opcional):'
                      : 'Observações do Pedido (opcional):'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      isCatalog
                        ? 'Ex: Tamanho M, cor preta, personalizar com nome...'
                        : 'Ex: Sem cebola, ponto da carne bem passado, gelo e limão...'
                    }
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass}`}
                  />
                </div>
              </div>
            </div>

            {/* Total and Submit */}
            <div
              className={`shrink-0 pt-4 border-t space-y-3 ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              {deliveryFee > 0 && (
                <div
                  className={`flex items-center justify-between text-xs ${mutedTextClass}`}
                >
                  <span>{isCatalog ? 'Frete / Entrega:' : 'Taxa de Entrega:'}</span>
                  <span>+ R$ {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm gap-2">
                <span className={`font-semibold ${labelTextClass}`}>
                  {cartInstallmentSummary?.kind === 'installments' &&
                  isCreditCardSelected
                    ? 'Total no Cartão:'
                    : 'Total do Pedido:'}
                </span>
                <div className="text-right">
                  {cartInstallmentSummary?.kind === 'installments' &&
                  isCreditCardSelected ? (
                    <>
                      <span
                        className="text-lg font-extrabold block leading-tight"
                        style={{ color: theme.readableAccentText }}
                      >
                        {cartInstallmentSummary.shortLabel}
                        {cartInstallmentSummary.interestSuffix
                          ? ` (${cartInstallmentSummary.interestSuffix})`
                          : ''}
                      </span>
                      <span className={`text-[11px] font-semibold block ${mutedTextClass}`}>
                        Total: {cartInstallmentSummary.cashTotalFormatted}
                      </span>
                      {cartInstallmentSummary.isMixedUpsell && (
                        <span className="text-[10px] font-bold text-sky-400 block">
                          Parcelamento estendido a todo o pedido
                        </span>
                      )}
                    </>
                  ) : (
                    <span
                      className="text-lg font-extrabold"
                      style={{ color: theme.readableAccentText }}
                    >
                      R$ {totalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {cartInstallmentSummary?.kind === 'mixed_cash_only' &&
                isCreditCardSelected && (
                  <div
                    className={`px-3 py-2.5 rounded-xl border text-[11px] space-y-1 ${
                      isLight
                        ? 'bg-sky-50 border-sky-200 text-slate-700'
                        : 'bg-sky-500/10 border-sky-500/30 text-slate-200'
                    }`}
                  >
                    <p className="font-extrabold">
                      🛍️ Carrinho misto: item parcelável + item somente à vista
                    </p>
                    <p className="leading-snug opacity-90">
                      • Parceláveis: <strong>{cartInstallmentSummary.parcelableTotalFormatted}</strong>
                      {cartInstallmentSummary.parcelableInstallmentLabel
                        ? ` (${cartInstallmentSummary.parcelableInstallmentLabel})`
                        : ''}
                      <br />• Somente à vista
                      {cartInstallmentSummary.hasDeliveryFeeInCash
                        ? ' / entrega'
                        : ''}
                      : <strong>{cartInstallmentSummary.cashOnlyTotalFormatted}</strong>
                    </p>
                    <p className="text-[10px] opacity-80 leading-snug">
                      Em cobrança única no cartão fecha em{' '}
                      <strong>{cartInstallmentSummary.cashTotalFormatted}</strong> à vista (ou combine entrada + parcelas pelo WhatsApp).
                    </p>
                  </div>
                )}

              {canPayPixAtCheckout && (
                <p className={`text-[11px] leading-relaxed ${mutedTextClass}`}>
                  Ao fechar o pedido, o QR Code PIX será gerado exatamente no valor de{' '}
                  <strong className={headingTextClass}>
                    R$ {totalPrice.toFixed(2)}
                  </strong>
                  .
                </p>
              )}

              {cardFeeNotice && isAnyCardSelected && (
                <div
                  className={`px-3 py-2 rounded-xl border flex items-start gap-2 text-[11px] font-bold ${
                    isLight
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-amber-500/12 border-amber-500/35 text-amber-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{cardFeeNotice}</span>
                </div>
              )}

              {isPixSelected && !hasPixKey && (
                <p className={`text-[11px] leading-relaxed ${mutedTextClass}`}>
                  A chave PIX será combinada com o atendente ao enviar o pedido.
                </p>
              )}

              {checkoutError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <button
                onClick={handleConfirmCheckout}
                disabled={checkoutSubmitting}
                style={{
                  backgroundColor: theme.accentHex,
                  color: theme.accentTextOnSolid,
                }}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 ${
                  checkoutSubmitting
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:brightness-105'
                }`}
              >
                {checkoutSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Registrando e Baixando Estoque...</span>
                  </>
                ) : canPayPixAtCheckout ? (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>
                      Fechar Pedido e Gerar PIX (R$ {totalPrice.toFixed(2)})
                    </span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Pedido pelo WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Photo Gallery & Zoom Modal */}
      {zoomedItem &&
        (() => {
          const zoomedVariants = getActiveItemVariants(zoomedItem, isPro);
          const zoomedSelectedVar = resolveSelectedVariant(zoomedItem);
          const zoomedPhotos = extractItemPhotos(
            zoomedItem,
            isPro,
            zoomedSelectedVar
          );
          if (zoomedPhotos.length === 0) return null;
          const safeIndex = Math.min(activePhotoIndex, zoomedPhotos.length - 1);
          const currentZoomedPhoto = zoomedPhotos[safeIndex];
          const hasGallery = zoomedPhotos.length > 1;
          const zoomedEffectivePrice = resolveVariantEffectivePrice(
            zoomedItem,
            zoomedSelectedVar
          );
          const zoomedDiscountPct = isPro
            ? calculateDiscountPercent(
                zoomedEffectivePrice,
                zoomedItem.originalPrice
              )
            : null;
          const zoomedInstallmentInfo =
            isPro && acceptsCreditCard
              ? resolveInstallmentInfo(
                  zoomedEffectivePrice,
                  zoomedItem.maxInstallments,
                  zoomedItem.installmentsHasInterest,
                  zoomedItem.customInstallmentAmount,
                  menu.currency || 'R$',
                  zoomedItem.installmentsInterestMode
                )
              : null;

          return (
            <div
              onClick={closePhotoZoom}
              role="dialog"
              aria-modal="true"
              aria-label={`Foto ampliada de ${zoomedItem.name}`}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-3xl max-h-[92vh] flex flex-col border rounded-3xl overflow-hidden shadow-2xl ${modalBoxClass}`}
              >
                {/* Header */}
                <div
                  className={`shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b ${modalSubBarClass}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm sm:text-base font-extrabold truncate ${headingTextClass}`}
                      >
                        {zoomedItem.name}
                      </h3>
                      {hasGallery && (
                        <span
                          style={{
                            color: theme.readableAccentText,
                            backgroundColor: theme.accentSoftBg,
                            borderColor: theme.accentBorder,
                          }}
                          className="border text-[10px] font-bold px-2 py-0.5 rounded-full"
                        >
                          Foto {safeIndex + 1} de {zoomedPhotos.length}
                        </span>
                      )}
                      {(() => {
                        const catName =
                          menu.categories.find(
                            (c) =>
                              c.id === zoomedItem.category ||
                              c.name === zoomedItem.category
                          )?.name || zoomedItem.category;
                        return catName ? (
                          <span
                            className={`inline-flex items-center gap-1 border text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isLight
                                ? 'bg-slate-100 border-slate-200 text-slate-700'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300'
                            }`}
                          >
                            <Layers className="w-2.5 h-2.5 opacity-70" />
                            <span>{catName}</span>
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <p className={`text-[11px] ${mutedTextClass}`}>
                      {hasGallery
                        ? 'Escolha o ângulo nas miniaturas ou clique na foto para aproximar'
                        : 'Clique na foto ou use os botões para aproximar'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoZoomScale((prev) =>
                          Math.max(1, Number((prev - 0.5).toFixed(2)))
                        )
                      }
                      disabled={photoZoomScale <= 1}
                      aria-label="Diminuir zoom"
                      title="Diminuir zoom"
                      className={`p-2 rounded-xl border transition disabled:opacity-35 disabled:cursor-not-allowed ${pillMutedClass} ${
                        isLight ? 'hover:bg-slate-200' : 'hover:bg-slate-700'
                      }`}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span
                      style={{
                        color: theme.readableAccentText,
                        backgroundColor: isLight ? '#ffffff' : '#0f172a',
                        borderColor: theme.accentBorder,
                      }}
                      className="px-2 py-1 text-[11px] font-mono font-bold border rounded-lg min-w-[3.2rem] text-center"
                    >
                      {Math.round(photoZoomScale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoZoomScale((prev) =>
                          Math.min(2.5, Number((prev + 0.5).toFixed(2)))
                        )
                      }
                      disabled={photoZoomScale >= 2.5}
                      aria-label="Aumentar zoom"
                      title="Aumentar zoom"
                      className={`p-2 rounded-xl border transition disabled:opacity-35 disabled:cursor-not-allowed ${pillMutedClass} ${
                        isLight ? 'hover:bg-slate-200' : 'hover:bg-slate-700'
                      }`}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={closePhotoZoom}
                      aria-label="Fechar foto ampliada"
                      title="Fechar"
                      className={`p-2 rounded-xl border transition ml-1 ${
                        isLight
                          ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200'
                          : 'bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border-slate-700'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Interactive Gallery Thumbnails + Zoom Image Stage */}
                <div
                  className={`flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden ${
                    isLight ? 'bg-slate-100' : 'bg-[#070a10]'
                  }`}
                >
                  {hasGallery && (
                    <div
                      className={`order-2 sm:order-1 shrink-0 flex sm:flex-col gap-2 p-2.5 sm:p-3 border-t sm:border-t-0 sm:border-r overflow-x-auto sm:overflow-y-auto sm:w-24 justify-start ${modalSubBarClass}`}
                    >
                      {zoomedPhotos.map((photoUrl, pIdx) => {
                        const isSelected = pIdx === safeIndex;
                        return (
                          <button
                            key={`${photoUrl}-${pIdx}`}
                            type="button"
                            onClick={() => {
                              setActivePhotoIndex(pIdx);
                              setPhotoZoomScale(1);
                            }}
                            aria-label={`Ver foto ${pIdx + 1} de ${zoomedPhotos.length}`}
                            style={
                              isSelected
                                ? {
                                    borderColor: theme.accentHex,
                                    boxShadow: `0 0 0 2px ${theme.accentSoftBg}`,
                                  }
                                : undefined
                            }
                            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                              isSelected
                                ? 'scale-105'
                                : isLight
                                ? 'border-slate-200 opacity-75 hover:opacity-100'
                                : 'border-slate-700 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={photoUrl}
                              alt={`${zoomedItem.name} - ângulo ${pIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="order-1 sm:order-2 relative flex-1 min-h-0 overflow-auto p-3 sm:p-5 flex">
                    {hasGallery && photoZoomScale === 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePhotoIndex(
                              (prev) =>
                                (prev - 1 + zoomedPhotos.length) %
                                zoomedPhotos.length
                            );
                            setPhotoZoomScale(1);
                          }}
                          aria-label="Foto anterior"
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 backdrop-blur-sm transition shadow-lg"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePhotoIndex(
                              (prev) => (prev + 1) % zoomedPhotos.length
                            );
                            setPhotoZoomScale(1);
                          }}
                          aria-label="Próxima foto"
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 backdrop-blur-sm transition shadow-lg"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    <img
                      src={currentZoomedPhoto}
                      alt={`${zoomedItem.name} - foto ${safeIndex + 1}`}
                      onClick={() =>
                        setPhotoZoomScale((prev) => (prev > 1 ? 1 : 1.75))
                      }
                      title={
                        photoZoomScale > 1
                          ? 'Clique para voltar ao tamanho normal'
                          : 'Clique para dar zoom'
                      }
                      style={
                        photoZoomScale > 1
                          ? {
                              height: `${Math.round(photoZoomScale * 54)}vh`,
                              width: 'auto',
                              maxWidth: 'none',
                              maxHeight: 'none',
                            }
                          : undefined
                      }
                      className={
                        photoZoomScale > 1
                          ? 'm-auto rounded-2xl object-contain cursor-zoom-out select-none shadow-2xl transition-all duration-200'
                          : 'm-auto max-h-[54vh] max-w-full w-auto h-auto rounded-2xl object-contain cursor-zoom-in select-none shadow-2xl transition-all duration-200'
                      }
                    />
                  </div>
                </div>

                {/* Product Details & Direct Add Footer */}
                <div
                  className={`shrink-0 p-4 sm:px-5 sm:py-4 border-t space-y-3 ${modalSubBarClass}`}
                >
                  {getItemProductionDays(zoomedItem) > 0 && (
                    <span
                      className={`inline-block border text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isLight
                          ? 'bg-orange-50 border-orange-200 text-orange-700'
                          : 'bg-orange-500/15 border-orange-500/35 text-orange-300'
                      }`}
                    >
                      🛠️ Sob Encomenda •{' '}
                      {formatProductionDaysLabel(getItemProductionDays(zoomedItem))}
                    </span>
                  )}
                  {zoomedItem.description && (
                    <p className={`text-xs leading-relaxed ${labelTextClass}`}>
                      {zoomedItem.description}
                    </p>
                  )}
                  {isPro && zoomedVariants.length > 0 && (
                    <div className="space-y-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider block ${mutedTextClass}`}
                      >
                        {zoomedItem.variantGroupTitle || 'Opção'}:{' '}
                        <strong className={headingTextClass}>
                          {zoomedSelectedVar?.label || 'Indisponível'}
                        </strong>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {zoomedVariants.map((variant) => {
                          const isSelectedVar = zoomedSelectedVar?.id === variant.id;
                          const isVarAvailable = variant.isAvailable !== false;
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              disabled={!isVarAvailable}
                              onClick={() => {
                                setSelectedVariants((prev) => ({
                                  ...prev,
                                  [zoomedItem.id]: variant.id,
                                }));
                                setActivePhotoIndex(0);
                                setPhotoZoomScale(1);
                              }}
                              style={
                                isSelectedVar
                                  ? {
                                      backgroundColor: theme.accentHex,
                                      color: theme.accentTextOnSolid,
                                      borderColor: theme.accentHex,
                                    }
                                  : undefined
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                !isVarAvailable
                                  ? 'opacity-40 line-through cursor-not-allowed border-slate-700 text-slate-500'
                                  : isSelectedVar
                                  ? 'shadow-sm'
                                  : isLight
                                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                                  : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-slate-500'
                              }`}
                            >
                              {variant.colorHex && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                                  style={{ backgroundColor: variant.colorHex }}
                                />
                              )}
                              <span>{variant.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <RetailPriceTag
                      formattedPrice={formatItemStartingPriceLabel(zoomedItem)}
                      originalPrice={isPro ? zoomedItem.originalPrice : undefined}
                      discountPct={zoomedDiscountPct}
                      showSplash={Boolean(isPro && zoomedItem.showPriceSplash)}
                      installmentInfo={zoomedInstallmentInfo}
                      currency={menu.currency || 'R$'}
                      priceScaleClass={activePriceScaleClass}
                      priceFont={activePriceFont}
                      accentTextColor={theme.readableAccentText}
                      isLight={isLight}
                      mutedTextClass={mutedTextClass}
                    />
                    {renderCartActionControl(zoomedItem)}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Optional Table QR Code Scanner Modal */}
      <TableQrScannerModal
        isOpen={isTableScannerOpen}
        onClose={() => setIsTableScannerOpen(false)}
        onTableDetected={(detectedTable) => {
          setTableNumber(detectedTable);
          setTableScannedFromQr(true);
          setCheckoutFieldErrors((p) => ({ ...p, table: undefined }));
          setCheckoutError(null);
          setIsTableScannerOpen(false);
        }}
        isLight={isLight}
        accentHex={theme.accentHex}
        accentTextOnSolid={theme.accentTextOnSolid}
      />
    </div>
  );
}

