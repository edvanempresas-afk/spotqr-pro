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
} from 'lucide-react';
import { RestaurantMenu, MenuItem } from '@/lib/types';
import { getItemStockInfo } from '@/lib/stock';
import { generatePixPayload } from '@/lib/pix-brcode';
import QRCode from 'qrcode';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';

interface CartItem {
  item: MenuItem;
  quantity: number;
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
  const [menu, setMenu] = useState<(RestaurantMenu & { isPaid?: boolean }) | null>(
    null
  );
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
  const [paymentMethod, setPaymentMethod] = useState<
    'PIX' | 'Cartão' | 'Dinheiro'
  >('PIX');
  const [notes, setNotes] = useState('');

  // Quick actions
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixQrUrl, setPixQrUrl] = useState('');
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
            ? { ...localDraft!, isPaid: data.isPaid }
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

  const isPro = Boolean(
    menu?.isPaid || slug === 'demo-restaurante' || slug === 'demo-catalogo'
  );

  const addToCart = (item: MenuItem) => {
    const stock = getItemStockInfo(item);
    if (!stock.canOrder || stock.maxQuantity <= 0) return;
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

  // Generate PIX payload
  const pixPayload = useMemo(() => {
    if (!menu?.pixKey) return '';
    return generatePixPayload({
      key: menu.pixKey,
      name: menu.title || (isCatalog ? 'Loja' : 'Restaurante'),
      city: 'SAO PAULO',
      amount: totalPrice > 0 ? totalPrice : undefined,
    });
  }, [menu, totalPrice, isCatalog]);

  useEffect(() => {
    if (isPixModalOpen && pixPayload) {
      QRCode.toDataURL(pixPayload, { width: 260, margin: 2 })
        .then((url) => setPixQrUrl(url))
        .catch(() => {});
    }
  }, [isPixModalOpen, pixPayload]);

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

  const handleSendWhatsAppOrder = () => {
    if (!menu?.whatsappNumber) return;

    const itemsSummary = Object.values(cart)
      .map(
        (c) =>
          `• ${c.quantity}x ${c.item.name} — R$ ${(
            c.quantity * c.item.price
          ).toFixed(2)}`
      )
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

    let message =
      `${modeTitle}\n` +
      `*${isCatalog ? 'Loja / Marca' : 'Estabelecimento'}:* ${menu.title}\n` +
      `────────────────────\n`;

    if (!activeMode) {
      message += `*Forma de Pagamento:* ${paymentMethod}\n`;
    } else if (activeMode === 'table') {
      message += `*${isCatalog ? 'Stand / Ref' : 'Mesa'}:* ${
        tableNumber || 'Presencial'
      }\n`;
      if (isCatalog) {
        message += `*Forma de Pagamento:* ${paymentMethod}\n`;
      }
    } else if (activeMode === 'delivery') {
      message += `*Endereço de Entrega:* ${deliveryAddress || 'A combinar'}\n`;
      message += `*Forma de Pagamento:* ${paymentMethod}\n`;
    } else {
      message += `*Modalidade:* ${
        isCatalog ? 'Retirada na Loja' : 'Retirada no Balcão'
      }\n`;
      message += `*Forma de Pagamento:* ${paymentMethod}\n`;
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

    if (notes) {
      message += `\n*Observações / Detalhes:* ${notes}\n`;
    }

    message += `\n_Enviado via ${
      isCatalog ? 'Catálogo Digital' : 'Cardápio Digital'
    } SpotQR Pro_`;

    const cleanNumber = menu.whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#101726] border border-slate-800 rounded-3xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            {isCatalog ? 'Catálogo não encontrado' : 'Cardápio não encontrado'}
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Esta vitrine digital ainda não foi configurada.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-emerald-500 text-white font-semibold text-xs rounded-xl"
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
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400/90 bg-rose-500/10 border border-rose-500/25 px-3 py-1.5 rounded-xl shrink-0">
          Indisponível
        </span>
      );
    }

    if (itemInCart > 0) {
      return (
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-xl px-1.5 py-1 shadow-md shadow-emerald-500/20 border border-emerald-300/40">
            <ShoppingCart className="w-3.5 h-3.5 stroke-[2.3] ml-1 shrink-0 opacity-85" />
            <button
              type="button"
              onClick={() => removeFromCart(targetItem.id)}
              aria-label={`Remover 1 ${targetItem.name} do carrinho`}
              className="p-1 bg-slate-950/10 hover:bg-slate-950/20 rounded-lg transition"
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
                itemReachedMax
                  ? 'opacity-35 cursor-not-allowed'
                  : 'bg-slate-950/10 hover:bg-slate-950/20'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.6]" />
            </button>
          </div>
          {itemReachedMax && (
            <span className="text-[9px] font-bold text-amber-300">
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
        className="group/add shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.97] text-slate-950 shadow-md shadow-emerald-500/20 border border-emerald-300/40 transition-all whitespace-nowrap"
      >
        <ShoppingCart className="w-3.5 h-3.5 stroke-[2.4] shrink-0 transition-transform group-hover/add:-rotate-6 group-hover/add:scale-110" />
        <span>Adicionar</span>
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-md bg-slate-950/15">
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
        className={`group/img relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-700/60 hover:border-emerald-400/70 shadow-md shrink-0 cursor-zoom-in transition focus:outline-none focus:ring-2 focus:ring-emerald-400 ${extraClass}`}
      >
        <img
          src={targetItem.imageUrl}
          alt={targetItem.name}
          className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-105"
        />
        <span className="absolute bottom-1.5 right-1.5 inline-flex items-center justify-center w-5 h-5 rounded-md bg-black/70 backdrop-blur-sm border border-white/20 text-white group-hover/img:bg-emerald-500 group-hover/img:text-slate-950 transition shadow">
          <ZoomIn className="w-3 h-3" />
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#090d14] text-slate-100 pb-28">
      {/* Cover Banner */}
      <div className="relative w-full h-44 sm:h-56 bg-slate-900 overflow-hidden">
        <img
          src={menu.coverImage || fallbackCover}
          alt={menu.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d14] via-[#090d14]/40 to-transparent" />

        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 px-3 py-2 bg-black/50 backdrop-blur-md rounded-xl text-slate-200 hover:text-white border border-white/10 flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Criador de QR</span>
        </Link>

        {/* Table badge if detected from URL */}
        {tableNumber && (
          <div className="absolute top-4 right-4 px-3.5 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-extrabold shadow-glow flex items-center gap-1.5">
            <span>📍 {tableNumber}</span>
          </div>
        )}
      </div>

      {/* Main 3-Column Container: Left Ad | Showcase | Right Ad */}
      <div className="max-w-[1440px] mx-auto px-4 -mt-16 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT LATERAL AD (Only on Free / Non-PRO Showcases) */}
        {!isPro && (
          <div className="hidden lg:block lg:col-span-3 sticky top-6 pt-16">
            <AdBanner format="skyscraper" side="left" isPro={isPro} />
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
          <div className="bg-[#121929]/95 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-emerald-500/40 flex items-center justify-center shrink-0 shadow-glow overflow-hidden ${
                  menu.logoImage
                    ? 'bg-slate-950'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
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
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {menu.title}
                  </h1>
                  {menu.isOpen !== false ? (
                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      {isCatalog ? '● Loja Aberta' : '● Aberto Agora'}
                    </span>
                  ) : (
                    <span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      ● Fechado
                    </span>
                  )}
                  {isPro && (
                    <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      Verificado PRO
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  {menu.description}
                </p>

                {/* Info Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1.5 text-xs text-slate-400">
                  {menu.openingHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{menu.openingHours}</span>
                    </span>
                  )}
                  {menu.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{menu.address}</span>
                    </span>
                  )}
                  {allowDelivery && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-semibold">
                      <Truck className="w-3 h-3" />
                      <span>{isCatalog ? 'Fazemos Envio / Entrega' : 'Delivery'}</span>
                    </span>
                  )}
                  {allowPickup && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold">
                      <Store className="w-3 h-3 text-amber-400" />
                      <span>Retirada no Local</span>
                    </span>
                  )}
                  {allowOnSite && isCatalog && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold">
                      <ShoppingBag className="w-3 h-3 text-emerald-400" />
                      <span>Presencial</span>
                    </span>
                  )}
                  {menu.wifiInfo && (
                    <button
                      onClick={handleCopyWifi}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 transition"
                    >
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {copiedWifi ? '✅ Wi-Fi Copiado!' : `Wi-Fi: ${menu.wifiInfo}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Assistance Bar (Waiter/Seller + Pay with PIX) */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePrimaryAssist}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
              >
                {isCatalog ? (
                  <>
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Falar com Vendedor</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Chamar Garçom</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsPixModalOpen(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>{isCatalog ? 'Pagar com PIX' : 'Pagar Conta com PIX'}</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isCatalog
                  ? 'Buscar produto, modelo 3D, roupa ou peça artesanal...'
                  : 'Buscar prato, ingrediente ou bebida...'
              }
              className="w-full bg-[#121929] border border-slate-800 focus:border-emerald-500 rounded-2xl pl-11 pr-4 py-3 text-xs text-white outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sticky Category Tabs */}
          <div className="sticky top-0 z-30 bg-[#090d14]/95 backdrop-blur-md py-3.5 border-b border-slate-800/80 my-3 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-emerald-500 text-white shadow-glow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos ({menu.items.length})
            </button>
            {menu.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-emerald-500 text-white shadow-glow'
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
              <div className="text-center py-12 bg-[#121929]/40 rounded-2xl border border-slate-800/60">
                <p className="text-sm text-slate-400">
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
                      className={`bg-[#121929]/75 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex gap-3.5 sm:gap-4 items-stretch justify-between transition shadow-sm ${
                        stock.canOrder
                          ? 'hover:border-emerald-500/35'
                          : 'opacity-60 grayscale-[40%]'
                      }`}
                    >
                      {imageOnLeft &&
                        renderProductThumbnail(item, 'self-start sm:self-center')}

                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-white">
                              {item.name}
                            </h3>
                            {item.badge && stock.canOrder && (
                              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                            {stock.canOrder && stock.isUnique && (
                              <span className="bg-purple-500/15 border border-purple-500/35 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                💎 Peça Única
                              </span>
                            )}
                            {stock.canOrder && stock.isLimited && stock.badgeText && (
                              <span className="bg-sky-500/15 border border-sky-500/35 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                📦 {stock.badgeText}
                              </span>
                            )}
                            {!stock.canOrder && (
                              <span className="bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                Esgotado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
                          <span className="text-sm sm:text-base font-extrabold text-emerald-400">
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
            <div className="mt-8 text-center text-xs text-slate-500 py-4 border-t border-slate-800">
              <p>
                {isCatalog
                  ? 'Catálogo Digital criado gratuitamente com SpotQR.'
                  : 'Cardápio Digital criado gratuitamente com SpotQR.'}
              </p>
              <Link
                href="/"
                className="text-emerald-400 font-semibold underline underline-offset-2"
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
            <AdBanner format="skyscraper" side="right" isPro={isPro} />
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white p-4 rounded-2xl shadow-glow-lg flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-black/20 rounded-xl flex items-center justify-center font-bold text-sm">
                {totalItems}
              </div>
              <div className="text-left">
                <span className="text-xs text-emerald-100 block">
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

      {/* PIX Bill Payment Modal */}
      {isPixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-[#121929] border border-slate-700 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <button
              onClick={() => setIsPixModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">
                {isCatalog ? 'Pagamento via PIX' : 'Pagamento PIX na Mesa'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Escaneie ou copie a chave PIX oficial de{' '}
                <strong className="text-white">{menu.title}</strong>
              </p>
            </div>

            {pixQrUrl && (
              <div className="bg-white p-3 rounded-2xl inline-block mx-auto shadow-lg">
                <img
                  src={pixQrUrl}
                  alt="QR Code PIX"
                  className="w-44 h-44 object-contain"
                />
              </div>
            )}

            <div className="text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-500 block text-[10px] uppercase mb-0.5">
                Chave PIX Oficial:
              </span>
              <strong className="font-mono text-emerald-400">
                {menu.pixKey || 'financeiro@spotqr.com.br'}
              </strong>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  pixPayload || menu.pixKey || 'financeiro@spotqr.com.br'
                );
                setCopiedPix(true);
                setTimeout(() => setCopiedPix(false), 2500);
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              {copiedPix ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Código PIX Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar PIX Copia e Cola</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Cart & WhatsApp Checkout Drawer/Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
          <div className="relative w-full max-w-lg bg-[#121929] border border-slate-700 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="shrink-0 flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Finalizar Pedido
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Mode Selector (only renders modes explicitly enabled by owner) */}
            {enabledModes.length > 0 && (
              <div
                className={`shrink-0 grid gap-2 my-3 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 ${
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
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-sm'
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
                    className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {c.item.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          R$ {(c.item.price * c.quantity).toFixed(2)}
                        </span>
                        {(stock.isUnique || stock.isLimited) && (
                          <span className="text-[10px] text-amber-300 font-semibold">
                            {stock.isUnique
                              ? '• Peça única (máx. 1)'
                              : `• Limite: ${stock.maxQuantity} unid.`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-2 py-1">
                      <button
                        onClick={() => removeFromCart(c.item.id)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1 text-white">
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
                            ? 'text-slate-600 cursor-not-allowed'
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Seu Nome:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Forma de Pagamento:
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as any)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="PIX">PIX</option>
                        <option value="Cartão">Cartão</option>
                        <option value="Dinheiro">Dinheiro</option>
                      </select>
                    </div>
                  </div>
                )}

                {enabledModes.includes('table') && orderMode === 'table' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        {isCatalog ? 'Balcão / Stand (opcional):' : 'Número da Mesa:'}
                      </label>
                      <input
                        type="text"
                        placeholder={isCatalog ? 'Ex: Balcão Principal' : 'Ex: Mesa 04'}
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Seu Nome:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {enabledModes.includes('delivery') && orderMode === 'delivery' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Endereço Completo para Entrega / Envio:
                      </label>
                      <input
                        type="text"
                        placeholder="Rua, Número, Bairro, Cidade / CEP"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Seu Nome:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Carlos"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Forma de Pagamento:
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as any)
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value="PIX">PIX</option>
                          <option value="Cartão">Cartão na Entrega</option>
                          <option value="Dinheiro">Dinheiro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {enabledModes.includes('pickup') && orderMode === 'pickup' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Seu Nome para Retirada:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Pagamento:
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as any)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="PIX">PIX</option>
                        <option value="Cartão">Cartão no Balcão</option>
                        <option value="Dinheiro">Dinheiro</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Total and Submit */}
            <div className="shrink-0 pt-4 border-t border-slate-800 space-y-3">
              {deliveryFee > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{isCatalog ? 'Frete / Entrega:' : 'Taxa de Entrega:'}</span>
                  <span>+ R$ {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-semibold">
                  Total do Pedido:
                </span>
                <span className="text-lg font-extrabold text-emerald-400">
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleSendWhatsAppOrder}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-glow flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Pedido pelo WhatsApp</span>
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
            className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#121929] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-slate-800 bg-[#0d1320]">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                  {zoomedItem.name}
                </h3>
                <p className="text-[11px] text-slate-400">
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
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 py-1 text-[11px] font-mono font-bold text-emerald-300 bg-slate-900 border border-slate-800 rounded-lg min-w-[3.2rem] text-center">
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
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={closePhotoZoom}
                  aria-label="Fechar foto ampliada"
                  title="Fechar"
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 transition ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Zoom Image Stage */}
            <div className="flex-1 min-h-0 overflow-auto bg-[#070a10] p-3 sm:p-5 flex">
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
            <div className="shrink-0 p-4 sm:px-5 sm:py-4 border-t border-slate-800 bg-[#0d1320] space-y-3">
              {zoomedItem.description && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {zoomedItem.description}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Preço
                  </span>
                  <span className="text-lg font-extrabold text-emerald-400">
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

