'use client';

import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Sparkles,
  X,
  Zap,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Tv,
  ShoppingBag,
  CreditCard,
  Printer,
  Wifi,
  Award,
} from 'lucide-react';
import { shouldShowAds } from '@/lib/permissions';
import { useProPrice } from '@/lib/pro-price';

export type AdSlotFormat =
  | 'leaderboard'
  | 'rectangle'
  | 'in-feed'
  | 'sticky-footer'
  | 'skyscraper'
  | 'video-ad';

interface AdBannerProps {
  format: AdSlotFormat;
  isPro?: boolean;
  className?: string;
  onUpgradeClick?: () => void;
  offerIndexOverride?: number;
  side?: 'left' | 'right';
  themeMode?: 'dark' | 'light';
}

// 6 High-converting affiliate sponsor offers so every 2 items in the menu shows a fresh ad
export const SPONSORED_OFFERS = [
  {
    title: 'Maquininha de Cartão Sem Aluguel',
    tagline: 'Menores taxas do Brasil no PIX, Débito e Crédito na hora.',
    cta: 'Pedir com Desconto',
    badge: 'Oferta Especial Comércio',
    url: 'https://www.mercadopago.com.br/point',
    bgColor: 'bg-[#0f172a] from-blue-950 via-[#0f172a] to-indigo-950',
    borderColor: 'border-blue-500/40',
    lightBgColor: 'bg-white from-blue-50/90 via-white to-indigo-50/90',
    lightBorderColor: 'border-blue-200',
    lightBadgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    accentColor: 'text-blue-400',
    buttonColor: 'bg-blue-600 hover:bg-blue-500',
  },
  {
    title: 'Impressora Térmica 80mm para Cozinha',
    tagline:
      'Imprima pedidos do WhatsApp e comandas direto no balcão sem tinta.',
    cta: 'Ver no Mercado Livre',
    badge: 'Mais Vendida para Restaurantes',
    url: 'https://lista.mercadolivre.com.br/impressora-termica-80mm',
    bgColor: 'bg-[#0f172a] from-amber-950 via-[#121622] to-slate-900',
    borderColor: 'border-amber-500/40',
    lightBgColor: 'bg-white from-amber-50/90 via-white to-orange-50/90',
    lightBorderColor: 'border-amber-200',
    lightBadgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    accentColor: 'text-amber-400',
    buttonColor: 'bg-amber-600 hover:bg-amber-500',
  },
  {
    title: 'Suportes de Acrílico A6 para Mesas',
    tagline:
      'Displays T dobráveis em acrílico cristal puro para colocar seu QR Code.',
    cta: 'Comprar Kit 20 Unidades',
    badge: 'Pronto para Display',
    url: 'https://lista.mercadolivre.com.br/display-acrilico-a6',
    bgColor: 'bg-[#0f172a] from-emerald-950 via-[#0f1926] to-teal-950',
    borderColor: 'border-emerald-500/40',
    lightBgColor: 'bg-white from-emerald-50/90 via-white to-teal-50/90',
    lightBorderColor: 'border-emerald-200',
    lightBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    accentColor: 'text-emerald-400',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-500',
  },
  {
    title: 'Embalagens Delivery Kraft Personalizadas',
    tagline:
      'Caixas para hambúrguer, batata e lacres de segurança com preço de fábrica.',
    cta: 'Ver Catálogo em Oferta',
    badge: 'Delivery Premium',
    url: 'https://lista.mercadolivre.com.br/embalagem-delivery-hamburguer',
    bgColor: 'bg-[#0f172a] from-purple-950 via-[#141326] to-fuchsia-950',
    borderColor: 'border-purple-500/40',
    lightBgColor: 'bg-white from-purple-50/90 via-white to-fuchsia-50/90',
    lightBorderColor: 'border-purple-200',
    lightBadgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    accentColor: 'text-purple-400',
    buttonColor: 'bg-purple-600 hover:bg-purple-500',
  },
  {
    title: 'Roteador Wi-Fi 6 Mesh Empresarial',
    tagline:
      'Sinal forte em todo o salão e mesas para até 150 clientes simultâneos.',
    cta: 'Conferir Oferta Hoje',
    badge: 'Alta Velocidade',
    url: 'https://lista.mercadolivre.com.br/roteador-mesh-gigabit',
    bgColor: 'bg-[#0f172a] from-cyan-950 via-[#0e1826] to-sky-950',
    borderColor: 'border-cyan-500/40',
    lightBgColor: 'bg-white from-cyan-50/90 via-white to-sky-50/90',
    lightBorderColor: 'border-cyan-200',
    lightBadgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    accentColor: 'text-cyan-400',
    buttonColor: 'bg-cyan-600 hover:bg-cyan-500',
  },
  {
    title: 'Conta Digital PJ Grátis com PIX Ilimitado',
    tagline:
      'Receba vendas das mesas na hora com rendimento automático de 105% do CDI.',
    cta: 'Abrir Conta Grátis',
    badge: 'Zero Tarifas',
    url: 'https://www.mercadopago.com.br/conta',
    bgColor: 'bg-[#0f172a] from-rose-950 via-[#1a1322] to-orange-950',
    borderColor: 'border-rose-500/40',
    lightBgColor: 'bg-white from-rose-50/90 via-white to-orange-50/90',
    lightBorderColor: 'border-rose-200',
    lightBadgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    accentColor: 'text-rose-400',
    buttonColor: 'bg-rose-600 hover:bg-rose-500',
  },
];

