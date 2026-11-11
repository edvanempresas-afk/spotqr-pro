'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  ShoppingBag,
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
} from 'lucide-react';
import { RestaurantMenu, MenuItem } from '@/lib/types';
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
      try {
        const res = await fetch(
          `/api/cardapio?slug=${encodeURIComponent(slug)}&mode=${defaultMode}`
        );
        if (res.ok) {
          const data = await res.json();
          setMenu(data);
          const resolvedMode = data.mode || defaultMode;
          const hasMesaParam =
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).has('mesa');
          if (resolvedMode === 'catalog' && !hasMesaParam) {
            setOrderMode('delivery');
          }
        }
      } catch (err) {
        console.error('Error loading showcase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, [slug, defaultMode]);

  const isCatalog = (menu?.mode || defaultMode) === 'catalog';
  const isPro = Boolean(
    menu?.isPaid || slug === 'demo-restaurante' || slug === 'demo-catalogo'
  );

  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: existing ? existing.quantity + 1 : 1,
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
    orderMode === 'delivery' ? Number(menu?.deliveryFee || 0) : 0;
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

    const modeTitle = isCatalog
      ? orderMode === 'delivery'
        ? '📦 *PEDIDO PARA ENTREGA / ENVIO*'
        : orderMode === 'pickup'
        ? '🏪 *PEDIDO PARA RETIRADA NA LOJA*'
        : '🛍️ *PEDIDO PRESENCIAL / BALCÃO*'
      : orderMode === 'table'
      ? '🍽️ *PEDIDO NA MESA*'
      : orderMode === 'delivery'
      ? '🛵 *PEDIDO PARA ENTREGA (DELIVERY)*'
      : '🛍️ *PEDIDO PARA RETIRADA NO BALCÃO*';

    let message =
      `${modeTitle}\n` +
      `*${isCatalog ? 'Loja / Marca' : 'Estabelecimento'}:* ${menu.title}\n` +
      `────────────────────\n`;

    if (orderMode === 'table') {
      message += `*${isCatalog ? 'Stand / Ref' : 'Mesa'}:* ${
        tableNumber || 'Presencial'
      }\n`;
      if (isCatalog) {
        message += `*Forma de Pagamento:* ${paymentMethod}\n`;
      }
    } else if (orderMode === 'delivery') {
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
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-glow">
                {isCatalog ? (
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
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1.5 text-xs text-slate-400">
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
                const inCart = cart[item.id]?.quantity || 0;
                return (
                  <React.Fragment key={item.id}>
                    <div
                      className={`bg-[#121929]/75 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex gap-4 items-center justify-between transition shadow-sm ${
                        item.isAvailable
                          ? 'hover:border-emerald-500/30'
                          : 'opacity-60 grayscale-[40%]'
                      }`}
                    >
                      <div className="flex-1 space-y-1.5 pr-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-white">
                            {item.name}
                          </h3>
                          {item.badge && item.isAvailable && (
                            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          {!item.isAvailable && (
                            <span className="bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              Esgotado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="pt-1 text-sm sm:text-base font-extrabold text-emerald-400">
                          R$ {item.price.toFixed(2)}
                        </div>
                      </div>

                      {/* Right: Image and Cart Button */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-slate-700/60 shadow-md"
                          />
                        )}

                        {!item.isAvailable ? (
                          <span className="text-[11px] font-semibold text-slate-500 px-3 py-1">
                            Indisponível
                          </span>
                        ) : inCart > 0 ? (
                          <div className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-2 py-1 shadow-sm">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 hover:bg-emerald-700 rounded-lg transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold px-1">{inCart}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="p-1 hover:bg-emerald-700 rounded-lg transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-emerald-500 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 hover:border-emerald-400 transition shadow-sm"
                          >
                            + Adicionar
                          </button>
                        )}
                      </div>
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
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
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

            {/* Order Mode Selector */}
            <div className="grid grid-cols-3 gap-2 my-3 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              {isCatalog ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOrderMode('delivery')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      orderMode === 'delivery'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Entrega / Envio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderMode('pickup')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      orderMode === 'pickup'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Retirar na Loja</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderMode('table')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      orderMode === 'table'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Presencial</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setOrderMode('table')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      orderMode === 'table'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Na Mesa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderMode('delivery')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      orderMode === 'delivery'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderMode('pickup')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      orderMode === 'pickup'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Retirada</span>
                  </button>
                </>
              )}
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto py-2 space-y-3">
              {Object.values(cart).map((c) => (
                <div
                  key={c.item.id}
                  className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {c.item.name}
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      R$ {(c.item.price * c.quantity).toFixed(2)}
                    </span>
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
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Dynamic Fields by Mode */}
              <div className="pt-2 space-y-3">
                {orderMode === 'table' && (
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

                {orderMode === 'delivery' && (
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

                {orderMode === 'pickup' && (
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
            <div className="pt-4 border-t border-slate-800 space-y-3">
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
    </div>
  );
}
