'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  PlusCircle,
  Sparkles,
  Trash2,
  FolderInput,
  Pizza,
  Upload,
  Crop,
  Image as ImageIcon,
  FolderPlus,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import {
  MenuCategory,
  MenuFlavor,
  MenuFlavorGroup,
  MenuItem,
} from '@/lib/types';
import {
  getFlavorsInGroup,
  resolveFlavorGroupsWithLegacy,
  UNGROUPED_FLAVOR_GROUP_ID,
} from '@/lib/flavors';

interface MenuFlavorsTabProps {
  flavorGroups: MenuFlavorGroup[];
  flavors: MenuFlavor[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  onChangeFlavorData: (
    nextGroups: MenuFlavorGroup[],
    nextFlavors: MenuFlavor[]
  ) => void;
  onCleanupDeletedFlavor: (flavorId: string) => void;
  onCleanupDeletedGroup: (groupId: string) => void;
  onUploadFlavorPhoto: (flavorId: string, file: File) => void;
  onCropFlavorPhoto: (flavorId: string, currentUrl: string) => void;
}

const PIZZA_SAMPLE_PHOTO =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80';

const PIZZA_PRESET_FLAVORS: Array<{
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}> = [
  {
    name: 'Mussarela',
    description: 'Molho de tomate, mussarela especial e orégano',
    price: 42,
    imageUrl: PIZZA_SAMPLE_PHOTO,
  },
  {
    name: 'Calabresa',
    description: 'Calabresa fatiada, cebola roxa e mussarela',
    price: 44,
    imageUrl: PIZZA_SAMPLE_PHOTO,
  },
  {
    name: 'Portuguesa',
    description: 'Presunto, ovos, cebola, ervilha, azeitona e mussarela',
    price: 48,
    imageUrl: PIZZA_SAMPLE_PHOTO,
  },
  {
    name: 'Frango com Catupiry',
    description: 'Frango desfiado temperado coberto com Catupiry original',
    price: 49,
    imageUrl: PIZZA_SAMPLE_PHOTO,
  },
  {
    name: 'Marguerita',
    description: 'Mussarela, tomate em rodelas, manjericão fresco e parmesão',
    price: 45,
    imageUrl: PIZZA_SAMPLE_PHOTO,
  },
  {
    name: 'Quatro Queijos',
    description: 'Mussarela, provolone, parmesão e gorgonzola/catupiry',
    price: 52,
    imageUrl: PIZZA_SAMPLE_PHOTO,
  },
  {
    name: 'Camarão Especial',
    description: 'Camarão refogado no alho e ervas com requeijão cremoso',
    price: 66,
    imageUrl: PIZZA_SAMPLE_PHOTO,
  },
];

const PASTEL_PRESET_FLAVORS: Array<{
  name: string;
  description: string;
  price: number;
}> = [
  { name: 'Carne Moída Temperada', description: 'Carne bovina refogada com cheiro-verde', price: 3.5 },
  { name: 'Queijo Mussarela', description: 'Queijo mussarela derretido em tiras', price: 3.5 },
  { name: 'Pizza (Presunto e Queijo)', description: 'Presunto, queijo mussarela, tomate e orégano', price: 4.0 },
  { name: 'Frango com Catupiry', description: 'Frango desfiado cremoso com requeijão', price: 4.5 },
  { name: 'Bacon Crocante', description: 'Cubos de bacon frito sequinho', price: 4.5 },
  { name: 'Palmito com Azeitona', description: 'Palmito picado com creme suave e azeitonas', price: 5.0 },
];

const QUICK_GROUP_TEMPLATES = [
  { icon: '🍕', name: 'Pizzas' },
  { icon: '🥟', name: 'Pastéis' },
  { icon: '🥙', name: 'Esfihas' },
  { icon: '🍨', name: 'Açaí & Sorvetes' },
  { icon: '🌮', name: 'Tapiocas & Crepes' },
];

export default function MenuFlavorsTab({
  flavorGroups,
  flavors,
  categories,
  menuItems,
  onChangeFlavorData,
  onCleanupDeletedFlavor,
  onCleanupDeletedGroup,
  onUploadFlavorPhoto,
  onCropFlavorPhoto,
}: MenuFlavorsTabProps) {
  const allGroups = useMemo(
    () => resolveFlavorGroupsWithLegacy(flavorGroups, flavors),
    [flavorGroups, flavors]
  );
  const validExplicitIds = useMemo(
    () => new Set(flavorGroups.map((g) => g.id)),
    [flavorGroups]
  );

  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [importCategoryId, setImportCategoryId] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (allGroups.length === 0) {
      setActiveGroupId('');
      return;
    }
    if (!activeGroupId || !allGroups.some((g) => g.id === activeGroupId)) {
      setActiveGroupId(allGroups[0].id);
    }
  }, [allGroups, activeGroupId]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const activeGroup =
    allGroups.find((g) => g.id === activeGroupId) || allGroups[0] || null;
  const visibleFlavors = activeGroup
    ? getFlavorsInGroup(flavors, activeGroup.id, validExplicitIds)
    : [];

