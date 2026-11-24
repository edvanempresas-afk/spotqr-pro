'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Check,
  Minus,
  Plus,
  ShoppingCart,
  Search,
  Pizza,
  ChevronRight,
} from 'lucide-react';
import {
  MenuExtra,
  MenuFlavor,
  MenuItem,
  MenuSizeOption,
  SelectedExtraItem,
  SelectedFlavorItem,
  SelectedSizeItem,
} from '@/lib/types';
import {
  calculateCustomizedUnitPrice,
  FLAVOR_PRICING_LABELS,
  resolveEffectiveMaxFlavors,
} from '@/lib/flavors';

export interface CustomizedSelectionPayload {
  item: MenuItem;
  quantity: number;
  selectedSize?: SelectedSizeItem;
  selectedFlavors?: SelectedFlavorItem[];
  selectedExtras?: MenuExtra[];
  unitPrice: number;
}

interface ShowcaseCustomizeModalProps {
  item: MenuItem | null;
  availableExtras: MenuExtra[];
  availableFlavors: MenuFlavor[];
  maxRemainingStock: number;
  isLight: boolean;
  accentHex: string;
  accentTextOnSolid: string;
  readableAccentText: string;
  onClose: () => void;
  onConfirm: (selection: CustomizedSelectionPayload) => void;
}

