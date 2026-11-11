'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Utensils,
  ShoppingBag,
  Sparkles,
  Check,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Wifi,
  MapPin,
  Clock,
  Phone,
  Layers,
  ExternalLink,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { RestaurantMenu, MenuItem, MenuCategory } from '@/lib/types';
import { compressImageFileToDataUrl } from '@/lib/image-upload';

interface MenuEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  mode?: 'menu' | 'catalog';
  onSaved?: () => void;
}

const FOOD_IMAGE_PRESETS = [
  {
    label: '🍔 Burger',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: '🍕 Pizza',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: '🍟 Porção',
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: '🥩 Prato / Carne',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: '🥤 Drink / Shake',
    url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: '🍰 Sobremesa',
    url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&auto=format&fit=crop&q=80',
  },
];

const CATALOG_IMAGE_PRESETS = [
  { label: '🖨️ 3D', url: '/catalogo/prod-3d.jpg' },
  { label: '👕 Moda', url: '/catalogo/prod-roupa.jpg' },
  { label: '🧶 Artesanato', url: '/catalogo/prod-artesanato.jpg' },
  { label: '🕯️ Presente', url: '/catalogo/prod-vela.jpg' },
];

const COVER_IMAGE_PRESETS = [
  { label: '🛍️ Ateliê & Loja', url: '/catalogo/cover-loja.jpg' },
  {
    label: '🍔 Restaurante Gourmet',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
  },
  { label: '🧶 Artesanato Decor', url: '/catalogo/prod-artesanato.jpg' },
  { label: '👕 Boutique Minimal', url: '/catalogo/prod-roupa.jpg' },
];

