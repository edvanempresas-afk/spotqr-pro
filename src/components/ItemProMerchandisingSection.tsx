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
} from 'lucide-react';
import '../app/merchandising.css';
import {
  MenuItem,
  MenuItemVariant,
  PromoVisualEffect,
} from '../lib/types';
import {
  PROMO_EFFECT_OPTIONS,
  buildVariantPreset,
  calculateDiscountPercent,
  formatInstallmentLabel,
  resolveVariantEffectivePrice,
} from '../lib/merchandising';

interface ItemProMerchandisingSectionProps {
  item: MenuItem;
  currency?: string;
  isPro: boolean;
  onUpdateItem: (patch: Partial<MenuItem>) => void;
}

export function ItemProMerchandisingSection({
  item,
  currency = 'R$',
  isPro,
  onUpdateItem,
}: ItemProMerchandisingSectionProps) {
  const hasAnyActiveProMerchandising = Boolean(
    (typeof item.originalPrice === 'number' && item.originalPrice > 0) ||
      (item.promoEffect && item.promoEffect !== 'none') ||
      item.showPriceSplash ||
      (typeof item.maxInstallments === 'number' && item.maxInstallments >= 2) ||
      (Array.isArray(item.variants) && item.variants.length > 0)
  );

  const [expanded, setExpanded] = useState<boolean>(false);

  const variants = item.variants || [];
  const activeEffect: PromoVisualEffect = item.promoEffect || 'none';
  const discountPct = calculateDiscountPercent(
    Number(item.price) || 0,
    item.originalPrice
  );
  const installmentPreview = formatInstallmentLabel(
    resolveVariantEffectivePrice(item, variants[0]),
    item.maxInstallments,
    currency
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
          <span className="text-rose-300 font-semibold">🎄 Pisca-Pisca Natalino</span>,{' '}
          <span className="text-orange-300 font-semibold">💥 Splash de Desconto</span>,{' '}
          <span className="text-sky-300 font-semibold">Parcelamento sem juros</span> e vende{' '}
          <span className="text-white font-semibold">110V / 220V, Cores e Tamanhos</span> no mesmo anúncio!
        </p>
      </div>
    );
  }

  return (
    <div className="sm:col-span-3 rounded-2xl bg-slate-950/75 border border-emerald-500/25 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-slate-900/60 transition"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-extrabold text-white">
            Destaques PRO: Promoção, Parcelas &amp; Variações (110V/220V, Cores)
          </span>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
            PRO Ativo
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {hasAnyActiveProMerchandising && (
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
              {item.maxInstallments && item.maxInstallments >= 2 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/35 text-sky-200">
                  {item.maxInstallments}x s/ juros
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
          {/* 1. DESTAQUE PROMOCIONAL, PRECO "DE / POR", SPLASH E BORDAS SAZONAIS */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5 className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Destaque Promocional, Splash no Preço &amp; Borda Animada</span>
              </h5>
              {discountPct && (
                <span className="price-splash-badge text-[10px]">
                  -{discountPct}% OFF
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Preço Anterior &quot;De:&quot; ({currency}) — Opcional:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 199,90 (mostra preço riscado e %)"
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
                      onUpdateItem({
                        originalPrice:
                          Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 focus:border-orange-400 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {discountPct
                    ? `Exibirá "De ${currency} ${Number(item.originalPrice).toFixed(2).replace('.', ',')}" riscado e economia de ${discountPct}%.`
                    : 'Preencha um valor maior que o preço atual para gerar o % OFF automático.'}
                </p>
              </div>

              <div className="flex flex-col justify-between gap-2">
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
                      💥 Colocar Splash Chamativo no Preço
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight block">
                      Adiciona selo explosivo animado (&quot;OFERTA&quot; ou &quot;-XX% OFF&quot;) colado no valor.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                Borda Especial ao Redor do Quadrado do Item:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PROMO_EFFECT_OPTIONS.map((opt) => {
                  const isSelected = activeEffect === opt.id;
                  const previewFrameClass =
                    opt.id === 'neon' && isSelected
                      ? 'promo-card-neon bg-emerald-950/40 border-emerald-400'
                      : opt.id === 'christmas' && isSelected
                      ? 'promo-card-christmas bg-rose-950/35 border-red-500'
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
                      className={`p-2.5 rounded-xl border text-left transition ${previewFrameClass}`}
                    >
                      <span className="text-[11px] font-extrabold text-white block">
                        {opt.badgeText}
                      </span>
                      <span className="text-[9.5px] text-slate-400 leading-tight block mt-0.5">
                        {opt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. PARCELAMENTO MAXIMO SEM JUROS */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5 className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                <span>Parcelamento Máximo sem Juros (Itens de Maior Valor)</span>
              </h5>
              {installmentPreview && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/35 text-sky-300">
                  {installmentPreview}
                </span>
              )}
            </div>

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
                    {parc === 0 ? 'Não exibir' : `${parc}x sem juros`}
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
          </div>

          {/* 3. MULTIPLAS VARIACOES NO MESMO ANUNCIO (VOLTAGEM, CORES, TAMANHOS) */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Variações no Mesmo Quadrado de Anúncio</span>
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Ideal para eletrônicos (110V / 220V), roupas (Cores / Tamanhos) ou capacidades. O cliente escolhe antes de colocar no carrinho!
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

            {/* Atalhos rápidos brasileiros */}
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
                    placeholder="Ex: Voltagem (110V ou 220V)"
                    className="w-full sm:w-72 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:border-emerald-400 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-xl bg-slate-950/90 border border-slate-800"
                    >
                      <input
                        type="color"
                        value={variant.colorHex || '#10b981'}
                        onChange={(e) =>
                          handleUpdateVariant(variant.id, {
                            colorHex: e.target.value,
                          })
                        }
                        title="Cor opcional da bolinha desta opção"
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
