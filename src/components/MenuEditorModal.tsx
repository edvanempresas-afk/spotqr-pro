'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Utensils,
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
} from 'lucide-react';
import { RestaurantMenu, MenuItem, MenuCategory } from '@/lib/types';

interface MenuEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
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

export default function MenuEditorModal({
  isOpen,
  onClose,
  slug,
  onSaved,
}: MenuEditorModalProps) {
  const [menu, setMenu] = useState<RestaurantMenu | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'categories' | 'items'>('items');
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (!isOpen || !slug) return;
    setLoading(true);
    fetch(`/api/cardapio?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setMenu(data);
        }
      })
      .catch((err) => console.error('Error loading menu for editor:', err))
      .finally(() => setLoading(false));
  }, [isOpen, slug]);

  if (!isOpen) return null;

  const handleSaveMenu = async () => {
    if (!menu) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/cardapio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu),
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
      name: 'Novo Prato ou Bebida',
      description: 'Descrição saborosa dos ingredientes e acompanhamento.',
      price: 29.9,
      category: defaultCat,
      imageUrl: FOOD_IMAGE_PRESETS[0].url,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#101726] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-[#0d1320]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Editor de Cardápio Digital: <span className="text-emerald-400">/{slug}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Altere preços, fotos, categorias ou pause produtos esgotados em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/cardapio/${slug}`}
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
            { id: 'items', label: `🍔 Pratos & Produtos (${menu?.items.length || 0})` },
            { id: 'categories', label: `📂 Categorias (${menu?.categories.length || 0})` },
            { id: 'info', label: '⚙️ Dados do Restaurante, WhatsApp & PIX' },
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
              Carregando editor de cardápio...
            </div>
          ) : (
            <>
              {/* TAB 1: PRODUCTS / ITEMS */}
              {activeTab === 'items' && (
                <div className="space-y-4">
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
                          {/* Image preview */}
                          <div className="md:col-span-2 flex flex-col items-center gap-2">
                            <img
                              src={
                                item.imageUrl ||
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'
                              }
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-xl border border-slate-700"
                            />
                            <div className="flex flex-wrap gap-1 justify-center">
                              {FOOD_IMAGE_PRESETS.slice(0, 3).map((preset) => (
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
                                Nome do Prato / Produto:
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
                                Descrição e Ingredientes:
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
                                <option value="Chef Especial">⭐ Chef Especial</option>
                                <option value="Promoção">💸 Promoção</option>
                                <option value="Novo">✨ Novo</option>
                                <option value="Vegetariano">🌿 Vegetariano</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                                URL da Foto:
                              </label>
                              <input
                                type="text"
                                value={item.imageUrl || ''}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, { imageUrl: e.target.value })
                                }
                                placeholder="https://..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-400 font-mono"
                              />
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

              {/* TAB 2: CATEGORIES */}
              {activeTab === 'categories' && (
                <div className="space-y-4 max-w-xl">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ex: 🍕 Pizzas Artesanais"
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

              {/* TAB 3: RESTAURANT INFO & WHATSAPP/PIX */}
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nome do Restaurante:
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
                      Chave PIX (Para pagamento da conta na mesa):
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
                      Horário de Funcionamento:
                    </label>
                    <input
                      type="text"
                      value={menu.openingHours || ''}
                      onChange={(e) =>
                        setMenu({ ...menu, openingHours: e.target.value })
                      }
                      placeholder="Ter a Dom • 18h às 23h30"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Endereço do Estabelecimento:
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
                      Wi-Fi para Clientes (Rede e Senha):
                    </label>
                    <input
                      type="text"
                      value={menu.wifiInfo || ''}
                      onChange={(e) => setMenu({ ...menu, wifiInfo: e.target.value })}
                      placeholder="Rede_Cliente | Senha: 123"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Taxa de Entrega Delivery (R$):
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      value={menu.deliveryFee || 0}
                      onChange={(e) =>
                        setMenu({
                          ...menu,
                          deliveryFee: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Status da Cozinha / Loja
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

