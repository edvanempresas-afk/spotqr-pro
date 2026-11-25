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
 * Etiqueta de Preço compacta no padrão do Varejo Brasileiro (Lei de Precificação / CDC):
 * - Com parcelamento: destaque principal em "2x de R$ 62,50" com "sem/com juros" logo abaixo,
 *   e o valor cheio à vista em verde abaixo do bloco ("ou R$ 125,00 à vista").
 * - Com `showSplash`: quadro compacto de gôndola com a estrela "-XX% OFF" colada próxima ao preço.
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
      <div className="space-y-1 min-w-0 pt-2.5">
        <div className="relative inline-flex flex-col items-start rounded-xl border-2 border-rose-600 bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 px-3 pt-1.5 pb-1.5 pr-8 shadow-[0_5px_14px_rgba(245,158,11,0.35)]">
          {/* Splash Estrela/Explosão de Gôndola bem próximo ao canto superior do preço */}
          <div
            className="price-gondola-splash-star pointer-events-none absolute -top-4 -right-4 w-13 h-12 flex items-center justify-center z-10 drop-shadow-[0_3px_6px_rgba(225,29,72,0.55)]"
            style={{ width: '3.25rem', height: '2.9rem' }}
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
              <span className="text-[11px] font-black tracking-tight">
                {splashHeadline}
              </span>
              <span className="text-[6.5px] font-black uppercase tracking-wider text-yellow-200">
                {splashSubline}
              </span>
            </div>
          </div>

          {hasPromoFromTo && (
            <div className="flex items-center gap-1 text-[10.5px] font-bold text-rose-950/90 leading-tight mb-0.5 pr-3">
              <span className="line-through opacity-85">
                De {formatMoneyBR(originalPrice!, currency)}
              </span>
              <span className="font-extrabold">por</span>
            </div>
          )}

          {installmentInfo ? (
            <>
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-xs sm:text-sm font-black text-slate-900 whitespace-nowrap">
                  {installmentInfo.count}x de
                </span>
                <span
                  className={`${priceScaleClass} ${priceFont.className} text-slate-950 whitespace-nowrap`}
                  style={{ fontFamily: priceFont.fontFamily }}
                >
                  {installmentInfo.perInstallmentFormatted}
                </span>
              </div>
              {installmentInfo.interestSuffix && (
                <span
                  className={`mt-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded leading-none ${
                    installmentInfo.hasInterest
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  {installmentInfo.interestSuffix}
                </span>
              )}
            </>
          ) : (
            <span
              className={`${priceScaleClass} ${priceFont.className} text-slate-950 whitespace-nowrap`}
              style={{ fontFamily: priceFont.fontFamily }}
            >
              {formattedPrice}
            </span>
          )}
        </div>

        {installmentInfo && (
          <p className={`text-[11px] font-extrabold flex flex-wrap items-center gap-1 ${greenCashClass}`}>
            <CreditCard className="w-3 h-3 shrink-0 opacity-90" />
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

      <div className="flex flex-wrap items-start gap-2">
        {installmentInfo ? (
          <div className="inline-flex flex-col items-start gap-1">
            <div className="flex items-baseline gap-1 leading-none">
              <span
                className="text-xs sm:text-sm font-extrabold whitespace-nowrap"
                style={{ color: accentTextColor }}
              >
                {installmentInfo.count}x de
              </span>
              <span
                className={`${priceScaleClass} ${priceFont.className} whitespace-nowrap`}
                style={{
                  color: accentTextColor,
                  fontFamily: priceFont.fontFamily,
                }}
              >
                {installmentInfo.perInstallmentFormatted}
              </span>
            </div>
            {installmentInfo.interestSuffix && (
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded leading-none border ${
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
            )}
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
            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border self-center ${
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
        <p className={`text-[11px] font-extrabold flex flex-wrap items-center gap-1 ${greenCashClass}`}>
          <CreditCard className="w-3 h-3 shrink-0 opacity-90" />
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
