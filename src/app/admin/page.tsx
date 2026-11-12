'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  DeveloperLead,
  DeveloperLeadStatus,
  DeveloperServiceType,
  DeveloperSettings,
  DeveloperNotification,
  PaymentRecord,
  AdminStoreSummary,
  ProVoucher,
} from '@/lib/types';
import AdminStoresProPanel from '@/components/AdminStoresProPanel';
import AdminVouchersPanel from '@/components/AdminVouchersPanel';
import AdminSecurityPanel from '@/components/AdminSecurityPanel';
import {
  Inbox,
  MessageCircle,
  CheckCircle2,
  Clock,
  Trash2,
  DollarSign,
  Sparkles,
  Bot,
  Scissors,
  CalendarCheck,
  Globe,
  UtensilsCrossed,
  Layers,
  Search,
  Filter,
  Copy,
  Check,
  Settings,
  Save,
  Building2,
  Phone,
  FileText,
  QrCode,
  ArrowUpRight,
  RefreshCw,
  Lock,
  KeyRound,
  LogOut,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  Bell,
  BellRing,
  Smartphone,
  TrendingUp,
  CreditCard,
  Download,
  Volume2,
  Store,
  Ticket,
} from 'lucide-react';
import Link from 'next/link';
import { broadcastProPriceUpdate } from '@/lib/pro-price';

const STATUS_CONFIG: Record<
  DeveloperLeadStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  novo: {
    label: 'Novo Pedido',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    dotClass: 'bg-emerald-400 animate-pulse',
  },
  em_contato: {
    label: 'Em Conversa',
    badgeClass: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    dotClass: 'bg-amber-400',
  },
  proposta_enviada: {
    label: 'Proposta Enviada',
    badgeClass: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
    dotClass: 'bg-sky-400',
  },
  fechado: {
    label: 'Projeto Fechado 💰',
    badgeClass: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
    dotClass: 'bg-purple-400',
  },
  arquivado: {
    label: 'Arquivado',
    badgeClass: 'bg-slate-800 border-slate-700 text-slate-400',
    dotClass: 'bg-slate-500',
  },
};

const SERVICE_ICONS: Record<DeveloperServiceType, React.ElementType> = {
  ia_atendimento: Bot,
  salao_barbearia: Scissors,
  marcacao_consultas: CalendarCheck,
  sites_landing_pages: Globe,
  delivery_restaurante: UtensilsCrossed,
  sistema_sob_medida: Layers,
};

