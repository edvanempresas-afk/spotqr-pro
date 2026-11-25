'use client';

import React from 'react';
import {
  Truck,
  MessageCircle,
  Eye,
  Zap,
  ShieldCheck,
  Store,
  Bike,
  Clock,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { MenuItem } from '@/lib/types';
import { PixDiscountInfo } from '@/lib/merchandising';

interface ShowcaseBuyBoxProps {
  item: MenuItem;
  isPro: boolean;
  isCatalog: boolean;
  allowDelivery: boolean;
  allowPickup: boolean;
  stockCanOrder: boolean;
  stockIsUnique: boolean;
  stockIsLimited: boolean;
  stockMaxQuantity: number;
  prodDays: number;
  pixDiscountInfo: PixDiscountInfo | null;
  acceptedPaymentSummary?: string;
  effectivePriceFormatted?: string;
  storeOpen?: boolean;
  whatsappNumber?: string;
  storeTitle?: string;
  selectedVariantLabel?: string;
  hasPhotos: boolean;
  isLight: boolean;
  layoutMode: 'list' | 'grid_2col';
  onOpenZoom: () => void;
  cartActionControl: React.ReactNode;
}

/**
 * Painel comercial de conversão (Buy Box) para os anúncios PRO:
 * Estrutura equilibrada do topo à base com entrega, vantagem PIX,
 * meios de pagamento reais da loja, resumo da seleção e botão de compra.
 */
export function ShowcaseBuyBox({
  item,
  isPro,
  isCatalog,
  allowDelivery,
  allowPickup,
  stockCanOrder,
  stockIsUnique,
  stockIsLimited,
  stockMaxQuantity,
  prodDays,
  pixDiscountInfo,
  acceptedPaymentSummary,
  effectivePriceFormatted,
  storeOpen = true,
  whatsappNumber,
  storeTitle,
  selectedVariantLabel,
  hasPhotos,
  isLight,
  layoutMode,
  onOpenZoom,
  cartActionControl,
}: ShowcaseBuyBoxProps) {
  const cleanPhone = (whatsappNumber || '').replace(/\D/g, '');
  const questionText = `Olá${storeTitle ? ` *${storeTitle}*` : ''}! Tenho uma dúvida sobre o item *${item.name}*${
    selectedVariantLabel ? ` (${selectedVariantLabel})` : ''
  }. Poderia me ajudar?`;
  const whatsappQuestionUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(questionText)}`
    : null;

  const boxBgClass = isLight
    ? 'bg-slate-50/90 border-slate-200/90'
    : 'bg-slate-900/75 border-slate-800/90';
  const subPanelClass = isLight
    ? 'bg-white border-slate-200/80 text-slate-700'
    : 'bg-slate-950/65 border-slate-800/80 text-slate-300';
  const mutedLineClass = isLight ? 'text-slate-600' : 'text-slate-400';

  if (layoutMode === 'grid_2col') {
    return (
      <div className="space-y-2.5 pt-2 border-t border-slate-700/25">
        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold">
          {isPro && pixDiscountInfo && stockCanOrder && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
              }`}
            >
              <Zap className="w-3 h-3 shrink-0" />
              <span>
                {pixDiscountInfo.pixPriceFormatted} no PIX (-{pixDiscountInfo.percent}%)
              </span>
            </span>
          )}
          {isPro && item.freeShipping && stockCanOrder && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                isLight
                  ? 'bg-teal-50 border-teal-200 text-teal-800'
                  : 'bg-teal-500/15 border-teal-500/35 text-teal-300'
              }`}
            >
              <Truck className="w-3 h-3 shrink-0" />
              <span>Frete Grátis</span>
            </span>
          )}
          {!item.freeShipping && allowDelivery && stockCanOrder && (
            <span className={`inline-flex items-center gap-1 ${mutedLineClass}`}>
              <Bike className="w-3 h-3 shrink-0 opacity-80" />
              <span>{isCatalog ? 'Envio / Entrega' : 'Delivery'}</span>
            </span>
          )}
          {allowPickup && stockCanOrder && (
            <span className={`inline-flex items-center gap-1 ${mutedLineClass}`}>
              <Store className="w-3 h-3 shrink-0 opacity-80" />
              <span>Retira</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {whatsappQuestionUrl && (
            <a
              href={whatsappQuestionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-bold border transition ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-slate-950/70 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
              title="Tirar dúvida rápida sobre este produto no WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dúvida</span>
            </a>
          )}
          <div className="ml-auto">{cartActionControl}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full md:w-64 lg:w-[17rem] shrink-0 rounded-2xl border p-3.5 flex flex-col justify-between gap-3 ${boxBgClass}`}
    >
      {/* Topo: Entrega e Disponibilidade */}
      <div className="space-y-2.5">
        <div className="space-y-1 text-[11px] font-semibold">
          {isPro && item.freeShipping && stockCanOrder && (
            <div
              className={`flex items-center gap-1.5 font-extrabold ${
                isLight ? 'text-teal-700' : 'text-teal-300'
              }`}
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span>Frete Grátis neste item</span>
            </div>
          )}

          {allowDelivery && stockCanOrder && (
            <div className={`flex items-center gap-1.5 ${mutedLineClass}`}>
              <Bike className="w-3.5 h-3.5 shrink-0 opacity-85" />
              <span>{isCatalog ? 'Entrega / Envio rápido' : 'Delivery disponível'}</span>
            </div>
          )}

          {allowPickup && stockCanOrder && (
            <div className={`flex items-center gap-1.5 ${mutedLineClass}`}>
              <Store className="w-3.5 h-3.5 shrink-0 opacity-85" />
              <span>Retirada na loja</span>
            </div>
          )}

          {stockCanOrder && stockIsUnique && (
            <div
              className={`flex items-center gap-1.5 font-bold ${
                isLight ? 'text-purple-700' : 'text-purple-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Peça única exclusiva</span>
            </div>
          )}

          {stockCanOrder && stockIsLimited && (
            <div
              className={`flex items-center gap-1.5 font-bold ${
                isLight ? 'text-amber-700' : 'text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Restam apenas {stockMaxQuantity} un.</span>
            </div>
          )}

          {stockCanOrder && !stockIsUnique && !stockIsLimited && prodDays === 0 && (
            <div
              className={`flex items-center gap-1.5 font-bold ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Estoque disponível • Pronta entrega</span>
            </div>
          )}
        </div>

        {/* Bloco Central da Buy Box: PIX Destaque OU Resumo Real de Pagamento/Seleção */}
        {isPro && pixDiscountInfo && stockCanOrder ? (
          <div
            className={`px-2.5 py-2 rounded-xl border space-y-0.5 ${
              isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-emerald-500/12 border-emerald-500/35 text-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[9.5px] font-black uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Economize no PIX</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950">
                -{pixDiscountInfo.percent}% OFF
              </span>
            </div>
            <div className="text-sm font-black leading-tight text-emerald-400">
              {pixDiscountInfo.pixPriceFormatted} à vista
            </div>
          </div>
        ) : (
          <div className={`px-2.5 py-2 rounded-xl border space-y-1.5 text-[10.5px] ${subPanelClass}`}>
            {(selectedVariantLabel || effectivePriceFormatted) && (
              <div className="flex items-center justify-between gap-1.5 font-bold">
                <span className="truncate opacity-85">
                  {selectedVariantLabel ? `Opção: ${selectedVariantLabel}` : 'Valor unitário'}
                </span>
                {effectivePriceFormatted && (
                  <span className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>
                    {effectivePriceFormatted}
                  </span>
                )}
              </div>
            )}
            {acceptedPaymentSummary && (
              <div className="flex items-start gap-1.5 leading-snug">
                <CreditCard className="w-3 h-3 shrink-0 mt-0.5 opacity-80" />
                <span className="text-[10px] font-semibold opacity-90">
                  {acceptedPaymentSummary}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-85">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>
                {storeOpen
                  ? 'Pedido direto sem taxas'
                  : 'Agende seu pedido'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Base: CTA Principal + Ações Rápidas */}
      <div className="space-y-2 pt-1 border-t border-slate-700/20">
        <div className="flex justify-end md:justify-stretch [&>*]:w-full [&_button.group\/add]:w-full [&_button.group\/add]:justify-center">
          {cartActionControl}
        </div>

        {(whatsappQuestionUrl || hasPhotos) && (
          <div className="flex items-center justify-between gap-1.5">
            {whatsappQuestionUrl && (
              <a
                href={whatsappQuestionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold border transition ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                }`}
                title="Perguntar no WhatsApp sobre este produto"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Tirar Dúvida</span>
              </a>
            )}
            {hasPhotos && (
              <button
                type="button"
                onClick={onOpenZoom}
                className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold border transition ${
                  !whatsappQuestionUrl ? 'flex-1' : ''
                } ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                }`}
                title="Ver todas as fotos ampliadas"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>Ampliar Fotos</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
