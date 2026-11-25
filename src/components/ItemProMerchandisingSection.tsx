'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  Zap,
  CreditCard,
  Layers,
  Plus,
  Trash2,
  Flame,
  Upload,
  Image as ImageIcon,
  X,
  Truck,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import '../app/merchandising.css';
import {
  InstallmentsInterestMode,
  MenuItem,
  MenuItemVariant,
  PromoVisualEffect,
} from '../lib/types';
import {
  PROMO_EFFECT_OPTIONS,
  TRUST_HIGHLIGHT_SUGGESTIONS,
  buildVariantPreset,
  calculateDiscountPercent,
  calculatePixDiscountInfo,
  formatInstallmentLabel,
  formatMoneyBR,
  resolveEffectiveInterestMode,
  resolveInstallmentInfo,
  resolvePriceFontOption,
  resolveVariantEffectivePrice,
} from '../lib/merchandising';
import { compressImageFileToDataUrl } from '../lib/image-upload';
import { ChristmasCardDecor } from './ChristmasCardDecor';
import { RetailPriceTag } from './RetailPriceTag';

export interface CreditCardInstallmentNoticeProps {
  mpAffiliatePointUrl?: string;
  onEnableCreditCard?: () => void;
  compact?: boolean;
  headline?: string;
  description?: string;
}

/**
 * Shared aviso informing merchants that installment pricing is restricted to
 * stores accepting Credit Card, offering 1-click activation and optional Mercado Pago Point link.
 */
