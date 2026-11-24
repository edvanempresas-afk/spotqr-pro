'use client';

import React, { useMemo } from 'react';
import { Plus, Trash2, Sparkles, Pizza } from 'lucide-react';
import {
  FlavorPricingRule,
  FlavorSourceMode,
  MenuCategory,
  MenuFlavor,
  MenuFlavorGroup,
  MenuItem,
  MenuSizeOption,
} from '@/lib/types';
import {
  FLAVOR_PRICING_LABELS,
  getFlavorsInGroup,
  resolveFlavorGroupsWithLegacy,
  UNGROUPED_FLAVOR_GROUP_ID,
} from '@/lib/flavors';

interface ItemMultiFlavorSectionProps {
  item: MenuItem;
  categories: MenuCategory[];
  flavorGroups: MenuFlavorGroup[];
  menuFlavors: MenuFlavor[];
  onUpdateItem: (patch: Partial<MenuItem>) => void;
  onGoToFlavorsTab: () => void;
}

export default function ItemMultiFlavorSection({
  item,
  categories,
  flavorGroups,
  menuFlavors,
  onUpdateItem,
  onGoToFlavorsTab,
}: ItemMultiFlavorSectionProps) {
  const sourceMode: FlavorSourceMode = item.flavorSourceMode || 'category';
  const pricingRule: FlavorPricingRule = item.flavorPricingRule || 'highest';
  const maxFlavors = Math.max(1, Math.min(8, item.maxFlavors || 2));
  const sizes = item.sizes || [];

  const allGroups = useMemo(
    () => resolveFlavorGroupsWithLegacy(flavorGroups, menuFlavors),
    [flavorGroups, menuFlavors]
  );
  const validExplicitIds = useMemo(
    () => new Set(flavorGroups.map((g) => g.id)),
    [flavorGroups]
  );

  // Selected flavor groups when sourceMode === 'custom'
  const selectedGroupIds = useMemo(() => {
    if (Array.isArray(item.flavorGroupIds) && item.flavorGroupIds.length > 0) {
      return item.flavorGroupIds;
    }
    // Legacy compatibility: if allowedFlavorIds existed before groups existed
    if (Array.isArray(item.allowedFlavorIds) && item.allowedFlavorIds.length > 0) {
      const allowedSet = new Set(item.allowedFlavorIds);
      const inferredGroupIds = new Set<string>();
      for (const fl of menuFlavors) {
        if (!allowedSet.has(fl.id)) continue;
        if (fl.groupId && validExplicitIds.has(fl.groupId)) {
          inferredGroupIds.add(fl.groupId);
        } else {
          inferredGroupIds.add(UNGROUPED_FLAVOR_GROUP_ID);
        }
      }
      return Array.from(inferredGroupIds);
    }
    return [];
  }, [item.flavorGroupIds, item.allowedFlavorIds, menuFlavors, validExplicitIds]);

  const flavorsVisibleForSelectedGroups = useMemo(() => {
    const out: MenuFlavor[] = [];
    for (const grpId of selectedGroupIds) {
      out.push(...getFlavorsInGroup(menuFlavors, grpId, validExplicitIds));
    }
    return out;
  }, [selectedGroupIds, menuFlavors, validExplicitIds]);

  const excludedSet = useMemo(
    () => new Set(item.excludedFlavorIds || []),
    [item.excludedFlavorIds]
  );

  const handleToggleAllowFlavors = (enabled: boolean) => {
    if (!enabled) {
      onUpdateItem({ allowFlavors: false });
      return;
    }

    const defaultSource: FlavorSourceMode =
      menuFlavors.length > 0 ? 'custom' : 'category';

    // Smart initial group selection: match item name (pastel vs pizza) or pick first if only 1 group
    let defaultGroupIds = item.flavorGroupIds || [];
    if (defaultGroupIds.length === 0 && allGroups.length > 0) {
      const lowerName = (item.name || '').toLowerCase();
      const matched = allGroups.find((g) => {
        const gLow = g.name.toLowerCase();
        if (lowerName.includes('pastel') && gLow.includes('pastel')) return true;
        if (lowerName.includes('pizza') && gLow.includes('pizza')) return true;
        if (lowerName.includes('esfiha') && gLow.includes('esfiha')) return true;
        if ((lowerName.includes('açai') || lowerName.includes('açaí')) && (gLow.includes('açai') || gLow.includes('açaí'))) return true;
        return false;
      });
      if (matched) {
        defaultGroupIds = [matched.id];
      } else if (allGroups.length === 1) {
        defaultGroupIds = [allGroups[0].id];
      }
    }

    onUpdateItem({
      allowFlavors: true,
      maxFlavors: item.maxFlavors || 2,
      flavorPricingRule: item.flavorPricingRule || 'highest',
      flavorSourceMode: item.flavorSourceMode || defaultSource,
      flavorGroupIds: defaultGroupIds,
      flavorCategoryIds:
        item.flavorCategoryIds && item.flavorCategoryIds.length > 0
          ? item.flavorCategoryIds
          : item.category
          ? [item.category]
          : [],
    });
  };

  const handleAddSize = () => {
    const nextSize: MenuSizeOption = {
      id: `size-${Date.now()}`,
      name: '',
      price: item.price || 0,
      maxFlavors: maxFlavors,
    };
    onUpdateItem({ sizes: [...sizes, nextSize] });
  };

  const handleLoadPizzaSizes = () => {
    const now = Date.now();
    const presets: MenuSizeOption[] = [
      { id: `size-${now}-1`, name: 'Brotinho (4 fatias)', price: 32, maxFlavors: 1 },
      { id: `size-${now}-2`, name: 'Média (6 fatias)', price: 44, maxFlavors: 2 },
      { id: `size-${now}-3`, name: 'Grande (8 fatias)', price: 54, maxFlavors: 3 },
      { id: `size-${now}-4`, name: 'Família (12 fatias)', price: 68, maxFlavors: 4 },
    ];
    onUpdateItem({ sizes: presets });
  };

  const handleUpdateSize = (sizeId: string, patch: Partial<MenuSizeOption>) => {
    onUpdateItem({
      sizes: sizes.map((s) => (s.id === sizeId ? { ...s, ...patch } : s)),
    });
  };

  const handleDeleteSize = (sizeId: string) => {
    const next = sizes.filter((s) => s.id !== sizeId);
    onUpdateItem({ sizes: next.length > 0 ? next : undefined });
  };

  const activeFlavorCount =
    sourceMode === 'category'
      ? `${(item.flavorCategoryIds || []).length} categoria(s)`
      : `${
          flavorsVisibleForSelectedGroups.filter((f) => !excludedSet.has(f.id))
            .length
        } sabor(es)`;

  return (
    <div className="sm:col-span-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(item.allowFlavors)}
            onChange={(e) => handleToggleAllowFlavors(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 focus:ring-offset-slate-900"
          />
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Pizza className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Permitir Múltiplos Sabores / Tamanhos? (Pizza meio-a-meio, Pastel até 4 sabores...)
            </span>
          </span>
        </label>

        {item.allowFlavors && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Até {maxFlavors} sabor(es) • {activeFlavorCount}
          </span>
        )}
      </div>

      {item.allowFlavors && (
        <div className="space-y-4 pt-3 border-t border-slate-800/80">
          {/* 1. Quantidade máxima de sabores & Regra de Preço */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-300 uppercase block">
                Máximo de Sabores neste Item (quando sem tamanhos):
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onUpdateItem({ maxFlavors: n })}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                      maxFlavors === n
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Até {n} sabores
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                O cliente escolhe 1 sabor, 2 sabores (1/2 + 1/2), até o limite definido.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-300 uppercase block">
                Como Calcular Preço ao Misturar Sabores:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['highest', 'average', 'sum'] as FlavorPricingRule[]).map((ruleKey) => (
                  <button
                    key={ruleKey}
                    type="button"
                    onClick={() => onUpdateItem({ flavorPricingRule: ruleKey })}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition text-center ${
                      pricingRule === ruleKey
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {FLAVOR_PRICING_LABELS[ruleKey].short}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {FLAVOR_PRICING_LABELS[pricingRule].description}
              </p>
            </div>
          </div>

          {/* 2. Tamanhos Opcionais (Brotinho, Média, Grande, Família...) */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-white block">
                  📏 Tamanhos do Produto (opcional — estilo iFood / Pizzaria)
                </span>
                <span className="text-[10px] text-slate-400">
                  Se quiser que o cliente escolha primeiro o tamanho (ex: Média 2 sabores, Grande 3 sabores), adicione abaixo:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {sizes.length === 0 && (
                  <button
                    type="button"
                    onClick={handleLoadPizzaSizes}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Carregar Tamanhos Pizza</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddSize}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar Tamanho</span>
                </button>
              </div>
            </div>

            {sizes.length > 0 && (
              <div className="space-y-2 pt-1">
                {sizes.map((sz) => (
                  <div
                    key={sz.id}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-950/70 border border-slate-800 rounded-xl p-2"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <input
                        type="text"
                        value={sz.name}
                        placeholder="Ex: Grande (8 fatias)"
                        onChange={(e) =>
                          handleUpdateSize(sz.id, { name: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-semibold"
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={sz.price === 0 ? '' : sz.price}
                        placeholder="Base R$ 0,00"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateSize(sz.id, {
                            price: val === '' ? 0 : parseFloat(val) || 0,
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                        title="Preço base deste tamanho (pode ser 0 se cobrar pelo valor do sabor)"
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3 flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 shrink-0">
                        Sabores:
                      </span>
                      <select
                        value={sz.maxFlavors || 1}
                        onChange={(e) =>
                          handleUpdateSize(sz.id, {
                            maxFlavors: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-xs text-white font-bold"
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            Até {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteSize(sz.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-lg transition"
                        title="Remover tamanho"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. De onde vêm os sabores? (Categoria do Cardápio OU Grupos da Aba Sabores) */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-white">
                📋 De onde puxar a lista de sabores para este produto?
              </span>
              <div className="inline-flex p-0.5 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onUpdateItem({ flavorSourceMode: 'category' })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    sourceMode === 'category'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📂 Categorias do Cardápio
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateItem({
                      flavorSourceMode: 'custom',
                      flavorGroupIds: selectedGroupIds,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    sourceMode === 'custom'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🍕 Grupos da Aba &ldquo;Sabores&rdquo;
                </button>
              </div>
            </div>

            {sourceMode === 'category' ? (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400">
                  Marque qual(is) categoria(s) contêm os sabores (ex: &ldquo;Pizzas Tradicionais&rdquo;). Todos os itens daquela categoria aparecerão com foto automaticamente!
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const checked = (item.flavorCategoryIds || []).includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer transition ${
                          checked
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const curr = item.flavorCategoryIds || [];
                            const next = e.target.checked
                              ? [...curr, cat.id]
                              : curr.filter((id) => id !== cat.id);
                            onUpdateItem({ flavorCategoryIds: next });
                          }}
                          className="accent-emerald-500 w-3.5 h-3.5"
                        />
                        <span>{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : allGroups.length === 0 ? (
              <div className="text-xs text-amber-300/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span>Nenhum grupo de sabores cadastrado na aba Sabores ainda.</span>
                <button
                  type="button"
                  onClick={onGoToFlavorsTab}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] whitespace-nowrap self-start sm:self-auto"
                >
                  Cadastrar Sabores Agora
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Group Selection */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-300 block">
                    Selecione qual Grupo de Sabores este item usa (ex: marque só Pizzas ou só Pastéis):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {allGroups.map((grp) => {
                      const count = getFlavorsInGroup(
                        menuFlavors,
                        grp.id,
                        validExplicitIds
                      ).length;
                      const isGrpSelected = selectedGroupIds.includes(grp.id);
                      return (
                        <label
                          key={grp.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition ${
                            isGrpSelected
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-extrabold'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isGrpSelected}
                            onChange={(e) => {
                              const nextGroupIds = e.target.checked
                                ? [...selectedGroupIds, grp.id]
                                : selectedGroupIds.filter((id) => id !== grp.id);
                              onUpdateItem({
                                flavorGroupIds: nextGroupIds,
                                allowedFlavorIds: undefined,
                              });
                            }}
                            className="accent-emerald-500 w-3.5 h-3.5"
                          />
                          <span>{grp.icon || '🍽️'}</span>
                          <span>{grp.name}</span>
                          <span className="text-[10px] opacity-75">({count})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Only Flavors from Selected Groups */}
                {selectedGroupIds.length === 0 ? (
                  <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                    Marque pelo menos 1 grupo acima (ex: 🍕 Pizzas ou 🥟 Pastéis) para exibir os sabores deste item.
                  </p>
                ) : flavorsVisibleForSelectedGroups.length > 0 ? (
                  <div className="space-y-2 pt-1 border-t border-slate-800/70">
                    <p className="text-[10px] text-slate-400">
                      Sabores incluídos do(s) grupo(s) selecionado(s) — todos vêm marcados, desmarque se algum não servir para este item:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {flavorsVisibleForSelectedGroups.map((fl) => {
                        const isLegacyExplicit =
                          (!item.flavorGroupIds || item.flavorGroupIds.length === 0) &&
                          Array.isArray(item.allowedFlavorIds);
                        const isChecked = isLegacyExplicit
                          ? item.allowedFlavorIds!.includes(fl.id)
                          : !excludedSet.has(fl.id);
                        return (
                          <label
                            key={fl.id}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                              isChecked
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-950 border-slate-800 text-slate-400 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currExcluded = item.excludedFlavorIds || [];
                                  const nextExcluded = e.target.checked
                                    ? currExcluded.filter((id) => id !== fl.id)
                                    : Array.from(new Set([...currExcluded, fl.id]));
                                  onUpdateItem({
                                    flavorGroupIds: selectedGroupIds,
                                    excludedFlavorIds: nextExcluded,
                                    allowedFlavorIds: undefined,
                                  });
                                }}
                                className="w-3.5 h-3.5 rounded text-emerald-500 shrink-0"
                              />
                              {fl.imageUrl && (
                                <img
                                  src={fl.imageUrl}
                                  alt={fl.name}
                                  className="w-6 h-6 rounded-md object-cover shrink-0 border border-slate-700"
                                />
                              )}
                              <span className="font-semibold truncate">
                                {fl.name || 'Sem nome'}
                              </span>
                            </div>
                            <span className="font-mono text-emerald-400 text-[11px] shrink-0 ml-1">
                              {fl.price > 0
                                ? `R$ ${Number(fl.price).toFixed(2).replace('.', ',')}`
                                : 'Incluso'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