export default function MenuEditorModal({
  isOpen,
  onClose,
  slug,
  mode = 'menu',
  onSaved,
}: MenuEditorModalProps) {
  const [menu, setMenu] = useState<RestaurantMenu | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'info' | 'categories' | 'items' | 'branding'
  >('items');
  const [newCategoryName, setNewCategoryName] = useState('');

  const isCatalog = (menu?.mode || mode) === 'catalog';
  const activePresets = isCatalog ? CATALOG_IMAGE_PRESETS : FOOD_IMAGE_PRESETS;
  const imagePos: 'left' | 'right' = menu?.productImagePosition || 'right';
  const defaultFulfill = !isCatalog;
  const allowDelivery = menu?.allowDelivery ?? defaultFulfill;
  const allowPickup = menu?.allowPickup ?? defaultFulfill;
  const allowOnSite = menu?.allowOnSite ?? defaultFulfill;

  useEffect(() => {
    if (!isOpen || !slug) return;
    setLoading(true);
    fetch(`/api/cardapio?slug=${encodeURIComponent(slug)}&mode=${mode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setMenu(data);
        }
      })
      .catch((err) => console.error('Error loading showcase for editor:', err))
      .finally(() => setLoading(false));
  }, [isOpen, slug, mode]);

  if (!isOpen) return null;

  const handleSaveMenu = async () => {
    if (!menu) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const payload: RestaurantMenu = {
        ...menu,
        mode: menu.mode || mode,
        allowDelivery,
        allowPickup,
        allowOnSite,
        productImagePosition: imagePos,
      };
      const res = await fetch('/api/cardapio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSavedSuccess(true);
        if (onSaved) onSaved();
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving menu:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!menu || !newCategoryName.trim()) return;
    const newCat: MenuCategory = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
    };
    setMenu({
      ...menu,
      categories: [...menu.categories, newCat],
    });
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catId: string) => {
    if (!menu) return;
    if (menu.categories.length <= 1) {
      alert('O cardápio precisa ter pelo menos 1 categoria.');
      return;
    }
    setMenu({
      ...menu,
      categories: menu.categories.filter((c) => c.id !== catId),
    });
  };

  const handleAddItem = () => {
    if (!menu) return;
    const defaultCat = menu.categories[0]?.id || 'cat-1';
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: isCatalog ? 'Novo Produto da Loja' : 'Novo Prato ou Bebida',
      description: isCatalog
        ? 'Informe detalhes como material, tamanhos, cores disponíveis ou personalização.'
        : 'Descrição saborosa dos ingredientes e acompanhamento.',
      price: isCatalog ? 59.9 : 29.9,
      category: defaultCat,
      imageUrl: activePresets[0].url,
      badge: 'Novo',
      isAvailable: true,
    };
    setMenu({
      ...menu,
      items: [newItem, ...menu.items],
    });
  };

  const handleUpdateItem = (itemId: string, patch: Partial<MenuItem>) => {
    if (!menu) return;
    setMenu({
      ...menu,
      items: menu.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!menu) return;
    setMenu({
      ...menu,
      items: menu.items.filter((it) => it.id !== itemId),
    });
  };

  const handleProductPhotoUpload = async (
    itemId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingTarget(`item-${itemId}`);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 'product');
      handleUpdateItem(itemId, { imageUrl: dataUrl });
    } catch (err: any) {
      alert(err?.message || 'Erro ao enviar foto do produto.');
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleBrandImageUpload = async (
    field: 'logoImage' | 'coverImage',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !menu) return;
    setUploadingTarget(field);
    try {
      const preset = field === 'logoImage' ? 'logo' : 'cover';
      const dataUrl = await compressImageFileToDataUrl(file, preset);
      setMenu((prev) => (prev ? { ...prev, [field]: dataUrl } : prev));
    } catch (err: any) {
      alert(err?.message || 'Erro ao enviar imagem.');
    } finally {
      setUploadingTarget(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#101726] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-[#0d1320]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              {isCatalog ? (
                <ShoppingBag className="w-5 h-5" />
              ) : (
                <Utensils className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {isCatalog
                  ? 'Editor de Catálogo Digital:'
                  : 'Editor de Cardápio Digital:'}{' '}
                <span className="text-emerald-400">/{slug}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Altere preços, fotos, categorias ou pause produtos esgotados em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/${isCatalog ? 'catalogo' : 'cardapio'}/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <span>Ver ao Vivo</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>

            <button
              onClick={handleSaveMenu}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-glow"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/60 gap-4 overflow-x-auto">
          {[
            {
              id: 'items',
              label: isCatalog
                ? `🛍️ Produtos (${menu?.items.length || 0})`
                : `🍔 Pratos & Produtos (${menu?.items.length || 0})`,
            },
            {
              id: 'branding',
              label: '🎨 Logo & Imagem de Fundo',
            },
            { id: 'categories', label: `📂 Categorias (${menu?.categories.length || 0})` },
            {
              id: 'info',
              label: isCatalog
                ? '⚙️ Dados da Loja, WhatsApp & PIX'
                : '⚙️ Dados do Restaurante, WhatsApp & PIX',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading || !menu ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              {isCatalog
                ? 'Carregando editor de catálogo...'
                : 'Carregando editor de cardápio...'}
            </div>
          ) : (
            <>
              {/* TAB 1: PRODUCTS / ITEMS */}
              {activeTab === 'items' && (
                <div className="space-y-4">
                  {/* Quick Visual & Fulfillment Bar: Photo Side + Shipping/Pickup */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-300">
                        📸 Posição da Foto:
                      </span>
                      <div className="inline-flex bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setMenu({ ...menu, productImagePosition: 'left' })
                          }
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                            imagePos === 'left'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          ◧ Lado Esquerdo
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setMenu({ ...menu, productImagePosition: 'right' })
                          }
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                            imagePos === 'right'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          ◨ Lado Direito
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-300">
                        🚚 Entrega / Retirada no Menu:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setMenu({ ...menu, allowDelivery: !allowDelivery })
                        }
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                          allowDelivery
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {allowDelivery ? '✅' : '○'}{' '}
                        {isCatalog ? 'Fazemos Envio' : 'Delivery'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setMenu({ ...menu, allowPickup: !allowPickup })
                        }
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                          allowPickup
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {allowPickup ? '✅' : '○'} Retirada no Local
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setMenu({ ...menu, allowOnSite: !allowOnSite })
                        }
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                          allowOnSite
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {allowOnSite ? '✅' : '○'}{' '}
                        {isCatalog ? 'Presencial / Balcão' : 'Na Mesa'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Adicione seus itens, ajuste os preços ou marque como <strong>Esgotado</strong> quando acabar no estoque.
                    </p>
                    <button
                      onClick={handleAddItem}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Produto</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {menu.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition ${
                          item.isAvailable
                            ? 'bg-slate-900/70 border-slate-800'
                            : 'bg-rose-950/20 border-rose-500/30 opacity-75'
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          {/* Image preview + Direct Upload from PC/Mobile */}
                          <div className="md:col-span-2 flex flex-col items-center gap-2">
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                              <img
                                src={item.imageUrl || activePresets[0].url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <label className="w-full max-w-[112px] flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer transition text-center">
                              <Upload className="w-3 h-3 shrink-0" />
                              <span>
                                {uploadingTarget === `item-${item.id}`
                                  ? 'Enviando...'
                                  : 'Enviar Foto'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleProductPhotoUpload(item.id, e)
                                }
                                className="hidden"
                              />
                            </label>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {activePresets.slice(0, 4).map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateItem(item.id, { imageUrl: preset.url })
                                  }
                                  className="text-[10px] bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded text-slate-300"
                                  title={`Usar foto ${preset.label}`}
                                >
                                  {preset.label.split(' ')[0]}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Fields */}
                          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                                {isCatalog ? 'Nome do Produto:' : 'Nome do Prato / Produto:'}
                              </label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, { name: e.target.value })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                                Preço (R$):
                              </label>
                              <input
                                type="number"
                                step="0.10"
                                value={item.price}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, {
                                    price: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                                {isCatalog
                                  ? 'Descrição, Tamanhos, Cores ou Material:'
                                  : 'Descrição e Ingredientes:'}
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, {
                                    description: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                                Categoria:
                              </label>
                              <select
                                value={item.category}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, { category: e.target.value })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                              >
                                {menu.categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                                Selo de Destaque:
                              </label>
                              <select
                                value={item.badge || ''}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, {
                                    badge: e.target.value || undefined,
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-400"
                              >
                                <option value="">Sem selo</option>
                                <option value="Mais Vendido">🔥 Mais Vendido</option>
                                <option value="Promoção">💸 Promoção</option>
                                <option value="Novo">✨ Novo</option>
                                <option value="Pronta Entrega">📦 Pronta Entrega</option>
                                <option value="Sob Encomenda">🛠️ Sob Encomenda</option>
                                <option value="Feito à Mão">🧶 Feito à Mão</option>
                                <option value="Exclusivo">💎 Exclusivo</option>
                                {!isCatalog && (
                                  <>
                                    <option value="Chef Especial">⭐ Chef Especial</option>
                                    <option value="Vegetariano">🌿 Vegetariano</option>
                                  </>
                                )}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                                Foto do Produto (Upload ou URL):
                              </label>
                              {item.imageUrl?.startsWith('data:') ? (
                                <div className="flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-[11px] text-emerald-300">
                                  <span className="truncate font-semibold">
                                    ✅ Foto própria enviada
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateItem(item.id, { imageUrl: '' })
                                    }
                                    className="text-slate-400 hover:text-rose-400 text-[10px] underline shrink-0"
                                  >
                                    Remover
                                  </button>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={item.imageUrl || ''}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, { imageUrl: e.target.value })
                                  }
                                  placeholder="https://... ou use Enviar Foto"
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-400 font-mono"
                                />
                              )}
                            </div>
                          </div>

                          {/* Availability & Delete Actions */}
                          <div className="md:col-span-2 flex md:flex-col items-end justify-between gap-2 h-full">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(item.id, {
                                  isAvailable: !item.isAvailable,
                                })
                              }
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                                item.isAvailable
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                  : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                              }`}
                            >
                              {item.isAvailable ? '✅ Disponível' : '🚫 Esgotado'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                              title="Excluir produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: BRANDING (LOGO & BACKGROUND COVER) */}
              {activeTab === 'branding' && (() => {
                const defaultCover = isCatalog
                  ? '/catalogo/cover-loja.jpg'
                  : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80';
                return (
                  <div className="space-y-6 max-w-3xl">
                    {/* Live Header Mini Preview */}
                    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#090d14]">
                      <div className="relative h-28 sm:h-36 bg-slate-900">
                        <img
                          src={menu.coverImage || defaultCover}
                          alt="Capa da vitrine"
                          className="w-full h-full object-cover opacity-65"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#090d14] via-[#090d14]/40 to-transparent" />
                        <span className="absolute top-2.5 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-slate-300 border border-white/10">
                          Prévia do Cabeçalho
                        </span>
                      </div>
                      <div className="px-4 pb-4 -mt-8 relative z-10">
                        <div className="bg-[#121929]/95 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xl">
                          <div className="w-14 h-14 rounded-xl border-2 border-emerald-500/40 bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
                            {menu.logoImage ? (
                              <img
                                src={menu.logoImage}
                                alt="Logo"
                                className="w-full h-full object-cover"
                              />
                            ) : isCatalog ? (
                              <ShoppingBag className="w-7 h-7 text-emerald-400" />
                            ) : (
                              <Utensils className="w-7 h-7 text-emerald-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-white truncate">
                              {menu.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {menu.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Logo & Cover Upload Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Company Logo Card */}
                      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-emerald-400" />
                            <span>Logo da Empresa (Cabeçalho)</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Aparece no quadrado ao lado do nome da sua empresa.
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-xl border border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
                            {menu.logoImage ? (
                              <img
                                src={menu.logoImage}
                                alt="Logo atual"
                                className="w-full h-full object-cover"
                              />
                            ) : isCatalog ? (
                              <ShoppingBag className="w-7 h-7 text-slate-600" />
                            ) : (
                              <Utensils className="w-7 h-7 text-slate-600" />
                            )}
                          </div>

                          <div className="flex-1 space-y-2">
                            <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold cursor-pointer transition shadow-sm">
                              <Upload className="w-3.5 h-3.5" />
                              <span>
                                {uploadingTarget === 'logoImage'
                                  ? 'Enviando Logo...'
                                  : 'Upload da Logo'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleBrandImageUpload('logoImage', e)
                                }
                                className="hidden"
                              />
                            </label>

                            {menu.logoImage && (
                              <button
                                type="button"
                                onClick={() =>
                                  setMenu({ ...menu, logoImage: '' })
                                }
                                className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-lg text-[11px] font-semibold transition"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remover Logo (Usar Ícone)</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {!menu.logoImage?.startsWith('data:') && (
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                              Ou cole URL da Logo:
                            </label>
                            <input
                              type="text"
                              value={menu.logoImage || ''}
                              onChange={(e) =>
                                setMenu({ ...menu, logoImage: e.target.value })
                              }
                              placeholder="https://..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono"
                            />
                          </div>
                        )}
                      </div>

                      {/* Cover Background Image Card */}
                      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-amber-400" />
                            <span>Imagem de Fundo (Banner Topo)</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Foto ampla exibida no topo atrás do cartão da loja.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold cursor-pointer transition shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {uploadingTarget === 'coverImage'
                                ? 'Enviando Fundo...'
                                : 'Upload Imagem de Fundo'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleBrandImageUpload('coverImage', e)
                              }
                              className="hidden"
                            />
                          </label>

                          <div className="flex flex-wrap gap-1.5">
                            {COVER_IMAGE_PRESETS.map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() =>
                                  setMenu({ ...menu, coverImage: preset.url })
                                }
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-semibold text-slate-300 transition"
                              >
                                {preset.label}
                              </button>
                            ))}
                            {menu.coverImage && (
                              <button
                                type="button"
                                onClick={() =>
                                  setMenu({ ...menu, coverImage: '' })
                                }
                                className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-semibold text-slate-400 flex items-center gap-1 transition"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Padrão</span>
                              </button>
                            )}
                          </div>

                          {menu.coverImage?.startsWith('data:') ? (
                            <div className="flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-[11px] text-emerald-300">
                              <span className="font-semibold">
                                ✅ Imagem de fundo própria enviada
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setMenu({ ...menu, coverImage: '' })
                                }
                                className="text-slate-400 hover:text-rose-400 text-[10px] underline"
                              >
                                Remover
                              </button>
                            </div>
                          ) : (
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                                Ou cole URL da Capa:
                              </label>
                              <input
                                type="text"
                                value={menu.coverImage || ''}
                                onChange={(e) =>
                                  setMenu({
                                    ...menu,
                                    coverImage: e.target.value,
                                  })
                                }
                                placeholder="https://..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 flex items-center justify-between gap-3">
                      <span>
                        💡 Depois de escolher sua logo, foto de fundo ou fotos dos produtos, clique em <strong>Salvar Alterações</strong> no topo para publicar no ar.
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* TAB 2: CATEGORIES */}
              {activeTab === 'categories' && (
                <div className="space-y-4 max-w-xl">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={
                        isCatalog
                          ? 'Ex: 🖨️ Impressões 3D • 👕 Camisetas'
                          : 'Ex: 🍕 Pizzas Artesanais'
                      }
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                    />
                    <button
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {menu.categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
                      >
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) =>
                            setMenu({
                              ...menu,
                              categories: menu.categories.map((c) =>
                                c.id === cat.id ? { ...c, name: e.target.value } : c
                              ),
                            })
                          }
                          className="bg-transparent text-xs font-bold text-white outline-none flex-1"
                        />
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: INFO & WHATSAPP/PIX */}
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                  <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Formato da Vitrine Digital
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isCatalog
                          ? 'Catálogo de Produtos (Roupas, Artesanato, 3D e Lojas)'
                          : 'Cardápio Digital (Restaurantes, Bares e Delivery)'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMenu({ ...menu, mode: 'menu' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          !isCatalog
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        🍔 Cardápio
                      </button>
                      <button
                        type="button"
                        onClick={() => setMenu({ ...menu, mode: 'catalog' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          isCatalog
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        🛍️ Catálogo / Loja
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {isCatalog ? 'Nome da Loja / Marca:' : 'Nome do Restaurante:'}
                    </label>
                    <input
                      type="text"
                      value={menu.title}
                      onChange={(e) => setMenu({ ...menu, title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      WhatsApp Recebedor de Pedidos (com DDD):
                    </label>
                    <input
                      type="text"
                      value={menu.whatsappNumber}
                      onChange={(e) =>
                        setMenu({ ...menu, whatsappNumber: e.target.value })
                      }
                      placeholder="5511999998888"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Descrição / Slogan de Boas-vindas:
                    </label>
                    <input
                      type="text"
                      value={menu.description}
                      onChange={(e) =>
                        setMenu({ ...menu, description: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {isCatalog
                        ? 'Chave PIX (Para recebimento de pedidos):'
                        : 'Chave PIX (Para pagamento da conta na mesa):'}
                    </label>
                    <input
                      type="text"
                      value={menu.pixKey || ''}
                      onChange={(e) => setMenu({ ...menu, pixKey: e.target.value })}
                      placeholder="CNPJ, E-mail ou Celular"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Horário de Atendimento:
                    </label>
                    <input
                      type="text"
                      value={menu.openingHours || ''}
                      onChange={(e) =>
                        setMenu({ ...menu, openingHours: e.target.value })
                      }
                      placeholder={
                        isCatalog ? 'Seg a Sáb • 09h às 19h' : 'Ter a Dom • 18h às 23h30'
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {isCatalog ? 'Localização / Cidade:' : 'Endereço do Estabelecimento:'}
                    </label>
                    <input
                      type="text"
                      value={menu.address || ''}
                      onChange={(e) => setMenu({ ...menu, address: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Wi-Fi para Clientes (opcional):
                    </label>
                    <input
                      type="text"
                      value={menu.wifiInfo || ''}
                      onChange={(e) => setMenu({ ...menu, wifiInfo: e.target.value })}
                      placeholder="Rede_Cliente | Senha: 123"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  {/* Layout & Fulfillment Controls in Settings Tab */}
                  <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                    <div>
                      <span className="text-xs font-bold text-white block mb-1">
                        📸 Posição da Foto dos Produtos
                      </span>
                      <p className="text-[11px] text-slate-400 mb-2.5">
                        Escolha em qual lado do cartão a foto do item aparece para seus clientes:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setMenu({ ...menu, productImagePosition: 'left' })
                          }
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                            imagePos === 'left'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          ◧ Lado Esquerdo
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setMenu({ ...menu, productImagePosition: 'right' })
                          }
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                            imagePos === 'right'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          ◨ Lado Direito
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-white block mb-1">
                        🚚 Opções de Envio & Retirada
                      </span>
                      <p className="text-[11px] text-slate-400 mb-2.5">
                        Só aparece no site público o que você marcar abaixo:
                      </p>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowDelivery}
                            onChange={(e) =>
                              setMenu({ ...menu, allowDelivery: e.target.checked })
                            }
                            className="accent-emerald-500 w-4 h-4"
                          />
                          <span>
                            {isCatalog
                              ? 'Fazemos Envio / Entrega (Correios, Motoboy, etc.)'
                              : 'Fazemos Delivery / Entrega'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowPickup}
                            onChange={(e) =>
                              setMenu({ ...menu, allowPickup: e.target.checked })
                            }
                            className="accent-emerald-500 w-4 h-4"
                          />
                          <span>Aceita Retirada no Local / Loja</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowOnSite}
                            onChange={(e) =>
                              setMenu({ ...menu, allowOnSite: e.target.checked })
                            }
                            className="accent-emerald-500 w-4 h-4"
                          />
                          <span>
                            {isCatalog
                              ? 'Atendimento Presencial / Balcão'
                              : 'Pedidos na Mesa (QR nas Mesas)'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {isCatalog ? 'Taxa de Entrega / Frete Fixo (R$):' : 'Taxa de Entrega Delivery (R$):'}
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      disabled={!allowDelivery}
                      value={menu.deliveryFee || 0}
                      onChange={(e) =>
                        setMenu({
                          ...menu,
                          deliveryFee: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white ${
                        !allowDelivery ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                    {!allowDelivery && (
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Ative "Fazemos Envio / Delivery" acima para configurar frete.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isCatalog ? 'Status da Loja' : 'Status da Cozinha / Loja'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {menu.isOpen !== false
                          ? 'Aceitando pedidos normalmente'
                          : 'Loja fechada temporariamente'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setMenu({ ...menu, isOpen: menu.isOpen === false ? true : false })
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        menu.isOpen !== false
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {menu.isOpen !== false ? '🟢 Aberto' : '🔴 Fechado'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