export function CreditCardInstallmentNotice({
  mpAffiliatePointUrl = 'https://www.mercadopago.com.br/point',
  onEnableCreditCard,
  compact = false,
  headline = 'Aviso: Parcelamento exige pagamento em Cartão de Crédito',
  description = 'Você só pode criar preços parcelados (ex.: 2x, 6x, 12x) se aceitar pagamentos em Cartão de Crédito. Se você ainda não tem maquininha para aceitar cartão, oferecemos nosso link de indicação do Mercado Pago abaixo caso queira adquirir uma.',
}: CreditCardInstallmentNoticeProps) {
  const safeMpUrl = mpAffiliatePointUrl || 'https://www.mercadopago.com.br/point';
  return (
    <div
      className={`rounded-xl border border-amber-500/40 bg-amber-950/30 ${
        compact ? 'p-2.5 space-y-2' : 'p-3 space-y-2.5'
      }`}
    >
      <div className="flex items-start gap-2">
        <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 min-w-0">
          <span
            className={`font-extrabold text-amber-200 block leading-snug ${
              compact ? 'text-[11px]' : 'text-xs'
            }`}
          >
            {headline}
          </span>
          <p
            className={`text-slate-200/90 leading-relaxed ${
              compact ? 'text-[10px]' : 'text-[11px]'
            }`}
          >
            {description}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {onEnableCreditCard && (
          <button
            type="button"
            onClick={onEnableCreditCard}
            className={`inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold transition shadow-sm ${
              compact ? 'px-2.5 py-1 text-[10.5px]' : 'px-3 py-1.5 text-[11px]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>
              {compact
                ? 'Ativar Cartão de Crédito'
                : 'Já aceito Cartão — Ativar e Liberar Parcelas'}
            </span>
          </button>
        )}

        <a
          href={safeMpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/45 text-sky-200 font-bold transition ${
            compact ? 'px-2.5 py-1 text-[10.5px]' : 'px-3 py-1.5 text-[11px]'
          }`}
        >
          <span>
            💳{' '}
            {compact
              ? 'Não tem maquininha? Adquirir Mercado Pago (Opcional)'
              : 'Não tem maquininha? Adquirir Mercado Pago (Link de Indicação)'}
          </span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      </div>
    </div>
  );
}

interface ItemProMerchandisingSectionProps {
  item: MenuItem;
  currency?: string;
  isPro: boolean;
  acceptsCreditCard?: boolean;
  mpAffiliatePointUrl?: string;
  onEnableCreditCard?: () => void;
  onUpdateItem: (patch: Partial<MenuItem>) => void;
}

export function ItemProMerchandisingSection({
  item,
  currency = 'R$',
  isPro,
  acceptsCreditCard = true,
  mpAffiliatePointUrl = 'https://www.mercadopago.com.br/point',
  onEnableCreditCard,
  onUpdateItem,
}: ItemProMerchandisingSectionProps) {
  const hasAnyActiveProMerchandising = Boolean(
    (typeof item.originalPrice === 'number' && item.originalPrice > 0) ||
      (item.promoEffect && item.promoEffect !== 'none') ||
      item.showPriceSplash ||
      (typeof item.maxInstallments === 'number' && item.maxInstallments >= 2) ||
      (typeof item.pixDiscountPercent === 'number' && item.pixDiscountPercent >= 1) ||
      item.freeShipping ||
      (Array.isArray(item.trustHighlights) && item.trustHighlights.length > 0) ||
      (Array.isArray(item.variants) && item.variants.length > 0)
  );

  const [expanded, setExpanded] = useState<boolean>(false);
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);
  const [newHighlightInput, setNewHighlightInput] = useState<string>('');

  const variants = item.variants || [];
  const activeEffect: PromoVisualEffect = item.promoEffect || 'none';
  const discountPct = calculateDiscountPercent(
    Number(item.price) || 0,
    item.originalPrice
  );
  const effectiveSamplePrice = resolveVariantEffectivePrice(item, variants[0]);
  const resolvedInterestMode = resolveEffectiveInterestMode(
    item.installmentsInterestMode,
    item.installmentsHasInterest
  );
  const isCardAccepted = Boolean(acceptsCreditCard);
  const installmentInfo = isCardAccepted
    ? resolveInstallmentInfo(
        effectiveSamplePrice,
        item.maxInstallments,
        item.installmentsHasInterest,
        item.customInstallmentAmount,
        currency,
        resolvedInterestMode
      )
    : null;
  const installmentPreview = isCardAccepted
    ? formatInstallmentLabel(
        effectiveSamplePrice,
        item.maxInstallments,
        currency,
        item.installmentsHasInterest,
        item.customInstallmentAmount,
        resolvedInterestMode
      )
    : null;
  const pixDiscountPreview = calculatePixDiscountInfo(
    effectiveSamplePrice,
    item.pixDiscountPercent,
    currency
  );
  const activeHighlights = item.trustHighlights || [];

  const handleToggleHighlight = (label: string) => {
    const clean = label.trim().slice(0, 42);
    if (!clean) return;
    if (activeHighlights.includes(clean)) {
      const next = activeHighlights.filter((h) => h !== clean);
      onUpdateItem({ trustHighlights: next.length > 0 ? next : undefined });
      return;
    }
    if (activeHighlights.length >= 4) return;
    onUpdateItem({ trustHighlights: [...activeHighlights, clean] });
  };

  // Deduplicated photos configured on this product (main + galleryImages) so owner can bind to variations
  const itemCandidatePhotos = Array.from(
    new Set(
      [item.imageUrl, ...(item.galleryImages || [])]
        .map((u) => (typeof u === 'string' ? u.trim() : ''))
        .filter(Boolean)
    )
  );

  const handleAddVariant = () => {
    const next: MenuItemVariant = {
      id: `var-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      label: '',
      groupLabel: item.variantGroupTitle || 'Opção',
      isAvailable: true,
    };
    onUpdateItem({
      variantGroupTitle: item.variantGroupTitle || 'Voltagem / Cor',
      variants: [...variants, next],
    });
  };

  const handleApplyPreset = (
    preset: 'voltage_br' | 'colors_basic' | 'sizes_clothes' | 'storage_tech'
  ) => {
    const built = buildVariantPreset(preset);
    onUpdateItem({
      variantGroupTitle: built.groupTitle,
      variants: built.variants,
    });
  };

  const handleUpdateVariant = (
    variantId: string,
    patch: Partial<MenuItemVariant>
  ) => {
    onUpdateItem({
      variants: variants.map((v) => (v.id === variantId ? { ...v, ...patch } : v)),
    });
  };

  const handleRemoveVariant = (variantId: string) => {
    const next = variants.filter((v) => v.id !== variantId);
    onUpdateItem({
      variants: next,
      ...(next.length === 0 ? { variantGroupTitle: undefined } : {}),
    });
  };

  const handleVariantPhotoUpload = async (
    variantId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingVariantId(variantId);
    try {
      const compressed = await compressImageFileToDataUrl(file, 'product');
      handleUpdateVariant(variantId, { imageUrl: compressed });
    } catch {
      // Ignore invalid upload file silently
    } finally {
      setUploadingVariantId(null);
    }
  };

  if (!isPro) {
    return (
      <div className="sm:col-span-3 p-3 rounded-2xl bg-slate-950/60 border border-amber-500/25 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-200">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Destaques Neon/Natal, Splash no Preço, Parcelas &amp; Variações (110V/220V)</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-300">
            <Lock className="w-2.5 h-2.5" />
            Exclusivo PRO
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          No <strong className="text-amber-300">Plano PRO</strong> você ativa bordas{' '}
          <span className="text-emerald-300 font-semibold">Neon Pulsante</span>,{' '}
          <span className="text-rose-300 font-semibold">🎄 Pisca-Pisca Natalino com LEDs e Sinos</span>,{' '}
          <span className="text-orange-300 font-semibold">💥 Splash de Gôndola</span>,{' '}
          <span className="text-sky-300 font-semibold">Parcelamento sem juros</span> e vende{' '}
          <span className="text-white font-semibold">110V / 220V e Cores com Foto Própria</span> no mesmo anúncio!
        </p>
      </div>
    );
  }

  return (
    <div className="sm:col-span-3 rounded-2xl bg-slate-950/75 border border-emerald-500/25 overflow-visible">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-slate-900/60 transition rounded-2xl"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-extrabold text-white">
            Destaques PRO: Promoção, Parcelas &amp; Variações (110V/220V, Cores com Foto)
          </span>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
            PRO Ativo
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {(hasAnyActiveProMerchandising || !isCardAccepted) && (
            <div className="flex flex-wrap items-center gap-1">
              {activeEffect !== 'none' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/35 text-violet-200">
                  {PROMO_EFFECT_OPTIONS.find((e) => e.id === activeEffect)?.badgeText}
                </span>
              )}
              {discountPct && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/35 text-rose-200">
                  -{discountPct}%
                </span>
              )}
              {item.showPriceSplash && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/35 text-amber-200">
                  💥 Splash Gôndola
                </span>
              )}
              {item.maxInstallments && item.maxInstallments >= 2 ? (
                isCardAccepted ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/35 text-sky-200">
                    {item.maxInstallments}x
                    {resolvedInterestMode === 'with_interest'
                      ? ' c/ juros'
                      : resolvedInterestMode === 'no_interest'
                      ? ' s/ juros'
                      : ''}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/45 text-amber-200">
                    🔒 {item.maxInstallments}x bloqueado (sem Cartão)
                  </span>
                )
              ) : (
                !isCardAccepted && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-200">
                    🔒 Parcelas exigem Cartão
                  </span>
                )
              )}
              {pixDiscountPreview && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/35 text-emerald-200">
                  ⚡ -{pixDiscountPreview.percent}% PIX
                </span>
              )}
              {item.freeShipping && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/35 text-teal-200">
                  🚚 Frete Grátis
                </span>
              )}
              {variants.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/35 text-emerald-200">
                  {variants.length} var.
                </span>
              )}
            </div>
          )}
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1 pl-1">
            <span>{expanded ? 'Recolher' : 'Configurar'}</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-800/80 space-y-4">
          {/* 1. DESTAQUE PROMOCIONAL, PRECO "DE / POR", SPLASH DE GONDOLA E BORDAS */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5 className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Destaque Promocional, Splash de Gôndola &amp; Borda Natalina/Neon</span>
              </h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Preço Anterior &quot;De:&quot; ({currency}) — Opcional:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 150,00 (gera desconto % automático)"
                    value={
                      typeof item.originalPrice === 'number' &&
                      item.originalPrice > 0
                        ? item.originalPrice
                        : ''
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(',', '.').trim();
                      if (!raw) {
                        onUpdateItem({ originalPrice: undefined });
                        return;
                      }
                      const parsed = parseFloat(raw);
                      const valid = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
                      const becameDiscount =
                        Boolean(valid && valid > (Number(item.price) || 0)) &&
                        !item.originalPrice;
                      onUpdateItem({
                        originalPrice: valid,
                        ...(becameDiscount ? { showPriceSplash: true } : {}),
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 focus:border-orange-400 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {discountPct
                      ? `Economia automática de ${discountPct}% calculada sobre o valor anterior.`
                      : 'Preencha um valor maior que o preço atual para ativar o -XX% OFF.'}
                  </p>
                </div>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-orange-500/40 cursor-pointer select-none transition">
                  <input
                    type="checkbox"
                    checked={Boolean(item.showPriceSplash)}
                    onChange={(e) =>
                      onUpdateItem({ showPriceSplash: e.target.checked })
                    }
                    className="w-4 h-4 mt-0.5 rounded text-orange-500"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-orange-200 block">
                      💥 Etiqueta Splash de Gôndola encima do Preço
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight block">
                      Coloca etiqueta amarela estilizada com explosão vermelha (&quot;-17% OFF&quot; / &quot;OFERTA&quot;) direto sobre o preço!
                    </span>
                  </div>
                </label>
              </div>

              {/* Prévia Ao Vivo da Etiqueta / Splash encima do Preço */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col items-start justify-center gap-2">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                  Prévia do Preço na Vitrine:
                </span>
                <RetailPriceTag
                  formattedPrice={formatMoneyBR(
                    effectiveSamplePrice,
                    currency
                  )}
                  originalPrice={item.originalPrice}
                  discountPct={discountPct}
                  showSplash={Boolean(item.showPriceSplash)}
                  installmentInfo={installmentInfo}
                  currency={currency}
                  priceScaleClass="text-xl leading-none"
                  priceFont={resolvePriceFontOption('modern')}
                  accentTextColor="#34d399"
                  isLight={false}
                  mutedTextClass="text-slate-400"
                />
                {!isCardAccepted && (
                  <CreditCardInstallmentNotice
                    compact
                    mpAffiliatePointUrl={mpAffiliatePointUrl}
                    onEnableCreditCard={onEnableCreditCard}
                    headline="Prévia à vista: parcelamento bloqueado sem Cartão de Crédito"
                    description="Você só pode criar preços parcelados se aceitar Cartão de Crédito. Se ainda não tem maquininha, use nosso link do Mercado Pago (opcional)."
                  />
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">
                Borda Especial ao Redor do Quadrado do Item:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {PROMO_EFFECT_OPTIONS.map((opt) => {
                  const isSelected = activeEffect === opt.id;
                  const previewFrameClass =
                    opt.id === 'neon' && isSelected
                      ? 'promo-card-neon bg-emerald-950/40 border-emerald-400'
                      : opt.id === 'christmas' && isSelected
                      ? 'promo-card-christmas bg-emerald-950/35 border-emerald-500'
                      : opt.id === 'flash_gold' && isSelected
                      ? 'promo-card-flash-gold bg-amber-950/35 border-amber-400'
                      : isSelected
                      ? 'bg-slate-800 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-300';

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateItem({ promoEffect: opt.id })}
                      className={`relative overflow-visible p-3 rounded-xl border text-left transition ${previewFrameClass}`}
                    >
                      {opt.id === 'christmas' && isSelected && (
                        <ChristmasCardDecor compact />
                      )}
                      <span className="text-[11px] font-extrabold text-white block relative z-20">
                        {opt.badgeText}
                      </span>
                      <span className="text-[9.5px] text-slate-400 leading-tight block mt-0.5 relative z-20">
                        {opt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. PARCELAMENTO (OBRIGATORIO ACEITAR CARTAO DE CREDITO) */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5 className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                <span>Parcelamento no Cartão de Crédito (Itens de Maior Valor)</span>
              </h5>
              {!isCardAccepted ? (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/45 text-amber-200">
                  🔒 Exige Cartão de Crédito ativo
                </span>
              ) : (
                installmentPreview && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/35 text-sky-300">
                    {installmentPreview} • À vista {formatMoneyBR(effectiveSamplePrice, currency)}
                  </span>
                )
              )}
            </div>

            {!isCardAccepted ? (
              <CreditCardInstallmentNotice
                mpAffiliatePointUrl={mpAffiliatePointUrl}
                onEnableCreditCard={onEnableCreditCard}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-1.5">
              {[0, 2, 3, 6, 10, 12].map((parc) => {
                const currentParc = item.maxInstallments || 0;
                const isSelected =
                  parc === 0 ? currentParc < 2 : currentParc === parc;
                return (
                  <button
                    key={parc}
                    type="button"
                    onClick={() =>
                      onUpdateItem({ maxInstallments: parc === 0 ? undefined : parc })
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {parc === 0 ? 'Não exibir' : `${parc}x`}
                  </button>
                );
              })}

              <div className="flex items-center gap-1.5 ml-auto bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1">
                <span className="text-[10px] text-slate-400 font-semibold">
                  Outro (até 24x):
                </span>
                <input
                  type="number"
                  min={2}
                  max={24}
                  step={1}
                  placeholder="Ex: 18"
                  value={
                    typeof item.maxInstallments === 'number' &&
                    item.maxInstallments >= 2
                      ? item.maxInstallments
                      : ''
                  }
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (!raw) {
                      onUpdateItem({ maxInstallments: undefined });
                      return;
                    }
                    const parsed = parseInt(raw, 10);
                    onUpdateItem({
                      maxInstallments:
                        Number.isNaN(parsed) || parsed < 2
                          ? undefined
                          : Math.min(24, parsed),
                    });
                  }}
                  className="w-12 bg-transparent text-xs font-extrabold text-sky-300 outline-none text-center"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/70 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                  Texto sobre Juros:
                </span>
                {(
                  [
                    {
                      id: 'no_interest' as InstallmentsInterestMode,
                      label: '✅ Mostrar "Sem juros"',
                      activeClass: 'bg-emerald-500/20 border-emerald-400 text-emerald-200',
                    },
                    {
                      id: 'with_interest' as InstallmentsInterestMode,
                      label: '📈 Mostrar "Com juros"',
                      activeClass: 'bg-rose-500/20 border-rose-400 text-rose-200',
                    },
                    {
                      id: 'hide' as InstallmentsInterestMode,
                      label: '🙈 Não mostrar (só valor da parcela)',
                      activeClass: 'bg-sky-500/20 border-sky-400 text-sky-200',
                    },
                  ]
                ).map((modeOpt) => {
                  const isModeActive = resolvedInterestMode === modeOpt.id;
                  return (
                    <button
                      key={modeOpt.id}
                      type="button"
                      onClick={() =>
                        onUpdateItem({
                          installmentsInterestMode: modeOpt.id,
                          installmentsHasInterest: modeOpt.id === 'with_interest',
                          ...(modeOpt.id !== 'with_interest'
                            ? { customInstallmentAmount: undefined }
                            : {}),
                          ...(!item.maxInstallments || item.maxInstallments < 2
                            ? { maxInstallments: 2 }
                            : {}),
                        })
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                        isModeActive
                          ? modeOpt.activeClass
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {modeOpt.label}
                    </button>
                  );
                })}
              </div>

              {typeof item.maxInstallments === 'number' &&
                item.maxInstallments >= 2 &&
                resolvedInterestMode === 'with_interest' && (
                  <div className="flex flex-wrap items-center gap-2 bg-slate-950 border border-rose-500/35 rounded-xl px-3 py-2">
                    <span className="text-[10.5px] text-rose-200 font-semibold">
                      Valor exato da parcela com juros ({currency}, opcional):
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={
                        effectiveSamplePrice > 0
                          ? (effectiveSamplePrice / item.maxInstallments)
                              .toFixed(2)
                              .replace('.', ',')
                          : 'Auto'
                      }
                      value={
                        typeof item.customInstallmentAmount === 'number' &&
                        item.customInstallmentAmount > 0
                          ? item.customInstallmentAmount
                          : ''
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(',', '.').trim();
                        if (!raw) {
                          onUpdateItem({ customInstallmentAmount: undefined });
                          return;
                        }
                        const parsed = parseFloat(raw);
                        onUpdateItem({
                          customInstallmentAmount:
                            Number.isFinite(parsed) && parsed > 0
                              ? parsed
                              : undefined,
                        });
                      }}
                      title="Informe o valor exato de cada parcela com juros (ou deixe vazio para divisão padrão)"
                      className="w-24 ml-auto bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-extrabold text-rose-200 outline-none text-right"
                    />
                  </div>
                )}
            </div>
              </>
            )}
          </div>

          {/* 3. VARIACOES NO MESMO ANUNCIO COM FOTO ATRELADA */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Variações no Mesmo Anúncio + Foto por Cor/Opção</span>
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Venda Voltagem (110V/220V), Cores ou Tamanhos no mesmo card e vincule uma foto própria para trocar a imagem quando o cliente clicar na opção!
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-extrabold transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Opção</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 mr-1">
                Atalhos prontos:
              </span>
              <button
                type="button"
                onClick={() => handleApplyPreset('voltage_br')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-amber-300 transition"
              >
                <Zap className="w-3 h-3" />
                <span>Voltagem 110V / 220V</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('colors_basic')}
                className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-sky-300 transition"
              >
                🎨 Cores (Preto / Branco / Azul)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('sizes_clothes')}
                className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-purple-300 transition"
              >
                👕 Tamanhos P / M / G / GG
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('storage_tech')}
                className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-emerald-300 transition"
              >
                💾 128GB / 256GB
              </button>
            </div>

            {variants.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Rótulo do Seletor na Vitrine (ex: Voltagem, Cor, Modelo):
                  </label>
                  <input
                    type="text"
                    value={item.variantGroupTitle || ''}
                    onChange={(e) =>
                      onUpdateItem({ variantGroupTitle: e.target.value })
                    }
                    placeholder="Ex: Voltagem ou Cor"
                    className="w-full sm:w-72 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:border-emerald-400 outline-none"
                  />
                </div>

                <div className="space-y-2.5">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2"
                    >
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <input
                          type="color"
                          value={variant.colorHex || '#10b981'}
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, {
                              colorHex: e.target.value,
                            })
                          }
                          title="Cor da bolinha desta opção"
                          className="w-7 h-7 rounded-lg bg-transparent border border-slate-700 p-0.5 cursor-pointer shrink-0"
                        />
                        {variant.colorHex && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateVariant(variant.id, {
                                colorHex: undefined,
                              })
                            }
                            title="Remover bolinha de cor"
                            className="text-[9px] font-bold text-slate-500 hover:text-slate-300 px-1"
                          >
                            sem cor
                          </button>
                        )}

                        <input
                          type="text"
                          value={variant.label}
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, {
                              label: e.target.value,
                            })
                          }
                          placeholder="Ex: 220V ou Preto Fosco"
                          className="flex-1 min-w-[120px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:border-emerald-400 outline-none"
                        />

                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 shrink-0">
                          <span className="text-[10px] font-semibold text-slate-400">
                            {currency}:
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Igual base"
                            value={
                              typeof variant.price === 'number' && variant.price > 0
                                ? variant.price
                                : ''
                            }
                            onChange={(e) => {
                              const raw = e.target.value.replace(',', '.').trim();
                              if (!raw) {
                                handleUpdateVariant(variant.id, {
                                  price: undefined,
                                });
                                return;
                              }
                              const parsed = parseFloat(raw);
                              handleUpdateVariant(variant.id, {
                                price:
                                  Number.isFinite(parsed) && parsed > 0
                                    ? parsed
                                    : undefined,
                              });
                            }}
                            title="Deixe vazio para manter o mesmo preço do produto principal"
                            className="w-20 bg-transparent text-xs font-bold text-emerald-300 outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateVariant(variant.id, {
                              isAvailable: variant.isAvailable === false,
                            })
                          }
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition shrink-0 ${
                            variant.isAvailable !== false
                              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                              : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                          }`}
                        >
                          {variant.isAvailable !== false ? 'Ativo' : 'Indisp.'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition shrink-0"
                          title="Excluir variação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Foto vinculada a esta variação (upload direto ou atrelada às fotos adicionais) */}
                      <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-800/70">
                        <div className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
                          {variant.imageUrl ? (
                            <img
                              src={variant.imageUrl}
                              alt={variant.label || 'Variação'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-600" />
                          )}
                        </div>

                        <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-emerald-300 cursor-pointer transition shrink-0">
                          <Upload className="w-3 h-3" />
                          <span>
                            {uploadingVariantId === variant.id
                              ? 'Enviando...'
                              : variant.imageUrl
                              ? 'Trocar Foto'
                              : 'Foto da Opção'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleVariantPhotoUpload(variant.id, e)
                            }
                            className="hidden"
                          />
                        </label>

                        {variant.imageUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateVariant(variant.id, {
                                imageUrl: undefined,
                              })
                            }
                            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[10px] font-bold text-rose-300 transition shrink-0"
                            title="Remover foto desta variação"
                          >
                            <X className="w-3 h-3" />
                            <span>Desvincular</span>
                          </button>
                        )}

                        {itemCandidatePhotos.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                            <span className="text-[9.5px] font-semibold text-slate-400">
                              Ou atrele às fotos já cadastradas:
                            </span>
                            {itemCandidatePhotos.map((photoUrl, pIdx) => {
                              const isLinked = variant.imageUrl === photoUrl;
                              return (
                                <button
                                  key={`${variant.id}-cand-${pIdx}`}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateVariant(variant.id, {
                                      imageUrl: isLinked ? undefined : photoUrl,
                                    })
                                  }
                                  title={
                                    isLinked
                                      ? 'Foto vinculada a esta opção (clique para desvincular)'
                                      : `Vincular Foto ${pIdx === 0 ? 'Principal' : `#${pIdx + 1}`}`
                                  }
                                  className={`relative w-8 h-8 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                                    isLinked
                                      ? 'border-emerald-400 ring-2 ring-emerald-400/40 scale-105'
                                      : 'border-slate-700 opacity-75 hover:opacity-100 hover:border-slate-500'
                                  }`}
                                >
                                  <img
                                    src={photoUrl}
                                    alt={`Foto ${pIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-0 right-0 px-0.5 bg-black/75 text-[7px] font-black text-white">
                                    {pIdx === 0 ? '1ª' : `#${pIdx + 1}`}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. BUY BOX COMERCIAL: DESCONTO NO PIX, FRETE GRATIS & BENEFICIOS */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buy Box Comercial, Desconto no PIX &amp; Benefícios do Anúncio</span>
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Preenche o painel de compra com gatilhos reais (desconto extra no PIX aplicado no checkout, frete grátis e selos de confiança).
                </p>
              </div>
              {pixDiscountPreview && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                  ⚡ PIX: {pixDiscountPreview.pixPriceFormatted} (-{pixDiscountPreview.percent}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Desconto no PIX */}
              <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Desconto Extra Pagando no PIX (à vista):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[0, 5, 10, 15].map((pct) => {
                    const current = item.pixDiscountPercent || 0;
                    const selected = pct === 0 ? current < 1 : current === pct;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() =>
                          onUpdateItem({
                            pixDiscountPercent: pct === 0 ? undefined : pct,
                          })
                        }
                        className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border transition ${
                          selected
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {pct === 0 ? 'Sem desc.' : `${pct}% OFF`}
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 ml-auto">
                    <input
                      type="number"
                      min={1}
                      max={70}
                      step={1}
                      placeholder="%"
                      value={
                        typeof item.pixDiscountPercent === 'number' &&
                        item.pixDiscountPercent >= 1
                          ? item.pixDiscountPercent
                          : ''
                      }
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) {
                          onUpdateItem({ pixDiscountPercent: undefined });
                          return;
                        }
                        const parsed = parseInt(raw, 10);
                        onUpdateItem({
                          pixDiscountPercent:
                            Number.isNaN(parsed) || parsed < 1
                              ? undefined
                              : Math.min(70, parsed),
                        });
                      }}
                      className="w-10 bg-transparent text-xs font-extrabold text-emerald-300 outline-none text-center"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">%</span>
                  </div>
                </div>
                {pixDiscountPreview && (
                  <p className="text-[10px] font-semibold text-emerald-300">
                    Desconto aplicado automaticamente quando o cliente escolhe PIX no pedido!
                  </p>
                )}
              </div>

              {/* Selo Frete Gratis */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/40 cursor-pointer select-none transition">
                <input
                  type="checkbox"
                  checked={Boolean(item.freeShipping)}
                  onChange={(e) =>
                    onUpdateItem({ freeShipping: e.target.checked })
                  }
                  className="w-4 h-4 mt-0.5 rounded text-emerald-500"
                />
                <div>
                  <span className="text-xs font-extrabold text-emerald-200 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Exibir Selo &quot;Frete Grátis&quot; neste item</span>
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                    Destaca envio gratuito direto na Buy Box do anúncio ao lado do botão de compra.
                  </span>
                </div>
              </label>
            </div>

            {/* Destaques / Beneficios Comerciais */}
            <div className="space-y-2 pt-1 border-t border-slate-800/70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Destaques / Benefícios no Centro do Card (até 4 selos):
                </span>
                <span className="text-[10px] text-slate-500">
                  {activeHighlights.length}/4 adicionados
                </span>
              </div>

              {activeHighlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeHighlights.map((hl) => (
                    <span
                      key={hl}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-bold text-emerald-200"
                    >
                      <span>✓ {hl}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleHighlight(hl)}
                        className="text-emerald-300/80 hover:text-white ml-0.5"
                        title="Remover destaque"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newHighlightInput}
                  maxLength={42}
                  disabled={activeHighlights.length >= 4}
                  onChange={(e) => setNewHighlightInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleToggleHighlight(newHighlightInput);
                      setNewHighlightInput('');
                    }
                  }}
                  placeholder={
                    activeHighlights.length >= 4
                      ? 'Limite de 4 destaques atingido'
                      : 'Ex: 100% Algodão, Garantia 1 ano...'
                  }
                  className="flex-1 min-w-[180px] bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-400 outline-none"
                />
                <button
                  type="button"
                  disabled={
                    activeHighlights.length >= 4 || !newHighlightInput.trim()
                  }
                  onClick={() => {
                    handleToggleHighlight(newHighlightInput);
                    setNewHighlightInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold border border-slate-700 transition"
                >
                  + Adicionar
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9.5px] font-semibold text-slate-500 mr-0.5">
                  Sugestões rápidas:
                </span>
                {TRUST_HIGHLIGHT_SUGGESTIONS.map((sug) => {
                  const isAdded = activeHighlights.includes(sug);
                  return (
                    <button
                      key={sug}
                      type="button"
                      disabled={!isAdded && activeHighlights.length >= 4}
                      onClick={() => handleToggleHighlight(sug)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition ${
                        isAdded
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white disabled:opacity-35'
                      }`}
                    >
                      {isAdded ? '✓ ' : '+ '}
                      {sug}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
