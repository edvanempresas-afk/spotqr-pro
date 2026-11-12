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
  GripVertical,
  ArrowUp,
  ArrowDown,
  Crop,
  Download,
  Sun,
  Moon,
  Palette,
  ShoppingCart,
  Video,
  Lock,
  Loader2,
} from 'lucide-react';
import {
  RestaurantMenu,
  MenuItem,
  MenuCategory,
  ProductStockMode,
  ShowcasePaymentMethod,
  QRConfig,
} from '@/lib/types';
import { ImageUploadPreset } from '@/lib/image-upload';
import { processCoverVideoFile } from '@/lib/video-upload';
import { getItemStockInfo } from '@/lib/stock';
import { isProStillValid, getProRenewalAlert } from '@/lib/pro-status';
import {
  SHOWCASE_PAYMENT_OPTIONS,
  getAcceptedPaymentsList,
} from '@/lib/payments';
import {
  SHOWCASE_COLOR_PRESETS,
  normalizeHexColor,
  resolveShowcaseTheme,
  getContrastTextColor,
  getReadableAccentTextColor,
} from '@/lib/theme';
import { renderStyledQR, getDefaultFrameTexts } from '@/lib/qr-canvas';
import ImageCropModal from './ImageCropModal';

interface MenuEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  mode?: 'menu' | 'catalog';
  defaultTitle?: string;
  onSaved?: () => void;
  onDownloadQR?: (menu?: RestaurantMenu) => void | Promise<void>;
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
  defaultTitle,
  onSaved,
  onDownloadQR,
}: MenuEditorModalProps) {
  const [menu, setMenu] = useState<RestaurantMenu | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openingPreview, setOpeningPreview] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'info' | 'categories' | 'items' | 'branding'
  >('items');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Image Crop / Framing Modal state
  const [cropSession, setCropSession] = useState<{
    src: string;
    isObjectUrl: boolean;
    preset: ImageUploadPreset;
    target:
      | { kind: 'item'; itemId: string }
      | { kind: 'brand'; field: 'logoImage' | 'coverImage' };
  } | null>(null);

  // Drag & Drop snap-card ordering state
  const [dragArmedId, setDragArmedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const isCatalog = (menu?.mode || mode) === 'catalog';
  const activePresets = isCatalog ? CATALOG_IMAGE_PRESETS : FOOD_IMAGE_PRESETS;
  const imagePos: 'left' | 'right' = menu?.productImagePosition || 'right';
  const defaultFulfill = !isCatalog;
  const allowDelivery = menu?.allowDelivery ?? defaultFulfill;
  const allowPickup = menu?.allowPickup ?? defaultFulfill;
  const allowOnSite = menu?.allowOnSite ?? defaultFulfill;
  const acceptedPayments = getAcceptedPaymentsList(menu);

  const toggleAcceptedPayment = (method: ShowcasePaymentMethod) => {
    if (!menu) return;
    const current = getAcceptedPaymentsList(menu);
    const next = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    setMenu({ ...menu, acceptedPayments: next });
  };

  useEffect(() => {
    if (!isOpen || !slug) return;
    setLoading(true);
    const titleQuery = defaultTitle
      ? `&title=${encodeURIComponent(defaultTitle)}`
      : '';
    fetch(
      `/api/cardapio?slug=${encodeURIComponent(slug)}&mode=${mode}${titleQuery}&t=${Date.now()}`,
      { cache: 'no-store' }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          let resolved: RestaurantMenu = data;
          if (typeof window !== 'undefined') {
            try {
              const rawDraft = localStorage.getItem(`spotqr_live_showcase_${slug}`);
              if (rawDraft) {
                const draft: RestaurantMenu = JSON.parse(rawDraft);
                const draftTime = new Date(draft.updatedAt || 0).getTime();
                const serverTime = new Date(data.updatedAt || 0).getTime();
                if (draftTime > serverTime) {
                  resolved = {
                    ...draft,
                    isPaid: data.isPaid,
                    proExpiresAt: data.proExpiresAt || null,
                  } as RestaurantMenu;
                }
              }
            } catch {
              // Ignore localStorage parse failures
            }
          }
          setMenu(resolved);
        }
      })
      .catch((err) => console.error('Error loading showcase for editor:', err))
      .finally(() => setLoading(false));
  }, [isOpen, slug, mode, defaultTitle]);

  if (!isOpen) return null;

  const proMeta = menu as
    | (RestaurantMenu & {
        isPaid?: boolean;
        proExpiresAt?: string | null;
        autoRenewSummary?: {
          enabled: boolean;
          status: 'active' | 'past_due' | 'canceled' | 'suspended_free';
          graceEndsAt?: string | null;
          retryCount: number;
          lastError?: string | null;
        } | null;
      })
    | null;
  const isProShowcase = Boolean(
    proMeta &&
      (isProStillValid({
        slug,
        isPaid: proMeta.isPaid,
        proExpiresAt: proMeta.proExpiresAt,
        autoRenew: proMeta.autoRenewSummary || undefined,
      }) ||
        slug === 'demo-restaurante' ||
        slug === 'demo-catalogo')
  );
  const editorRenewalAlert = proMeta
    ? getProRenewalAlert({
        slug,
        isPaid: proMeta.isPaid,
        proExpiresAt: proMeta.proExpiresAt,
        autoRenew: proMeta.autoRenewSummary || undefined,
      })
    : null;

  const buildCurrentPayload = (source: RestaurantMenu): RestaurantMenu => ({
    ...source,
    mode: source.mode || mode,
    allowDelivery: source.allowDelivery ?? !( (source.mode || mode) === 'catalog' ),
    allowPickup: source.allowPickup ?? !( (source.mode || mode) === 'catalog' ),
    allowOnSite: source.allowOnSite ?? !( (source.mode || mode) === 'catalog' ),
    acceptedPayments: getAcceptedPaymentsList(source),
    themeMode: source.themeMode === 'light' ? 'light' : 'dark',
    themeColor: normalizeHexColor(
      source.themeColor,
      (source.mode || mode) === 'catalog' ? '#10b981' : '#16a34a'
    ),
    productImagePosition: source.productImagePosition || 'right',
    updatedAt: new Date().toISOString(),
  });

  const persistShowcase = async (): Promise<boolean> => {
    if (!menu) return false;
    const payload = buildCurrentPayload(menu);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `spotqr_live_showcase_${slug}`,
          JSON.stringify(payload)
        );
      } catch {
        // Ignore quota exceeded on private browsing
      }
    }
    try {
      const res = await fetch('/api/cardapio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMenu(payload);
        if (onSaved) onSaved();
        return true;
      }
    } catch (err) {
      console.error('Error saving showcase:', err);
    }
    return false;
  };

  const handleSaveMenu = async () => {
    if (!menu) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const ok = await persistShowcase();
      if (ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 6000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!menu) return;
    setDownloadingQR(true);
    try {
      await persistShowcase();
      if (onDownloadQR) {
        await onDownloadQR(menu);
        return;
      }

      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://spotqr.com.br';
      const qrType = isCatalog ? 'catalog' : 'menu';
      const frames = getDefaultFrameTexts(qrType);
      const targetUrl = `${origin}/r/${slug}`;
      const fallbackConfig: QRConfig = {
        type: qrType,
        url: targetUrl,
        whatsappPhone: menu.whatsappNumber || '',
        whatsappMessage: '',
        pixKey: menu.pixKey || '',
        pixKeyType: 'email',
        pixName: menu.title,
        pixCity: 'Sao Paulo',
        wifiSSID: '',
        wifiPassword: '',
        wifiEncryption: 'WPA',
        googleReviewUrl: '',
        fgColor: '#000000',
        bgColor: '#ffffff',
        cornerColor: menu.themeColor || '#16a34a',
        dotStyle: 'squares',
        logoUrl: isProShowcase ? menu.logoImage || undefined : undefined,
        logoSize: 22,
        frameStyle: 'bottom_tag',
        frameTopText: frames.topText,
        frameText: frames.bottomText,
        frameColor: menu.themeColor || '#16a34a',
        frameTextColor: '#ffffff',
        isDynamic: isProShowcase,
        dynamicSlug: slug,
        title: menu.title,
      };
      const offscreenCanvas = document.createElement('canvas');
      await renderStyledQR({
        config: fallbackConfig,
        targetContent: targetUrl,
        canvas: offscreenCanvas,
        width: 1200,
        height: 1200,
      });
      const a = document.createElement('a');
      a.href = offscreenCanvas.toDataURL('image/png');
      a.download = `spotqr-${slug}.png`;
      a.click();
    } finally {
      setDownloadingQR(false);
    }
  };

  const handleOpenLivePreview = async () => {
    if (!menu) return;
    const targetUrl = `/${isCatalog ? 'catalogo' : 'cardapio'}/${slug}?preview=1`;
    // Open synchronously before async fetch to prevent mobile popup blockers
    const previewWin = window.open('about:blank', '_blank');
    setOpeningPreview(true);
    try {
      await persistShowcase();
      if (previewWin) {
        previewWin.location.href = targetUrl;
      } else {
        window.open(targetUrl, '_blank');
      }
    } finally {
      setOpeningPreview(false);
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

  const moveItem = (fromIdx: number, toIdx: number) => {
    if (!menu || fromIdx < 0 || toIdx < 0 || toIdx >= menu.items.length || fromIdx === toIdx) {
      return;
    }
    const next = [...menu.items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setMenu({ ...menu, items: next });
  };

  const openCropForFile = (
    file: File,
    preset: ImageUploadPreset,
    target:
      | { kind: 'item'; itemId: string }
      | { kind: 'brand'; field: 'logoImage' | 'coverImage' }
  ) => {
    if (!file.type || !file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setCropSession({
      src: objectUrl,
      isObjectUrl: true,
      preset,
      target,
    });
  };

  const handleProductPhotoUpload = (
    itemId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    openCropForFile(file, 'product', { kind: 'item', itemId });
  };

  const handleBrandImageUpload = (
    field: 'logoImage' | 'coverImage',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    openCropForFile(file, field === 'logoImage' ? 'logo' : 'cover', {
      kind: 'brand',
      field,
    });
  };

  const handleCoverVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !menu) return;
    if (!isProShowcase) {
      setVideoError(
        'O vídeo curto animado no banner é um recurso exclusivo do Plano PRO.'
      );
      return;
    }

    setVideoError(null);
    setUploadingVideo(true);
    try {
      const videoDataUrl = await processCoverVideoFile(file);
      setMenu((prev) => (prev ? { ...prev, coverVideo: videoDataUrl } : prev));
    } catch (err: unknown) {
      setVideoError(
        err instanceof Error
          ? err.message
          : 'Não foi possível processar o vídeo escolhido.'
      );
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleCloseCrop = () => {
    if (cropSession?.isObjectUrl) {
      URL.revokeObjectURL(cropSession.src);
    }
    setCropSession(null);
  };

  const handleConfirmCrop = (croppedDataUrl: string) => {
    if (!cropSession) return;
    if (cropSession.target.kind === 'item') {
      handleUpdateItem(cropSession.target.itemId, { imageUrl: croppedDataUrl });
    } else {
      const field = cropSession.target.field;
      setMenu((prev) => (prev ? { ...prev, [field]: croppedDataUrl } : prev));
    }
    if (cropSession.isObjectUrl) {
      URL.revokeObjectURL(cropSession.src);
    }
    setCropSession(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#101726] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-800 bg-[#0d1320]">
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadQR}
              disabled={downloadingQR || !menu}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 rounded-xl text-xs font-bold border border-sky-500/40 transition disabled:opacity-50"
              title="Baixar imagem do QR Code em PNG de alta resolução"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {downloadingQR
                  ? 'Baixando...'
                  : isCatalog
                  ? 'Baixar QR do Catálogo'
                  : 'Baixar QR do Cardápio'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenLivePreview}
              disabled={openingPreview || !menu}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition disabled:opacity-60"
            >
              <span>{openingPreview ? 'Abrindo...' : 'Ver ao Vivo'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </button>

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

        {/* Expiration Alert Banner inside Editor (<= 10 days or past_due) */}
        {editorRenewalAlert && (
          <div
            className={`px-6 py-2.5 border-b text-xs font-semibold flex flex-wrap items-center justify-between gap-2 ${
              editorRenewalAlert.kind === 'past_due'
                ? 'bg-red-950/50 border-red-500/40 text-red-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}
          >
            <span>⏳ {editorRenewalAlert.headline} — renove no Painel para manter o vídeo animado e link personalizado ativos.</span>
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="shrink-0 flex sm:flex-wrap items-center border-b border-slate-800 px-4 sm:px-6 bg-slate-900/60 gap-2 sm:gap-5 overflow-x-auto sm:overflow-visible">
          {[
            {
              id: 'items',
              label: isCatalog
                ? `🛍️ Produtos (${menu?.items.length || 0})`
                : `🍔 Pratos & Produtos (${menu?.items.length || 0})`,
            },
            {
              id: 'branding',
              label: '🎨 Visual, Logo & Cores',
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
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`shrink-0 py-3 px-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {savedSuccess && (
          <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>
                {isCatalog ? 'Catálogo salvo!' : 'Cardápio salvo!'} Agora você já pode baixar o QR Code para divulgar ou imprimir:
              </span>
            </span>
            <button
              type="button"
              onClick={handleDownloadQR}
              disabled={downloadingQR}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isCatalog
                  ? 'Baixar QR do Catálogo (PNG)'
                  : 'Baixar QR do Cardápio (PNG)'}
              </span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
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
                  {/* Quick Visual, Fulfillment & Payment Bar */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
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

                    <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-300">
                        💳 Pagamentos Aceitos:
                      </span>
                      {SHOWCASE_PAYMENT_OPTIONS.map((opt) => {
                        const enabled = acceptedPayments.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleAcceptedPayment(opt.id)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                              enabled
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {enabled ? '✅' : '○'} {opt.icon} {opt.shortLabel}
                          </button>
                        );
                      })}
                      {acceptedPayments.length === 0 && (
                        <span className="text-[10px] text-amber-300 font-semibold">
                          (Nenhum marcado: pedido irá como &ldquo;A combinar no WhatsApp&rdquo;)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-400">
                      Arraste pela alça <strong>⋮⋮</strong> ou use as setas <strong>↑ ↓</strong> para reordenar os cards.
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
                    {menu.items.map((item, idx) => {
                      const isBeingDragged = draggingId === item.id;
                      const isDropTarget =
                        dragOverId === item.id && draggingId !== item.id;

                      return (
                        <div
                          key={item.id}
                          draggable={dragArmedId === item.id}
                          onDragStart={(e) => {
                            setDraggingId(item.id);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', item.id);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggingId && draggingId !== item.id) {
                              setDragOverId(item.id);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggingId && draggingId !== item.id) {
                              const fromIdx = menu.items.findIndex(
                                (it) => it.id === draggingId
                              );
                              moveItem(fromIdx, idx);
                            }
                            setDraggingId(null);
                            setDragOverId(null);
                            setDragArmedId(null);
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverId(null);
                            setDragArmedId(null);
                          }}
                          className={`rounded-2xl border transition-all ${
                            isBeingDragged
                              ? 'opacity-45 scale-[0.98] border-dashed border-emerald-500 bg-slate-900'
                              : isDropTarget
                              ? 'ring-2 ring-emerald-400 border-emerald-400 bg-emerald-500/10 shadow-glow'
                              : item.isAvailable
                              ? 'bg-slate-900/70 border-slate-800'
                              : 'bg-rose-950/20 border-rose-500/30 opacity-75'
                          }`}
                        >
                          {isDropTarget && (
                            <div className="px-4 py-1.5 bg-emerald-500/20 border-b border-emerald-500/40 rounded-t-2xl text-[11px] font-extrabold text-emerald-300 text-center">
                              ⬇ Solte aqui para encaixar na posição #{idx + 1}
                            </div>
                          )}

                          {/* Snap-Card Reorder Header Bar */}
                          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 rounded-t-2xl">
                            <div
                              onMouseEnter={() => setDragArmedId(item.id)}
                              onMouseLeave={() => {
                                if (!draggingId) setDragArmedId(null);
                              }}
                              onPointerDown={() => setDragArmedId(item.id)}
                              className="flex items-center gap-2 cursor-grab active:cursor-grabbing select-none text-slate-400 hover:text-emerald-400 transition py-0.5"
                              title="Segure e arraste para encaixar em outra posição"
                            >
                              <GripVertical className="w-4 h-4 text-emerald-400" />
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-extrabold text-slate-200 font-mono">
                                #{idx + 1}
                              </span>
                              <span className="text-[11px] font-semibold">
                                Arraste para reordenar
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveItem(idx, idx - 1)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                title="Mover para cima"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === menu.items.length - 1}
                                onClick={() => moveItem(idx, idx + 1)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                title="Mover para baixo"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            {/* Image preview + Direct Upload + Crop Framing */}
                            <div className="md:col-span-2 flex flex-col items-center gap-2">
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                                <img
                                  src={item.imageUrl || activePresets[0].url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="w-full max-w-[120px] flex flex-col gap-1">
                                <label className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer transition text-center">
                                  <Upload className="w-3 h-3 shrink-0" />
                                  <span>Enviar Foto</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      handleProductPhotoUpload(item.id, e)
                                    }
                                    className="hidden"
                                  />
                                </label>

                                {(item.imageUrl || activePresets[0].url) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCropSession({
                                        src: item.imageUrl || activePresets[0].url,
                                        isObjectUrl: false,
                                        preset: 'product',
                                        target: { kind: 'item', itemId: item.id },
                                      })
                                    }
                                    className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition"
                                    title="Ajustar zoom e enquadramento da foto"
                                  >
                                    <Crop className="w-3 h-3 text-amber-400" />
                                    <span>Enquadrar</span>
                                  </button>
                                )}
                              </div>

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
                                onChange={(e) => {
                                  const nextBadge = e.target.value || undefined;
                                  handleUpdateItem(item.id, {
                                    badge: nextBadge,
                                    productionDays:
                                      nextBadge === 'Sob Encomenda'
                                        ? item.productionDays &&
                                          item.productionDays > 0
                                          ? item.productionDays
                                          : 3
                                        : undefined,
                                  });
                                }}
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

                            {/* Stock / Quantity Control per Order */}
                            {(() => {
                              const currentStockMode: ProductStockMode =
                                item.stockMode || 'unlimited';
                              const stockInfo = getItemStockInfo(item);
                              const setStockMode = (nextMode: ProductStockMode) => {
                                if (nextMode === 'unlimited') {
                                  handleUpdateItem(item.id, {
                                    stockMode: 'unlimited',
                                  });
                                } else if (nextMode === 'unique') {
                                  handleUpdateItem(item.id, {
                                    stockMode: 'unique',
                                    stockQuantity: 1,
                                  });
                                } else {
                                  handleUpdateItem(item.id, {
                                    stockMode: 'limited',
                                    stockQuantity:
                                      typeof item.stockQuantity === 'number' &&
                                      item.stockQuantity >= 1
                                        ? item.stockQuantity
                                        : 5,
                                  });
                                }
                              };
                              return (
                                <div className="sm:col-span-3 pt-2 mt-1 border-t border-slate-800/70">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                      Limite / Estoque Disponível:
                                    </label>
                                    {stockInfo.badgeText && item.isAvailable && (
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                          stockInfo.isUnique
                                            ? 'bg-purple-500/15 border-purple-500/35 text-purple-300'
                                            : stockInfo.maxQuantity <= 0
                                            ? 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                                            : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                                        }`}
                                      >
                                        {stockInfo.isUnique
                                          ? '💎 Peça Única (máx. 1 por pedido)'
                                          : stockInfo.maxQuantity <= 0
                                          ? '🚫 Sem estoque (Esgotado)'
                                          : `📦 Cliente pode pedir até ${stockInfo.maxQuantity} unid.`}
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setStockMode('unlimited')}
                                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                                        currentStockMode === 'unlimited'
                                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      ∞ Ilimitado
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setStockMode('limited')}
                                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                                        currentStockMode === 'limited'
                                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      📦 Limitar Qtd
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setStockMode('unique')}
                                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                                        currentStockMode === 'unique'
                                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      💎 Peça Única (Máx. 1)
                                    </button>

                                    {currentStockMode === 'limited' && (
                                      <div className="flex items-center gap-1.5 ml-auto bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1">
                                        <span className="text-[10px] font-semibold text-slate-400">
                                          Qtd máx:
                                        </span>
                                        <input
                                          type="number"
                                          min={0}
                                          step={1}
                                          value={
                                            typeof item.stockQuantity === 'number'
                                              ? item.stockQuantity
                                              : 1
                                          }
                                          onChange={(e) => {
                                            const parsed = parseInt(e.target.value, 10);
                                            handleUpdateItem(item.id, {
                                              stockQuantity: Number.isNaN(parsed)
                                                ? 0
                                                : Math.max(0, parsed),
                                            });
                                          }}
                                          className="w-14 bg-transparent text-xs font-extrabold text-amber-300 outline-none text-center"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {item.badge === 'Sob Encomenda' && (
                                    <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2.5">
                                      <div>
                                        <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                                          <span>⏱️ Prazo para ficar pronto (Sob Encomenda):</span>
                                        </label>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                          Quantos dias leva para produzir e entregar ao cliente.
                                        </p>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {[2, 3, 5, 7, 15].map((daysOption) => {
                                          const selected = item.productionDays === daysOption;
                                          return (
                                            <button
                                              key={daysOption}
                                              type="button"
                                              onClick={() =>
                                                handleUpdateItem(item.id, {
                                                  productionDays: daysOption,
                                                })
                                              }
                                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                                selected
                                                  ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                              }`}
                                            >
                                              {daysOption}d
                                            </button>
                                          );
                                        })}
                                        <div className="flex items-center gap-1.5 bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1">
                                          <input
                                            type="number"
                                            min={1}
                                            max={365}
                                            step={1}
                                            placeholder="Ex: 5"
                                            value={
                                              typeof item.productionDays === 'number' &&
                                              item.productionDays > 0
                                                ? item.productionDays
                                                : ''
                                            }
                                            onChange={(e) => {
                                              const raw = e.target.value.trim();
                                              if (!raw) {
                                                handleUpdateItem(item.id, {
                                                  productionDays: undefined,
                                                });
                                                return;
                                              }
                                              const parsed = parseInt(raw, 10);
                                              handleUpdateItem(item.id, {
                                                productionDays: Number.isNaN(parsed)
                                                  ? undefined
                                                  : Math.max(1, Math.min(365, parsed)),
                                              });
                                            }}
                                            className="w-12 bg-transparent text-xs font-extrabold text-amber-300 outline-none text-center"
                                          />
                                          <span className="text-[10px] font-semibold text-slate-400">
                                            {item.productionDays === 1 ? 'dia' : 'dias'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
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
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: BRANDING (THEME, COLORS, LOGO & BACKGROUND COVER) */}
              {activeTab === 'branding' && (() => {
                const defaultCover = isCatalog
                  ? '/catalogo/cover-loja.jpg'
                  : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80';
                const theme = resolveShowcaseTheme(
                  menu.themeMode,
                  menu.themeColor,
                  isCatalog ? '#10b981' : '#16a34a'
                );
                return (
                  <div className="space-y-6 max-w-3xl">
                    {/* Live Theme, Color & Header Mini Preview */}
                    <div
                      className={`rounded-2xl overflow-hidden border transition-colors ${
                        theme.isLight
                          ? 'border-slate-300 bg-slate-50'
                          : 'border-slate-800 bg-[#090d14]'
                      }`}
                    >
                      <div className="relative h-28 sm:h-32 bg-slate-900">
                        <img
                          src={menu.coverImage || defaultCover}
                          alt="Capa da vitrine"
                          className={`w-full h-full object-cover ${
                            theme.isLight ? 'opacity-80' : 'opacity-65'
                          }`}
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background: theme.isLight
                              ? 'linear-gradient(to top, #f8fafc 4%, rgba(248,250,252,0.35) 55%, transparent 100%)'
                              : 'linear-gradient(to top, #090d14 4%, rgba(9,13,20,0.4) 55%, transparent 100%)',
                          }}
                        />
                        <span className="absolute top-2.5 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-slate-200 border border-white/15">
                          Prévia ao Vivo ({theme.isLight ? '☀️ Claro' : '🌙 Escuro'})
                        </span>
                      </div>

                      <div className="px-4 pb-4 -mt-8 relative z-10 space-y-2.5">
                        <div
                          className={`rounded-2xl p-3.5 flex items-center justify-between gap-3 border shadow-lg transition-colors ${
                            theme.isLight
                              ? 'bg-white border-slate-200'
                              : 'bg-[#121929]/95 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center overflow-hidden shrink-0 ${
                                theme.isLight ? 'bg-slate-100' : 'bg-slate-950'
                              }`}
                              style={{ borderColor: theme.accentHex }}
                            >
                              {menu.logoImage ? (
                                <img
                                  src={menu.logoImage}
                                  alt="Logo"
                                  className="w-full h-full object-cover"
                                />
                              ) : isCatalog ? (
                                <ShoppingBag
                                  className="w-6 h-6"
                                  style={{ color: theme.readableAccentText }}
                                />
                              ) : (
                                <Utensils
                                  className="w-6 h-6"
                                  style={{ color: theme.readableAccentText }}
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4
                                className={`text-sm font-extrabold truncate ${
                                  theme.isLight ? 'text-slate-900' : 'text-white'
                                }`}
                              >
                                {menu.title}
                              </h4>
                              <p
                                className={`text-[11px] line-clamp-1 ${
                                  theme.isLight ? 'text-slate-500' : 'text-slate-400'
                                }`}
                              >
                                {menu.description}
                              </p>
                            </div>
                          </div>

                          <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <span
                              className="text-xs font-extrabold"
                              style={{ color: theme.readableAccentText }}
                            >
                              R$ 49,90
                            </span>
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold shadow-sm"
                              style={{
                                backgroundColor: theme.accentHex,
                                color: theme.accentTextOnSolid,
                              }}
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Adicionar +</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Theme Mode (Light / Dark) & Brand Accent Color Picker */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Light / Dark Mode Selector */}
                      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            {theme.isLight ? (
                              <Sun className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Moon className="w-4 h-4 text-sky-400" />
                            )}
                            <span>Tema da Página do Cliente</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Escolha se os clientes verão seu{' '}
                            {isCatalog ? 'catálogo' : 'cardápio'} no estilo escuro ou claro.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setMenu({ ...menu, themeMode: 'dark' })}
                            className={`p-3 rounded-xl border text-left transition ${
                              !theme.isLight
                                ? 'bg-[#090d14] border-emerald-500 ring-1 ring-emerald-500/40'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <Moon className="w-4 h-4 text-sky-400" />
                              {!theme.isLight && (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </div>
                            <span className="text-xs font-extrabold text-white block">
                              Tema Escuro
                            </span>
                            <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                              Elegante &amp; moderno
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setMenu({ ...menu, themeMode: 'light' })}
                            className={`p-3 rounded-xl border text-left transition ${
                              theme.isLight
                                ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/40 shadow-md'
                                : 'bg-slate-100/95 border-slate-300/60 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <Sun className="w-4 h-4 text-amber-500" />
                              {theme.isLight && (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </div>
                            <span className="text-xs font-extrabold text-slate-900 block">
                              Tema Claro
                            </span>
                            <span className="text-[10px] text-slate-600 leading-tight block mt-0.5">
                              Clean &amp; luminoso
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Brand Color Selector */}
                      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                              <Palette className="w-4 h-4 text-emerald-400" />
                              <span>Cor Predominante da Marca</span>
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Define botões, preços, categorias ativas e detalhes.
                            </p>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border shrink-0"
                            style={{
                              backgroundColor: theme.accentSoftBg,
                              borderColor: theme.accentBorder,
                              color: getReadableAccentTextColor(theme.accentHex, false),
                            }}
                          >
                            {theme.accentHex.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {SHOWCASE_COLOR_PRESETS.map((preset) => {
                            const isSelected =
                              theme.accentHex.toLowerCase() ===
                              preset.hex.toLowerCase();
                            return (
                              <button
                                key={preset.hex}
                                type="button"
                                onClick={() =>
                                  setMenu({ ...menu, themeColor: preset.hex })
                                }
                                title={preset.name}
                                aria-label={`Cor ${preset.name}`}
                                className={`w-7 h-7 rounded-full border-2 transition flex items-center justify-center ${
                                  isSelected
                                    ? 'border-white scale-110 ring-2 ring-white/30'
                                    : 'border-slate-700 hover:scale-105'
                                }`}
                                style={{ backgroundColor: preset.hex }}
                              >
                                {isSelected && (
                                  <Check
                                    className="w-3.5 h-3.5"
                                    style={{ color: getContrastTextColor(preset.hex) }}
                                  />
                                )}
                              </button>
                            );
                          })}

                          <label
                            title="Escolher qualquer cor personalizada"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-700 hover:border-slate-500 text-[11px] font-semibold text-slate-200 cursor-pointer transition"
                          >
                            <input
                              type="color"
                              value={theme.accentHex}
                              onChange={(e) =>
                                setMenu({ ...menu, themeColor: e.target.value })
                              }
                              className="w-4 h-4 rounded-full bg-transparent border-0 p-0 cursor-pointer"
                            />
                            <span>Personalizar</span>
                          </label>
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
                              <span>Upload da Logo</span>
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
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCropSession({
                                      src: menu.logoImage!,
                                      isObjectUrl: false,
                                      preset: 'logo',
                                      target: { kind: 'brand', field: 'logoImage' },
                                    })
                                  }
                                  className="flex items-center justify-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition"
                                >
                                  <Crop className="w-3 h-3 text-amber-400" />
                                  <span>Enquadrar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMenu({ ...menu, logoImage: '' })
                                  }
                                  className="flex items-center justify-center gap-1 px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-lg text-[11px] font-semibold transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Remover</span>
                                </button>
                              </div>
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

                      {/* Cover Background Image & PRO Video Card */}
                      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-amber-400" />
                            <span>Banner de Fundo (Topo da Loja)</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Foto ampla exibida no topo atrás do cartão da loja (também usada como capa de espera se houver vídeo).
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold cursor-pointer transition shadow-sm">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Imagem de Fundo</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleBrandImageUpload('coverImage', e)
                                }
                                className="hidden"
                              />
                            </label>

                            {(menu.coverImage || defaultCover) && (
                              <button
                                type="button"
                                onClick={() =>
                                  setCropSession({
                                    src: menu.coverImage || defaultCover,
                                    isObjectUrl: false,
                                    preset: 'cover',
                                    target: { kind: 'brand', field: 'coverImage' },
                                  })
                                }
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                                title="Ajustar enquadramento da imagem de fundo"
                              >
                                <Crop className="w-3.5 h-3.5 text-amber-400" />
                                <span>Enquadrar</span>
                              </button>
                            )}
                          </div>

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

                          {/* PRO Animated Video Banner */}
                          <div className="pt-3 mt-3 border-t border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h5 className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                                  <Video className="w-3.5 h-3.5 text-violet-400" />
                                  <span>Vídeo Curto Animado no Topo</span>
                                </h5>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Roda mudo em loop contínuo atrás da loja no lugar da foto estática.
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 border ${
                                  isProShowcase
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                }`}
                              >
                                {isProShowcase ? (
                                  <>
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>PRO Liberado</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-2.5 h-2.5" />
                                    <span>Exclusivo PRO</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {isProShowcase ? (
                              <div className="space-y-2">
                                {menu.coverVideo && (
                                  <div className="relative h-24 rounded-xl overflow-hidden border border-violet-500/40 bg-slate-950">
                                    <video
                                      key={menu.coverVideo}
                                      src={menu.coverVideo}
                                      poster={menu.coverImage || defaultCover}
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                      className="w-full h-full object-cover opacity-80"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 px-2.5 py-1 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent flex items-center justify-between text-[10px]">
                                      <span className="text-violet-200 font-bold flex items-center gap-1">
                                        <Video className="w-3 h-3 text-violet-400" />
                                        Vídeo animado ativo
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setVideoError(null);
                                          setMenu({
                                            ...menu,
                                            coverVideo: undefined,
                                          });
                                        }}
                                        className="text-rose-300 hover:text-rose-200 font-bold flex items-center gap-0.5"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Remover Vídeo</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <label
                                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition shadow-sm ${
                                    uploadingVideo
                                      ? 'bg-violet-500/30 text-violet-200 cursor-wait'
                                      : 'bg-violet-500 hover:bg-violet-400 text-white cursor-pointer'
                                  }`}
                                >
                                  {uploadingVideo ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Otimizando vídeo curto...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-3.5 h-3.5" />
                                      <span>
                                        {menu.coverVideo
                                          ? 'Trocar Vídeo Curto (MP4 / WebM)'
                                          : 'Enviar Vídeo Curto (MP4 / WebM)'}
                                      </span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime,video/*"
                                    disabled={uploadingVideo}
                                    onChange={handleCoverVideoUpload}
                                    className="hidden"
                                  />
                                </label>

                                <div>
                                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                                    Ou cole URL direta do Vídeo (.mp4 / .webm):
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      menu.coverVideo?.startsWith('data:')
                                        ? ''
                                        : menu.coverVideo || ''
                                    }
                                    onChange={(e) => {
                                      setVideoError(null);
                                      setMenu({
                                        ...menu,
                                        coverVideo:
                                          e.target.value.trim() || undefined,
                                      });
                                    }}
                                    placeholder="https://.../banner-animado.mp4"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono"
                                  />
                                </div>

                                {videoError && (
                                  <div className="px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-[11px] text-rose-200">
                                    ⚠️ {videoError}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-1.5">
                                <p className="text-[11px] text-amber-200 font-semibold flex items-center gap-1.5">
                                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>
                                    Recurso exclusivo para lojas no Plano PRO.
                                  </span>
                                </p>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                  Ative o Plano PRO ou digite seu código voucher para enviar um vídeo curto em movimento no topo da sua loja. Enquanto estiver no Free, será exibida apenas a imagem de fundo estática.
                                </p>
                              </div>
                            )}
                          </div>
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
                      Chave PIX (Gerada com valor exato somente após fechar pedido):
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

                    <div className="md:col-span-2 pt-3 border-t border-slate-800/80">
                      <span className="text-xs font-bold text-white block mb-1">
                        💳 Formas de Pagamento que Você Aceita
                      </span>
                      <p className="text-[11px] text-slate-400 mb-2.5">
                        Só aparecerão para seu cliente escolher na hora do pedido as opções marcadas abaixo:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {SHOWCASE_PAYMENT_OPTIONS.map((opt) => (
                          <label
                            key={opt.id}
                            className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 hover:border-slate-700 transition"
                          >
                            <input
                              type="checkbox"
                              checked={acceptedPayments.includes(opt.id)}
                              onChange={() => toggleAcceptedPayment(opt.id)}
                              className="accent-emerald-500 w-4 h-4 shrink-0"
                            />
                            <span>
                              {opt.icon} {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      {acceptedPayments.includes('pix') &&
                        !menu.pixKey?.trim() && (
                          <p className="text-[11px] text-amber-300 mt-2">
                            💡 Você marcou <strong>PIX</strong> — preencha sua{' '}
                            <strong>Chave PIX</strong> acima para gerar automaticamente o QR Code PIX no valor exato quando o cliente fechar o pedido no carrinho.
                          </p>
                        )}
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

      {/* Interactive Image Crop / Framing Modal */}
      <ImageCropModal
        isOpen={Boolean(cropSession)}
        imageSrc={cropSession?.src || null}
        preset={cropSession?.preset || 'product'}
        onCancel={handleCloseCrop}
        onConfirm={handleConfirmCrop}
      />
    </div>
  );
}

