'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Store,
  Search,
  ShieldCheck,
  Lock,
  Unlock,
  Clock,
  ArrowUpRight,
  Check,
  UtensilsCrossed,
  ShoppingBag,
  QrCode,
  RotateCcw,
} from 'lucide-react';
import { AdminStoreSummary } from '@/lib/types';
import { isProStillValid, formatRemainingProTime } from '@/lib/pro-status';

type GrantMode = 'indeterminate' | 'days_30' | 'hours';

interface StoreGrantDraft {
  mode: GrantMode;
  hours: number;
  minutes: number;
}

interface AdminStoresProPanelProps {
  stores: AdminStoreSummary[];
  onStoresUpdated: (stores: AdminStoreSummary[]) => void;
  onRefresh: () => void;
}

export default function AdminStoresProPanel({
  stores,
  onStoresUpdated,
  onRefresh,
}: AdminStoresProPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'free' | 'pro'>(
    'all'
  );
  const [drafts, setDrafts] = useState<Record<string, StoreGrantDraft>>({});
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const expiredSyncedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const hasTimed = stores.some((s) => s.isPaid && Boolean(s.proExpiresAt));
    if (!hasTimed) return;
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNowMs(currentNow);
      for (const s of stores) {
        if (
          s.isPaid &&
          s.proExpiresAt &&
          !isProStillValid(s, currentNow) &&
          !expiredSyncedRef.current.has(s.slug)
        ) {
          expiredSyncedRef.current.add(s.slug);
          onRefresh();
          break;
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [stores, onRefresh]);

  const getDraft = (slug: string): StoreGrantDraft =>
    drafts[slug] || { mode: 'indeterminate', hours: 2, minutes: 0 };

  const updateDraft = (slug: string, patch: Partial<StoreGrantDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [slug]: { ...getDraft(slug), ...patch },
    }));
  };

  const handleGrantPro = async (store: AdminStoreSummary) => {
    const draft = getDraft(store.slug);
    setBusySlug(store.slug);
    setToast(null);

    try {
      const res = await fetch('/api/admin/pro-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant_pro',
          slug: store.slug,
          mode: draft.mode,
          hours: draft.hours,
          minutes: draft.minutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({
          type: 'error',
          text: data?.error || 'Não foi possível liberar o PRO.',
        });
        return;
      }

      if (Array.isArray(data.stores)) {
        onStoresUpdated(data.stores);
      }
      expiredSyncedRef.current.delete(store.slug);

      const modeDesc =
        draft.mode === 'indeterminate'
          ? 'por tempo indeterminado'
          : draft.mode === 'days_30'
          ? 'por 30 dias'
          : `por ${draft.hours}h${
              draft.minutes > 0 ? ` ${draft.minutes}min` : ''
            }`;

      setToast({
        type: 'success',
        text: `✅ PRO liberado para "${store.title}" (ID #${store.storeCode}) ${modeDesc}!`,
      });
    } catch {
      setToast({
        type: 'error',
        text: 'Erro de conexão ao liberar acesso PRO.',
      });
    } finally {
      setBusySlug(null);
    }
  };

  const handleRevokePro = async (store: AdminStoreSummary) => {
    setBusySlug(store.slug);
    setToast(null);
    try {
      const res = await fetch('/api/admin/pro-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_pro',
          slug: store.slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({
          type: 'error',
          text: data?.error || 'Erro ao voltar para Free.',
        });
        return;
      }
      if (Array.isArray(data.stores)) {
        onStoresUpdated(data.stores);
      }
      setToast({
        type: 'success',
        text: `🔒 "${store.title}" (ID #${store.storeCode}) voltou para o Plano Grátis (Free).`,
      });
    } catch {
      setToast({ type: 'error', text: 'Erro de conexão ao revogar PRO.' });
    } finally {
      setBusySlug(null);
    }
  };

  const filteredStores = stores.filter((s) => {
    const activePro = isProStillValid(s, nowMs);
    if (statusFilter === 'pro' && !activePro) return false;
    if (statusFilter === 'free' && activePro) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase().replace(/^#/, '');
      const hitTitle = s.title.toLowerCase().includes(q);
      const hitCode = s.storeCode.toLowerCase().includes(q);
      const hitSlug = s.slug.toLowerCase().includes(q);
      const hitOwner = (s.ownerEmail || s.ownerName || '')
        .toLowerCase()
        .includes(q);
      if (!hitTitle && !hitCode && !hitSlug && !hitOwner) return false;
    }
    return true;
  });

  const proCount = stores.filter((s) => isProStillValid(s, nowMs)).length;
  const freeCount = stores.length - proCount;

  return (
    <div className="bg-[#101726] border border-slate-800 rounded-3xl p-5 sm:p-6 mb-8 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <span>Lojas Cadastradas & Liberação PRO Presencial</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Localize o cliente pelo Nome da Loja ou ID Único e libere o Plano
            PRO sem ads e com logomarca no QR para demonstrações ao vivo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold">
            Total: {stores.length}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            PRO: {proCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
            Grátis: {freeCount}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome da loja, número de ID (#123456), e-mail ou slug..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'all', label: `Todas (${stores.length})` },
            { id: 'free', label: `Free (${freeCount})` },
            { id: 'pro', label: `PRO (${proCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === tab.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Stores List */}
      {filteredStores.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl text-xs text-slate-400">
          Nenhuma loja encontrada com esse filtro. Quando um cliente cadastrar um
          cardápio, catálogo ou QR dinâmico, ele aparecerá aqui com seu ID único.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStores.map((store) => {
            const draft = getDraft(store.slug);
            const activePro = isProStillValid(store, nowMs);
            const isBusy = busySlug === store.slug;
            const livePath =
              store.type === 'catalog'
                ? `/catalogo/${store.slug}`
                : `/cardapio/${store.slug}`;

            const TypeIcon =
              store.type === 'catalog'
                ? ShoppingBag
                : store.type === 'menu'
                ? UtensilsCrossed
                : QrCode;

            const previewExpiresAt =
              draft.mode === 'hours'
                ? new Date(
                    nowMs +
                      Math.max(
                        1,
                        (Math.max(0, draft.hours) * 60 +
                          Math.max(0, draft.minutes))
                      ) *
                        60 *
                        1000
                  )
                : null;

            return (
              <div
                key={store.slug}
                className={`rounded-2xl border p-4 sm:p-5 transition ${
                  activePro
                    ? 'bg-emerald-950/20 border-emerald-500/35'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  {/* Left: Store Identity (Name + Unique ID) */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-slate-950 border border-slate-700 text-emerald-400 font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg">
                        ID #{store.storeCode}
                      </span>

                      <h3 className="text-base font-extrabold text-white flex items-center gap-1.5 truncate">
                        <TypeIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{store.title}</span>
                      </h3>

                      {activePro ? (
                        <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          PRO ATIVO
                        </span>
                      ) : (
                        <span className="bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          GRÁTIS (FREE)
                        </span>
                      )}

                      {activePro && (
                        <span className="bg-sky-500/15 border border-sky-500/35 text-sky-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>
                            {store.proExpiresAt
                              ? `Termina em ${formatRemainingProTime(
                                  store.proExpiresAt,
                                  nowMs
                                )}`
                              : store.proGrantType === 'paid'
                              ? 'Assinatura Paga (Vitalício)'
                              : 'Tempo Indeterminado'}
                          </span>
                        </span>
                      )}
                    </div>

                    <div
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400"
                      suppressHydrationWarning
                    >
                      <span className="font-mono text-slate-300">
                        /{store.slug}
                      </span>
                      {(store.ownerName || store.ownerEmail) && (
                        <span>
                          Cliente:{' '}
                          <strong className="text-slate-200">
                            {store.ownerName || store.ownerEmail}
                          </strong>
                          {store.ownerEmail && store.ownerName
                            ? ` (${store.ownerEmail})`
                            : ''}
                        </span>
                      )}
                      {store.proVoucherCode && (
                        <span className="text-amber-300 font-mono font-bold">
                          Voucher: {store.proVoucherCode}
                        </span>
                      )}
                      <Link
                        href={livePath}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
                      >
                        <span>Abrir Página</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Right: 3 Mark Boxes + Hours Timer + Liberar PRO / Revoke */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 xl:min-w-[470px]">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        Liberar PRO — Escolha a Duração:
                      </span>
                      {activePro && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleRevokePro(store)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Voltar p/ Free</span>
                        </button>
                      )}
                    </div>

                    {/* 3 Check-Style Option Boxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        {
                          id: 'indeterminate' as const,
                          label: 'Tempo Indeterminado',
                        },
                        {
                          id: 'days_30' as const,
                          label: '30 Dias',
                        },
                        {
                          id: 'hours' as const,
                          label: 'Por quantas horas?',
                        },
                      ].map((opt) => {
                        const checked = draft.mode === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              updateDraft(store.slug, { mode: opt.id })
                            }
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs font-bold transition ${
                              checked
                                ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition ${
                                checked
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                  : 'bg-slate-950 border-slate-600'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="leading-tight">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Time Input when "Por quantas horas?" is checked */}
                    {draft.mode === 'hours' && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Definir Timer (volta para Free ao acabar):
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 6, 12, 24].map((presetH) => (
                              <button
                                key={presetH}
                                type="button"
                                onClick={() =>
                                  updateDraft(store.slug, {
                                    hours: presetH,
                                    minutes: 0,
                                  })
                                }
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                                  draft.hours === presetH && draft.minutes === 0
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
                                }`}
                              >
                                {presetH}h
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                              Horas:
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={720}
                              value={draft.hours}
                              onChange={(e) =>
                                updateDraft(store.slug, {
                                  hours: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                              Minutos (opcional):
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={59}
                              value={draft.minutes}
                              onChange={(e) =>
                                updateDraft(store.slug, {
                                  minutes: Math.min(
                                    59,
                                    Math.max(0, Number(e.target.value) || 0)
                                  ),
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                            />
                          </div>
                        </div>

                        {previewExpiresAt && (
                          <p
                            className="text-[10px] text-slate-400"
                            suppressHydrationWarning
                          >
                            Voltará a ser Grátis (Free) automaticamente em:{' '}
                            <strong className="text-emerald-300">
                              {previewExpiresAt.toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleGrantPro(store)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold transition shadow-glow flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {isBusy
                          ? 'Aplicando...'
                          : activePro
                          ? 'Atualizar Duração do PRO'
                          : 'Liberar PRO Agora'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
