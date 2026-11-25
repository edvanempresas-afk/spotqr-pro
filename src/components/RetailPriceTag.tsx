'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import {
  InstallmentDisplayInfo,
  PriceFontOption,
  formatMoneyBR,
} from '@/lib/merchandising';

interface RetailPriceTagProps {
  formattedPrice: string;
  originalPrice?: number;
  discountPct: number | null;
  showSplash: boolean;
  installmentInfo?: InstallmentDisplayInfo | null;
  currency?: string;
  priceScaleClass: string;
  priceFont: PriceFontOption;
  accentTextColor: string;
  isLight: boolean;
  mutedTextClass: string;
}

/**
 * Etiqueta de Preço no padrão do Varejo Brasileiro (Lei de Precificação / CDC):
 * - Quando possui parcelamento: o valor PARCELADO fica em destaque principal
 *   ("de R$ 150,00 por 2x de R$ 62,50 sem juros / com juros"), e logo abaixo
 *   em letras menores verdes aparece o valor total à vista ("ou R$ 125,00 à vista").
 * - Quando `showSplash` está ativo: usa etiqueta amarela de gôndola com a estrela
 *   explosiva vermelha posicionada diretamente encima do canto superior do preço.
 */
export function RetailPriceTag({
  formattedPrice,
  originalPrice,
  discountPct,
  showSplash,
  installmentInfo,
  currency = 'R$',
  priceScaleClass,
  priceFont,
  accentTextColor,
  isLight,
  mutedTextClass,
}: RetailPriceTagProps) {
  const splashHeadline = discountPct ? `-${discountPct}%` : 'OFERTA!';
  const splashSubline = discountPct ? 'OFF' : 'HOJE';
  const hasPromoFromTo = Boolean(discountPct && typeof originalPrice === 'number');
  const greenCashClass = isLight ? 'text-emerald-700' : 'text-emerald-400';

  if (showSplash) {
    return (
      <div className="space-y-1.5 min-w-0 pt-2">
        <div className="relative inline-flex flex-col rounded-2xl border-2 border-rose-600 bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 px-3.5 pt-2 pb-2 pr-14 shadow-[0_6px_18px_rgba(245,158,11,0.35)]">
          {/* Splash Estrela/Explosão de Gôndola encima do canto superior do preço */}
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

          {hasPromoFromTo && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-950/90 leading-none mb-1">
              <span className="line-through opacity-85">
                De {formatMoneyBR(originalPrice!, currency)}
              </span>
              <span className="no-underline font-extrabold">por</span>
            </div>
          )}

          {installmentInfo ? (
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 leading-none">
              <span className="text-sm sm:text-base font-black text-slate-900">
                {installmentInfo.count}x de
              </span>
              <span
                className={`${priceScaleClass} ${priceFont.className} text-slate-950`}
                style={{ fontFamily: priceFont.fontFamily }}
              >
                {installmentInfo.perInstallmentFormatted}
              </span>
              <span
                className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md self-center ${
                  installmentInfo.hasInterest
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-700 text-white'
                }`}
              >
                {installmentInfo.interestSuffix}
              </span>
            </div>
          ) : (
            <span
              className={`${priceScaleClass} ${priceFont.className} text-slate-950`}
              style={{ fontFamily: priceFont.fontFamily }}
            >
              {formattedPrice}
            </span>
          )}
        </div>

        {installmentInfo && (
          <p className={`text-xs font-extrabold flex flex-wrap items-center gap-1.5 ${greenCashClass}`}>
            <CreditCard className="w-3.5 h-3.5 shrink-0 opacity-90" />
            <span>ou {installmentInfo.cashPriceFormatted} à vista</span>
            {installmentInfo.totalCreditFormatted && (
              <span className={`text-[10px] font-semibold ${mutedTextClass}`}>
                (total a prazo {installmentInfo.totalCreditFormatted})
              </span>
            )}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1 min-w-0">
      {hasPromoFromTo && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${mutedTextClass}`}>
          <span className="line-through">
            De {formatMoneyBR(originalPrice!, currency)}
          </span>
          <span>por</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {installmentInfo ? (
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 leading-none">
            <span
              className="text-sm sm:text-base font-extrabold"
              style={{ color: accentTextColor }}
            >
              {installmentInfo.count}x de
            </span>
            <span
              className={`${priceScaleClass} ${priceFont.className}`}
              style={{
                color: accentTextColor,
                fontFamily: priceFont.fontFamily,
              }}
            >
              {installmentInfo.perInstallmentFormatted}
            </span>
            <span
              className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md self-center border ${
                installmentInfo.hasInterest
                  ? isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                  : isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
              }`}
            >
              {installmentInfo.interestSuffix}
            </span>
          </div>
        ) : (
          <span
            className={`${priceScaleClass} ${priceFont.className}`}
            style={{
              color: accentTextColor,
              fontFamily: priceFont.fontFamily,
            }}
          >
            {formattedPrice}
          </span>
        )}

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

      {installmentInfo && (
        <p className={`text-xs font-extrabold flex flex-wrap items-center gap-1.5 ${greenCashClass}`}>
          <CreditCard className="w-3.5 h-3.5 shrink-0 opacity-90" />
          <span>ou {installmentInfo.cashPriceFormatted} à vista</span>
          {installmentInfo.totalCreditFormatted && (
            <span className={`text-[10px] font-semibold ${mutedTextClass}`}>
              (total a prazo {installmentInfo.totalCreditFormatted})
            </span>
          )}
        </p>
      )}
    </div>
  );
}