  const ensureGroupByName = (
    name: string,
    icon: string,
    preferredId?: string
  ): { groups: MenuFlavorGroup[]; targetGroup: MenuFlavorGroup } => {
    const cleanName = name.trim();
    const existing = flavorGroups.find(
      (g) =>
        (preferredId && g.id === preferredId) ||
        g.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      return { groups: flavorGroups, targetGroup: existing };
    }
    const created: MenuFlavorGroup = {
      id: preferredId || `grp-${Date.now()}`,
      name: cleanName,
      icon,
    };
    return { groups: [...flavorGroups, created], targetGroup: created };
  };

  const handleCreateGroup = (rawName: string, icon = '🍽️') => {
    const clean = rawName.trim();
    if (!clean) return;
    const { groups: nextGroups, targetGroup } = ensureGroupByName(clean, icon);
    onChangeFlavorData(nextGroups, flavors);
    setActiveGroupId(targetGroup.id);
    setCreatingGroup(false);
    setNewGroupName('');
  };

  const handleConfirmRenameGroup = (groupId: string) => {
    const clean = renameText.trim();
    if (!clean) return;
    if (groupId === UNGROUPED_FLAVOR_GROUP_ID) {
      const created: MenuFlavorGroup = {
        id: `grp-${Date.now()}`,
        name: clean,
        icon: '🍽️',
      };
      const updatedFlavors = flavors.map((fl) =>
        !fl.groupId || !validExplicitIds.has(fl.groupId)
          ? { ...fl, groupId: created.id }
          : fl
      );
      onChangeFlavorData([...flavorGroups, created], updatedFlavors);
      setActiveGroupId(created.id);
    } else {
      onChangeFlavorData(
        flavorGroups.map((g) => (g.id === groupId ? { ...g, name: clean } : g)),
        flavors
      );
    }
    setRenamingGroupId(null);
    setRenameText('');
  };

  const handleDeleteGroup = (group: MenuFlavorGroup) => {
    const count = getFlavorsInGroup(flavors, group.id, validExplicitIds).length;
    if (
      count > 0 &&
      !window.confirm(
        `Excluir o grupo "${group.name}" e seus ${count} sabores?`
      )
    ) {
      return;
    }

    const nextGroups = flavorGroups.filter((g) => g.id !== group.id);
    const nextFlavors = flavors.filter((fl) =>
      group.id === UNGROUPED_FLAVOR_GROUP_ID
        ? Boolean(fl.groupId && validExplicitIds.has(fl.groupId))
        : fl.groupId !== group.id
    );
    onChangeFlavorData(nextGroups, nextFlavors);
    onCleanupDeletedGroup(group.id);
  };

  const handleAddFlavor = () => {
    let nextGroups = flavorGroups;
    let targetGroupId = activeGroup?.id;

    if (!targetGroupId || targetGroupId === UNGROUPED_FLAVOR_GROUP_ID) {
      if (flavorGroups.length === 0) {
        const res = ensureGroupByName('Sabores Principais', '🍕', 'grp-geral');
        nextGroups = res.groups;
        targetGroupId = res.targetGroup.id;
        setActiveGroupId(targetGroupId);
      }
    }

    const newFlavor: MenuFlavor = {
      id: `flavor-${Date.now()}`,
      groupId:
        targetGroupId && targetGroupId !== UNGROUPED_FLAVOR_GROUP_ID
          ? targetGroupId
          : undefined,
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      isAvailable: true,
    };
    onChangeFlavorData(nextGroups, [...flavors, newFlavor]);
  };