export default function ShowcaseCustomizeModal({
  item,
  availableExtras,
  availableFlavors,
  maxRemainingStock,
  isLight,
  accentHex,
  accentTextOnSolid,
  readableAccentText,
  onClose,
  onConfirm,
}: ShowcaseCustomizeModalProps) {
  const sizes = useMemo<MenuSizeOption[]>(
    () => (item?.sizes && item.sizes.length > 0 ? item.sizes : []),
    [item]
  );

  const [selectedSize, setSelectedSize] = useState<MenuSizeOption | null>(null);
  const [flavorCount, setFlavorCount] = useState<number>(1);
  const [flavorSlots, setFlavorSlots] = useState<(MenuFlavor | null)[]>([]);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0);
  const [flavorSearch, setFlavorSearch] = useState<string>('');
  const [flavorToast, setFlavorToast] = useState<string | null>(null);
  const [selectedExtraIds, setSelectedExtraIds] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState<number>(1);

  const countSectionRef = useRef<HTMLDivElement | null>(null);
  const flavorsSectionRef = useRef<HTMLDivElement | null>(null);
  const extrasSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!item) return;
    const initialSize = sizes.length > 0 ? sizes[0] : null;
    setSelectedSize(initialSize);
    const hasFlavors = Boolean(item.allowFlavors && availableFlavors.length > 0);
    const effMax = resolveEffectiveMaxFlavors(item, initialSize);
    const initialCount = hasFlavors ? (effMax >= 2 ? 1 : 1) : 0;
    setFlavorCount(initialCount);
    setFlavorSlots(initialCount > 0 ? Array(initialCount).fill(null) : []);
    setActiveSlotIdx(0);
    setFlavorSearch('');
    setFlavorToast(null);
    setSelectedExtraIds(new Set());
    setQuantity(1);
  }, [item, sizes, availableFlavors.length]);

  if (!item) return null;

  const hasFlavorsEnabled = Boolean(
    item.allowFlavors && availableFlavors.length > 0
  );
  const effectiveMaxFlavors = resolveEffectiveMaxFlavors(item, selectedSize);
  const pricingRule = item.flavorPricingRule || 'highest';

  const handleSelectSize = (sz: MenuSizeOption) => {
    setSelectedSize(sz);
    const newMax = resolveEffectiveMaxFlavors(item, sz);
    if (hasFlavorsEnabled) {
      const clampedCount = Math.min(Math.max(1, flavorCount), newMax);
      setFlavorCount(clampedCount);
      setFlavorSlots((prev) => {
        const next = Array(clampedCount).fill(null);
        for (let i = 0; i < Math.min(prev.length, clampedCount); i++) {
          next[i] = prev[i];
        }
        return next;
      });
      setActiveSlotIdx((prevIdx) => Math.min(prevIdx, clampedCount - 1));
    }
    setTimeout(() => {
      if (hasFlavorsEnabled) {
        (countSectionRef.current || flavorsSectionRef.current)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 80);
  };

  const handleChangeFlavorCount = (nextCount: number) => {
    setFlavorCount(nextCount);
    setFlavorSlots((prev) => {
      const next: (MenuFlavor | null)[] = Array(nextCount).fill(null);
      for (let i = 0; i < Math.min(prev.length, nextCount); i++) {
        next[i] = prev[i];
      }
      const firstEmpty = next.findIndex((s) => !s);
      setActiveSlotIdx(firstEmpty === -1 ? 0 : firstEmpty);
      return next;
    });
    setFlavorToast(null);
    setTimeout(() => {
      flavorsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  };

  const handlePickFlavorForActiveSlot = (flavor: MenuFlavor) => {
    const nextSlots = [...flavorSlots];
    nextSlots[activeSlotIdx] = flavor;
    setFlavorSlots(nextSlots);

    // Find next unfilled slot (prefer after active, or wrap to any unfilled)
    let nextEmpty = nextSlots.findIndex((s, i) => i > activeSlotIdx && !s);
    if (nextEmpty === -1) {
      nextEmpty = nextSlots.findIndex((s) => !s);
    }

    if (nextEmpty !== -1) {
      const finishedNum = activeSlotIdx + 1;
      setActiveSlotIdx(nextEmpty);
      setFlavorToast(
        `✅ ${finishedNum}º sabor (${flavor.name}) escolhido! Agora escolha o ${nextEmpty + 1}º sabor:`
      );
      setTimeout(() => {
        flavorsSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 60);
    } else {
      setFlavorToast(
        flavorCount > 1
          ? `✅ Todos os ${flavorCount} sabores selecionados!`
          : `✅ Sabor ${flavor.name} selecionado!`
      );
      if (availableExtras.length > 0) {
        setTimeout(() => {
          extrasSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 120);
      }
    }
  };

  const chosenFlavorsList: SelectedFlavorItem[] = flavorSlots
    .filter((f): f is MenuFlavor => Boolean(f))
    .map((f) => ({ id: f.id, name: f.name, price: Number(f.price) || 0 }));

  const chosenExtrasList = availableExtras.filter((ex) =>
    selectedExtraIds.has(ex.id)
  );
  const chosenExtrasMapped: SelectedExtraItem[] = chosenExtrasList.map((ex) => ({
    id: ex.id,
    name: ex.name,
    price: Number(ex.price) || 0,
  }));

  const priceSummary = calculateCustomizedUnitPrice({
    baseItemPrice: item.price,
    selectedSize: selectedSize
      ? { id: selectedSize.id, name: selectedSize.name, price: selectedSize.price }
      : null,
    selectedFlavors: chosenFlavorsList,
    flavorPricingRule: pricingRule,
    selectedExtras: chosenExtrasMapped,
  });

  const grandTotal = priceSummary.unitPrice * quantity;
  const missingFlavorIdx = hasFlavorsEnabled
    ? flavorSlots.findIndex((s) => !s)
    : -1;
  const allFlavorsPicked = missingFlavorIdx === -1;
  const needsSizePick = sizes.length > 0 && !selectedSize;

  const filteredFlavors = availableFlavors.filter((fl) => {
    if (!flavorSearch.trim()) return true;
    const q = flavorSearch.toLowerCase();
    return (
      fl.name.toLowerCase().includes(q) ||
      (fl.description || '').toLowerCase().includes(q)
    );
  });

  const modalBoxClass = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-[#121929] border-slate-700 text-white';
  const headingTextClass = isLight ? 'text-slate-900' : 'text-white';
  const mutedTextClass = isLight ? 'text-slate-600' : 'text-slate-400';
  const labelTextClass = isLight ? 'text-slate-700' : 'text-slate-300';

  const handleConfirmClick = () => {
    if (needsSizePick) return;
    if (!allFlavorsPicked) {
      setActiveSlotIdx(missingFlavorIdx);
      setFlavorToast(
        `Falta escolher o ${missingFlavorIdx + 1}º sabor para completar!`
      );
      flavorsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }

    onConfirm({
      item,
      quantity,
      selectedSize: selectedSize
        ? {
            id: selectedSize.id,
            name: selectedSize.name,
            price: selectedSize.price,
          }
        : undefined,
      selectedFlavors:
        chosenFlavorsList.length > 0 ? chosenFlavorsList : undefined,
      selectedExtras: chosenExtrasList.length > 0 ? chosenExtrasList : undefined,
      unitPrice: priceSummary.unitPrice,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
      <div
        className={`relative w-full max-w-lg border rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col ${modalBoxClass}`}
      >
        {/* Header */}
        <div
          className={`shrink-0 flex items-center justify-between pb-3 border-b ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">
              {hasFlavorsEnabled ? '🍕' : '🍟'}
            </span>
            <div className="min-w-0">
              <h3
                className={`text-sm font-extrabold truncate ${headingTextClass}`}
              >
                {item.name}
              </h3>
              <p className={`text-[11px] truncate ${mutedTextClass}`}>
                {hasFlavorsEnabled
                  ? 'Escolha tamanho, sabores e complementos'
                  : 'Personalize com adicionais do seu jeito'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition shrink-0 ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Customization Body */}
        <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-5 pr-1">
          {item.description && (
            <p className={`text-xs leading-relaxed ${mutedTextClass}`}>
              {item.description}
            </p>
          )}

          {/* STEP 1: Sizes */}
          {sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider ${labelTextClass}`}
                >
                  1. Escolha o Tamanho *
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sizes.map((sz) => {
                  const isActive = selectedSize?.id === sz.id;
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => handleSelectSize(sz)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${
                        isActive
                          ? isLight
                            ? 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm'
                            : 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold block truncate">
                          {sz.name || 'Tamanho'}
                        </span>
                        <span className={`text-[10px] ${mutedTextClass}`}>
                          Até {sz.maxFlavors || 1}{' '}
                          {(sz.maxFlavors || 1) === 1 ? 'sabor' : 'sabores'}
                        </span>
                      </div>
                      <span
                        className="text-xs font-black shrink-0"
                        style={{ color: readableAccentText }}
                      >
                        {sz.price > 0
                          ? `R$ ${Number(sz.price).toFixed(2)}`
                          : 'Conforme sabor'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Number of Flavors (1, 2, 3, 4...) */}
          {hasFlavorsEnabled && (
            <div ref={countSectionRef} className="space-y-2 scroll-mt-2">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider ${labelTextClass}`}
                >
                  {sizes.length > 0
                    ? '2. Quantos Sabores?'
                    : '1. Quantos Sabores Deseja Misturar?'}
                </span>
                <span className={`text-[10px] font-semibold ${mutedTextClass}`}>
                  {FLAVOR_PRICING_LABELS[pricingRule].short}
                </span>
              </div>

              {effectiveMaxFlavors > 1 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Array.from(
                    { length: effectiveMaxFlavors },
                    (_, i) => i + 1
                  ).map((n) => {
                    const active = flavorCount === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleChangeFlavorCount(n)}
                        style={
                          active
                            ? {
                                backgroundColor: accentHex,
                                color: accentTextOnSolid,
                              }
                            : undefined
                        }
                        className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition text-center ${
                          active
                            ? 'shadow-sm border-transparent'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {n === 1
                          ? '1 Sabor'
                          : n === 2
                          ? '2 Sabores (½)'
                          : `${n} Sabores`}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div
                  className={`text-[11px] px-3 py-2 rounded-xl border ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  Este tamanho permite <strong>1 sabor inteiro</strong>.
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Cascading Slot Picker + Shared Flavor List (iFood / 99Food Flow) */}
          {hasFlavorsEnabled && flavorCount > 0 && (
            <div ref={flavorsSectionRef} className="space-y-3 scroll-mt-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${labelTextClass}`}
                >
                  <Pizza className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Escolha os Sabores ({flavorSlots.filter(Boolean).length}/
                    {flavorCount})
                  </span>
                </span>
              </div>

              {/* Interactive Fraction Slots Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {flavorSlots.map((slotFlavor, idx) => {
                  const isEditingThis = activeSlotIdx === idx;
                  const fractionStr =
                    flavorCount === 1 ? 'Inteiro' : `1/${flavorCount}`;
                  return (
                    <button
                      key={`slot-${idx}`}
                      type="button"
                      onClick={() => {
                        setActiveSlotIdx(idx);
                        setFlavorToast(
                          `Selecionando o ${idx + 1}º sabor (${fractionStr}):`
                        );
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${
                        isEditingThis
                          ? isLight
                            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
                            : 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/25'
                          : slotFlavor
                          ? isLight
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-emerald-500/10 border-emerald-500/40'
                          : isLight
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-slate-900/50 border-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider block ${
                            isEditingThis
                              ? isLight
                                ? 'text-amber-700'
                                : 'text-amber-300'
                              : slotFlavor
                              ? isLight
                                ? 'text-emerald-700'
                                : 'text-emerald-400'
                              : mutedTextClass
                          }`}
                        >
                          {fractionStr} • Sabor {idx + 1} de {flavorCount}
                          {isEditingThis && ' (Escolhendo agora)'}
                        </span>
                        <span
                          className={`text-xs font-bold block truncate mt-0.5 ${
                            slotFlavor ? headingTextClass : mutedTextClass
                          }`}
                        >
                          {slotFlavor
                            ? slotFlavor.name
                            : `Toque abaixo para escolher...`}
                        </span>
                      </div>
                      {slotFlavor ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Guidance Banner */}
              <div
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  flavorToast && allFlavorsPicked
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-amber-500/15 border-amber-500/35 text-amber-200'
                }`}
              >
                <span>
                  {flavorToast ||
                    `👉 Selecione abaixo o ${activeSlotIdx + 1}º sabor (${
                      flavorCount === 1 ? 'Inteiro' : `1/${flavorCount}`
                    }):`}
                </span>
              </div>

              {/* Search box when store has many flavors */}
              {availableFlavors.length >= 6 && (
                <div className="relative">
                  <Search
                    className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${mutedTextClass}`}
                  />
                  <input
                    type="text"
                    value={flavorSearch}
                    onChange={(e) => setFlavorSearch(e.target.value)}
                    placeholder="Buscar sabor..."
                    className={`w-full border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              )}

              {/* Flavor Options List */}
              <div className="space-y-1.5">
                {filteredFlavors.map((fl) => {
                  const chosenCountForThis = flavorSlots.filter(
                    (s) => s?.id === fl.id
                  ).length;
                  const isActiveSlotFlavor =
                    flavorSlots[activeSlotIdx]?.id === fl.id;

                  return (
                    <button
                      key={fl.id}
                      type="button"
                      onClick={() => handlePickFlavorForActiveSlot(fl)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition-all ${
                        isActiveSlotFlavor
                          ? isLight
                            ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                            : 'bg-emerald-500/20 border-emerald-500 shadow-sm'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-emerald-300'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold ${headingTextClass}`}>
                            {fl.name}
                          </span>
                          {chosenCountForThis > 0 && (
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              ✓ {chosenCountForThis}x selecionado
                            </span>
                          )}
                        </div>
                        {fl.description && (
                          <p
                            className={`text-[11px] line-clamp-2 mt-0.5 ${mutedTextClass}`}
                          >
                            {fl.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-xs font-black"
                          style={{ color: readableAccentText }}
                        >
                          {fl.price > 0
                            ? pricingRule === 'sum'
                              ? `+ R$ ${Number(fl.price).toFixed(2)}`
                              : `R$ ${Number(fl.price).toFixed(2)}`
                            : 'Incluso'}
                        </span>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                            isActiveSlotFlavor
                              ? 'bg-emerald-500 border-emerald-600 text-white'
                              : isLight
                              ? 'border-slate-300 bg-slate-50 text-slate-500'
                              : 'border-slate-700 bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isActiveSlotFlavor ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Extras / Adicionais */}
          {availableExtras.length > 0 && (
            <div ref={extrasSectionRef} className="space-y-2 scroll-mt-2">
              <span
                className={`block text-[11px] font-black uppercase tracking-wider ${labelTextClass}`}
              >
                {hasFlavorsEnabled
                  ? '🍟 Adicionais / Borda Recheada (opcional)'
                  : 'Escolha os adicionais desejados:'}
              </span>
              <div className="space-y-1.5">
                {availableExtras.map((extra) => {
                  const isSelected = selectedExtraIds.has(extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => {
                        setSelectedExtraIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(extra.id)) next.delete(extra.id);
                          else next.add(extra.id);
                          return next;
                        });
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? isLight
                            ? 'bg-emerald-50/90 border-emerald-400 text-slate-900 shadow-sm'
                            : 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-600 text-white'
                              : isLight
                              ? 'border-slate-300 bg-white'
                              : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </div>
                        <span className="text-xs font-bold">{extra.name}</span>
                      </div>

                      <span
                        className={`text-xs font-black shrink-0 ${
                          isSelected
                            ? isLight
                              ? 'text-emerald-700'
                              : 'text-emerald-400'
                            : mutedTextClass
                        }`}
                      >
                        + R$ {Number(extra.price).toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Stepper + Confirm */}
        <div
          className={`shrink-0 pt-4 mt-2 border-t space-y-3 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${labelTextClass}`}>
              Quantidade deste item:
            </span>
            <div
              className={`flex items-center gap-2 rounded-xl p-1 border ${
                isLight
                  ? 'bg-slate-100 border-slate-200'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className={`p-1.5 rounded-lg transition ${
                  quantity <= 1
                    ? 'opacity-30 cursor-not-allowed'
                    : isLight
                    ? 'hover:bg-white text-slate-700'
                    : 'hover:bg-slate-800 text-white'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className={`text-xs font-black px-2 ${headingTextClass}`}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) =>
                    q < maxRemainingStock ? q + 1 : q
                  )
                }
                disabled={quantity >= maxRemainingStock}
                className={`p-1.5 rounded-lg transition ${
                  quantity >= maxRemainingStock
                    ? 'opacity-30 cursor-not-allowed'
                    : isLight
                    ? 'hover:bg-white text-slate-700'
                    : 'hover:bg-slate-800 text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmClick}
            style={{
              backgroundColor: accentHex,
              color: accentTextOnSolid,
            }}
            className={`w-full py-3 px-4 rounded-2xl text-xs font-black shadow-lg transition flex items-center justify-between gap-2 ${
              !allFlavorsPicked
                ? 'opacity-85 hover:opacity-100'
                : 'hover:brightness-105 active:scale-[0.98]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 stroke-[2.4]" />
              <span>
                {!allFlavorsPicked
                  ? `Escolha o ${missingFlavorIdx + 1}º sabor (${
                      flavorSlots.filter(Boolean).length
                    }/${flavorCount})`
                  : 'Adicionar ao Pedido'}
              </span>
            </span>
            <span className="font-extrabold text-sm">
              R$ {grandTotal.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
