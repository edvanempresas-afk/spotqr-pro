'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdBanner from '@/components/AdBanner';
import ProFeatureLockModal from '@/components/ProFeatureLockModal';
import PixCheckoutModal from '@/components/PixCheckoutModal';
import MenuEditorModal from '@/components/MenuEditorModal';
import TableTentModal from '@/components/TableTentModal';
import ClientAuthModal from '@/components/ClientAuthModal';
import VoucherRedeemBox from '@/components/VoucherRedeemBox';
import {
  QrCode,
  Sparkles,
  ExternalLink,
  Edit3,
  BarChart2,
  Printer,
  Check,
  ArrowRight,
  Utensils,
  ShoppingBag,
  PlusCircle,
  Copy,
  Lock,
  ShieldCheck,
  Download,
  UserCheck,
  LogOut,
  LogIn,
  UserPlus,
  Clock,
} from 'lucide-react';
import { DynamicQRRecord, QRConfig } from '@/lib/types';
import {
  isProStillValid,
  formatRemainingProTime,
  computeStableStoreCode,
} from '@/lib/pro-status';
import { renderStyledQR, getDefaultFrameTexts } from '@/lib/qr-canvas';
import Link from 'next/link';
import { useProPrice } from '@/lib/pro-price';

export default function DashboardPage() {
  const { proPriceLabel } = useProPrice();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>(
    'login'
  );

  const [qrs, setQrs] = useState<DynamicQRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [creatingStarter, setCreatingStarter] = useState(false);

  // Menu / Catalog Editor Modal
  const [menuEditorSlug, setMenuEditorSlug] = useState<string | null>(null);
  const [menuEditorMode, setMenuEditorMode] = useState<'menu' | 'catalog'>(
    'menu'
  );

  // Table Tent & Download QR Modal
  const [activeTentQR, setActiveTentQR] = useState<DynamicQRRecord | null>(
    null
  );
  const [tentQrDataUrl, setTentQrDataUrl] = useState<string>('');
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Paywall & Checkout Modals
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockFeatureTitle, setLockFeatureTitle] = useState('');
  const [lockFeatureDescription, setLockFeatureDescription] = useState('');
  const [targetUpgradeSlug, setTargetUpgradeSlug] = useState<string>('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const expiredSyncTriggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const hasTimedPro = qrs.some((q) => q.isPaid && Boolean(q.proExpiresAt));
    if (!hasTimedPro) return;
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNowMs(currentNow);
      for (const q of qrs) {
        if (
          q.isPaid &&
          q.proExpiresAt &&
          !isProStillValid(q, currentNow) &&
          !expiredSyncTriggeredRef.current.has(q.slug)
        ) {
          expiredSyncTriggeredRef.current.add(q.slug);
          fetchQRs();
          break;
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [qrs]);

  useEffect(() => {
    // Check if returning from Mercado Pago Checkout Pro
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mpPaymentId = params.get('payment_id') || params.get('collection_id');
      const mpSlug = params.get('slug') || params.get('external_reference');
      if (mpPaymentId && mpSlug) {
        fetch(
          `/api/mercadopago/check-status?paymentId=${encodeURIComponent(
            mpPaymentId
          )}&slug=${encodeURIComponent(mpSlug)}`
        )
          .then(() => fetchQRs())
          .catch(() => {});
      }
    }
    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
    setCheckingAuth(true);
    try {
      const authRes = await fetch('/api/auth');
      const authData = await authRes.json();
      if (authData.authenticated && authData.user) {
        setCurrentUser(authData.user);
        await fetchQRs();
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking client auth:', err);
      setCurrentUser(null);
      setLoading(false);
    } finally {
      setCheckingAuth(false);
    }
  }

  async function fetchQRs() {
    setLoading(true);
    try {
      const res = await fetch('/api/dynamic-qr');
      if (res.status === 401) {
        setCurrentUser(null);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setQrs(data);
      }
    } catch (err) {
      console.error('Error fetching QRs:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateStarterShowcase = async (
    mode: 'menu' | 'catalog' = 'menu'
  ) => {
    if (!currentUser) return;
    setCreatingStarter(true);
    try {
      const fallbackBase = mode === 'catalog' ? 'minha-loja' : 'meu-cardapio';
      const baseSlug = (currentUser.businessName || currentUser.name || fallbackBase)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`;

      const res = await fetch('/api/dynamic-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title:
            currentUser.businessName ||
            (mode === 'catalog'
              ? `Catálogo de ${currentUser.name}`
              : `Cardápio de ${currentUser.name}`),
          targetUrl: `/${mode === 'catalog' ? 'catalogo' : 'cardapio'}/${slug}`,
          type: mode,
        }),
      });

      if (res.ok) {
        await fetchQRs();
        setMenuEditorMode(mode);
        setMenuEditorSlug(slug);
      }
    } catch (err) {
      console.error('Error creating starter showcase:', err);
    } finally {
      setCreatingStarter(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setCurrentUser(null);
    setQrs([]);
  };

  const handleStartEdit = (qr: DynamicQRRecord) => {
    if (!isProStillValid(qr, nowMs)) {
      setTargetUpgradeSlug(qr.slug);
      setLockFeatureTitle('Edição de Link Dinâmico é Exclusiva do Plano PRO');
      setLockFeatureDescription(
        `O QR Code /${qr.slug} ainda está na versão gratuita. Para trocar o link de destino sem reimprimir os adesivos de mesa e colocar sua logomarca no centro, ative a versão PRO por apenas ${proPriceLabel}.`
      );
      setIsLockModalOpen(true);
      return;
    }

    setEditingSlug(qr.slug);
    setEditUrl(qr.targetUrl);
    setEditTitle(qr.title);
  };

  const handleOpenMenuEditor = (qr: DynamicQRRecord) => {
    setMenuEditorMode(qr.type === 'catalog' ? 'catalog' : 'menu');
    setMenuEditorSlug(qr.slug);
  };

  const buildFullConfig = (qr: DynamicQRRecord): QRConfig => {
    const resolvedType = qr.type || 'menu';
    const defaults = getDefaultFrameTexts(resolvedType);
    const effectivePaid = isProStillValid(qr, nowMs);
    return {
      type: resolvedType,
      url: qr.targetUrl,
      whatsappPhone: currentUser?.whatsapp || '5511999998888',
      whatsappMessage: '',
      pixKey: '',
      pixKeyType: 'email',
      pixName: qr.title,
      pixCity: 'SAO PAULO',
      wifiSSID: '',
      wifiPassword: '',
      wifiEncryption: 'WPA',
      googleReviewUrl: '',
      fgColor: qr.qrConfig?.fgColor || '#0f172a',
      fgGradientColor: qr.qrConfig?.fgGradientColor || '#16a34a',
      useGradient: qr.qrConfig?.useGradient ?? true,
      bgColor: qr.qrConfig?.bgColor || '#ffffff',
      cornerColor: qr.qrConfig?.cornerColor || '#16a34a',
      dotStyle: qr.qrConfig?.dotStyle || 'rounded',
      logoUrl: effectivePaid ? qr.qrConfig?.logoUrl || '' : '',
      logoSize: qr.qrConfig?.logoSize || 22,
      frameStyle: qr.qrConfig?.frameStyle || 'table_tent',
      frameTopText: qr.qrConfig?.frameTopText || defaults.topText,
      frameText: qr.qrConfig?.frameText || defaults.bottomText,
      frameColor: qr.qrConfig?.frameColor || '#16a34a',
      frameTextColor: qr.qrConfig?.frameTextColor || '#ffffff',
      isDynamic: effectivePaid,
      dynamicSlug: qr.slug,
      title: qr.title,
    };
  };

  const handleOpenTableTentOrDownload = async (
    qr: DynamicQRRecord,
    mode: 'tent' | 'download'
  ) => {
    if (!hiddenCanvasRef.current) return;
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://spotqr.pro';
    const redirectUrl = `${origin}/r/${qr.slug}`;
    const fullCfg = buildFullConfig(qr);

    await renderStyledQR({
      config: fullCfg,
      targetContent: redirectUrl,
      canvas: hiddenCanvasRef.current,
      width: 1200,
      height: 1200,
    });

    const dataUrl = hiddenCanvasRef.current.toDataURL('image/png');
    if (mode === 'download') {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `spotqr-${qr.slug}.png`;
      a.click();
    } else {
      setTentQrDataUrl(dataUrl);
      setActiveTentQR(qr);
    }
  };

  const handleTriggerProCheckout = async (slugToUpgrade?: string) => {
    const slug =
      slugToUpgrade || targetUpgradeSlug || qrs[0]?.slug || 'meu-restaurante';
    try {
      const res = await fetch('/api/mercadopago/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          email: currentUser?.email || 'cliente@spotqr.pro',
          name: currentUser?.name || 'Cliente SpotQR Pro',
          title: `Ativação QR Dinâmico ${slug}`,
          type: 'menu',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentData(data.payment);
        setTargetUpgradeSlug(slug);
        setIsLockModalOpen(false);
        setIsCheckoutOpen(true);
      }
    } catch (err) {
      console.error('Error initiating checkout:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSlug) return;
    setSaving(true);
    try {
      const res = await fetch('/api/dynamic-qr', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editingSlug,
          targetUrl: editUrl,
          title: editTitle,
        }),
      });
      if (res.ok) {
        setEditingSlug(null);
        fetchQRs();
      }
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const copyShortUrl = (slug: string) => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://spotqr.pro';
    navigator.clipboard.writeText(`${origin}/r/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const hasAnyFreeQR = qrs.some((q) => !isProStillValid(q, nowMs));
  const activeProCount = qrs.filter((q) => isProStillValid(q, nowMs)).length;
  const totalScans = qrs.reduce((acc, q) => acc + (q.scansCount || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] pb-16">
      <Navbar />

      {/* Hidden canvas for high-res QR rendering */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {checkingAuth ? (
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
              <Utensils className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400">
              Verificando sua conta de cliente...
            </p>
          </div>
        </main>
      ) : !currentUser ? (
        /* GATEWAY FOR UNLOGGED CLIENTS */
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-lg w-full bg-[#101726] border-2 border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 mx-auto shadow-glow">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full uppercase">
                Acesso Exclusivo do Cliente
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white pt-1">
                Entre ou Crie seu Login para Gerenciar seu Cardápio
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Para proteger o cardápio e os QR Codes do seu estabelecimento,
                cada cliente possui seu próprio login e senha.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('login');
                  setIsAuthModalOpen(true);
                }}
                className="py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-glow transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar na Minha Conta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('register');
                  setIsAuthModalOpen(true);
                }}
                className="py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Cadastrar Meu Negócio</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-500">
              Conta de demonstração para teste rápido:{' '}
              <strong className="text-slate-300">
                cliente@restaurante.com.br
              </strong>{' '}
              (Senha: <strong className="text-slate-300">123456</strong>)
            </div>
          </div>
        </main>
      ) : (
        <>
          {/* STRATEGIC AD: Dashboard Leaderboard if user has any unpaid QR */}
          {hasAnyFreeQR && (
            <AdBanner
              format="leaderboard"
              isPro={false}
              onUpgradeClick={() => handleTriggerProCheckout()}
            />
          )}

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    Logado como: {currentUser.name} ({currentUser.email})
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Painel de {currentUser.businessName || currentUser.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Edite os pratos e preços do seu cardápio ou altere o link do
                  seu QR Code a qualquer hora.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCreateStarterShowcase('menu')}
                  disabled={creatingStarter}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-glow"
                >
                  <Utensils className="w-4 h-4" />
                  <span>
                    {creatingStarter
                      ? 'Criando...'
                      : '+ Novo Cardápio'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateStarterShowcase('catalog')}
                  disabled={creatingStarter}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-glow"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>+ Novo Catálogo / Loja</span>
                </button>

                <Link
                  href="/#gerador"
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Gerador de QR Code</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#121929] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Total de Leituras (Scans)</span>
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {totalScans}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Clientes que escanearam suas mesas
                </p>
              </div>

              <div className="bg-[#121929] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Meus Cardápios & QRs</span>
                  <QrCode className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {qrs.length}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {activeProCount} Ativos no Plano PRO
                </p>
              </div>

              <div className="bg-[#121929] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Economia Estimada</span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-400">
                  R${' '}
                  {(activeProCount * 240 || 240).toFixed(0)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Em reimpressões de placas e adesivos
                </p>
              </div>
            </div>

            {/* Voucher Redeem Option (Visible for both Free and PRO accounts) */}
            <VoucherRedeemBox
              stores={qrs}
              onRedeemed={() => fetchQRs()}
              className="mb-8"
            />

            {/* List of Dynamic QRs */}
            {loading ? (
              <div className="py-20 text-center text-slate-500 text-xs">
                Carregando seus cardápios e códigos...
              </div>
            ) : qrs.length === 0 ? (
              <div className="bg-[#101726] border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
                <Utensils className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">
                  Bem-vindo, {currentUser.name}! Crie seu Primeiro Cardápio
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Clique no botão abaixo para gerar seu Cardápio Digital com
                  pratos, fotos, preços e pedidos direto no seu WhatsApp.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCreateStarterShowcase('menu')}
                    disabled={creatingStarter}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-glow transition"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>
                      {creatingStarter
                        ? 'Criando...'
                        : 'Criar Cardápio (Restaurante)'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateStarterShowcase('catalog')}
                    disabled={creatingStarter}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-glow transition"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Criar Catálogo (Loja / Produtos)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {qrs.map((qr) => {
                  const isEditing = editingSlug === qr.slug;
                  const effectivePaid = isProStillValid(qr, nowMs);
                  const storeCode = computeStableStoreCode(qr);

                  return (
                    <div
                      key={qr.slug}
                      className={`border rounded-2xl p-5 sm:p-6 shadow-md transition ${
                        effectivePaid
                          ? 'bg-[#121929] border-slate-800 hover:border-slate-700'
                          : 'bg-slate-900/50 border-amber-500/30'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left: Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-base font-bold text-white">
                              {qr.title}
                            </h3>
                            <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                              ID #{storeCode}
                            </span>
                            {effectivePaid ? (
                              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                PRO Ativo (Com Logo Central & Sem Ads)
                              </span>
                            ) : (
                              <button
                                onClick={() => handleTriggerProCheckout(qr.slug)}
                                className="bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 transition"
                              >
                                <Lock className="w-3 h-3 text-amber-400" />
                                Versão Grátis • Ativar PRO + Logo ({proPriceLabel})
                              </button>
                            )}
                            {effectivePaid && qr.proExpiresAt && (
                              <span className="bg-sky-500/15 border border-sky-500/35 text-sky-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3 text-sky-400" />
                                <span>
                                  Expira em {formatRemainingProTime(qr.proExpiresAt, nowMs)}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Links Info */}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                              <span className="text-slate-500">
                                Link do QR:
                              </span>
                              <span className="font-mono text-emerald-400 font-semibold">
                                /r/{qr.slug}
                              </span>
                              <button
                                onClick={() => copyShortUrl(qr.slug)}
                                className="ml-1 text-slate-400 hover:text-white"
                                title="Copiar Link"
                              >
                                {copiedSlug === qr.slug ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-400">
                              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                              <span>Destino:</span>
                              <a
                                href={qr.targetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-300 hover:text-emerald-400 underline font-mono truncate max-w-xs"
                              >
                                {qr.targetUrl}
                              </a>
                            </div>
                          </div>

                          {/* Metrics Rule */}
                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                            {effectivePaid ? (
                              <span className="text-emerald-400/90 font-medium">
                                📊 <strong>{qr.scansCount || 0}</strong>{' '}
                                leituras registradas nas mesas
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-400/80">
                                <Lock className="w-3 h-3" />
                                <span>
                                  Métricas e Logo Central liberadas no PRO
                                </span>
                              </span>
                            )}
                            <span>•</span>
                            <span suppressHydrationWarning>
                              Atualizado em:{' '}
                              {new Date(
                                qr.updatedAt || qr.createdAt
                              ).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {(qr.type === 'menu' || qr.type === 'catalog' || qr.linkedMenuId) && (() => {
                            const isCat = qr.type === 'catalog';
                            return (
                              <>
                                <button
                                  onClick={() => handleOpenMenuEditor(qr)}
                                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-sm"
                                >
                                  {isCat ? (
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                  ) : (
                                    <Utensils className="w-3.5 h-3.5" />
                                  )}
                                  <span>
                                    {isCat
                                      ? 'Editar Meu Catálogo'
                                      : 'Editar Meu Cardápio'}
                                  </span>
                                </button>

                                <Link
                                  href={`/${isCat ? 'catalogo' : 'cardapio'}/${qr.slug}`}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
                                >
                                  <span>
                                    {isCat ? 'Ver Catálogo' : 'Ver Cardápio'}
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                                </Link>
                              </>
                            );
                          })()}

                          <button
                            onClick={() =>
                              handleOpenTableTentOrDownload(qr, 'tent')
                            }
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
                            title="Imprimir Plaquinha de Mesa A6/A5"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span>Placa de Mesa</span>
                          </button>

                          <button
                            onClick={() =>
                              handleOpenTableTentOrDownload(qr, 'download')
                            }
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 rounded-xl text-xs font-bold border border-sky-500/40 transition shadow-sm"
                            title="Baixar imagem do QR Code em PNG em Alta Definição"
                          >
                            <Download className="w-4 h-4 text-sky-400" />
                            <span>
                              {qr.type === 'catalog'
                                ? 'Baixar QR do Catálogo'
                                : qr.type === 'menu' || qr.linkedMenuId
                                ? 'Baixar QR do Cardápio'
                                : 'Baixar QR PNG'}
                            </span>
                          </button>

                          {/* Edit Destination Button */}
                          <button
                            onClick={() => handleStartEdit(qr)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                              effectivePaid
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {effectivePaid ? (
                              <>
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Mudar Link</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Mudar Link (PRO)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Inline Edit Form for PRO users */}
                      {isEditing && effectivePaid && (
                        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end animate-fade-in bg-slate-900/50 p-4 rounded-xl">
                          <div className="sm:col-span-4">
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Nome do Estabelecimento / QR:
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Nova URL de Destino:
                            </label>
                            <input
                              type="text"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                            />
                          </div>

                          <div className="sm:col-span-3 flex items-center gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={saving}
                              className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                              onClick={() => setEditingSlug(null)}
                              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-semibold transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </>
      )}

      <Footer />

      {/* Client Auth Modal */}
      <ClientAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          fetchQRs();
        }}
      />

      {/* Access Rule Lock Modal */}
      <ProFeatureLockModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        onUpgrade={() => handleTriggerProCheckout()}
        onVoucherRedeemed={() => fetchQRs()}
        targetSlug={targetUpgradeSlug}
        featureTitle={lockFeatureTitle}
        featureDescription={lockFeatureDescription}
      />

      {/* Pix Payment Checkout Modal */}
      <PixCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        slug={targetUpgradeSlug}
        paymentData={paymentData}
        onPaymentSuccess={() => {
          setIsCheckoutOpen(false);
          fetchQRs();
        }}
      />

      {/* Menu / Catalog Editor Modal */}
      {menuEditorSlug && (
        <MenuEditorModal
          isOpen={Boolean(menuEditorSlug)}
          onClose={() => setMenuEditorSlug(null)}
          slug={menuEditorSlug}
          mode={menuEditorMode}
          defaultTitle={
            qrs.find((q) => q.slug === menuEditorSlug)?.title ||
            currentUser?.businessName
          }
          onSaved={() => fetchQRs()}
          onDownloadQR={async (editedMenu) => {
            const targetQr = qrs.find((q) => q.slug === menuEditorSlug);
            if (targetQr) {
              const mergedQr: DynamicQRRecord = editedMenu
                ? {
                    ...targetQr,
                    title: editedMenu.title || targetQr.title,
                    qrConfig: {
                      fgColor: targetQr.qrConfig?.fgColor || '#0f172a',
                      bgColor: targetQr.qrConfig?.bgColor || '#ffffff',
                      dotStyle: targetQr.qrConfig?.dotStyle || 'rounded',
                      frameStyle: targetQr.qrConfig?.frameStyle || 'table_tent',
                      frameColor:
                        targetQr.qrConfig?.frameColor ||
                        editedMenu.themeColor ||
                        '#16a34a',
                      frameTextColor:
                        targetQr.qrConfig?.frameTextColor || '#ffffff',
                      ...(targetQr.qrConfig || {}),
                      logoUrl:
                        typeof editedMenu.logoImage === 'string'
                          ? editedMenu.logoImage
                          : targetQr.qrConfig?.logoUrl,
                    },
                  }
                : targetQr;
              await handleOpenTableTentOrDownload(mergedQr, 'download');
            }
            await fetchQRs();
          }}
        />
      )}

      {/* Table Tent Modal from Dashboard */}
      {activeTentQR && (
        <TableTentModal
          isOpen={Boolean(activeTentQR)}
          onClose={() => setActiveTentQR(null)}
          qrDataUrl={tentQrDataUrl}
          config={buildFullConfig(activeTentQR)}
          isPro={isProStillValid(activeTentQR, nowMs)}
          onUpgradeToPro={() => {
            const slug = activeTentQR.slug;
            setActiveTentQR(null);
            handleTriggerProCheckout(slug);
          }}
        />
      )}
    </div>
  );
}