export default function DeveloperAdminDashboard() {
  // Authentication State
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Main Navigation Tab for Mobile App & Desktop
  const [activeAppSection, setActiveAppSection] = useState<
    | 'overview'
    | 'stores'
    | 'vouchers'
    | 'security'
    | 'subscriptions'
    | 'proposals'
    | 'notifications'
  >('overview');

  // Dashboard Data State
  const [leads, setLeads] = useState<DeveloperLead[]>([]);
  const [stores, setStores] = useState<AdminStoreSummary[]>([]);
  const [vouchers, setVouchers] = useState<ProVoucher[]>([]);
  const [notifications, setNotifications] = useState<DeveloperNotification[]>(
    []
  );
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<{
    currentMonthLabel: string;
    monthlyApprovedCount: number;
    monthlyRevenue: number;
    todayApprovedCount: number;
    todayRevenue: number;
    totalActiveProCount: number;
    totalAllTimeRevenue: number;
    pendingPaymentsCount: number;
    paymentsList: PaymentRecord[];
  }>({
    currentMonthLabel: 'Mês Atual',
    monthlyApprovedCount: 0,
    monthlyRevenue: 0,
    todayApprovedCount: 0,
    todayRevenue: 0,
    totalActiveProCount: 0,
    totalAllTimeRevenue: 0,
    pendingPaymentsCount: 0,
    paymentsList: [],
  });

  const [settings, setSettings] = useState<DeveloperSettings>({
    developerName: 'Desenvolvedor Full-Stack & Especialista em IA',
    developerWhatsapp: '5511999998888',
    developerEmail: 'edvandonasicmentosilva@gmail.com',
    agencyHeadline:
      'Desenvolvemos Sites, IA de Atendimento 24h, Sistemas de Agendamento para Clínicas, Salões de Beleza, Barbearias e Restaurantes.',
    availableForProjects: true,
    adminUsername: 'edvandonasicmentosilva@gmail.com',
    ntfyTopic: 'spotqr-edvan-alertas-1982',
  });
  const [platformStats, setPlatformStats] = useState({
    totalQRs: 0,
    paidQRs: 0,
    qrRevenue: 0,
    totalScans: 0,
  });
  const [cloudPersistenceEnabled, setCloudPersistenceEnabled] = useState<
    boolean | null
  >(null);

  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [serviceFilter, setServiceFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mobile PWA & Push Notification State
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const deletedLeadIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);

  // Editing Notes & Estimated Value per lead
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [tempNotes, setTempNotes] = useState<string>('');
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);

  // Settings & Password panels
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(
    'edvandonasicmentosilva@gmail.com'
  );
  const [newPassword, setNewPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Register Service Worker & PWA Install Prompt
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDeleted = JSON.parse(
          localStorage.getItem('spotqr_deleted_leads') || '[]'
        );
        if (Array.isArray(savedDeleted)) {
          savedDeleted.forEach((id: string) =>
            deletedLeadIdsRef.current.add(id)
          );
        }
      } catch {
        // ignore
      }
      if ('Notification' in window) {
        setNotifPermission(Notification.permission);
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredInstallPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => {
        window.removeEventListener(
          'beforeinstallprompt',
          handleBeforeInstallPrompt
        );
      };
    }
  }, []);

  useEffect(() => {
    checkSessionAndLoad();
  }, []);

  // Real-time background polling for new subscriptions & proposals every 6 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const playCashRegisterChime = () => {
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.12); // E6
      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.65);
    } catch {
      // ignore if audio blocked
    }
  };

  const triggerDeviceNotification = async (title: string, body: string) => {
    playCashRegisterChime();
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && 'showNotification' in reg) {
            await reg.showNotification(title, {
              body,
              icon: '/icon.svg',
              badge: '/icon.svg',
              vibrate: [200, 100, 200],
              data: { url: '/admin' },
            } as any);
            return;
          }
        }
        new Notification(title, {
          body,
          icon: '/icon.svg',
        });
      } catch {
        // fallback
      }
    }
  };

  const handleEnableBrowserNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Seu navegador atual não suporta notificações nativas.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      triggerDeviceNotification(
        '🔔 Alertas Ativados no Celular!',
        'Você receberá notificações com som sempre que cair uma assinatura ou proposta de cliente.'
      );
    }
  };

  const handleInstallMobileApp = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredInstallPrompt(null);
      }
    } else {
      setShowInstallGuideModal(true);
    }
  };

  const handleTestLiveNotification = async () => {
    setTestingPush(true);
    try {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'default'
      ) {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
      }
      const res = await fetch('/api/developer-leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_notification' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        if (data.notification) {
          seenNotifIdsRef.current.add(data.notification.id);
          triggerDeviceNotification(
            data.notification.title,
            data.notification.message
          );
        }
      }
    } catch (err) {
      console.error('Error testing notification:', err);
    } finally {
      setTestingPush(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/developer-leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_notifications_read' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  async function checkSessionAndLoad() {
    setCheckingAuth(true);
    try {
      const authRes = await fetch('/api/admin/auth');
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.authenticated) {
          setIsAuthenticated(true);
          if (authData.username) setNewUsername(authData.username);
          await fetchDashboardData(false);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Error checking admin auth:', err);
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUser,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        setLoginPassword('');
        await fetchDashboardData(false);
      } else {
        setLoginError(
          data.error || 'Usuário ou senha incorretos. Acesso negado.'
        );
      }
    } catch (err) {
      console.error('Error logging in:', err);
      setLoginError('Erro de conexão ao verificar credenciais.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch (err) {
      console.error('Error logging out:', err);
    }
    setIsAuthenticated(false);
    setLeads([]);
    setLoginPassword('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    setSavingPassword(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newUsername,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordFeedback({
          type: 'success',
          text:
            data.message || 'Usuário e senha de acesso alterados com sucesso!',
        });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordFeedback({
          type: 'error',
          text: data.error || 'Não foi possível alterar a senha.',
        });
      }
    } catch (err) {
      setPasswordFeedback({
        type: 'error',
        text: 'Erro ao salvar nova senha.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  async function fetchDashboardData(isBackgroundPoll: boolean = false) {
    if (!isBackgroundPoll) setLoading(true);
    try {
      const res = await fetch('/api/developer-leads');
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const incomingLeads: DeveloperLead[] = (data.leads || []).filter(
          (l: DeveloperLead) =>
            !deletedLeadIdsRef.current.has(l.id) &&
            !['lead-demo-1', 'lead-demo-2', 'lead-demo-3'].includes(l.id)
        );
        setLeads(incomingLeads);
        if (data.settings && !isBackgroundPoll) {
          setSettings({
            ...data.settings,
            ntfyTopic:
              data.settings.ntfyTopic || 'spotqr-edvan-alertas-1982',
          });
          if (data.settings.adminUsername) {
            setNewUsername(data.settings.adminUsername);
          }
        }
        if (data.platformStats) setPlatformStats(data.platformStats);
        if (typeof data.cloudPersistenceEnabled === 'boolean') {
          setCloudPersistenceEnabled(data.cloudPersistenceEnabled);
        }
        if (data.subscriptionAnalytics) {
          setSubscriptionAnalytics(data.subscriptionAnalytics);
        }
        if (Array.isArray(data.stores)) {
          setStores(data.stores);
        }
        if (Array.isArray(data.vouchers)) {
          setVouchers(data.vouchers);
        }
        if (data.notifications) {
          const incoming: DeveloperNotification[] = data.notifications;
          if (!initialLoadDoneRef.current) {
            incoming.forEach((n) => seenNotifIdsRef.current.add(n.id));
            initialLoadDoneRef.current = true;
          } else {
            // Check for brand new notifications that arrived since last poll
            for (const n of incoming) {
              if (!seenNotifIdsRef.current.has(n.id)) {
                seenNotifIdsRef.current.add(n.id);
                triggerDeviceNotification(n.title, n.message);
              }
            }
          }
          setNotifications(incoming);
        }
      }
    } catch (err) {
      if (!isBackgroundPoll) {
        console.error('Error loading developer dashboard:', err);
      }
    } finally {
      if (!isBackgroundPoll) setLoading(false);
    }
  }

  const handleStatusChange = async (
    id: string,
    newStatus: DeveloperLeadStatus
  ) => {
    try {
      const res = await fetch('/api/developer-leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
          )
        );
      }
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  const handleStartEditLeadDetails = (lead: DeveloperLead) => {
    setEditingLeadId(lead.id);
    setTempValue(lead.estimatedValue ? String(lead.estimatedValue) : '');
    setTempNotes(lead.developerNotes || '');
  };

  const handleSaveLeadDetails = async (id: string) => {
    setSavingLeadId(id);
    try {
      const res = await fetch('/api/developer-leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          estimatedValue: Number(tempValue) || 0,
          developerNotes: tempNotes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLeads((prev) =>
          prev.map((item) => (item.id === id ? data.lead : item))
        );
        setEditingLeadId(null);
      }
    } catch (err) {
      console.error('Error saving lead notes:', err);
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleDeleteLead = async (id: string) => {
    deletedLeadIdsRef.current.add(id);
    try {
      const arr = Array.from(deletedLeadIdsRef.current);
      localStorage.setItem('spotqr_deleted_leads', JSON.stringify(arr));
    } catch {
      // ignore
    }
    setLeads((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`/api/developer-leads?id=${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/developer-leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          settings,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const savedPrice =
          data?.settings?.proPriceReais ?? settings.proPriceReais;
        if (savedPrice) {
          broadcastProPriceUpdate(savedPrice);
        }
        setSettingsSavedToast(true);
        setTimeout(() => setSettingsSavedToast(false), 3000);
      }
    } catch (err) {
      console.error('Error saving developer settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const copyContact = (id: string, contactText: string) => {
    navigator.clipboard.writeText(contactText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const buildWhatsAppReplyUrl = (lead: DeveloperLead) => {
    const digits = lead.contact.replace(/\D/g, '');
    const phone =
      digits.length >= 10
        ? digits.startsWith('55')
          ? digits
          : `55${digits}`
        : '';
    const msg = encodeURIComponent(
      `Olá ${lead.name}! Tudo bem? Sou o desenvolvedor responsável pelo SpotQR Pro. Recebi sua mensagem sobre o desenvolvimento de *${lead.serviceLabel}*${
        lead.businessName ? ` para *${lead.businessName}*` : ''
      }. Vamos conversar sobre como criar esse projeto para você?`
    );
    return phone
      ? `https://wa.me/${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    if (statusFilter !== 'todos' && lead.status !== statusFilter) return false;
    if (serviceFilter !== 'todos' && lead.serviceType !== serviceFilter)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchBiz = (lead.businessName || '').toLowerCase().includes(q);
      const matchDesc = lead.description.toLowerCase().includes(q);
      const matchContact = lead.contact.toLowerCase().includes(q);
      const matchLabel = lead.serviceLabel.toLowerCase().includes(q);
      if (
        !matchName &&
        !matchBiz &&
        !matchDesc &&
        !matchContact &&
        !matchLabel
      ) {
        return false;
      }
    }
    return true;
  });

  // Metrics Calculation
  const newLeadsCount = leads.filter((l) => l.status === 'novo').length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;
  const totalPipelineValue = leads
    .filter((l) => l.status !== 'arquivado')
    .reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
  const closedDealsValue = leads
    .filter((l) => l.status === 'fechado')
    .reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
  const closedDealsCount = leads.filter((l) => l.status === 'fechado').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] pb-24 sm:pb-16">
      <Navbar />

      {checkingAuth ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
              <Lock className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-400">
              Verificando credenciais de segurança do desenvolvedor...
            </p>
          </div>
        </main>
      ) : !isAuthenticated ? (
        /* EXCLUSIVE DEVELOPER LOGIN SCREEN */
        <main className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
          <div className="absolute -top-20 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="w-full max-w-md bg-[#101726] border-2 border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl relative z-10">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 mx-auto mb-4 shadow-glow">
                <Lock className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                Área Restrita & App Mobile
              </span>
              <h1 className="text-2xl font-extrabold text-white mt-3">
                Acesso Exclusivo Desenvolvedor
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Entre com seu login e senha para acompanhar assinaturas do mês,
                valores faturados e propostas no seu celular.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Seu E-mail de Desenvolvedor
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="Digite seu e-mail de acesso..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Senha Exclusiva de Acesso
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Digite sua senha..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-glow transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {loggingIn
                    ? 'Autenticando...'
                    : 'Entrar no App do Desenvolvedor'}
                </span>
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-emerald-400 transition"
              >
                ← Voltar para a Página Principal
              </Link>
            </div>
          </div>
        </main>
      ) : (
        /* AUTHENTICATED DEVELOPER MOBILE APP & CRM DASHBOARD */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Top App Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  SpotQR App Mobile • Edvan Dev
                </span>

                {unreadNotifsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAppSection('notifications');
                      handleMarkAllRead();
                    }}
                    className="text-[11px] font-extrabold text-slate-950 bg-emerald-400 px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1"
                  >
                    <BellRing className="w-3 h-3" />
                    <span>{unreadNotifsCount} Novos Alertas!</span>
                  </button>
                )}

                {newLeadsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveAppSection('proposals')}
                    className="text-[11px] font-extrabold text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-full"
                  >
                    {newLeadsCount}{' '}
                    {newLeadsCount === 1
                      ? 'Proposta Nova'
                      : 'Propostas Novas'}
                  </button>
                )}

                {cloudPersistenceEnabled === true && (
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    🟢 Banco Nuvem Ativo (Cadastros Salvos)
                  </span>
                )}
              </div>

              {cloudPersistenceEnabled === false && (
                <div className="mb-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 max-w-2xl">
                  <strong className="text-amber-300 block mb-0.5">
                    ⚠️ Banco em Nuvem ainda não conectado na Vercel (Modo Temporário)
                  </strong>
                  <span>
                    Sem banco externo, a Vercel limpa usuários e menus temporários quando você publica uma nova atualização. No painel da Vercel, abra a aba <strong>Storage ➔ Create Database ➔ Upstash Redis (Grátis)</strong> e conecte ao projeto <strong>spotqr</strong> para salvar todos os logins permanentemente.
                  </span>
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Painel de Assinaturas, Faturamento & Propostas
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Acompanhe em tempo real no seu celular quantas assinaturas foram
                feitas no mês, valores recebidos e mensagens de clientes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleInstallMobileApp}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-glow transition whitespace-nowrap"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>📲 Instalar App no Celular</span>
              </button>

              <button
                type="button"
                onClick={handleTestLiveNotification}
                disabled={testingPush}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-extrabold transition whitespace-nowrap"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {testingPush ? 'Enviando...' : '🔔 Testar Alerta com Som'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => fetchDashboardData(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Atualizar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowPasswordModal(false);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-extrabold border border-sky-500/30 transition whitespace-nowrap"
              >
                <Settings className="w-3.5 h-3.5 text-sky-400" />
                <span>Mercado Pago & Config</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(!showPasswordModal);
                  setShowSettings(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Senha</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-bold transition whitespace-nowrap"
                title="Trancar Painel e Sair"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* APP NAVIGATION TABS (Desktop Pills + Mobile Bottom Bar) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-1.5 bg-[#101726] border border-slate-800 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setActiveAppSection('overview')}
              className={`flex items-center justify-center gap-1.5 py-3 px-2.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                activeAppSection === 'overview'
                  ? 'bg-emerald-500 text-slate-950 shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>📊 Resumo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppSection('stores')}
              className={`flex items-center justify-center gap-1.5 py-3 px-2.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                activeAppSection === 'stores'
                  ? 'bg-emerald-500 text-slate-950 shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-4 h-4 shrink-0" />
              <span>🏪 Lojas &amp; PRO ({stores.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppSection('vouchers')}
              className={`flex items-center justify-center gap-1.5 py-3 px-2.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                activeAppSection === 'vouchers'
                  ? 'bg-emerald-500 text-slate-950 shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ticket className="w-4 h-4 shrink-0" />
              <span>🎟️ Vouchers ({vouchers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppSection('security')}
              className={`flex items-center justify-center gap-1.5 py-3 px-2.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                activeAppSection === 'security'
                  ? 'bg-emerald-500 text-slate-950 shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>🔐 Segurança &amp; PIX</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppSection('subscriptions')}
              className={`flex items-center justify-center gap-1.5 py-3 px-2.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                activeAppSection === 'subscriptions'
                  ? 'bg-emerald-500 text-slate-950 shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>
                💰 Assinaturas ({subscriptionAnalytics.monthlyApprovedCount})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppSection('proposals')}
              className={`flex items-center justify-center gap-1.5 py-3 px-2.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                activeAppSection === 'proposals'
                  ? 'bg-emerald-500 text-slate-950 shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>💬 Propostas ({leads.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveAppSection('notifications');
                handleMarkAllRead();
              }}
              className={`flex items-center justify-center gap-1.5 py-3 px-2.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                activeAppSection === 'notifications'
                  ? 'bg-emerald-500 text-slate-950 shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>🔔 Alertas ({notifications.length})</span>
            </button>
          </div>

          {/* Collapsible Change Password Panel */}
          {showPasswordModal && (
            <div className="bg-[#121929] border-2 border-amber-500/40 rounded-3xl p-6 mb-8 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Segurança: Alterar Usuário e Senha do Painel</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Defina seu usuário e senha exclusivos para acessar esta tela
                    de mensagens.
                  </p>
                </div>
              </div>

              {passwordFeedback && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs font-bold border ${
                    passwordFeedback.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/15 border-red-500/30 text-red-300'
                  }`}
                >
                  {passwordFeedback.text}
                </div>
              )}

              <form
                onSubmit={handleChangePassword}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Novo Usuário / E-mail de Login
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Senha Atual *
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nova Senha Forte *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {savingPassword ? 'Salvando...' : 'Atualizar Senha'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Collapsible Developer Settings Panel */}
          {showSettings && (
            <div className="bg-[#121929] border-2 border-emerald-500/40 rounded-3xl p-6 mb-8 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span>
                      Configurações de Pagamento (Mercado Pago) & Notificações
                      no Celular
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Gerencie suas chaves de produção do Mercado Pago e o canal
                    de Push Mobile no celular.
                  </p>
                </div>
                {settingsSavedToast && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Dados salvos com sucesso!
                  </span>
                )}
              </div>

              <form
                onSubmit={handleSaveSettings}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Seu Nome / Nome da Sua Agência
                  </label>
                  <input
                    type="text"
                    value={settings.developerName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        developerName: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Seu WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    value={settings.developerWhatsapp}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        developerWhatsapp: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tópico de Push no Celular (App Ntfy Grátis)
                  </label>
                  <input
                    type="text"
                    value={settings.ntfyTopic || 'spotqr-edvan-alertas-1982'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ntfyTopic: e.target.value,
                      })
                    }
                    placeholder="spotqr-edvan-alertas-1982"
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3.5 py-2 text-xs text-emerald-300 font-mono"
                  />
                </div>

                {/* MERCADO LIVRE / MERCADO PAGO INTEGRATION SECTION */}
                <div className="sm:col-span-3 pt-4 mt-2 border-t border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-sky-400 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>
                          Integração Oficial Mercado Livre / Mercado Pago
                          (Recebimento de Assinaturas PRO)
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Suas credenciais de produção (`APP_USR-...`) estão
                        conectadas para receber PIX e Cartão direto na sua
                        conta.
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-emerald-500/15 border-emerald-500/40 text-emerald-400">
                      🟢 Produção Ativa (Mercado Pago Conectado)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Public Key (Produção)
                      </label>
                      <input
                        type="text"
                        value={
                          settings.mpPublicKey ||
                          'APP_USR-8b245dbb-b6c0-4335-b46a-ae016ea5071d'
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            mpPublicKey: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Access Token Mercado Pago (Produção)
                      </label>
                      <input
                        type="password"
                        value={settings.mpAccessToken || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            mpAccessToken: e.target.value,
                          })
                        }
                        placeholder="APP_USR-4000171423020297-..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Sua Chave PIX Reserva (Opcional)
                      </label>
                      <input
                        type="text"
                        value={settings.mpPixKey || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            mpPixKey: e.target.value,
                          })
                        }
                        placeholder="Seu CPF, CNPJ, E-mail ou Celular"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Valor da Assinatura PRO (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={settings.proPriceReais ?? 10.9}
                        onChange={(e) => {
                          const parsed = parseFloat(
                            e.target.value.replace(',', '.')
                          );
                          setSettings({
                            ...settings,
                            proPriceReais:
                              Number.isFinite(parsed) && parsed > 0
                                ? parsed
                                : 10.9,
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {savingSettings ? 'Salvando...' : 'Salvar Configurações'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MONTHLY FINANCIAL & SUBSCRIPTIONS KPI CARDS (Always visible on Overview & Subscriptions) */}
          {(activeAppSection === 'overview' ||
            activeAppSection === 'subscriptions') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Card 1: Monthly Subscriptions & Value */}
              <div className="bg-gradient-to-br from-emerald-950/60 to-[#121929] border-2 border-emerald-500/40 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-2">
                  <span>
                    Assinaturas no Mês ({subscriptionAnalytics.currentMonthLabel})
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-extrabold text-white">
                    R${' '}
                    {subscriptionAnalytics.monthlyRevenue
                      .toFixed(2)
                      .replace('.', ',')}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                    {subscriptionAnalytics.monthlyApprovedCount}{' '}
                    {subscriptionAnalytics.monthlyApprovedCount === 1
                      ? 'assinatura'
                      : 'assinaturas'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Hoje: {subscriptionAnalytics.todayApprovedCount} pagas (R${' '}
                  {subscriptionAnalytics.todayRevenue
                    .toFixed(2)
                    .replace('.', ',')}
                  )
                </p>
              </div>

              {/* Card 2: Active PRO Subscriptions & Pending PIX */}
              <div className="bg-[#121929] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span>Total Assinaturas PRO Ativas</span>
                  <QrCode className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400">
                    {subscriptionAnalytics.totalActiveProCount}
                  </span>
                  <span className="text-xs text-slate-400">
                    clientes PRO (R${' '}
                    {subscriptionAnalytics.totalAllTimeRevenue
                      .toFixed(2)
                      .replace('.', ',')}{' '}
                    total)
                  </span>
                </div>
                <p className="text-[11px] text-amber-400 font-semibold mt-1.5">
                  ⏳ {subscriptionAnalytics.pendingPaymentsCount} cobranças PIX
                  aguardando pagamento
                </p>
              </div>

              {/* Card 3: Proposals & Messages */}
              <div className="bg-[#121929] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span>Propostas de Desenvolvimento</span>
                  <Inbox className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {leads.length}
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    ({newLeadsCount} novas)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Orçamentos em negociação:{' '}
                  <strong className="text-amber-300">
                    R$ {totalPipelineValue.toLocaleString('pt-BR')}
                  </strong>
                </p>
              </div>

              {/* Card 4: Closed Deals + Mobile Alert Status */}
              <div className="bg-[#121929] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span>Contratos Dev Fechados</span>
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    R$ {closedDealsValue.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-purple-400 font-bold">
                    ({closedDealsCount} ganhos)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {platformStats.totalScans} leituras de QR nas mesas
                </p>
              </div>
            </div>
          )}

          {/* SECTION: STORES & IN-PERSON PRO ACTIVATION */}
          {(activeAppSection === 'stores' || activeAppSection === 'overview') && (
            <AdminStoresProPanel
              stores={stores}
              onStoresUpdated={setStores}
              onRefresh={() => fetchDashboardData(true)}
            />
          )}

          {/* SECTION: PRINTABLE VOUCHERS GENERATOR */}
          {(activeAppSection === 'vouchers' ||
            activeAppSection === 'overview') && (
            <AdminVouchersPanel
              vouchers={vouchers}
              onVouchersUpdated={setVouchers}
            />
          )}

          {/* SECTION: SECURITY, PASSWORD RECOVERY & ANTI-PIX-HIJACK */}
          {(activeAppSection === 'security' ||
            activeAppSection === 'overview') && <AdminSecurityPanel />}

          {/* SECTION: SUBSCRIPTIONS & MONTHLY REVENUE BREAKDOWN */}
          {(activeAppSection === 'subscriptions' ||
            activeAppSection === 'overview') && (
            <div className="bg-[#101726] border border-slate-800 rounded-3xl p-5 sm:p-6 mb-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span>
                      Relatório de Assinaturas PRO —{' '}
                      {subscriptionAnalytics.currentMonthLabel}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Histórico em tempo real de todas as assinaturas pagas e
                    cobranças PIX geradas no Mercado Pago.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                    Total Mês: R${' '}
                    {subscriptionAnalytics.monthlyRevenue
                      .toFixed(2)
                      .replace('.', ',')}{' '}
                    ({subscriptionAnalytics.monthlyApprovedCount} pagas)
                  </span>
                </div>
              </div>

              {subscriptionAnalytics.paymentsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhuma assinatura registrada ainda.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {subscriptionAnalytics.paymentsList
                    .slice(0, activeAppSection === 'overview' ? 5 : 50)
                    .map((payment) => {
                      const isApproved = payment.status === 'approved';
                      return (
                        <div
                          key={payment.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition ${
                            isApproved
                              ? 'bg-emerald-950/25 border-emerald-500/30'
                              : 'bg-slate-900/70 border-slate-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                                  isApproved
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {isApproved
                                  ? '✅ PAGO (PRO ATIVO)'
                                  : '⏳ AGUARDANDO PIX'}
                              </span>
                              <strong className="text-sm text-white">
                                {payment.clientName || payment.slug}
                              </strong>
                              <span className="text-xs text-emerald-400 font-mono">
                                /{payment.slug}
                              </span>
                            </div>
                            <div
                              className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3"
                              suppressHydrationWarning
                            >
                              <span>ID Mercado Pago: #{payment.id}</span>
                              {payment.clientEmail && (
                                <span>• E-mail: {payment.clientEmail}</span>
                              )}
                              <span>
                                • Data:{' '}
                                {new Date(
                                  payment.approvedAt || payment.createdAt
                                ).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span
                              className={`text-base font-extrabold ${
                                isApproved
                                  ? 'text-emerald-400'
                                  : 'text-slate-300'
                              }`}
                            >
                              R${' '}
                              {Number(payment.amount || 10.9)
                                .toFixed(2)
                                .replace('.', ',')}
                            </span>
                            <Link
                              href={`/cardapio/${payment.slug}`}
                              target="_blank"
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1"
                            >
                              <span>Ver Cardápio</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* SECTION: NOTIFICATIONS & MOBILE APP SETUP */}
          {(activeAppSection === 'notifications' ||
            activeAppSection === 'overview') && (
            <div className="bg-[#101726] border border-slate-800 rounded-3xl p-5 sm:p-6 mb-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-amber-400" />
                    <span>
                      Central de Notificações no Celular (Assinaturas &
                      Propostas)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Receba alertas sonoros e notificações push no seu celular
                    sempre que entrar uma assinatura ou proposta.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {notifPermission !== 'granted' ? (
                    <button
                      type="button"
                      onClick={handleEnableBrowserNotifications}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Ativar Permissão de Notificação</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Notificações Nativas Ativas</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleTestLiveNotification}
                    disabled={testingPush}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition whitespace-nowrap"
                  >
                    ⚡ Disparar Teste Agora
                  </button>
                </div>
              </div>

              {/* Mobile Push Lock-Screen Integration Box (Ntfy) */}
              <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-4 mb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>
                      Quer receber Push no Celular mesmo com a tela bloqueada?
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    1. Clique em <strong>&ldquo;📲 Instalar App no Celular&rdquo;</strong> no topo para fixar este painel na tela inicial do seu Android ou iPhone.
                    <br />
                    2. Para alertas 24h com tela bloqueada, instale o app gratuito{' '}
                    <strong className="text-white">ntfy</strong> (Play Store / App Store) e inscreva-se no tópico exclusivo:{' '}
                    <code className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                      {settings.ntfyTopic || 'spotqr-edvan-alertas-1982'}
                    </code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyContact(
                      'ntfy-topic',
                      settings.ntfyTopic || 'spotqr-edvan-alertas-1982'
                    )
                  }
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold shrink-0 whitespace-nowrap"
                >
                  {copiedId === 'ntfy-topic'
                    ? '✓ Tópico Copiado!'
                    : 'Copiar Código do Tópico'}
                </button>
              </div>

              {/* Notification Feed */}
              <div className="space-y-2.5">
                {notifications
                  .slice(0, activeAppSection === 'overview' ? 4 : 30)
                  .map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                        notif.type === 'subscription_paid'
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : notif.type === 'new_lead'
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold text-white">
                            {notif.title}
                          </span>
                          <span
                            className="text-[11px] text-slate-400"
                            suppressHydrationWarning
                          >
                            •{' '}
                            {new Date(notif.createdAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {notif.message}
                        </p>
                      </div>

                      {notif.amount && (
                        <span className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold shrink-0">
                          + R$ {notif.amount.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SECTION: PROPOSALS / LEADS CRM */}
          {(activeAppSection === 'proposals' ||
            activeAppSection === 'overview') && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <span>
                    Propostas de Desenvolvimento Recebidas ({leads.length})
                  </span>
                </h2>
              </div>

              {/* Filters & Search Bar */}
              <div className="bg-[#101726] border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'todos', label: `Todas (${leads.length})` },
                    {
                      id: 'novo',
                      label: `Novos (${
                        leads.filter((l) => l.status === 'novo').length
                      })`,
                    },
                    {
                      id: 'em_contato',
                      label: `Em Conversa (${
                        leads.filter((l) => l.status === 'em_contato').length
                      })`,
                    },
                    {
                      id: 'proposta_enviada',
                      label: `Proposta (${
                        leads.filter((l) => l.status === 'proposta_enviada')
                          .length
                      })`,
                    },
                    {
                      id: 'fechado',
                      label: `Fechados 💰 (${
                        leads.filter((l) => l.status === 'fechado').length
                      })`,
                    },
                    { id: 'arquivado', label: 'Arquivados' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        statusFilter === tab.id
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Right: Service Filter + Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={serviceFilter}
                      onChange={(e) => setServiceFilter(e.target.value)}
                      className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                    >
                      <option value="todos">Todos os Tipos de Serviço</option>
                      <option value="ia_atendimento">
                        🤖 IA de Atendimento (WhatsApp)
                      </option>
                      <option value="salao_barbearia">
                        ✂️ Salão de Beleza & Barbearia
                      </option>
                      <option value="marcacao_consultas">
                        📅 Marcação de Consultas & Clínicas
                      </option>
                      <option value="sites_landing_pages">
                        🌐 Sites & Landing Pages
                      </option>
                      <option value="delivery_restaurante">
                        🍔 Delivery & Restaurantes
                      </option>
                      <option value="sistema_sob_medida">
                        🚀 Sistemas Sob Medida
                      </option>
                    </select>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar cliente, barbearia, IA..."
                      className="w-full sm:w-56 bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Leads / Messages List */}
              {loading ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  Carregando caixa de entrada do desenvolvedor...
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="bg-[#101726] border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
                  <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-1">
                    Nenhuma mensagem encontrada neste filtro
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">
                    Quando visitantes preencherem o formulário &ldquo;Fale com o
                    Desenvolvedor&rdquo; na página inicial, os pedidos
                    aparecerão instantaneamente aqui com alerta sonoro.
                  </p>
                  <Link
                    href="/#desenvolvedor"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-extrabold shadow-glow"
                  >
                    Ver Formulário na Página Principal
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLeads.map((lead) => {
                    const statusMeta =
                      STATUS_CONFIG[lead.status] || STATUS_CONFIG.novo;
                    const ServiceIcon =
                      SERVICE_ICONS[lead.serviceType] || Sparkles;
                    const isEditing = editingLeadId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        className={`rounded-2xl border p-5 sm:p-6 transition shadow-lg ${
                          lead.status === 'novo'
                            ? 'bg-gradient-to-r from-[#131f33] to-[#111827] border-emerald-500/40'
                            : 'bg-[#121929] border-slate-800'
                        }`}
                      >
                        {/* Top Row: Client Info + Status Selector */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.badgeClass}`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${statusMeta.dotClass}`}
                                />
                                {statusMeta.label}
                              </span>

                              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                                <ServiceIcon className="w-3.5 h-3.5" />
                                {lead.serviceLabel}
                              </span>

                              {lead.urgency && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                                  <Clock className="w-3 h-3" />
                                  {lead.urgency}
                                </span>
                              )}

                              {lead.budgetRange && (
                                <span className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full">
                                  Orçamento: <strong>{lead.budgetRange}</strong>
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <h3 className="text-lg font-extrabold text-white">
                                {lead.name}
                              </h3>
                              {lead.businessName && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-lg">
                                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                                  {lead.businessName}
                                </span>
                              )}
                              <span
                                className="text-[11px] text-slate-500"
                                suppressHydrationWarning
                              >
                                • Recebido em{' '}
                                {new Date(lead.createdAt).toLocaleString(
                                  'pt-BR',
                                  {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Right Actions: Reply on WhatsApp + Status Dropdown */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <a
                              href={buildWhatsAppReplyUrl(lead)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => {
                                if (lead.status === 'novo') {
                                  handleStatusChange(lead.id, 'em_contato');
                                }
                              }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-glow transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Chamar Cliente no WhatsApp</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>

                            <select
                              value={lead.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  lead.id,
                                  e.target.value as DeveloperLeadStatus
                                )
                              }
                              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-emerald-500"
                            >
                              <option value="novo">🔴 Novo Pedido</option>
                              <option value="em_contato">🟡 Em Conversa</option>
                              <option value="proposta_enviada">
                                🔵 Proposta Enviada
                              </option>
                              <option value="fechado">
                                🟢 Projeto Fechado 💰
                              </option>
                              <option value="arquivado">⚪ Arquivado</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 transition"
                              title="Excluir Mensagem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Middle: Message Content & Contact Box */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 items-start">
                          <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800/90 rounded-xl p-4">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <span>
                                Descrição do Projeto Solicitado pelo Cliente:
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                              {lead.description}
                            </p>
                          </div>

                          <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-400 uppercase">
                                Contato Informado:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  copyContact(lead.id, lead.contact)
                                }
                                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                              >
                                {copiedId === lead.id ? (
                                  <>
                                    <Check className="w-3 h-3" /> Copiado!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copiar
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-2 text-sm font-mono font-bold text-white bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="truncate">{lead.contact}</span>
                            </div>

                            {/* Developer Value & Internal Notes */}
                            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-slate-400">
                                  Valor Estimado:{' '}
                                </span>
                                <strong className="text-emerald-400">
                                  R${' '}
                                  {(lead.estimatedValue || 0).toLocaleString(
                                    'pt-BR'
                                  )}
                                </strong>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleStartEditLeadDetails(lead)}
                                className="text-[11px] font-bold text-amber-400 hover:underline"
                              >
                                {isEditing
                                  ? 'Editando...'
                                  : 'Editar Valor / Notas'}
                              </button>
                            </div>

                            {lead.developerNotes && !isEditing && (
                              <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                                <strong className="text-amber-400">
                                  Sua Nota:
                                </strong>{' '}
                                {lead.developerNotes}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inline Editor for Value & Developer Notes */}
                        {isEditing && (
                          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-900/60 p-4 rounded-xl">
                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                Valor do Orçamento (R$):
                              </label>
                              <input
                                type="number"
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                placeholder="Ex: 1800"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                              />
                            </div>

                            <div className="sm:col-span-6">
                              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                Anotações Internas do Desenvolvedor:
                              </label>
                              <input
                                type="text"
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                placeholder="Ex: Cliente quer entrega em 10 dias, fechar pacote Site + IA..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                              />
                            </div>

                            <div className="sm:col-span-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveLeadDetails(lead.id)}
                                disabled={savingLeadId === lead.id}
                                className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition"
                              >
                                {savingLeadId === lead.id
                                  ? 'Salvando...'
                                  : 'Salvar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingLeadId(null)}
                                className="py-2 px-3 bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold"
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
            </>
          )}

          {/* FIXED BOTTOM NAVIGATION BAR FOR SMARTPHONES (Native Mobile App Feel) */}
          <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-[#0b0f17]/95 backdrop-blur-lg border-t border-slate-800 px-1 py-2 grid grid-cols-7 gap-0.5">
            <button
              type="button"
              onClick={() => setActiveAppSection('overview')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-bold ${
                activeAppSection === 'overview'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400'
              }`}
            >
              <TrendingUp className="w-4 h-4 mb-0.5" />
              <span>Resumo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppSection('stores')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-bold ${
                activeAppSection === 'stores'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400'
              }`}
            >
              <Store className="w-4 h-4 mb-0.5" />
              <span>Lojas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppSection('vouchers')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-bold ${
                activeAppSection === 'vouchers'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400'
              }`}
            >
              <Ticket className="w-4 h-4 mb-0.5" />
              <span>Vouchers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppSection('security')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-bold ${
                activeAppSection === 'security'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mb-0.5" />
              <span>Segurança</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppSection('subscriptions')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-bold ${
                activeAppSection === 'subscriptions'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400'
              }`}
            >
              <CreditCard className="w-4 h-4 mb-0.5" />
              <span>Vendas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppSection('proposals')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-bold relative ${
                activeAppSection === 'proposals'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400'
              }`}
            >
              <MessageCircle className="w-4 h-4 mb-0.5" />
              <span>Propostas</span>
              {newLeadsCount > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveAppSection('notifications');
                handleMarkAllRead();
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-bold relative ${
                activeAppSection === 'notifications'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400'
              }`}
            >
              <Bell className="w-4 h-4 mb-0.5" />
              <span>Alertas</span>
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          </div>

          {/* MODAL GUIDE FOR INSTALLING THE WEB APP ON ANDROID / IPHONE */}
          {showInstallGuideModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="w-full max-w-md bg-[#101726] border-2 border-emerald-500/40 rounded-3xl p-6 space-y-4 text-left shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">
                      Como Instalar o App no Seu Celular
                    </h3>
                    <p className="text-xs text-slate-400">
                      Funciona em qualquer Android ou iPhone sem precisar de
                      Play Store:
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-200 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <strong className="text-emerald-400 block mb-1">
                      🤖 No Android (Chrome):
                    </strong>
                    Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior
                    do navegador e selecione{' '}
                    <strong>&ldquo;Instalar aplicativo&rdquo;</strong> ou{' '}
                    <strong>&ldquo;Adicionar à tela inicial&rdquo;</strong>.
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <strong className="text-sky-400 block mb-1">
                      🍎 No iPhone (Safari):
                    </strong>
                    Toque no botão <strong>Compartilhar (ícone com seta para cima)</strong>{' '}
                    na barra inferior e escolha{' '}
                    <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong>.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInstallGuideModal(false)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider"
                >
                  Entendi, Fechar
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}