  const handleUpdateFlavor = (flavorId: string, patch: Partial<MenuFlavor>) => {
    onChangeFlavorData(
      flavorGroups,
      flavors.map((fl) => (fl.id === flavorId ? { ...fl, ...patch } : fl))
    );
  };

  const handleDeleteFlavor = (flavorId: string) => {
    onChangeFlavorData(
      flavorGroups,
      flavors.filter((fl) => fl.id !== flavorId)
    );
    onCleanupDeletedFlavor(flavorId);
  };

  const handleLoadPreset = (
    groupName: string,
    groupIcon: string,
    preferredGroupId: string,
    presetList: Array<{
      name: string;
      description: string;
      price: number;
      imageUrl?: string;
    }>
  ) => {
    const { groups: nextGroups, targetGroup } = ensureGroupByName(
      groupName,
      groupIcon,
      preferredGroupId
    );
    const now = Date.now();
    const existingInGroup = new Set(
      getFlavorsInGroup(flavors, targetGroup.id, validExplicitIds).map((f) =>
        f.name.trim().toLowerCase()
      )
    );
    const additions: MenuFlavor[] = presetList
      .filter((p) => !existingInGroup.has(p.name.trim().toLowerCase()))
      .map((p, idx) => ({
        id: `flavor-${now}-${idx}`,
        groupId: targetGroup.id,
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl || '',
        isAvailable: true,
      }));

    onChangeFlavorData(nextGroups, [...flavors, ...additions]);
    setActiveGroupId(targetGroup.id);
    if (additions.length > 0) {
      showNotice(
        `✅ ${additions.length} sabores adicionados no grupo "${groupIcon} ${targetGroup.name}"!`
      );
    } else {
      showNotice(`Todos os sabores modelo já existem em "${targetGroup.name}".`);
    }
  };

