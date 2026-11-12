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
} from 'lucide-react';
import { RestaurantMenu, MenuItem } from '@/lib/types';
import { getItemStockInfo } from '@/lib/stock';
import { isProStillValid } from '@/lib/pro-status';
import {
  getAcceptedPaymentOptions,
  getAcceptedPaymentsList,
} from '@/lib/payments';
import { resolveShowcaseTheme } from '@/lib/theme';
import { generatePixPayload } from '@/lib/pix-brcode';
import { renderPixQrDataUrl } from '@/lib/qr-canvas';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';

interface CartItem {
  item: MenuItem;
  quantity: number;
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

  // Order details
  const [orderMode, setOrderMode] = useState<OrderMode>(
    defaultMode === 'catalog' ? 'delivery' : 'table'
  );
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [notes, setNotes] = useState('');

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
  const [photoZoomScale, setPhotoZoomScale] = useState<number>(1);

  const openPhotoZoom = (item: MenuItem) => {
    setZoomedItem(item);
    setPhotoZoomScale(1);
  };

  const closePhotoZoom = () => {
    setZoomedItem(null);
    setPhotoZoomScale(1);
  };

  useEffect(() => {
    if (!zoomedItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePhotoZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedItem]);

  // Read ?mesa=XX from URL if customer scanned a numbered table plaque
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mesaParam = urlParams.get('mesa');
      if (mesaParam) {
        setTableNumber(`Mesa ${mesaParam}`);
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
  const hasPixKey = Boolean(menu?.pixKey?.trim());
  const selectedPaymentOption =
    acceptedPaymentOptions.find((opt) => opt.whatsappLabel === paymentMethod) ||
    null;
  const isPixSelected = selectedPaymentOption?.id === 'pix';

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

  const addToCart = (item: MenuItem) => {
    const stock = getItemStockInfo(item);
    if (!stock.canOrder || stock.maxQuantity <= 0) return;
    setClosedPixOrder(null);
    setCart((prev) => {
      const existing = prev[item.id];
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty >= stock.maxQuantity) {
        return prev;
      }
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: currentQty + 1,
        },
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setClosedPixOrder(null);
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  };

  const totalItems = Object.values(cart).reduce((acc, c) => acc + c.quantity, 0);
  const subtotalPrice = Object.values(cart).reduce(
    (acc, c) => acc + c.quantity * c.item.price,
    0
  );
  const deliveryFee =
    enabledModes.includes('delivery') && orderMode === 'delivery'
      ? Number(menu?.deliveryFee || 0)
      : 0;
  const totalPrice = subtotalPrice + deliveryFee;
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
      : `🔔 *CHAMADO DE ATENDIMENTO*\n\nOlá! Estou em *${
          tableNumber || 'Minha Mesa'
        }* no *${menu.title}* e gostaria de chamar o garçom / atendimento.`;
    window.open(
      `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const buildWhatsAppOrderUrl = (pixTxId?: string): string => {
    if (!menu?.whatsappNumber) return '';

    const itemsSummary = Object.values(cart)
      .map((c) => {
        const prodDaysInfo =
          c.item.badge === 'Sob Encomenda' &&
          c.item.productionDays &&
          c.item.productionDays > 0
            ? ` (Sob encomenda • pronto em ${c.item.productionDays} ${
                c.item.productionDays === 1 ? 'dia' : 'dias'
              })`
            : '';
        return `• ${c.quantity}x ${c.item.name}${prodDaysInfo} — R$ ${(
          c.quantity * c.item.price
        ).toFixed(2)}`;
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

    if (pixTxId) {
      message += `*Código do Pedido (PIX):* #${pixTxId}\n`;
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

    if (customerName) {
      message += `*Cliente:* ${customerName}\n`;
    }

    message += `\n*Itens do Pedido:*\n${itemsSummary}\n`;
    if (deliveryFee > 0) {
      message += `\n*Subtotal:* R$ ${subtotalPrice.toFixed(2)}`;
      message += `\n*${isCatalog ? 'Frete / Entrega' : 'Taxa de Entrega'}:* R$ ${deliveryFee.toFixed(2)}`;
    }
    message += `\n*TOTAL: R$ ${totalPrice.toFixed(2)}*\n`;

    if (pixTxId) {
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

  const handleConfirmCheckout = () => {
    if (canPayPixAtCheckout) {
      const txId = `PED${Date.now().toString().slice(-6)}`;
      const whatsappUrl = buildWhatsAppOrderUrl(txId);
      setCopiedPix(false);
      setIsCartOpen(false);
      setClosedPixOrder({
        amount: Number(totalPrice.toFixed(2)),
        subtotal: Number(subtotalPrice.toFixed(2)),
        deliveryFee: Number(deliveryFee.toFixed(2)),
        itemsCount: totalItems,
        txId,
        whatsappUrl,
      });
      return;
    }

    const url = buildWhatsAppOrderUrl();
    if (url) {
      window.open(url, '_blank');
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
    const itemInCart = cart[targetItem.id]?.quantity || 0;
    const itemStock = getItemStockInfo(targetItem);
    const itemReachedMax = itemInCart >= itemStock.maxQuantity;

    if (!itemStock.canOrder) {
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

    if (itemInCart > 0) {
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
              onClick={() => removeFromCart(targetItem.id)}
              aria-label={`Remover 1 ${targetItem.name} do carrinho`}
              className={`p-1 rounded-lg transition ${subtleOnSolidClass}`}
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.6]" />
            </button>
            <span className="text-xs font-extrabold px-1 min-w-[1.25rem] text-center">
              {itemInCart}
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
                  : 'Adicionar mais uma unidade'
              }
              className={`p-1 rounded-lg transition ${
                itemReachedMax ? 'opacity-35 cursor-not-allowed' : subtleOnSolidClass
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.6]" />
            </button>
          </div>
          {itemReachedMax && (
            <span
              className={`text-[9px] font-bold ${
                isLight ? 'text-amber-700' : 'text-amber-300'
              }`}
            >
              {itemStock.isUnique
                ? 'Peça única (máx. 1)'
                : `Máx. ${itemStock.maxQuantity} disp.`}
            </span>
          )}
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => addToCart(targetItem)}
        aria-label={`Adicionar ${targetItem.name} ao carrinho`}
        style={{
          backgroundColor: theme.accentHex,
          color: theme.accentTextOnSolid,
          borderColor: theme.accentBorder,
        }}
        className="group/add shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold hover:brightness-105 active:scale-[0.97] shadow-md border transition-all whitespace-nowrap"
      >
        <ShoppingCart className="w-3.5 h-3.5 stroke-[2.4] shrink-0 transition-transform group-hover/add:-rotate-6 group-hover/add:scale-110" />
        <span>Adicionar</span>
        <span
          className={`inline-flex items-center justify-center w-4 h-4 rounded-md ${
            theme.accentTextOnSolid === '#0f172a' ? 'bg-black/15' : 'bg-white/20'
          }`}
        >
          <Plus className="w-3 h-3 stroke-[2.8]" />
        </span>
      </button>
    );
  };

  const renderProductThumbnail = (targetItem: MenuItem, extraClass = '') => {
    if (!targetItem.imageUrl) return null;
    return (
      <button
        type="button"
        onClick={() => openPhotoZoom(targetItem)}
        aria-label={`Ampliar foto de ${targetItem.name}`}
        title="Clique para ampliar e ver a foto em detalhes"
        className={`group/img relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border shadow-md shrink-0 cursor-zoom-in transition focus:outline-none ${
          isLight
            ? 'border-slate-200 hover:border-slate-400'
            : 'border-slate-700/60 hover:border-slate-500'
        } ${extraClass}`}
      >
        <img
          src={targetItem.imageUrl}
          alt={targetItem.name}
          className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-105"
        />
        <span className="absolute bottom-1.5 right-1.5 inline-flex items-center justify-center w-5 h-5 rounded-md bg-black/75 backdrop-blur-sm border border-white/20 text-white group-hover/img:scale-110 transition shadow">
          <ZoomIn className="w-3 h-3" />
        </span>
      </button>
    );
  };

  const renderPaymentSelector = () => {
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
      </div>
    );
  };

  return (
    <div className={`min-h-screen pb-28 transition-colors ${pageBgClass}`}>
      {/* Cover Banner */}
      <div className="relative w-full h-44 sm:h-56 bg-slate-900 overflow-hidden">
        <img
          src={menu.coverImage || fallbackCover}
          alt={menu.title}
          className={`w-full h-full object-cover ${
            isLight ? 'opacity-85' : 'opacity-60'
          }`}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isLight
              ? 'linear-gradient(to top, #f8fafc 0%, rgba(248, 250, 252, 0.35) 55%, transparent 100%)'
              : 'linear-gradient(to top, #090d14 0%, rgba(9, 13, 20, 0.4) 55%, transparent 100%)',
          }}
        />

        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 px-3 py-2 bg-black/55 backdrop-blur-md rounded-xl text-slate-100 hover:text-white border border-white/15 flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Criador de QR</span>
        </Link>

        {/* Table badge if detected from URL */}
        {tableNumber && (
          <div
            style={{
              backgroundColor: theme.accentHex,
              color: theme.accentTextOnSolid,
            }}
            className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-lg flex items-center gap-1.5"
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
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
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
                  {isPro && (
                    <span
                      className={`border text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        isLight
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      Verificado PRO
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
                  {allowOnSite && isCatalog && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${pillMutedClass}`}
                    >
                      <ShoppingBag
                        className="w-3 h-3"
                        style={{ color: theme.readableAccentText }}
                      />
                      <span>Presencial</span>
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

            {/* Quick Assistance Bar (Waiter/Seller) — PIX only opens after closing cart order */}
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
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
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
                    <Bell
                      className={`w-4 h-4 ${
                        isLight ? 'text-amber-600' : 'text-amber-400'
                      }`}
                    />
                    <span>Chamar Garçom</span>
                  </>
                )}
              </button>
            </div>
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
          <div className="space-y-3.5">
            {filteredItems.length === 0 ? (
              <div
                className={`text-center py-12 rounded-2xl border ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-[#121929]/40 border-slate-800/60'
                }`}
              >
                <p className={`text-sm ${mutedTextClass}`}>
                  Nenhum item encontrado para sua busca.
                </p>
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const stock = getItemStockInfo(item);
                const cartActionControl = renderCartActionControl(item);

                return (
                  <React.Fragment key={item.id}>
                    <div
                      className={`border rounded-2xl p-4 sm:p-5 flex gap-3.5 sm:gap-4 items-stretch justify-between transition shadow-sm ${
                        isLight
                          ? 'bg-white border-slate-200/90'
                          : 'bg-[#121929]/75 border-slate-800/80'
                      } ${
                        stock.canOrder
                          ? isLight
                            ? 'hover:border-slate-300 hover:shadow-md'
                            : 'hover:border-slate-700'
                          : 'opacity-60 grayscale-[40%]'
                      }`}
                    >
                      {imageOnLeft &&
                        renderProductThumbnail(item, 'self-start sm:self-center')}

                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-sm sm:text-base font-bold ${headingTextClass}`}
                            >
                              {item.name}
                            </h3>
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
                            {stock.canOrder &&
                              item.badge === 'Sob Encomenda' &&
                              item.productionDays &&
                              item.productionDays > 0 && (
                                <span
                                  className={`border text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isLight
                                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                                      : 'bg-orange-500/15 border-orange-500/35 text-orange-300'
                                  }`}
                                >
                                  ⏱️ Pronto em {item.productionDays}{' '}
                                  {item.productionDays === 1 ? 'dia' : 'dias'}
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
                          <p
                            className={`text-xs line-clamp-2 leading-relaxed ${mutedTextClass}`}
                          >
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
                          <span
                            className="text-sm sm:text-base font-extrabold"
                            style={{ color: theme.readableAccentText }}
                          >
                            R$ {item.price.toFixed(2)}
                          </span>
                          {(imageOnLeft || !item.imageUrl) && (
                            <div className="ml-auto">{cartActionControl}</div>
                          )}
                        </div>
                      </div>

                      {!imageOnLeft && item.imageUrl && (
                        <div className="flex flex-col items-end justify-between gap-2.5 shrink-0">
                          {renderProductThumbnail(item)}
                          {cartActionControl}
                        </div>
                      )}
                    </div>

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

          {/* Free watermark at bottom if not PRO */}
          {!isPro && (
            <div
              className={`mt-8 text-center text-xs text-slate-500 py-4 border-t ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <p>
                {isCatalog
                  ? 'Catálogo Digital criado gratuitamente com SpotQR.'
                  : 'Cardápio Digital criado gratuitamente com SpotQR.'}
              </p>
              <Link
                href="/"
                style={{ color: theme.readableAccentText }}
                className="font-semibold underline underline-offset-2"
              >
                {isCatalog
                  ? 'Crie o catálogo da sua loja sem comissões'
                  : 'Crie o cardápio do seu restaurante sem comissões'}
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

      {/* Floating Bottom Cart Bar */}
      {totalItems > 0 && (
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
                <span className="text-sm font-extrabold">
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
              <span>Fechar Pedido</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

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
                      onClick={() => setOrderMode(modeKey)}
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
                const reachedMax = c.quantity >= stock.maxQuantity;
                return (
                  <div
                    key={c.item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <h4 className={`text-xs font-bold ${headingTextClass}`}>
                        {c.item.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: theme.readableAccentText }}
                        >
                          R$ {(c.item.price * c.quantity).toFixed(2)}
                        </span>
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
                        {c.item.badge === 'Sob Encomenda' &&
                          c.item.productionDays &&
                          c.item.productionDays > 0 && (
                            <span
                              className={`text-[10px] font-semibold ${
                                isLight ? 'text-orange-700' : 'text-orange-300'
                              }`}
                            >
                              • Pronto em {c.item.productionDays}{' '}
                              {c.item.productionDays === 1 ? 'dia' : 'dias'}
                            </span>
                          )}
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                        isLight
                          ? 'bg-white border border-slate-200'
                          : 'bg-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => removeFromCart(c.item.id)}
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
                        onClick={() => addToCart(c.item)}
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
                      Seu Nome:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass}`}
                    />
                  </div>
                )}

                {enabledModes.includes('table') && orderMode === 'table' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                      >
                        {isCatalog ? 'Balcão / Stand (opcional):' : 'Número da Mesa:'}
                      </label>
                      <input
                        type="text"
                        placeholder={isCatalog ? 'Ex: Balcão Principal' : 'Ex: Mesa 04'}
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass}`}
                      />
                    </div>
                    <div>
                      <label
                        className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                      >
                        Seu Nome:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass}`}
                      />
                    </div>
                  </div>
                )}

                {enabledModes.includes('delivery') && orderMode === 'delivery' && (
                  <div className="space-y-3">
                    <div>
                      <label
                        className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                      >
                        Endereço Completo para Entrega / Envio:
                      </label>
                      <input
                        type="text"
                        placeholder="Rua, Número, Bairro, Cidade / CEP"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass}`}
                      />
                    </div>
                    <div>
                      <label
                        className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                      >
                        Seu Nome:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass}`}
                      />
                    </div>
                  </div>
                )}

                {enabledModes.includes('pickup') && orderMode === 'pickup' && (
                  <div>
                    <label
                      className={`text-xs font-semibold block mb-1 ${labelTextClass}`}
                    >
                      Seu Nome para Retirada:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputFieldClass}`}
                    />
                  </div>
                )}

                {/* Accepted Payment Methods (strictly configured by advertiser) */}
                {renderPaymentSelector()}

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
              <div className="flex items-center justify-between text-sm">
                <span className={`font-semibold ${labelTextClass}`}>
                  Total do Pedido:
                </span>
                <span
                  className="text-lg font-extrabold"
                  style={{ color: theme.readableAccentText }}
                >
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>

              {canPayPixAtCheckout && (
                <p className={`text-[11px] leading-relaxed ${mutedTextClass}`}>
                  Ao fechar o pedido, o QR Code PIX será gerado exatamente no valor de{' '}
                  <strong className={headingTextClass}>
                    R$ {totalPrice.toFixed(2)}
                  </strong>
                  .
                </p>
              )}

              {isPixSelected && !hasPixKey && (
                <p className={`text-[11px] leading-relaxed ${mutedTextClass}`}>
                  A chave PIX será combinada com o atendente ao enviar o pedido.
                </p>
              )}

              <button
                onClick={handleConfirmCheckout}
                style={{
                  backgroundColor: theme.accentHex,
                  color: theme.accentTextOnSolid,
                }}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold transition shadow-md hover:brightness-105 flex items-center justify-center gap-2"
              >
                {canPayPixAtCheckout ? (
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

      {/* Product Photo Zoom Modal */}
      {zoomedItem && zoomedItem.imageUrl && (
        <div
          onClick={closePhotoZoom}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de ${zoomedItem.name}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-2xl max-h-[92vh] flex flex-col border rounded-3xl overflow-hidden shadow-2xl ${modalBoxClass}`}
          >
            {/* Header */}
            <div
              className={`shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b ${modalSubBarClass}`}
            >
              <div className="min-w-0 flex-1">
                <h3
                  className={`text-sm sm:text-base font-extrabold truncate ${headingTextClass}`}
                >
                  {zoomedItem.name}
                </h3>
                <p className={`text-[11px] ${mutedTextClass}`}>
                  Clique na foto ou use os botões para aproximar
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

            {/* Interactive Zoom Image Stage */}
            <div
              className={`flex-1 min-h-0 overflow-auto p-3 sm:p-5 flex ${
                isLight ? 'bg-slate-100' : 'bg-[#070a10]'
              }`}
            >
              <img
                src={zoomedItem.imageUrl}
                alt={zoomedItem.name}
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
                        height: `${Math.round(photoZoomScale * 56)}vh`,
                        width: 'auto',
                        maxWidth: 'none',
                        maxHeight: 'none',
                      }
                    : undefined
                }
                className={
                  photoZoomScale > 1
                    ? 'm-auto rounded-2xl object-contain cursor-zoom-out select-none shadow-2xl transition-all duration-200'
                    : 'm-auto max-h-[56vh] max-w-full w-auto h-auto rounded-2xl object-contain cursor-zoom-in select-none shadow-2xl transition-all duration-200'
                }
              />
            </div>

            {/* Product Details & Direct Add Footer */}
            <div
              className={`shrink-0 p-4 sm:px-5 sm:py-4 border-t space-y-3 ${modalSubBarClass}`}
            >
              {zoomedItem.badge === 'Sob Encomenda' &&
                zoomedItem.productionDays &&
                zoomedItem.productionDays > 0 && (
                  <span
                    className={`inline-block border text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isLight
                        ? 'bg-orange-50 border-orange-200 text-orange-700'
                        : 'bg-orange-500/15 border-orange-500/35 text-orange-300'
                    }`}
                  >
                    🛠️ Sob Encomenda • Pronto em {zoomedItem.productionDays}{' '}
                    {zoomedItem.productionDays === 1 ? 'dia' : 'dias'}
                  </span>
                )}
              {zoomedItem.description && (
                <p className={`text-xs leading-relaxed ${labelTextClass}`}>
                  {zoomedItem.description}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold block ${mutedTextClass}`}
                  >
                    Preço
                  </span>
                  <span
                    className="text-lg font-extrabold"
                    style={{ color: theme.readableAccentText }}
                  >
                    R$ {zoomedItem.price.toFixed(2)}
                  </span>
                </div>
                {renderCartActionControl(zoomedItem)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

