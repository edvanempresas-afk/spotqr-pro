'use client';

import React, { useState } from 'react';
import {
  PlusCircle,
  Sparkles,
  Trash2,
  FolderInput,
  Pizza,
  Upload,
  Crop,
  Image as ImageIcon,
} from 'lucide-react';
import { MenuCategory, MenuFlavor, MenuItem } from '@/lib/types';

interface MenuFlavorsTabProps {
  flavors: MenuFlavor[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  onChangeFlavors: (nextFlavors: MenuFlavor[]) => void;
  onCleanupDeletedFlavor: (flavorId: string) => void;
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

export default function MenuFlavorsTab({
  flavors,
  categories,
  menuItems,
  onChangeFlavors,
  onCleanupDeletedFlavor,
  onUploadFlavorPhoto,
  onCropFlavorPhoto,
}: MenuFlavorsTabProps) {
  const [importCategoryId, setImportCategoryId] = useState<string>('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const handleAddFlavor = () => {
    const newFlavor: MenuFlavor = {
      id: `flavor-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      isAvailable: true,
    };
    onChangeFlavors([...flavors, newFlavor]);
  };

  const handleUpdateFlavor = (flavorId: string, patch: Partial<MenuFlavor>) => {
    onChangeFlavors(
      flavors.map((fl) => (fl.id === flavorId ? { ...fl, ...patch } : fl))
    );
  };

  const handleDeleteFlavor = (flavorId: string) => {
    onChangeFlavors(flavors.filter((fl) => fl.id !== flavorId));
    onCleanupDeletedFlavor(flavorId);
  };

  const handleLoadPreset = (
    presetList: Array<{ name: string; description: string; price: number; imageUrl?: string }>
  ) => {
    const now = Date.now();
    const existingNames = new Set(flavors.map((f) => f.name.trim().toLowerCase()));
    const additions: MenuFlavor[] = presetList
      .filter((p) => !existingNames.has(p.name.trim().toLowerCase()))
      .map((p, idx) => ({
        id: `flavor-${now}-${idx}`,
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl || '',
        isAvailable: true,
      }));
    if (additions.length === 0) return;
    onChangeFlavors([...flavors, ...additions]);
  };

  const handleImportFromCategory = () => {
    if (!importCategoryId) return;
    const catItems = menuItems.filter(
      (it) => it.category === importCategoryId && it.name.trim()
    );
    if (catItems.length === 0) {
      setImportNotice('Essa categoria ainda não possui produtos cadastrados.');
      setTimeout(() => setImportNotice(null), 3500);
      return;
    }

    const existingNames = new Set(flavors.map((f) => f.name.trim().toLowerCase()));
    const now = Date.now();
    const imported: MenuFlavor[] = catItems
      .filter((it) => !existingNames.has(it.name.trim().toLowerCase()))
      .map((it, idx) => ({
        id: `flavor-${now}-${idx}`,
        name: it.name.trim(),
        description: it.description?.trim() || '',
        price: typeof it.price === 'number' ? it.price : 0,
        imageUrl: it.imageUrl || '',
        isAvailable: it.isAvailable !== false,
      }));

    if (imported.length === 0) {
      setImportNotice('Todos os itens dessa categoria já estão na lista de sabores.');
    } else {
      onChangeFlavors([...flavors, ...imported]);
      setImportNotice(
        `✅ ${imported.length} ${imported.length === 1 ? 'sabor importado (com fotos!)' : 'sabores importados (com fotos!)'} com sucesso!`
      );
    }
    setTimeout(() => setImportNotice(null), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#121929] border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Pizza className="w-4 h-4 text-amber-400" />
            <span>Cadastro Geral de Sabores &amp; Recheios</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {flavors.length} cadastrado(s)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Cadastre os sabores uma única vez com foto, ingredientes e preço (ou importe de uma categoria pronta). A foto aparece ao lado de cada sabor na escolha do cliente!
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddFlavor}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-glow shrink-0 self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Sabor</span>
        </button>
      </div>

      {/* Quick Import from Menu Category & Presets */}
      <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <FolderInput className="w-3.5 h-3.5 text-sky-400" />
            <span>Importar de categoria do cardápio:</span>
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
            Importar Sabores
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleLoadPreset(PIZZA_PRESET_FLAVORS)}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>🍕 Sabores Pizzaria</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadPreset(PASTEL_PRESET_FLAVORS)}
            className="px-2.5 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-[11px] font-bold transition flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>🥟 Sabores Pastelaria</span>
          </button>
        </div>
      </div>

      {importNotice && (
        <div className="px-3.5 py-2 rounded-xl bg-sky-500/15 border border-sky-500/35 text-xs font-semibold text-sky-200">
          {importNotice}
        </div>
      )}

      {/* Flavor List */}
      {flavors.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl">
            🍕
          </div>
          <h4 className="text-sm font-bold text-white">
            Nenhum sabor cadastrado ainda na aba de Sabores
          </h4>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            Você pode cadastrar sabores aqui com foto (ou importar uma categoria pronta acima). Nos produtos você também pode puxar os sabores direto de qualquer categoria do cardápio — já trazendo as fotos de cada item automaticamente!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {flavors.map((flavor, idx) => (
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
                        onClick={() => onCropFlavorPhoto(flavor.id, flavor.imageUrl!)}
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
                        title="Aplicar foto padrão de pizza"
                      >
                        🍕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name, Description & Image URL */}
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
                        onClick={() => handleUpdateFlavor(flavor.id, { imageUrl: '' })}
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
                        handleUpdateFlavor(flavor.id, { imageUrl: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-400 font-mono placeholder-slate-600"
                    />
                  )}
                </div>
              </div>

              {/* Price & Availability Actions */}
              <div className="flex items-center gap-3 shrink-0 justify-between lg:justify-end">
                <div className="w-36">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                    Valor Sabor / Extra (R$):
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
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-emerald-400 font-bold"
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
  );
}
