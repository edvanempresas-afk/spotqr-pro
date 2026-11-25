'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import { PriceFontOption, formatMoneyBR } from '@/lib/merchandising';

interface RetailPriceTagProps {
  formattedPrice: string;
  originalPrice?: number;
  discountPct: number | null;
  showSplash: boolean;
  installmentLabel?: string | null;
  currency?: string;
  priceScaleClass: string;
  priceFont: PriceFontOption;
  accentTextColor: string;
  isLight: boolean;
  mutedTextClass: string;
}

/**
 * Etiqueta de Preço estilo Varejo / Gôndola de Loja:
 * Quando `showSplash` está ativo no Plano PRO, exibe uma explosão (splash)
 * pontiaguda de oferta posicionada DIRETAMENTE ACIMA/SOBRE o bloco do preço,
 * como nas placas e cartazes de gôndola.
 */
export function RetailPriceTag({
  formattedPrice,
  originalPrice,
  discountPct,
  showSplash,
  installmentLabel,
  currency = 'R$',
  priceScaleClass,
  priceFont,
  accentTextColor,
  isLight,
  mutedTextClass,
}: RetailPriceTagProps) {
  const splashHeadline = discountPct ? `-${discountPct}%` : 'OFERTA!';
  const splashSubline = discountPct ? 'OFF' : 'HOJE';

  if (showSplash) {
    return (
      <div className="space-y-1.5 min-w-0 pt-2">
        <div className="relative inline-flex flex-col rounded-2xl border-2 border-rose-600 bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 px-3.5 pt-2.5 pb-1.5 pr-12 shadow-[0_6px_18px_rgba(245,158,11,0.35)]">
          {/* Splash Estrela/Explosão de Gôndola colada ENCIMA do canto superior do preço */}
          <div
            className="price-gondola-splash-star pointer-events-none absolute -top-4 -right-4 w-16 h-14 flex items-center justify-center z-10 drop-shadow-[0_4px_8px_rgba(225,29,72,0.55)]"
            aria-hidden="true"
          >
            <svg viewBox="0 0 120 100" className="w-full h-full">
              <polygon
                points="60,2 72,20 93,10 90,32 114,34 99,52 116,69 92,74 96,95 72,83 59,98 47,82 24,94 28,72 5,68 21,50 6,32 30,30 27,9 48,20"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-white rotate-[4deg]">
              <span className="text-[12px] font-black tracking-tight">
                {splashHeadline}
              </span>
              <span className="text-[7.5px] font-black uppercase tracking-wider text-yellow-200">
                {splashSubline}
              </span>
            </div>
          </div>

          {discountPct && typeof originalPrice === 'number' && (
            <span className="text-[11px] font-bold line-through text-rose-900/85 leading-none mb-0.5">
              De {formatMoneyBR(originalPrice, currency)}
            </span>
          )}

          <span
            className={`${priceScaleClass} ${priceFont.className} text-slate-950`}
            style={{ fontFamily: priceFont.fontFamily }}
          >
            {formattedPrice}
          </span>
        </div>

        {installmentLabel && (
          <p
            className={`text-[11px] font-bold flex items-center gap-1 ${
              isLight ? 'text-emerald-700' : 'text-emerald-300'
            }`}
          >
            <CreditCard className="w-3 h-3 shrink-0 opacity-85" />
            <span>{installmentLabel}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-0.5 min-w-0">
      {discountPct && typeof originalPrice === 'number' && (
        <span className={`text-xs line-through font-semibold block ${mutedTextClass}`}>
          De {formatMoneyBR(originalPrice, currency)}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`${priceScaleClass} ${priceFont.className}`}
          style={{
            color: accentTextColor,
            fontFamily: priceFont.fontFamily,
          }}
        >
          {formattedPrice}
        </span>
        {discountPct && (
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
              isLight
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
            }`}
          >
            -{discountPct}% OFF
          </span>
        )}
      </div>
      {installmentLabel && (
        <p
          className={`text-[11px] font-bold flex items-center gap-1 ${
            isLight ? 'text-emerald-700' : 'text-emerald-300'
          }`}
        >
          <CreditCard className="w-3 h-3 shrink-0 opacity-85" />
          <span>{installmentLabel}</span>
        </p>
      )}
    </div>
  );
}
