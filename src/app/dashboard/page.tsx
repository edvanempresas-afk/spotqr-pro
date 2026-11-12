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
import RecurringCardModal from '@/components/RecurringCardModal';
import FriendlySlugPanel from '@/components/FriendlySlugPanel';
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
  CreditCard,
  Link2,
  AlertTriangle,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';
import { DynamicQRRecord, QRConfig } from '@/lib/types';
import {
  isProStillValid,
  formatRemainingProTime,
  computeStableStoreCode,
  getProRenewalAlert,
} from '@/lib/pro-status';
import { renderStyledQR, getDefaultFrameTexts } from '@/lib/qr-canvas';
import Link from 'next/link';
import { useProPrice } from '@/lib/pro-price';

export default function DashboardPage() {
  const { proPrice, proPriceLabel } = useProPrice();
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
  const [friendlySlugEditing, setFriendlySlugEditing] = useState<string | null>(
    null
  );
  const [recurringCardTarget, setRecurringCardTarget] = useState<{
    qr: DynamicQRRecord;
    chargeNow?: boolean;
  } | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [clientTheme, setClientTheme] = useState<'dark' | 'light'>('dark');
  const expiredSyncTriggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('spotqr_client_theme');
    if (saved === 'light' || saved === 'dark') {
      setClientTheme(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor =
      clientTheme === 'light' ? '#f8fafc' : '#0b0f17';
    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, [clientTheme]);

  const handleSetClientTheme = (mode: 'dark' | 'light') => {
    setClientTheme(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('spotqr_client_theme', mode);
    }
  };

  const isLight = clientTheme === 'light';

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
  const renewalAlerts = qrs
    .map((q) => ({ qr: q, alert: getProRenewalAlert(q, nowMs) }))
    .filter(
      (entry): entry is { qr: DynamicQRRecord; alert: NonNullable<ReturnType<typeof getProRenewalAlert>> } =>
        Boolean(entry.alert)
    );
  const expiredDowngradedQRs = qrs.filter(
    (q) => q.hadProExpired && !isProStillValid(q, nowMs)
  );

  return (
    <div
      className={`min-h-screen flex flex-col pb-16 transition-colors ${
        isLight
          ? 'bg-slate-50 text-slate-900'
          : 'bg-[#0b0f17] text-slate-100'
      }`}
    >
      <Navbar themeMode={clientTheme} />

      {/* Hidden canvas for high-res QR rendering */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {checkingAuth ? (
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto animate-pulse ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <Utensils className="w-6 h-6" />
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Verificando sua conta de cliente...
            </p>
          </div>
        </main>
      ) : !currentUser ? (
        /* GATEWAY FOR UNLOGGED CLIENTS */
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div
            className={`max-w-lg w-full border-2 rounded-3xl p-8 text-center shadow-2xl space-y-5 transition-colors ${
              isLight
                ? 'bg-white border-slate-200'
                : 'bg-[#101726] border-slate-800'
            }`}
          >
            {/* Theme Switcher on Unlogged Gateway */}
            <div className="flex justify-end">
              <div
                className={`inline-flex items-center gap-1 p-1 rounded-xl border text-[11px] font-bold ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSetClientTheme('light')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                    isLight
                      ? 'bg-white text-amber-600 shadow-sm'
                      : 'hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Clara</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetClientTheme('dark')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                    !isLight
                      ? 'bg-slate-800 text-sky-300 shadow-sm'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Escura</span>
                </button>
              </div>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 mx-auto shadow-glow">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span
                className={`text-[11px] font-extrabold border px-3 py-1 rounded-full uppercase ${
                  isLight
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                Acesso Exclusivo do Cliente
              </span>
              <h1
                className={`text-2xl sm:text-3xl font-extrabold pt-1 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Entre ou Crie seu Login para Gerenciar seu Cardápio
              </h1>
              <p
                className={`text-xs sm:text-sm leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
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
                className={`py-3.5 px-5 rounded-xl border font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span>Cadastrar Meu Negócio</span>
              </button>
            </div>

            <div
              className={`pt-4 border-t text-xs ${
                isLight
                  ? 'border-slate-200 text-slate-500'
                  : 'border-slate-800/80 text-slate-500'
              }`}
            >
              Conta de demonstração para teste rápido:{' '}
              <strong className={isLight ? 'text-slate-800' : 'text-slate-300'}>
                cliente@restaurante.com.br
              </strong>{' '}
              (Senha:{' '}
              <strong className={isLight ? 'text-slate-800' : 'text-slate-300'}>
                123456
              </strong>
              )
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
              themeMode={clientTheme}
              onUpgradeClick={() => handleTriggerProCheckout()}
            />
          )}

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span
                    className={`text-xs font-bold border px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5 ${
                      isLight
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Logado como: {currentUser.name} ({currentUser.email})
                  </span>
                </div>
                <h1
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Painel de {currentUser.businessName || currentUser.name}
                </h1>
                <p
                  className={`text-xs sm:text-sm ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  Edite os pratos e preços do seu cardápio ou catálogo e altere o
                  link do seu QR Code a qualquer hora.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Light / Dark Client Screen Toggle */}
                <div
                  className={`inline-flex items-center gap-1 p-1 rounded-xl border text-xs font-bold ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-600 shadow-sm'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                  role="group"
                  aria-label="Alternar tema da tela do cliente"
                >
                  <button
                    type="button"
                    onClick={() => handleSetClientTheme('light')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                      isLight
                        ? 'bg-amber-100 text-amber-800 shadow-sm'
                        : 'hover:text-white'
                    }`}
                    title="Usar Tela Clara no Painel"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Tela Clara</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetClientTheme('dark')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                      !isLight
                        ? 'bg-slate-800 text-sky-300 shadow-sm'
                        : 'hover:text-slate-900'
                    }`}
                    title="Usar Tela Escura (Dark) no Painel"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                </div>

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
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-bold transition ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  <span>Gerador de QR Code</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 border rounded-xl text-xs font-bold transition ${
                    isLight
                      ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                      : 'bg-red-500/15 hover:bg-red-500/25 border-red-500/30 text-red-300'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>

            {/* PRO Expiration Warning (<= 10 days) & Auto-Renew Grace Alerts */}
            {renewalAlerts.length > 0 && (
              <div className="space-y-3 mb-6">
                {renewalAlerts.map(({ qr, alert }) => (
                  <div
                    key={`renew-${qr.slug}`}
                    className={`rounded-2xl p-4 sm:p-5 border-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg ${
                      alert.kind === 'past_due'
                        ? isLight
                          ? 'bg-red-50 border-red-300'
                          : 'bg-red-950/40 border-red-500/60'
                        : isLight
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-amber-950/30 border-amber-500/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          alert.kind === 'past_due'
                            ? isLight
                              ? 'bg-red-100 border-red-300 text-red-600'
                              : 'bg-red-500/20 border-red-500/40 text-red-400'
                            : isLight
                            ? 'bg-amber-100 border-amber-300 text-amber-700'
                            : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`text-xs font-extrabold uppercase tracking-wider ${
                            isLight ? 'text-amber-700' : 'text-amber-300'
                          }`}
                        >
                          {qr.title} • Plano PRO
                        </div>
                        <h2
                          className={`text-sm sm:text-base font-extrabold ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {alert.headline}
                        </h2>
                        <p
                          className={`text-xs leading-relaxed ${
                            isLight ? 'text-slate-700' : 'text-slate-300'
                          }`}
                        >
                          {alert.subtext}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTriggerProCheckout(qr.slug)}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow transition flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Renovar Agora Mesmo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setRecurringCardTarget({ qr, chargeNow: true })
                        }
                        className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition flex items-center gap-1.5 ${
                          isLight
                            ? 'bg-white hover:bg-sky-50 border-sky-300 text-sky-700'
                            : 'bg-slate-800 hover:bg-slate-700 border-sky-500/40 text-sky-300'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-sky-500" />
                        <span>
                          {qr.autoRenew?.enabled
                            ? 'Gerenciar Cartão Salvo'
                            : 'Cartão Recorrente (Mensal)'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notice when a store reverted to Free due to expiration / 5 failed billing days */}
            {expiredDowngradedQRs.length > 0 && (
              <div className="space-y-3 mb-6">
                {expiredDowngradedQRs.map((qr) => (
                  <div
                    key={`expired-${qr.slug}`}
                    className={`rounded-2xl p-4 sm:p-5 border-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isLight
                        ? 'bg-rose-50 border-rose-300'
                        : 'bg-slate-900/90 border-rose-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                          isLight
                            ? 'bg-rose-100 border-rose-300 text-rose-600'
                            : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        }`}
                      >
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3
                          className={`text-sm font-extrabold ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          O Plano PRO de {qr.title} expirou e voltou para o Free
                        </h3>
                        <p
                          className={`text-xs leading-relaxed ${
                            isLight ? 'text-slate-700' : 'text-slate-300'
                          }`}
                        >
                          Os benefícios PRO foram bloqueados automaticamente: o
                          vídeo animado voltou a ser foto estática, os anúncios
                          retornaram, a logo central do QR foi removida e qualquer
                          link amigável voltou ao endereço anterior (
                          <span
                            className={`font-mono ${
                              isLight ? 'text-rose-700' : 'text-rose-300'
                            }`}
                          >
                            /{qr.type === 'catalog' ? 'catalogo' : 'cardapio'}/
                            {qr.slug}
                          </span>
                          ).
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTriggerProCheckout(qr.slug)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition"
                      >
                        Renovar PRO Agora
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setRecurringCardTarget({ qr, chargeNow: true })
                        }
                        className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition flex items-center gap-1.5 ${
                          isLight
                            ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-700'
                            : 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/40 text-sky-300'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Assinar com Cartão</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div
                className={`border rounded-2xl p-5 relative overflow-hidden transition-colors ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-[#121929] border-slate-800'
                }`}
              >
                <div
                  className={`flex items-center justify-between text-xs font-semibold mb-2 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  <span>Total de Leituras (Scans)</span>
                  <BarChart2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div
                  className={`text-3xl font-extrabold ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {totalScans}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Clientes que escanearam suas mesas
                </p>
              </div>

              <div
                className={`border rounded-2xl p-5 transition-colors ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-[#121929] border-slate-800'
                }`}
              >
                <div
                  className={`flex items-center justify-between text-xs font-semibold mb-2 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  <span>Meus Cardápios & QRs</span>
                  <QrCode className="w-4 h-4 text-amber-500" />
                </div>
                <div
                  className={`text-3xl font-extrabold ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {qrs.length}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {activeProCount} Ativos no Plano PRO
                </p>
              </div>

              <div
                className={`border rounded-2xl p-5 transition-colors ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-[#121929] border-slate-800'
                }`}
              >
                <div
                  className={`flex items-center justify-between text-xs font-semibold mb-2 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  <span>Economia Estimada</span>
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                </div>
                <div
                  className={`text-3xl font-extrabold ${
                    isLight ? 'text-emerald-600' : 'text-emerald-400'
                  }`}
                >
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
              themeMode={clientTheme}
            />

            {/* List of Dynamic QRs */}
            {loading ? (
              <div className="py-20 text-center text-slate-500 text-xs">
                Carregando seus cardápios e códigos...
              </div>
            ) : qrs.length === 0 ? (
              <div
                className={`border rounded-3xl p-12 text-center max-w-lg mx-auto transition-colors ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-[#101726] border-slate-800'
                }`}
              >
                <Utensils className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3
                  className={`text-lg font-bold mb-1 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Bem-vindo, {currentUser.name}! Crie seu Primeiro Cardápio
                </h3>
                <p
                  className={`text-xs mb-6 leading-relaxed ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
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
                      className={`border rounded-2xl p-5 sm:p-6 shadow-md transition overflow-hidden ${
                        effectivePaid
                          ? isLight
                            ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
                            : 'bg-[#121929] border-slate-800 hover:border-slate-700'
                          : isLight
                          ? 'bg-white border-amber-300 shadow-sm'
                          : 'bg-slate-900/50 border-amber-500/30'
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        {/* Top: Info (full card width so URLs and badges never get squished) */}
                        <div className="space-y-2.5 w-full min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3
                              className={`text-base font-bold ${
                                isLight ? 'text-slate-900' : 'text-white'
                              }`}
                            >
                              {qr.title}
                            </h3>
                            <span
                              className={`border text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isLight
                                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              ID #{storeCode}
                            </span>
                            {effectivePaid ? (
                              <span
                                className={`border text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                                  isLight
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                }`}
                              >
                                <ShieldCheck className="w-3 h-3" />
                                PRO Ativo (Com Logo Central & Sem Ads)
                              </span>
                            ) : (
                              <button
                                onClick={() => handleTriggerProCheckout(qr.slug)}
                                className={`border text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 transition ${
                                  isLight
                                    ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                                }`}
                              >
                                <Lock className="w-3 h-3 text-amber-500" />
                                Versão Grátis • Ativar PRO + Logo ({proPriceLabel})
                              </button>
                            )}
                            {effectivePaid && qr.proExpiresAt && (
                              <span
                                className={`border text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                  isLight
                                    ? 'bg-sky-50 border-sky-200 text-sky-700'
                                    : 'bg-sky-500/15 border-sky-500/35 text-sky-300'
                                }`}
                              >
                                <Clock className="w-3 h-3 text-sky-500" />
                                <span>
                                  Expira em {formatRemainingProTime(qr.proExpiresAt, nowMs)}
                                </span>
                              </span>
                            )}
                            {qr.autoRenew?.enabled && (
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                                  qr.autoRenew.status === 'past_due'
                                    ? isLight
                                      ? 'bg-red-50 border-red-300 text-red-700'
                                      : 'bg-red-500/15 border-red-500/40 text-red-300'
                                    : isLight
                                    ? 'bg-sky-50 border-sky-200 text-sky-700'
                                    : 'bg-sky-500/15 border-sky-500/35 text-sky-300'
                                }`}
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>
                                  {qr.autoRenew.status === 'past_due'
                                    ? `Tentativa Cartão (${qr.autoRenew.retryCount}/10)`
                                    : `Cartão Salvo (•••• ${qr.autoRenew.cardLast4 || '****'})`}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Friendly PRO link invite bar when PRO still has random suffix */}
                          {effectivePaid &&
                            (qr.type === 'menu' || qr.type === 'catalog' || qr.linkedMenuId) &&
                            !qr.customSlug &&
                            friendlySlugEditing !== qr.slug && (
                              <div
                                className={`flex flex-wrap items-center justify-between gap-2 border rounded-xl px-3 py-2 text-[11px] ${
                                  isLight
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                                }`}
                              >
                                <span>
                                  ✨ <strong>Você é PRO!</strong> Seu link agora tem
                                  possibilidade de ficar mais curto e confortável (sem código final).
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSlug(null);
                                    setFriendlySlugEditing(qr.slug);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10px] uppercase transition shrink-0"
                                >
                                  Personalizar Link
                                </button>
                              </div>
                            )}

                          {/* Links Info */}
                          <div className="flex flex-wrap items-center gap-3 text-xs min-w-0">
                            <div
                              className={`flex items-center gap-1.5 border px-3 py-1 rounded-lg max-w-full ${
                                isLight
                                  ? 'bg-slate-50 border-slate-200'
                                  : 'bg-slate-900 border-slate-800'
                              }`}
                            >
                              <span className="text-slate-500 shrink-0">
                                Link do QR:
                              </span>
                              <span
                                className={`font-mono font-semibold truncate ${
                                  isLight ? 'text-emerald-700' : 'text-emerald-400'
                                }`}
                              >
                                /r/{qr.slug}
                              </span>
                              <button
                                onClick={() => copyShortUrl(qr.slug)}
                                className={`ml-1 shrink-0 ${
                                  isLight
                                    ? 'text-slate-500 hover:text-slate-900'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                                title="Copiar Link"
                              >
                                {copiedSlug === qr.slug ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <div
                              className={`flex items-center gap-1.5 min-w-0 max-w-full ${
                                isLight ? 'text-slate-600' : 'text-slate-400'
                              }`}
                            >
                              <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="shrink-0">Destino:</span>
                              <a
                                href={qr.targetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`underline font-mono truncate max-w-xs sm:max-w-md ${
                                  isLight
                                    ? 'text-slate-700 hover:text-emerald-600'
                                    : 'text-slate-300 hover:text-emerald-400'
                                }`}
                              >
                                {qr.targetUrl}
                              </a>
                            </div>
                          </div>

                          {/* Metrics Rule */}
                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                            {effectivePaid ? (
                              <span
                                className={`font-medium ${
                                  isLight ? 'text-emerald-700' : 'text-emerald-400/90'
                                }`}
                              >
                                📊 <strong>{qr.scansCount || 0}</strong>{' '}
                                leituras registradas nas mesas
                              </span>
                            ) : (
                              <span
                                className={`flex items-center gap-1 ${
                                  isLight ? 'text-amber-700' : 'text-amber-400/80'
                                }`}
                              >
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

                        {/* Bottom: Action Buttons neatly wrapped inside card bounds */}
                        <div
                          className={`w-full pt-3.5 border-t flex flex-wrap items-center gap-2 ${
                            isLight ? 'border-slate-200' : 'border-slate-800/80'
                          }`}
                        >
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
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                                    isLight
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                  }`}
                                >
                                  <span>
                                    {isCat ? 'Ver Catálogo' : 'Ver Cardápio'}
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-emerald-500" />
                                </Link>
                              </>
                            );
                          })()}

                          <button
                            onClick={() =>
                              handleOpenTableTentOrDownload(qr, 'tent')
                            }
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                              isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                            }`}
                            title="Imprimir Plaquinha de Mesa A6/A5"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-500" />
                            <span>Placa de Mesa</span>
                          </button>

                          <button
                            onClick={() =>
                              handleOpenTableTentOrDownload(qr, 'download')
                            }
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-sm ${
                              isLight
                                ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                                : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/40'
                            }`}
                            title="Baixar imagem do QR Code em PNG em Alta Definição"
                          >
                            <Download className="w-4 h-4 text-sky-500" />
                            <span>
                              {qr.type === 'catalog'
                                ? 'Baixar QR do Catálogo'
                                : qr.type === 'menu' || qr.linkedMenuId
                                ? 'Baixar QR do Cardápio'
                                : 'Baixar QR PNG'}
                            </span>
                          </button>

                          {/* Edit Friendly Link Button */}
                          {(qr.type === 'menu' || qr.type === 'catalog' || qr.linkedMenuId) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!effectivePaid) {
                                  setTargetUpgradeSlug(qr.slug);
                                  setLockFeatureTitle(
                                    'Link Amigável Personalizado é Exclusivo PRO'
                                  );
                                  setLockFeatureDescription(
                                    `Transforme seu endereço em um link curto e fácil de lembrar (ex: /${
                                      qr.type === 'catalog' ? 'catalogo' : 'cardapio'
                                    }/${qr.slug.replace(/-[a-z0-9]{2,4}$/, '')}) ativando o Plano PRO por ${proPriceLabel}/mês.`
                                  );
                                  setIsLockModalOpen(true);
                                  return;
                                }
                                setEditingSlug(null);
                                setFriendlySlugEditing(
                                  friendlySlugEditing === qr.slug ? null : qr.slug
                                );
                              }}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                                effectivePaid
                                  ? isLight
                                    ? 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200'
                                    : 'bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/35'
                                  : isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {effectivePaid ? (
                                <Link2 className="w-3.5 h-3.5 text-violet-500" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              <span>Link Amigável</span>
                            </button>
                          )}

                          {/* Recurring Auto-Renew Saved Card Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setRecurringCardTarget({
                                qr,
                                chargeNow: !effectivePaid,
                              })
                            }
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                              qr.autoRenew?.enabled
                                ? isLight
                                  ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
                                  : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40'
                                : isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                            title="Salvar cartão para renovação automática mensal"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-sky-500" />
                            <span>
                              {qr.autoRenew?.enabled
                                ? 'Cartão Salvo'
                                : 'Renovação Auto'}
                            </span>
                          </button>

                          {/* Edit Destination Button */}
                          <button
                            onClick={() => handleStartEdit(qr)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                              effectivePaid
                                ? isLight
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isLight
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
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
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Mudar Link (PRO)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Inline PRO Friendly Slug Customizer */}
                      {friendlySlugEditing === qr.slug && effectivePaid && (
                        <FriendlySlugPanel
                          currentSlug={qr.slug}
                          originalSlug={qr.originalSlug}
                          storeTitle={qr.title}
                          mode={qr.type === 'catalog' ? 'catalog' : 'menu'}
                          themeMode={clientTheme}
                          onUpdated={() => {
                            setFriendlySlugEditing(null);
                            fetchQRs();
                          }}
                          onClose={() => setFriendlySlugEditing(null)}
                        />
                      )}

                      {/* Inline Edit Form for PRO users */}
                      {isEditing && effectivePaid && (
                        <div
                          className={`mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-12 gap-3 items-end animate-fade-in p-4 rounded-xl ${
                            isLight
                              ? 'border-slate-200 bg-slate-50'
                              : 'border-slate-800 bg-slate-900/50'
                          }`}
                        >
                          <div className="sm:col-span-4">
                            <label
                              className={`text-[11px] font-semibold block mb-1 ${
                                isLight ? 'text-slate-700' : 'text-slate-300'
                              }`}
                            >
                              Nome do Estabelecimento / QR:
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className={`w-full border rounded-xl px-3 py-1.5 text-xs ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900'
                                  : 'bg-slate-950 border-slate-700 text-white'
                              }`}
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <label
                              className={`text-[11px] font-semibold block mb-1 ${
                                isLight ? 'text-slate-700' : 'text-slate-300'
                              }`}
                            >
                              Nova URL de Destino:
                            </label>
                            <input
                              type="text"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              placeholder="https://..."
                              className={`w-full border rounded-xl px-3 py-1.5 text-xs font-mono ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900'
                                  : 'bg-slate-950 border-slate-700 text-white'
                              }`}
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
                              className={`py-2 px-3 rounded-xl text-xs font-semibold transition ${
                                isLight
                                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                              }`}
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

      <Footer themeMode={clientTheme} />

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
        onOpenRecurringCard={() => {
          const matched = qrs.find((q) => q.slug === targetUpgradeSlug) || qrs[0];
          if (matched) {
            setRecurringCardTarget({ qr: matched, chargeNow: true });
          }
        }}
      />

      {/* Recurring Monthly Card Modal */}
      {recurringCardTarget && (
        <RecurringCardModal
          isOpen={Boolean(recurringCardTarget)}
          onClose={() => setRecurringCardTarget(null)}
          slug={recurringCardTarget.qr.slug}
          storeTitle={recurringCardTarget.qr.title}
          isCurrentlyPro={isProStillValid(recurringCardTarget.qr, nowMs)}
          proExpiresAt={recurringCardTarget.qr.proExpiresAt}
          currentAutoRenew={recurringCardTarget.qr.autoRenew}
          proPriceReais={proPrice}
          defaultChargeNow={Boolean(recurringCardTarget.chargeNow)}
          onSuccess={() => {
            setRecurringCardTarget(null);
            fetchQRs();
          }}
        />
      )}

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