export default function AdBanner({
  format,
  isPro = false,
  className = '',
  onUpgradeClick,
  offerIndexOverride,
  side = 'left',
  themeMode = 'dark',
}: AdBannerProps) {
  const { proPriceLabel } = useProPrice();
  const [closed, setClosed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(18);
  const [activeSlide, setActiveSlide] = useState(0);
  const isLight = themeMode === 'light';

  // Animate progress bar & slides for the Video Ad
  useEffect(() => {
    if (format !== 'video-ad' || !isPlaying || isPro) return;
    const interval = setInterval(() => {
      setVideoProgress((prev) => {
        if (prev >= 100) {
          setActiveSlide((s) => (s + 1) % 3);
          return 0;
        }
        return prev + 2;
      });
    }, 350);
    return () => clearInterval(interval);
  }, [format, isPlaying, isPro]);

  // RULE: PRO users NEVER see ads!
  if (!shouldShowAds(isPro) || closed) {
    return null;
  }

  // Pick an offer based on override or format
  const defaultIdx =
    format === 'leaderboard' ? 0 : format === 'rectangle' ? 1 : 2;
  const offerIndex =
    offerIndexOverride !== undefined
      ? offerIndexOverride % SPONSORED_OFFERS.length
      : defaultIdx;
  const offer = SPONSORED_OFFERS[offerIndex];

  const cardPalette = (item: (typeof SPONSORED_OFFERS)[number]) =>
    isLight
      ? `${item.lightBgColor} ${item.lightBorderColor} shadow-sm hover:shadow-md`
      : `${item.bgColor} ${item.borderColor} shadow-xl`;

  // 1. LEADERBOARD FORMAT (Horizontal Top or Inter-section banner)
  if (format === 'leaderboard') {
    return (
      <aside
        aria-label="Anúncio Patrocinado"
        className={`w-full max-w-5xl mx-auto my-6 px-4 no-print ${className}`}
      >
        <div
          className={`relative rounded-2xl bg-gradient-to-r ${cardPalette(offer)} border p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden`}
        >
          {/* Ad Label */}
          <div className="absolute top-1.5 right-3 flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">
              Anúncio Patrocinado
            </span>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className={`text-[9px] font-semibold underline underline-offset-2 ${
                  isLight
                    ? 'text-emerald-700 hover:text-emerald-800'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                Remover Anúncios (PRO)
              </button>
            )}
          </div>

          {/* Left Content */}
          <div className="flex items-center gap-3.5 text-left">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isLight
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4
                  className={`text-sm font-bold ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {offer.title}
                </h4>
                <span
                  className={`text-[10px] border font-semibold px-2 py-0.5 rounded-full ${
                    isLight
                      ? offer.lightBadgeClass
                      : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                  }`}
                >
                  {offer.badge}
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 max-w-xl ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {offer.tagline}
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <a
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full sm:w-auto px-4 py-2 ${offer.buttonColor} text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap`}
            >
              <span>{offer.cta}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>
    );
  }

  // 2. RECTANGLE FORMAT (300x250 Medium Box for sidebars/previews)
  if (format === 'rectangle') {
    return (
      <aside
        aria-label="Anúncio Patrocinado"
        className={`w-full max-w-sm mx-auto my-4 no-print ${className}`}
      >
        <div
          className={`relative rounded-3xl bg-gradient-to-b ${cardPalette(offer)} border p-6 text-center overflow-hidden flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono uppercase mb-3">
            <span>Publicidade</span>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className={`underline font-sans capitalize font-semibold ${
                  isLight
                    ? 'text-emerald-700 hover:text-emerald-800'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                Assinar PRO (Sem Ads)
              </button>
            )}
          </div>

          <div className="space-y-2 mb-5">
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isLight
                  ? offer.lightBadgeClass
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {offer.badge}
            </span>
            <h4
              className={`text-base font-extrabold leading-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {offer.title}
            </h4>
            <p
              className={`text-xs leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {offer.tagline}
            </p>
          </div>

          <a
            href={offer.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-2.5 px-4 ${offer.buttonColor} text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md whitespace-nowrap`}
          >
            <span>{offer.cta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>
    );
  }

  // 3. IN-FEED FORMAT (Native banner every 2 items on non-PRO Digital Menus)
  if (format === 'in-feed') {
    return (
      <aside
        aria-label="Anúncio Patrocinado"
        className={`w-full my-3.5 no-print ${className}`}
      >
        <div
          className={`rounded-2xl bg-gradient-to-r ${cardPalette(offer)} border p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-3 text-left">
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border shrink-0 font-bold ${
                isLight
                  ? 'bg-amber-100 border-amber-200 text-amber-800'
                  : 'bg-slate-950 border-slate-700 text-amber-400'
              }`}
            >
              Anúncio
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h5
                  className={`text-xs sm:text-sm font-bold ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {offer.title}
                </h5>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    isLight
                      ? offer.lightBadgeClass
                      : 'bg-white/10 border-white/10 text-slate-200'
                  }`}
                >
                  {offer.badge}
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                {offer.tagline}
              </p>
            </div>
          </div>

          <a
            href={offer.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 ${offer.buttonColor} text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 whitespace-nowrap shadow`}
          >
            <span>{offer.cta}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>
    );
  }

  // 4. SKYSCRAPER LATERAL FORMAT (Left & Right Vertical Sidebars for Free Digital Menus)
  if (format === 'skyscraper') {
    const primaryOffer =
      side === 'left' ? SPONSORED_OFFERS[0] : SPONSORED_OFFERS[1];
    const secondaryOffer =
      side === 'left' ? SPONSORED_OFFERS[3] : SPONSORED_OFFERS[4];

    return (
      <aside
        aria-label={`Anúncio Lateral ${side === 'left' ? 'Esquerdo' : 'Direito'}`}
        className={`w-full space-y-5 no-print ${className}`}
      >
        {/* Top Vertical Skyscraper Card */}
        <div
          className={`rounded-3xl bg-gradient-to-b ${cardPalette(primaryOffer)} border p-5 flex flex-col justify-between min-h-[340px] relative overflow-hidden`}
        >
          <div>
            <div
              className={`flex items-center justify-between text-[9px] font-mono uppercase mb-3 pb-2 border-b ${
                isLight
                  ? 'text-slate-500 border-slate-200'
                  : 'text-slate-400 border-white/10'
              }`}
            >
              <span>Patrocinado</span>
              <span
                className={`font-bold ${
                  isLight ? 'text-amber-700' : 'text-amber-400'
                }`}
              >
                AD
              </span>
            </div>

            <span
              className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border mb-3 ${
                isLight
                  ? primaryOffer.lightBadgeClass
                  : 'bg-white/10 border-white/10 text-white'
              }`}
            >
              {primaryOffer.badge}
            </span>

            <h4
              className={`text-base font-extrabold leading-snug mb-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {primaryOffer.title}
            </h4>

            <p
              className={`text-xs leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              {primaryOffer.tagline}
            </p>
          </div>

          <div
            className={`my-4 p-3 rounded-2xl border text-center ${
              isLight
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-slate-950/65 border-white/10'
            }`}
          >
            <span
              className={`text-[10px] uppercase block font-semibold ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Condição Exclusiva
            </span>
            <strong
              className={`text-sm font-extrabold ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              Frete Grátis + Envios Hoje
            </strong>
          </div>

          <a
            href={primaryOffer.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-3 px-3 ${primaryOffer.buttonColor} text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap`}
          >
            <span>{primaryOffer.cta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Bottom Vertical Skyscraper Card */}
        <div
          className={`rounded-3xl bg-gradient-to-b ${cardPalette(secondaryOffer)} border p-5 flex flex-col justify-between min-h-[300px] relative overflow-hidden`}
        >
          <div>
            <div
              className={`flex items-center justify-between text-[9px] font-mono uppercase mb-3 pb-2 border-b ${
                isLight
                  ? 'text-slate-500 border-slate-200'
                  : 'text-slate-400 border-white/10'
              }`}
            >
              <span>Publicidade</span>
              <span
                className={`font-bold ${
                  isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}
              >
                PARCEIRO
              </span>
            </div>

            <span
              className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border mb-2.5 ${
                isLight
                  ? secondaryOffer.lightBadgeClass
                  : 'bg-white/10 border-white/10 text-white'
              }`}
            >
              {secondaryOffer.badge}
            </span>

            <h4
              className={`text-sm font-extrabold leading-snug mb-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {secondaryOffer.title}
            </h4>

            <p
              className={`text-xs leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              {secondaryOffer.tagline}
            </p>
          </div>

          <a
            href={secondaryOffer.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-4 w-full py-2.5 px-3 ${secondaryOffer.buttonColor} text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap`}
          >
            <span>{secondaryOffer.cta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>
    );
  }

  // 5. VIDEO AD FORMAT (Large Widescreen Outstream Video Ad Player for the Generator Left Space)
  if (format === 'video-ad') {
    const videoSlides = [
      {
        badge: 'COMERCIAL EM VÍDEO • MERCADO PAGO POINT SMART 2',
        headline: 'A Maquininha com Impressora Integrada, 4G Grátis e Bateria para 72h',
        subtext:
          'Aceite PIX por QR Code no visor, aproximação (NFC), débito e crédito com recebimento na mesma hora.',
        highlight: 'DESCONTO DE 68% + FRETE GRÁTIS',
        cta: 'Assistir Oferta e Pedir Maquininha',
        url: 'https://www.mercadopago.com.br/point',
        bgGradient: 'from-blue-950 via-[#0d1936] to-emerald-950',
        Icon: CreditCard,
      },
      {
        badge: 'VÍDEO PATROCINADO • AUTOMAÇÃO PARA RESTAURANTES & LOJAS',
        headline: 'Kit Impressora Térmica 80mm + Leitor e Gaveta Automática de Caixa',
        subtext:
          'Imprima todos os pedidos que chegam no WhatsApp e agilize a produção da sua cozinha sem gastar com tinta.',
        highlight: '12X SEM JUROS • ENVIO FULL',
        cta: 'Ver Kit Completo em Vídeo',
        url: 'https://lista.mercadolivre.com.br/kit-automacao-comercial-restaurante',
        bgGradient: 'from-amber-950 via-[#1f160c] to-slate-950',
        Icon: Printer,
      },
      {
        badge: 'DESTAQUE EMPRESARIAL • DISPLAYS ACRÍLICO MESA',
        headline: 'Kit 20 Plaquinhas de Mesa em Acrílico Cristal A6 para QR Code',
        subtext:
          'Deixe suas mesas elegantes e aumente em até 40% os pedidos do seu Cardápio Digital com displays resistentes.',
        highlight: 'OFERTA DIRETO DA FÁBRICA',
        cta: 'Comprar Kit Acrílico com Desconto',
        url: 'https://lista.mercadolivre.com.br/display-acrilico-a6',
        bgGradient: 'from-emerald-950 via-[#0b2420] to-slate-950',
        Icon: Award,
      },
    ];

    const currentVideo = videoSlides[activeSlide];
    const SlideIcon = currentVideo.Icon;

    return (
      <aside
        aria-label="Anúncio em Vídeo Patrocinado"
        className={`w-full mt-6 no-print ${className}`}
      >
        <div className="rounded-3xl bg-[#0e1525] border-2 border-slate-700/90 shadow-2xl overflow-hidden">
          {/* Top Video Header Bar */}
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <Tv className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                Anúncio em Vídeo Patrocinado • HD
              </span>
            </div>

            <div className="flex items-center gap-3">
              {onUpgradeClick && (
                <button
                  type="button"
                  onClick={onUpgradeClick}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline whitespace-nowrap"
                >
                  Remover Anúncios em Vídeo (Ativar PRO {proPriceLabel})
                </button>
              )}
            </div>
          </div>

          {/* Main 16:9 Widescreen Video Viewport */}
          <div
            className={`relative bg-gradient-to-br ${currentVideo.bgGradient} p-6 sm:p-8 min-h-[290px] sm:min-h-[320px] flex flex-col justify-between overflow-hidden transition-all duration-700`}
          >
            {/* Animated Ambient Video Rings */}
            <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full bg-emerald-500/10 blur-2xl animate-pulse pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-72 h-72 rounded-full bg-blue-500/10 blur-2xl animate-pulse pointer-events-none" />

            {/* Top Overlay Badges */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                {currentVideo.badge}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/15 transition"
                  title={isPlaying ? 'Pausar Vídeo' : 'Reproduzir Vídeo'}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/15 transition"
                  title={isMuted ? 'Ativar Som' : 'Silenciar'}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Center Commercial Scene */}
            <div className="relative z-10 my-5 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-8 space-y-2.5 text-left">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                  {currentVideo.highlight}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  {currentVideo.headline}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {currentVideo.subtext}
                </p>
              </div>

              {/* Animated Visual Showcase Card inside Video */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-white/20 flex flex-col items-center justify-center text-white shadow-2xl relative">
                  <SlideIcon className="w-11 h-11 text-emerald-400 mb-1 animate-bounce" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                    Oferta TV
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Video Controls + CTA Bar */}
            <div className="relative z-10 space-y-3">
              {/* Video Timeline Progress Bar */}
              <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-amber-400 h-full transition-all duration-300"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveSlide(idx);
                        setVideoProgress(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        activeSlide === idx
                          ? 'bg-white text-slate-950'
                          : 'bg-black/40 text-slate-300 hover:bg-black/60'
                      }`}
                    >
                      Vídeo {idx + 1}
                    </button>
                  ))}
                  <span className="text-[11px] text-slate-300 ml-1">
                    0:0{Math.floor((videoProgress / 100) * 9)} / 0:10
                  </span>
                </div>

                <a
                  href={currentVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-glow transition flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>{currentVideo.cta}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 6. STICKY FOOTER FORMAT (Floating bottom bar on free pages)
  if (format === 'sticky-footer') {
    return (
      <aside
        aria-label="Anúncio Patrocinado"
        className={`fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-md p-3 sm:p-4 shadow-2xl no-print ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-900'
            : 'bg-[#0e1422]/95 border-slate-700/80'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 truncate">
            <span
              className={`hidden sm:inline-block text-[9px] uppercase font-mono px-2 py-0.5 rounded border ${
                isLight
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Anúncio
            </span>
            <div className="truncate">
              <span
                className={`font-bold mr-1.5 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {offer.title}
              </span>
              <span
                className={`hidden md:inline ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                — {offer.tagline}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3.5 py-1.5 ${offer.buttonColor} text-white rounded-lg font-bold text-xs flex items-center gap-1 whitespace-nowrap`}
            >
              <span>{offer.cta}</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className={`hidden sm:flex items-center gap-1 px-3 py-1.5 border font-bold rounded-lg text-xs transition whitespace-nowrap ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-400'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Remover Ads ({proPriceLabel})</span>
              </button>
            )}

            <button
              onClick={() => setClosed(true)}
              className={`p-1 rounded-lg transition ${
                isLight
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Fechar anúncio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return null;
}
