'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Link as LinkIcon,
  MessageCircle,
  QrCode as QrCodeIcon,
  Wifi,
  UtensilsCrossed,
  ShoppingBag,
  Star,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Square,
  ShieldCheck,
  Upload,
  X,
  UserCheck,
  Camera,
  Edit3,
  Lock,
  Check,
  ExternalLink,
} from 'lucide-react';
import { QRConfig, QRType, QRStyle, FrameStyle } from '@/lib/types';
import { generatePixPayload } from '@/lib/pix-brcode';
import { getDefaultFrameTexts } from '@/lib/qr-canvas';
import QRPreview from './QRPreview';
import PixCheckoutModal from './PixCheckoutModal';
import MenuEditorModal from './MenuEditorModal';
import ProFeatureLockModal from './ProFeatureLockModal';
import ClientAuthModal from './ClientAuthModal';
import AdBanner from './AdBanner';
import VoucherRedeemBox from './VoucherRedeemBox';
import { useRouter } from 'next/navigation';
import { useProPrice } from '@/lib/pro-price';

// Instant SVG Data-URI Logos (Zero CORS issues, 100% crisp at any resolution!)
const makeSvgDataUri = (bg: string, emojiOrText: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="28" fill="${bg}"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="64" font-family="sans-serif">${emojiOrText}</text>
    </svg>`
  )}`;

const PRESET_LOGOS = [
  { label: '🍔 Burger / Menu', url: makeSvgDataUri('#16a34a', '🍔') },
  { label: '🛍️ Loja / Catálogo', url: makeSvgDataUri('#10b981', '🛍️') },
  { label: '🖨️ 3D & Tech', url: makeSvgDataUri('#6366f1', '🖨️') },
  { label: '💸 PIX Oficial', url: makeSvgDataUri('#0d9488', '💠') },
  { label: '💬 WhatsApp', url: makeSvgDataUri('#25d366', '💬') },
  { label: '📶 Wi-Fi VIP', url: makeSvgDataUri('#0284c7', '📶') },
  { label: '🍕 Pizzaria', url: makeSvgDataUri('#dc2626', '🍕') },
  { label: '☕ Cafeteria', url: makeSvgDataUri('#b45309', '☕') },
  { label: '⭐ 5 Estrelas', url: makeSvgDataUri('#eab308', '⭐') },
];

const PRESET_THEMES = [
  {
    name: 'Esmeralda Pro',
    fgColor: '#0f172a',
    fgGradientColor: '#16a34a',
    useGradient: true,
    bgColor: '#ffffff',
    cornerColor: '#16a34a',
    frameColor: '#16a34a',
    frameTextColor: '#ffffff',
    dotStyle: 'rounded' as QRStyle,
  },
  {
    name: 'Gourmet Gold',
    fgColor: '#1a140a',
    fgGradientColor: '#b45309',
    useGradient: true,
    bgColor: '#ffffff',
    cornerColor: '#d97706',
    frameColor: '#d97706',
    frameTextColor: '#ffffff',
    dotStyle: 'classy' as QRStyle,
  },
  {
    name: 'WhatsApp Direct',
    fgColor: '#064e3b',
    fgGradientColor: '#16a34a',
    useGradient: true,
    bgColor: '#ffffff',
    cornerColor: '#16a34a',
    frameColor: '#16a34a',
    frameTextColor: '#ffffff',
    dotStyle: 'dots' as QRStyle,
  },
  {
    name: 'Royal Sapphire',
    fgColor: '#0f172a',
    fgGradientColor: '#0284c7',
    useGradient: true,
    bgColor: '#ffffff',
    cornerColor: '#0369a1',
    frameColor: '#0f172a',
    frameTextColor: '#ffffff',
    dotStyle: 'rounded' as QRStyle,
  },
  {
    name: 'Minimal Classic',
    fgColor: '#000000',
    fgGradientColor: '#000000',
    useGradient: false,
    bgColor: '#ffffff',
    cornerColor: '#000000',
    frameColor: '#18181b',
    frameTextColor: '#ffffff',
    dotStyle: 'squares' as QRStyle,
  },
];

export default function QRCodeGenerator() {
  const router = useRouter();
  const { proPriceLabel } = useProPrice();

  // Avoid SSR Hydration mismatch by updating origin inside useEffect
  const [baseOrigin, setBaseOrigin] = useState<string>('https://spotqr.pro');
  const [isProPurchased, setIsProPurchased] = useState<boolean>(false);
  const [clientUser, setClientUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<
    'menu' | 'checkout' | null
  >(null);

  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    setBaseOrigin(window.location.origin);
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setClientUser(data.user);
          if (data.hasActivePro) {
            setIsProPurchased(true);
            setProExpiresAt(data.activeProExpiresAt || null);
          }
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!isProPurchased || !proExpiresAt) return;
    const expMs = new Date(proExpiresAt).getTime();
    if (!Number.isFinite(expMs)) return;
    const delay = expMs - Date.now();
    if (delay <= 0) {
      setIsProPurchased(false);
      setProExpiresAt(null);
      setConfig((prev) => ({ ...prev, isDynamic: false, logoUrl: '' }));
      return;
    }
    const timer = setTimeout(() => {
      setIsProPurchased(false);
      setProExpiresAt(null);
      setConfig((prev) => ({ ...prev, isDynamic: false, logoUrl: '' }));
    }, Math.min(delay, 2147483647));
    return () => clearTimeout(timer);
  }, [isProPurchased, proExpiresAt]);

  const [config, setConfig] = useState<QRConfig>({
    type: 'menu',
    url: 'https://seurestaurante.com.br',
    whatsappPhone: '5511999998888',
    whatsappMessage: 'Olá! Gostaria de ver o cardápio e fazer um pedido.',
    pixKey: 'financeiro@seurestaurante.com.br',
    pixKeyType: 'email',
    pixName: 'Smash & Grill Burger',
    pixCity: 'SAO PAULO',
    pixAmount: '',
    wifiSSID: 'Restaurante_Clientes',
    wifiPassword: 'senha_vip_2026',
    wifiEncryption: 'WPA',
    googleReviewUrl: 'https://g.page/r/seurestaurante/review',
    instagramHandle: 'seurestaurante',
    vcardName: 'Dr. Carlos Mendes',
    vcardRole: 'Especialista / Consultor',
    vcardOrg: 'Clínica & Consultoria',
    vcardPhone: '5511999998888',
    vcardEmail: 'contato@empresa.com.br',

    fgColor: '#0f172a',
    fgGradientColor: '#16a34a',
    useGradient: true,
    bgColor: '#ffffff',
    cornerColor: '#16a34a',
    dotStyle: 'rounded',
    // RULE: Free version starts WITHOUT any logo in the center!
    logoUrl: '',
    logoSize: 22,

    frameStyle: 'table_tent',
    frameTopText: '📱 CARDÁPIO NA MESA',
    frameText: 'VER CARDÁPIO & PEDIR',
    frameColor: '#16a34a',
    frameTextColor: '#ffffff',

    isDynamic: false,
    dynamicSlug: 'demo-restaurante',
    title: 'Smash & Grill Burger',
  });

  const [activeTab, setActiveTab] = useState<
    'content' | 'style' | 'logo' | 'frame'
  >('content');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMenuEditorOpen, setIsMenuEditorOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockModalTitle, setLockModalTitle] = useState(
    'Logomarca ou Imagem no Centro é Exclusiva do Plano PRO'
  );
  const [lockModalDesc, setLockModalDesc] = useState('');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute actual payload string based on current type (SSR Hydration safe)
  const targetContent = useMemo(() => {
    if (config.isDynamic && config.dynamicSlug) {
      return `${baseOrigin}/r/${config.dynamicSlug}`;
    }

    switch (config.type) {
      case 'url':
        return config.url.trim().startsWith('http')
          ? config.url.trim()
          : `https://${config.url.trim()}`;

      case 'whatsapp': {
        const cleanPhone = config.whatsappPhone.replace(/\D/g, '');
        const encodedMsg = encodeURIComponent(config.whatsappMessage || '');
        return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      }

      case 'pix': {
        return generatePixPayload({
          key: config.pixKey,
          name: config.pixName || 'Recebedor',
          city: config.pixCity || 'SAO PAULO',
          amount: config.pixAmount ? parseFloat(config.pixAmount) : undefined,
        });
      }

      case 'wifi': {
        return `WIFI:T:${config.wifiEncryption};S:${config.wifiSSID};P:${config.wifiPassword};;`;
      }

      case 'menu': {
        return `${baseOrigin}/cardapio/${config.dynamicSlug || 'demo-restaurante'
          }`;
      }

      case 'catalog': {
        return `${baseOrigin}/catalogo/${config.dynamicSlug || 'demo-catalogo'
          }`;
      }

      case 'google_reviews': {
        return config.googleReviewUrl.trim().startsWith('http')
          ? config.googleReviewUrl.trim()
          : `https://${config.googleReviewUrl.trim()}`;
      }

      case 'instagram': {
        const handle = (config.instagramHandle || 'seurestaurante')
          .replace('@', '')
          .trim();
        return `https://instagram.com/${handle}`;
      }

      case 'vcard': {
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${config.vcardName || 'Contato'}`,
          `ORG:${config.vcardOrg || ''}`,
          `TITLE:${config.vcardRole || ''}`,
          `TEL;TYPE=CELL:${config.vcardPhone || ''}`,
          `EMAIL:${config.vcardEmail || ''}`,
          'END:VCARD',
        ].join('\n');
      }

      default:
        return 'https://spotqr.pro';
    }
  }, [config, baseOrigin]);

  const triggerLogoPaywall = () => {
    setLockModalTitle(
      'Logomarca ou Imagem no Centro é Exclusiva do Plano PRO'
    );
    setLockModalDesc(
      `Na versão gratuita o QR Code não possui imagem central. Desbloqueie o Plano PRO por apenas ${proPriceLabel} via PIX para colocar sua logomarca ou ícone no centro do QR Code e ter link dinâmico editável!`
    );
    setIsLockModalOpen(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isProPurchased) {
      e.target.value = '';
      triggerLogoPaywall();
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setConfig((prev) => ({
            ...prev,
            logoUrl: String(event.target?.result),
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPresetLogo = (url: string) => {
    if (!isProPurchased) {
      triggerLogoPaywall();
      return;
    }
    setConfig((prev) => ({ ...prev, logoUrl: url }));
  };

  const handleOpenMenuEditorWithAuth = () => {
    if (!clientUser) {
      setPendingAuthAction('menu');
      setIsAuthModalOpen(true);
      return;
    }
    setIsMenuEditorOpen(true);
  };

  const executePixCheckout = async (activeUser?: any) => {
    const userToUse = activeUser || clientUser;
    setIsSubmitting(true);
    try {
      const defaultSlug =
        config.type === 'catalog' ? 'minha-loja' : 'meu-restaurante';
      const slug = (config.dynamicSlug || defaultSlug)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');

      const res = await fetch('/api/mercadopago/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          email: userToUse?.email || 'cliente@spotqr.com.br',
          name:
            userToUse?.name ||
            config.title ||
            'Cliente SpotQR Pro',
          title:
            config.title ||
            userToUse?.businessName ||
            `QR Dinâmico ${slug}`,
          targetUrl: targetContent,
          type: config.type,
          qrConfig: {
            ...config,
            isDynamic: true,
            logoUrl: config.logoUrl || PRESET_LOGOS[0].url,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentData(data.payment);
        setIsCheckoutOpen(true);
      } else {
        alert(
          'Erro ao iniciar cobrança Pix com Mercado Pago. Tente novamente.'
        );
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao gerar Pix.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateProCheckout = async () => {
    if (!clientUser) {
      setPendingAuthAction('checkout');
      setIsAuthModalOpen(true);
      return;
    }
    await executePixCheckout(clientUser);
  };

  const handlePaymentSuccess = () => {
    setIsCheckoutOpen(false);
    setIsProPurchased(true);
    setConfig((prev) => ({
      ...prev,
      isDynamic: true,
      logoUrl: prev.logoUrl || PRESET_LOGOS[0].url,
    }));
  };

  return (
    <section id="gerador" className="relative py-10 lg:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ESTÚDIO 3 EM 1 • QR CODE, CARDÁPIO & CATÁLOGO DIGITAL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Crie QR Codes com Logo, Cardápios ou Catálogos Online
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Crie grátis e gere seu QR Code pronto para imprimir — ou ative o{' '}
            <strong className="text-emerald-400">
              Modo PRO (Logomarca no Centro & Link Dinâmico)
            </strong>
            .
          </p>
        </div>

        {/* Studio Grid: Controls (Order 1 Mobile / Left Top Desktop) + Live Preview (Order 2 Mobile / Right Sticky Desktop) + PRO & Video Ad (Order 3 Mobile / Left Bottom Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* BLOCK 1: Main Controls Card */}
          <div className="order-1 lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <div className="bg-[#101726]/90 border border-slate-700/80 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
              {/* Top QR Type Selector (9 Types including Catálogo Não-Alimentício!) */}
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 block">
                  1. Escolha o Tipo de Solução:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'menu',
                      label: 'Cardápio Digital',
                      sub: 'Alimentação & Mesas',
                      icon: UtensilsCrossed,
                      badge: 'Top #1',
                    },
                    {
                      id: 'catalog',
                      label: 'Catálogo / Loja',
                      sub: 'Roupas, 3D & Artesanato',
                      icon: ShoppingBag,
                      badge: 'Novo',
                    },
                    {
                      id: 'pix',
                      label: 'PIX Oficial',
                      sub: 'QR Banco Central',
                      icon: QrCodeIcon,
                      badge: 'Taxa 0%',
                    },
                    {
                      id: 'whatsapp',
                      label: 'WhatsApp',
                      icon: MessageCircle,
                    },
                    { id: 'wifi', label: 'Wi-Fi Clientes', icon: Wifi },
                    { id: 'url', label: 'Site / Link', icon: LinkIcon },
                    {
                      id: 'google_reviews',
                      label: 'Google 5★',
                      icon: Star,
                    },
                    {
                      id: 'instagram',
                      label: 'Instagram',
                      icon: Camera,
                    },
                    {
                      id: 'vcard',
                      label: 'Cartão vCard',
                      icon: UserCheck,
                    },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = config.type === item.id;
                    const isLastOddMobile = idx === 8;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const nextType = item.id as QRType;
                          const defaults = getDefaultFrameTexts(nextType);
                          setConfig((prev) => {
                            let nextSlug = prev.dynamicSlug;
                            let nextTitle = prev.title;
                            let nextWhatsappMsg = prev.whatsappMessage;

                            if (nextType === 'catalog') {
                              if (!nextSlug || nextSlug === 'demo-restaurante') {
                                nextSlug = 'demo-catalogo';
                              }
                              if (!nextTitle || nextTitle === 'Smash & Grill Burger') {
                                nextTitle = 'Studio Criativo & Loja';
                              }
                              nextWhatsappMsg =
                                'Olá! Gostaria de ver os produtos e fazer um pedido.';
                            } else if (nextType === 'menu') {
                              if (!nextSlug || nextSlug === 'demo-catalogo') {
                                nextSlug = 'demo-restaurante';
                              }
                              if (!nextTitle || nextTitle === 'Studio Criativo & Loja') {
                                nextTitle = 'Smash & Grill Burger';
                              }
                              nextWhatsappMsg =
                                'Olá! Gostaria de ver o cardápio e fazer um pedido.';
                            }

                            return {
                              ...prev,
                              type: nextType,
                              dynamicSlug: nextSlug,
                              title: nextTitle,
                              whatsappMessage: nextWhatsappMsg,
                              frameTopText: defaults.topText,
                              frameText: defaults.bottomText,
                            };
                          });
                        }}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${isLastOddMobile ? 'col-span-2 sm:col-span-1' : ''
                          } ${isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-glow'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                      >
                        {item.badge && (
                          <span
                            className={`absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white uppercase tracking-wider ${item.id === 'catalog' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500'
                              }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <Icon
                          className={`w-5 h-5 mb-1 ${isSelected ? 'text-emerald-400' : 'text-slate-400'
                            }`}
                        />
                        <span className="text-xs font-semibold leading-tight">
                          {item.label}
                        </span>
                        {'sub' in item && item.sub && (
                          <span className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                            {item.sub}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customization Sub-Tabs */}
              <div className="flex border-b border-slate-800 mb-6 gap-2 sm:gap-4 overflow-x-auto pb-1">
                {[
                  { id: 'content', label: '1. Conteúdo', icon: LinkIcon, proOnly: false },
                  {
                    id: 'style',
                    label: '2. Cores & Pontos',
                    icon: Palette,
                    proOnly: false,
                  },
                  {
                    id: 'logo',
                    label: '3. Logo no Centro',
                    icon: ImageIcon,
                    proOnly: true,
                  },
                  {
                    id: 'frame',
                    label: '4. Moldura & CTA',
                    icon: Square,
                    proOnly: false,
                  },
                ].map((subTab) => {
                  const Icon = subTab.icon;
                  const isActive = activeTab === subTab.id;
                  return (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => setActiveTab(subTab.id as any)}
                      className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${isActive
                          ? 'border-emerald-500 text-emerald-400'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{subTab.label}</span>
                      {subTab.proOnly && !isProPurchased && (
                        <span className="ml-1 inline-flex items-center gap-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                          <Lock className="w-2.5 h-2.5" />
                          PRO
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: Content Fields */}
              {activeTab === 'content' && (
                <div className="space-y-4 animate-fade-in">
                  {(config.type === 'menu' || config.type === 'catalog') && (() => {
                    const isCatalog = config.type === 'catalog';
                    const currentSlug =
                      config.dynamicSlug ||
                      (isCatalog ? 'demo-catalogo' : 'demo-restaurante');
                    const routeSeg = isCatalog ? 'catalogo' : 'cardapio';
                    const livePath = `/${routeSeg}/${currentSlug}`;

                    return (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="text-xs text-slate-300">
                            <p className="font-bold text-emerald-400 mb-0.5">
                              {isCatalog
                                ? '🛍️ Catálogo Digital de Produtos (Sem Taxas)'
                                : '🍔 Cardápio Digital com Pedidos no WhatsApp'}
                            </p>
                            <p>
                              {isCatalog
                                ? 'Ideal para roupas, artesanato, impressões 3D e comércios. Configure fotos à esquerda ou direita, envio/retirada e PIX no editor.'
                                : 'Inclui carrinho, opção Na Mesa / Delivery, foto esquerda ou direita, botão Chamar Garçom e PIX.'}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={handleOpenMenuEditorWithAuth}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-glow"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>
                                {isCatalog
                                  ? 'Editar Produtos & Preços'
                                  : 'Editar Pratos & Preços'}
                              </span>
                            </button>
                            <a
                              href={livePath}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
                              title={
                                isCatalog
                                  ? 'Abrir Catálogo ao Vivo'
                                  : 'Abrir Cardápio ao Vivo'
                              }
                            >
                              <span>Abrir</span>
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                            </a>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">
                              {isCatalog
                                ? 'Nome da Loja / Marca / Ateliê:'
                                : 'Nome do Restaurante / Bar:'}
                            </label>
                            <input
                              type="text"
                              value={config.title}
                              onChange={(e) =>
                                setConfig({ ...config, title: e.target.value })
                              }
                              placeholder={
                                isCatalog
                                  ? 'Ex: Studio 3D & Artesanato'
                                  : 'Ex: Smash & Grill Burger'
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">
                              WhatsApp para Receber Pedidos:
                            </label>
                            <input
                              type="text"
                              value={config.whatsappPhone}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  whatsappPhone: e.target.value,
                                })
                              }
                              placeholder="5511999998888"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">
                            {isCatalog
                              ? 'Endereço Personalizado do Catálogo:'
                              : 'Endereço Personalizado do Cardápio:'}
                          </label>
                          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-400">
                            <span className="text-xs text-slate-500 mr-1 shrink-0">
                              spotqr.com.br/{routeSeg}/
                            </span>
                            <input
                              type="text"
                              value={config.dynamicSlug}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  dynamicSlug: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_-]/g, '-'),
                                })
                              }
                              placeholder={isCatalog ? 'minha-loja' : 'meu-restaurante'}
                              className="bg-transparent text-emerald-400 font-bold text-sm outline-none flex-1 min-w-0 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {config.type === 'pix' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300">
                        <p className="font-semibold text-emerald-400 mb-1">
                          💸 Gerador Oficial de PIX no Padrão BRCode do Banco
                          Central
                        </p>
                        <p>
                          Receba direto na sua conta bancária sem pagar taxas de
                          intermediação.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">
                            Sua Chave PIX:
                          </label>
                          <input
                            type="text"
                            value={config.pixKey}
                            onChange={(e) =>
                              setConfig({ ...config, pixKey: e.target.value })
                            }
                            placeholder="CPF, CNPJ, Celular, E-mail ou Aleatória"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">
                            Valor Opcional (R$):
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={config.pixAmount}
                            onChange={(e) =>
                              setConfig({ ...config, pixAmount: e.target.value })
                            }
                            placeholder="Deixe vazio para valor livre"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">
                            Nome do Recebedor:
                          </label>
                          <input
                            type="text"
                            value={config.pixName}
                            onChange={(e) =>
                              setConfig({ ...config, pixName: e.target.value })
                            }
                            placeholder="Ex: Hamburgueria Silva LTDA"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">
                            Cidade:
                          </label>
                          <input
                            type="text"
                            value={config.pixCity}
                            onChange={(e) =>
                              setConfig({ ...config, pixCity: e.target.value })
                            }
                            placeholder="Ex: SAO PAULO"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {config.type === 'whatsapp' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Número do WhatsApp (com DDD):
                        </label>
                        <input
                          type="text"
                          value={config.whatsappPhone}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              whatsappPhone: e.target.value,
                            })
                          }
                          placeholder="Ex: 5511999998888"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Mensagem Automática:
                        </label>
                        <textarea
                          rows={3}
                          value={config.whatsappMessage}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              whatsappMessage: e.target.value,
                            })
                          }
                          placeholder="Ex: Olá! Gostaria de fazer um pedido..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {config.type === 'wifi' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">
                            Nome da Rede Wi-Fi (SSID):
                          </label>
                          <input
                            type="text"
                            value={config.wifiSSID}
                            onChange={(e) =>
                              setConfig({ ...config, wifiSSID: e.target.value })
                            }
                            placeholder="Ex: Restaurante_Clientes"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">
                            Senha do Wi-Fi:
                          </label>
                          <input
                            type="text"
                            value={config.wifiPassword}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                wifiPassword: e.target.value,
                              })
                            }
                            placeholder="Senha de acesso"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {config.type === 'url' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        URL do Site ou Link:
                      </label>
                      <input
                        type="url"
                        value={config.url}
                        onChange={(e) =>
                          setConfig({ ...config, url: e.target.value })
                        }
                        placeholder="https://seusite.com.br"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {config.type === 'google_reviews' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Link de Avaliação do Google Meu Negócio:
                      </label>
                      <input
                        type="url"
                        value={config.googleReviewUrl}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            googleReviewUrl: e.target.value,
                          })
                        }
                        placeholder="https://g.page/r/seulink/review"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Aumente suas avaliações 5 estrelas no Google Maps com uma
                        plaquinha no caixa.
                      </p>
                    </div>
                  )}

                  {config.type === 'instagram' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Arroba do Instagram (sem @):
                      </label>
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5">
                        <span className="text-slate-400 text-sm mr-1">@</span>
                        <input
                          type="text"
                          value={config.instagramHandle || ''}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              instagramHandle: e.target.value,
                            })
                          }
                          placeholder="seurestaurante"
                          className="bg-transparent text-sm text-white outline-none flex-1"
                        />
                      </div>
                    </div>
                  )}

                  {config.type === 'vcard' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Nome Completo:
                        </label>
                        <input
                          type="text"
                          value={config.vcardName || ''}
                          onChange={(e) =>
                            setConfig({ ...config, vcardName: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Cargo / Profissão:
                        </label>
                        <input
                          type="text"
                          value={config.vcardRole || ''}
                          onChange={(e) =>
                            setConfig({ ...config, vcardRole: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Telefone / WhatsApp:
                        </label>
                        <input
                          type="text"
                          value={config.vcardPhone || ''}
                          onChange={(e) =>
                            setConfig({ ...config, vcardPhone: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          E-mail:
                        </label>
                        <input
                          type="email"
                          value={config.vcardEmail || ''}
                          onChange={(e) =>
                            setConfig({ ...config, vcardEmail: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Colors & Gradient Style */}
              {activeTab === 'style' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Presets */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Paletas de Alta Conversão:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESET_THEMES.map((theme) => (
                        <button
                          key={theme.name}
                          type="button"
                          onClick={() => {
                            setConfig((prev) => ({
                              ...prev,
                              fgColor: theme.fgColor,
                              fgGradientColor: theme.fgGradientColor,
                              useGradient: theme.useGradient,
                              bgColor: theme.bgColor,
                              cornerColor: theme.cornerColor,
                              frameColor: theme.frameColor,
                              frameTextColor: theme.frameTextColor,
                              dotStyle: theme.dotStyle,
                            }));
                          }}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-left transition"
                        >
                          <div
                            className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: theme.cornerColor }}
                          />
                          <span className="text-xs font-medium text-slate-200 truncate">
                            {theme.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dot Style Options */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Formato dos Pontos:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'rounded', label: 'Arredondado' },
                        { id: 'dots', label: 'Círculos Dots' },
                        { id: 'classy', label: 'Diamante Classy' },
                        { id: 'squares', label: 'Clássico' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              dotStyle: style.id as QRStyle,
                            })
                          }
                          className={`p-3 rounded-xl border text-xs font-semibold transition ${config.dotStyle === style.id
                              ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-glow'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gradient Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        ✨ Degradê Luxuoso nos Pontos
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Mistura suave entre duas cores mantendo 100% de leitura
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(config.useGradient)}
                      onChange={(e) =>
                        setConfig({ ...config, useGradient: e.target.checked })
                      }
                      className="w-5 h-5 accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Custom Color Pickers */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Cor Principal:
                      </label>
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5">
                        <input
                          type="color"
                          value={config.fgColor}
                          onChange={(e) =>
                            setConfig({ ...config, fgColor: e.target.value })
                          }
                          className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-none"
                        />
                        <span className="text-xs font-mono text-slate-300 uppercase">
                          {config.fgColor}
                        </span>
                      </div>
                    </div>

                    {config.useGradient && (
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Cor 2 (Degradê):
                        </label>
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5">
                          <input
                            type="color"
                            value={config.fgGradientColor || '#16a34a'}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                fgGradientColor: e.target.value,
                              })
                            }
                            className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-none"
                          />
                          <span className="text-xs font-mono text-slate-300 uppercase">
                            {config.fgGradientColor || '#16a34a'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Cor dos Cantos:
                      </label>
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5">
                        <input
                          type="color"
                          value={config.cornerColor}
                          onChange={(e) =>
                            setConfig({ ...config, cornerColor: e.target.value })
                          }
                          className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-none"
                        />
                        <span className="text-xs font-mono text-slate-300 uppercase">
                          {config.cornerColor}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Cor do Fundo:
                      </label>
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5">
                        <input
                          type="color"
                          value={config.bgColor}
                          onChange={(e) =>
                            setConfig({ ...config, bgColor: e.target.value })
                          }
                          className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-none"
                        />
                        <span className="text-xs font-mono text-slate-300 uppercase">
                          {config.bgColor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Logo (STRICTLY EXCLUSIVE FOR PRO!) */}
              {activeTab === 'logo' && (
                <div className="space-y-6 animate-fade-in">
                  {!isProPurchased && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-emerald-500/15 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-extrabold text-white">
                              Logomarca ou Imagem no Centro é Exclusiva PRO
                            </h4>
                            <span className="bg-amber-500 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                              {proPriceLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            Na versão gratuita o QR Code não possui logo no
                            centro. Ative o Plano PRO para colocar a marca da sua
                            empresa ou ícones exclusivos no centro do código!
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleInitiateProCheckout}
                        className="shrink-0 w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-glow transition"
                      >
                        Desbloquear Agora ({proPriceLabel})
                      </button>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Faça o Upload da sua Logomarca Própria:
                      </label>
                      {!isProPurchased && (
                        <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Requer Plano PRO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <label
                        onClick={(e) => {
                          if (!isProPurchased) {
                            e.preventDefault();
                            triggerLogoPaywall();
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-sm"
                      >
                        {!isProPurchased ? (
                          <Lock className="w-4 h-4 text-amber-200" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>
                          {isProPurchased
                            ? 'Selecionar Logo do Computador/Celular'
                            : 'Desbloquear Upload de Logo no Centro (PRO)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>

                      {isProPurchased && config.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, logoUrl: '' })}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium hover:bg-rose-500/30 transition"
                        >
                          <X className="w-4 h-4" />
                          <span>Remover Logo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preset Fast SVG Icons */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Ou escolha um Ícone Central Exclusivo PRO:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_LOGOS.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleSelectPresetLogo(item.url)}
                          className={`px-3 py-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${isProPurchased && config.logoUrl === item.url
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/60'
                            }`}
                        >
                          <span>{item.label}</span>
                          {!isProPurchased && (
                            <Lock className="w-3 h-3 text-amber-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Size Slider (Only when PRO is unlocked and logo selected) */}
                  {isProPurchased && config.logoUrl && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                        <span>Tamanho da Logo Central:</span>
                        <span className="font-mono">{config.logoSize}%</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={26}
                        value={config.logoSize}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            logoSize: Number(e.target.value),
                          })
                        }
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-500">
                        Proteção óptica ativa (Nível H): Garante leitura
                        instantânea mesmo com logomarca no centro.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Frames */}
              {activeTab === 'frame' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Estilo da Moldura / Display:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        {
                          id: 'table_tent',
                          label: 'Display c/ Cabeçalho',
                        },
                        { id: 'bottom_tag', label: 'Etiqueta Inferior (Pill)' },
                        { id: 'polaroid', label: 'Card Moderno' },
                        { id: 'badge', label: 'Emblema Superior' },
                        { id: 'luxury_border', label: 'Borda Luxury' },
                        { id: 'none', label: 'Sem Moldura' },
                      ].map((frame) => (
                        <button
                          key={frame.id}
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              frameStyle: frame.id as FrameStyle,
                            })
                          }
                          className={`p-3 rounded-xl border text-xs font-semibold transition text-left ${config.frameStyle === frame.id
                              ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-glow'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                          {frame.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {config.frameStyle !== 'none' && (
                    <div className="space-y-4">
                      {(config.frameStyle === 'table_tent' ||
                        config.frameStyle === 'polaroid' ||
                        config.frameStyle === 'badge') && (
                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">
                              Título Superior (Em cima do QR Code):
                            </label>
                            <input
                              type="text"
                              value={
                                config.frameTopText ??
                                getDefaultFrameTexts(config.type).topText
                              }
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  frameTopText: e.target.value,
                                })
                              }
                              placeholder="Ex: PAGAMENTO PIX ou CATÁLOGO DIGITAL"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        )}

                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Texto Inferior da Moldura (Call To Action):
                        </label>
                        <input
                          type="text"
                          value={config.frameText}
                          onChange={(e) =>
                            setConfig({ ...config, frameText: e.target.value })
                          }
                          placeholder="Ex: ESCANEIE COM A CÂMERA"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Cor da Moldura:
                          </label>
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5">
                            <input
                              type="color"
                              value={config.frameColor}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  frameColor: e.target.value,
                                })
                              }
                              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-none"
                            />
                            <span className="text-xs font-mono text-slate-300 uppercase">
                              {config.frameColor}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Cor do Texto:
                          </label>
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5">
                            <input
                              type="color"
                              value={config.frameTextColor}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  frameTextColor: e.target.value,
                                })
                              }
                              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-none"
                            />
                            <span className="text-xs font-mono text-slate-300 uppercase">
                              {config.frameTextColor}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* BLOCK 2: Live Preview Column (IMMEDIATELY below Controls on Mobile, Sticky Right Column on Desktop!) */}
          <div className="order-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24">
            <QRPreview
              config={config}
              targetContent={targetContent}
              onUpgradeToPro={() => {
                handleInitiateProCheckout();
              }}
            />
          </div>

          {/* BLOCK 3: PRO Upgrade Box + Video Ad (Below QR Preview on Mobile, Left Column Below Controls on Desktop!) */}
          <div className="order-3 lg:col-span-7 lg:col-start-1 lg:row-start-2 space-y-6">
            {/* DYNAMIC QR + LOGO IN CENTER PRO BOX - The Core Monetization Trigger */}
            <div className="bg-[#101726]/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
              <div
                className={`p-5 rounded-2xl border transition-all ${isProPurchased
                    ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/30 border-emerald-500/50 shadow-glow'
                    : 'bg-slate-900/60 border-amber-500/40'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        {isProPurchased
                          ? 'Plano PRO Desbloqueado (Logo no Centro + QR Dinâmico)'
                          : 'Desbloquear Logo no Centro + QR Code Dinâmico PRO'}
                      </span>
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        {isProPurchased ? 'ATIVO' : proPriceLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Libera{' '}
                      <strong className="text-amber-300">
                        sua logomarca ou imagem no centro do QR Code
                      </strong>{' '}
                      e permite{' '}
                      <strong className="text-slate-200">
                        mudar o link de destino, catálogo ou cardápio
                      </strong>{' '}
                      a qualquer momento sem precisar reimprimir adesivos.
                    </p>
                  </div>

                  {/* Toggle button requires PRO purchase */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isProPurchased) {
                        handleInitiateProCheckout();
                      } else {
                        setConfig({ ...config, isDynamic: !config.isDynamic });
                      }
                    }}
                    className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.isDynamic ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${config.isDynamic ? 'translate-x-6' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {!isProPurchased ? (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleInitiateProCheckout}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-bold transition shadow-glow flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? 'Gerando Pix...'
                          : `Liberar Logo no Centro + QR Dinâmico por ${proPriceLabel} (Pix)`}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Logo central liberada & Redirecionador ativo!
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="underline hover:text-emerald-300"
                    >
                      Ir para Meu Painel →
                    </button>
                  </div>
                )}

                {/* Voucher code input available in both Free & PRO states */}
                <VoucherRedeemBox
                  compact
                  targetSlug={
                    config.dynamicSlug &&
                    config.dynamicSlug !== 'demo-restaurante' &&
                    config.dynamicSlug !== 'demo-catalogo'
                      ? config.dynamicSlug
                      : undefined
                  }
                  onRedeemed={(res) => {
                    setIsProPurchased(true);
                    setProExpiresAt(res.proExpiresAt || null);
                    setConfig((prev) => ({
                      ...prev,
                      isDynamic: true,
                      dynamicSlug: res.slug || prev.dynamicSlug,
                    }));
                  }}
                  className="mt-4"
                />
              </div>
            </div>

            {/* STRATEGIC LARGE VIDEO AD */}
            <AdBanner
              format="video-ad"
              isPro={isProPurchased}
              onUpgradeClick={handleInitiateProCheckout}
            />
          </div>
        </div>
      </div>

      {/* Paywall Lock Modal when Free user tries to add Center Logo */}
      <ProFeatureLockModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        onUpgrade={() => handleInitiateProCheckout()}
        onVoucherRedeemed={() => {
          setIsProPurchased(true);
          setConfig((prev) => ({ ...prev, isDynamic: true }));
        }}
        featureTitle={lockModalTitle}
        featureDescription={
          lockModalDesc ||
          `A versão gratuita gera apenas QR Codes estáticos sem logo central. Adquira o Plano PRO por apenas ${proPriceLabel} para inserir sua logomarca ou imagem no centro do QR Code e torná-lo Dinâmico!`
        }
      />

      {/* Pix Checkout Modal */}
      <PixCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        slug={
          config.dynamicSlug ||
          (config.type === 'catalog' ? 'minha-loja' : 'meu-restaurante')
        }
        paymentData={paymentData}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Visual Menu / Catalog Editor Modal */}
      <MenuEditorModal
        isOpen={isMenuEditorOpen}
        onClose={() => setIsMenuEditorOpen(false)}
        slug={
          config.dynamicSlug ||
          (config.type === 'catalog' ? 'demo-catalogo' : 'demo-restaurante')
        }
        mode={config.type === 'catalog' ? 'catalog' : 'menu'}
        defaultTitle={config.title}
      />

      {/* Client Registration / Login Modal before saving Showcase or activating PRO */}
      <ClientAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAuthAction(null);
        }}
        defaultBusinessName={config.title}
        defaultWhatsapp={config.whatsappPhone}
        contextMessage={
          pendingAuthAction === 'menu'
            ? 'Crie seu login e senha grátis para salvar seu Cardápio ou Catálogo Digital e alterar itens e preços a qualquer hora.'
            : `Crie seu login e senha de cliente para vincular seu QR Code Dinâmico PRO (${proPriceLabel}) à sua conta exclusiva.`
        }
        onAuthSuccess={(user) => {
          setClientUser(user);
          setIsAuthModalOpen(false);
          if (pendingAuthAction === 'menu') {
            setPendingAuthAction(null);
            setIsMenuEditorOpen(true);
          } else if (pendingAuthAction === 'checkout') {
            setPendingAuthAction(null);
            executePixCheckout(user);
          }
        }}
      />
    </section>
  );
}