  const handleImportFromCategory = () => {
    if (!importCategoryId) return;
    const cat = categories.find((c) => c.id === importCategoryId);
    const catItems = menuItems.filter(
      (it) => it.category === importCategoryId && it.name.trim()
    );
    if (catItems.length === 0) {
      showNotice('Essa categoria ainda não possui produtos cadastrados.');
      return;
    }

    const { groups: nextGroups, targetGroup } = ensureGroupByName(
      cat?.name || 'Sabores Importados',
      cat?.icon || '🍽️'
    );
    const existingInGroup = new Set(
      getFlavorsInGroup(flavors, targetGroup.id, validExplicitIds).map((f) =>
        f.name.trim().toLowerCase()
      )
    );
    const now = Date.now();
    const imported: MenuFlavor[] = catItems
      .filter((it) => !existingInGroup.has(it.name.trim().toLowerCase()))
      .map((it, idx) => ({
        id: `flavor-${now}-${idx}`,
        groupId: targetGroup.id,
        name: it.name.trim(),
        description: it.description?.trim() || '',
        price: typeof it.price === 'number' ? it.price : 0,
        imageUrl: it.imageUrl || '',
        isAvailable: it.isAvailable !== false,
      }));

    onChangeFlavorData(nextGroups, [...flavors, ...imported]);
    setActiveGroupId(targetGroup.id);
    if (imported.length === 0) {
      showNotice(`Todos os sabores dessa categoria já estão em "${targetGroup.name}".`);
    } else {
      showNotice(
        `✅ ${imported.length} sabor(es) importado(s) para o grupo separado "${targetGroup.name}"!`
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#121929] border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Pizza className="w-4 h-4 text-amber-400" />
            <span>Grupos &amp; Cadastro de Sabores</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {allGroups.length} grupo(s) • {flavors.length} sabor(es)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Mantenha os sabores organizados por tipo em pastas separadas (ex: <strong>🍕 Pizzas</strong> separado de <strong>🥟 Pastéis</strong>). Depois, em cada produto você escolhe qual pasta/grupo aquele produto usa!
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreatingGroup(true);
            setNewGroupName('');
          }}
          className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-black transition flex items-center gap-1.5 shrink-0 self-start sm:self-center"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Novo Grupo de Sabores</span>
        </button>
      </div>

      {/* Create New Flavor Group Form */}
      {creatingGroup && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-amber-300">
              Criar Pasta / Grupo Separado de Sabores
            </span>
            <button
              type="button"
              onClick={() => setCreatingGroup(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_GROUP_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => handleCreateGroup(tpl.name, tpl.icon)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition"
              >
                {tpl.icon} {tpl.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ou digite um nome personalizado (ex: Pastéis Doces, Esfihas...)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGroup(newGroupName);
              }}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
            <button
              type="button"
              disabled={!newGroupName.trim()}
              onClick={() => handleCreateGroup(newGroupName)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-black transition"
            >
              Criar Grupo
            </button>
          </div>
        </div>
      )}

      {/* Presets & Import Toolbar (creates separate groups automatically!) */}
      <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <FolderInput className="w-3.5 h-3.5 text-sky-400" />
            <span>Importar de categoria (cria grupo próprio):</span>
          </span>
          <select
            value={importCategoryId}
            onChange={(e) => setImportCategoryId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
          >
            <option value="">Escolha uma categoria...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!importCategoryId}
            onClick={handleImportFromCategory}
            className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Importar
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              handleLoadPreset('Pizzas', '🍕', 'grp-pizzas', PIZZA_PRESET_FLAVORS)
            }
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>🍕 Carregar Grupo Pizzas</span>
          </button>
          <button
            type="button"
            onClick={() =>
              handleLoadPreset(
                'Pastéis',
                '🥟',
                'grp-pasteis',
                PASTEL_PRESET_FLAVORS
              )
            }
            className="px-2.5 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-[11px] font-bold transition flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>🥟 Carregar Grupo Pastéis</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="px-3.5 py-2 rounded-xl bg-sky-500/15 border border-sky-500/35 text-xs font-semibold text-sky-200">
          {notice}
        </div>
      )}

      {/* Flavor Group Selector Sub-Tabs */}
      {allGroups.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-1">
          {allGroups.map((grp) => {
            const count = getFlavorsInGroup(
              flavors,
              grp.id,
              validExplicitIds
            ).length;
            const isActive = activeGroup?.id === grp.id;
            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => setActiveGroupId(grp.id)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{grp.icon || '🍽️'}</span>
                <span>{grp.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Group Controls + Flavors List */}
      {!activeGroup ? (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl">
            🍕
          </div>
          <h4 className="text-sm font-bold text-white">
            Crie seu primeiro grupo de sabores separado
          </h4>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            Se você vende pizzas e pastéis (ou outros produtos com vários sabores), crie um grupo para <strong>🍕 Pizzas</strong> e outro grupo para <strong>🥟 Pastéis</strong> nos botões acima!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active Group Bar (Rename, Delete, Add Flavor inside THIS group) */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-2">
              {renamingGroupId === activeGroup.id ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={renameText}
                    onChange={(e) => setRenameText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')
                        handleConfirmRenameGroup(activeGroup.id);
                    }}
                    className="bg-slate-950 border border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleConfirmRenameGroup(activeGroup.id)}
                    className="p-1.5 rounded-lg bg-emerald-500 text-slate-950"
                    title="Salvar nome"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenamingGroupId(null)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-base">{activeGroup.icon || '🍽️'}</span>
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    {activeGroup.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingGroupId(activeGroup.id);
                      setRenameText(
                        activeGroup.id === UNGROUPED_FLAVOR_GROUP_ID
                          ? 'Pizzas'
                          : activeGroup.name
                      );
                    }}
                    className="p-1 text-slate-400 hover:text-emerald-400 rounded-lg transition"
                    title="Renomear grupo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(activeGroup)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded-lg transition"
                    title="Excluir grupo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddFlavor}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-glow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Sabor em {activeGroup.name}</span>
            </button>
          </div>

          {visibleFlavors.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">
                Nenhum sabor dentro do grupo <strong>{activeGroup.name}</strong> ainda.
              </p>
              <button
                type="button"
                onClick={handleAddFlavor}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition"
              >
                + Adicionar Primeiro Sabor em {activeGroup.name}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleFlavors.map((flavor, idx) => (
                <div
                  key={flavor.id}
                  className="p-3.5 rounded-2xl bg-[#121929] border border-slate-800/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 hover:border-slate-700 transition"
                >
                  {/* Photo Upload + Preview Column */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500 w-5">
                      #{idx + 1}
                    </span>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden flex items-center justify-center">
                        {flavor.imageUrl ? (
                          <img
                            src={flavor.imageUrl}
                            alt={flavor.name || 'Sabor'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <label
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-[10px] font-bold text-emerald-300 cursor-pointer transition"
                          title="Enviar foto da galeria/computador"
                        >
                          <Upload className="w-2.5 h-2.5" />
                          <span>Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              if (file) onUploadFlavorPhoto(flavor.id, file);
                            }}
                            className="hidden"
                          />
                        </label>
                        {flavor.imageUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              onCropFlavorPhoto(flavor.id, flavor.imageUrl!)
                            }
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
                            title="Enquadrar foto"
                          >
                            <Crop className="w-2.5 h-2.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateFlavor(flavor.id, {
                                imageUrl: PIZZA_SAMPLE_PHOTO,
                              })
                            }
                            className="px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] transition"
                            title="Aplicar foto padrão"
                          >
                            🍕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Name, Description & URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                        Nome do Sabor:
                      </label>
                      <input
                        type="text"
                        value={flavor.name}
                        placeholder="Ex: Calabresa, Frango c/ Catupiry..."
                        onChange={(e) =>
                          handleUpdateFlavor(flavor.id, { name: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold placeholder-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                        Ingredientes (opcional):
                      </label>
                      <input
                        type="text"
                        value={flavor.description || ''}
                        placeholder="Ex: Mussarela, calabresa fatiada e cebola..."
                        onChange={(e) =>
                          handleUpdateFlavor(flavor.id, {
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                        URL da Foto (opcional):
                      </label>
                      {flavor.imageUrl?.startsWith('data:') ? (
                        <div className="flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-[11px] text-emerald-300">
                          <span className="truncate font-semibold">✅ Foto enviada</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateFlavor(flavor.id, { imageUrl: '' })
                            }
                            className="text-slate-400 hover:text-rose-400 text-[10px] underline shrink-0"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={flavor.imageUrl || ''}
                          placeholder="https://... ou clique em Foto"
                          onChange={(e) =>
                            handleUpdateFlavor(flavor.id, {
                              imageUrl: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-400 font-mono placeholder-slate-600"
                        />
                      )}
                    </div>
                  </div>

                  {/* Group Selector (allows moving a mixed flavor to another group easily!) + Price + Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-between lg:justify-end">
                    {allGroups.length > 1 && (
                      <div className="w-32">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                          Mover p/ Grupo:
                        </label>
                        <select
                          value={
                            flavor.groupId && validExplicitIds.has(flavor.groupId)
                              ? flavor.groupId
                              : UNGROUPED_FLAVOR_GROUP_ID
                          }
                          onChange={(e) => {
                            const nextGrpId =
                              e.target.value === UNGROUPED_FLAVOR_GROUP_ID
                                ? undefined
                                : e.target.value;
                            handleUpdateFlavor(flavor.id, { groupId: nextGrpId });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-[11px] text-slate-200 font-semibold"
                        >
                          {allGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.icon || '🍽️'} {g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="w-32">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                        Valor Sabor (R$):
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={flavor.price === 0 ? '' : flavor.price}
                          placeholder="0,00"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              handleUpdateFlavor(flavor.id, { price: 0 });
                            } else {
                              const parsed = parseFloat(val);
                              handleUpdateFlavor(flavor.id, {
                                price: isNaN(parsed) ? 0 : parsed,
                              });
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-2 py-1.5 text-xs text-emerald-400 font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateFlavor(flavor.id, {
                            isAvailable: flavor.isAvailable === false ? true : false,
                          })
                        }
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                          flavor.isAvailable !== false
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        }`}
                      >
                        {flavor.isAvailable !== false ? 'Ativo' : 'Pausado'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFlavor(flavor.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                        title="Excluir sabor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
