'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  Check,
  Copy,
  RefreshCw,
  Ban,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import { PasswordResetRequest } from '@/lib/types';

interface SecurityUserRow {
  id: string;
  name: string;
  businessName: string;
  email: string;
  whatsapp: string;
  lastPasswordResetAt?: string;
  pixLockedUntil?: string | null;
  isPixLocked: boolean;
  isSuspended: boolean;
  hasBackupCode: boolean;
  stores: Array<{ slug: string; storeCode: string; title: string; pixKey: string }>;
}

export default function AdminSecurityPanel() {
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>(
    []
  );
  const [usersSecurity, setUsersSecurity] = useState<SecurityUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [issuedTokens, setIssuedTokens] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/security', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setResetRequests(data.resetRequests || []);
        setUsersSecurity(data.usersSecurity || []);
      } else {
        setErrorMsg(data.error || 'Erro ao carregar painel de segurança.');
      }
    } catch {
      setErrorMsg('Erro de conexão ao carregar módulo de segurança.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleApproveReset = async (requestId: string) => {
    setBusyId(requestId);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_reset', requestId }),
      });
      const data = await res.json();
      if (res.ok && data.plainCode) {
        setIssuedTokens((prev) => ({ ...prev, [requestId]: data.plainCode }));
        await loadOverview();
      } else {
        setErrorMsg(data.error || 'Erro ao gerar código de recuperação.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectReset = async (requestId: string) => {
    setBusyId(requestId);
    try {
      await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_reset', requestId }),
      });
      await loadOverview();
    } finally {
      setBusyId(null);
    }
  };

  const handlePixLock = async (userId: string, locked: boolean) => {
    setBusyId(userId);
    try {
      await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: locked ? 'lock_pix' : 'unlock_pix',
          userId,
        }),
      });
      await loadOverview();
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleSuspend = async (userId: string, suspended: boolean) => {
    setBusyId(userId);
    try {
      await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_suspend',
          userId,
          suspended,
        }),
      });
      await loadOverview();
    } finally {
      setBusyId(null);
    }
  };

  const buildOfficialWhatsAppUrl = (
    req: PasswordResetRequest,
    plainCode?: string
  ) => {
    const digits = (req.registeredWhatsapp || '').replace(/\D/g, '');
    const phone =
      digits.length >= 10
        ? digits.startsWith('55')
          ? digits
          : `55${digits}`
        : '';
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://www.spotqr.com.br';
    const resetLink = plainCode
      ? `${origin}/login?recovery=${encodeURIComponent(
          plainCode
        )}&email=${encodeURIComponent(req.email)}`
      : '';
    const msg = plainCode
      ? `🔐 *SpotQR Pro - Recuperação Segura*\n\nOlá! Confirmamos sua identidade para a loja *${req.businessName}*.\n\nSeu código único (válido por 30 minutos): *${plainCode}*\nOu acesse direto pelo link:\n${resetLink}\n\n⚠️ Por proteção anti-golpe, alterações na Chave PIX ficam travadas por 24h após a troca de senha.`
      : `🔐 Olá! Recebemos uma solicitação de recuperação de senha para *${req.businessName}* (${req.email}). Por segurança, você confirma que foi você quem solicitou?`;
    return phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const copyResetMessage = (req: PasswordResetRequest, plainCode: string) => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://www.spotqr.com.br';
    const resetLink = `${origin}/login?recovery=${encodeURIComponent(
      plainCode
    )}&email=${encodeURIComponent(req.email)}`;
    const text = `Código único SpotQR (${req.businessName}): ${plainCode}\nLink direto: ${resetLink}`;
    navigator.clipboard.writeText(text);
    setCopiedId(req.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const pendingCount = resetRequests.filter(
    (r) => r.status === 'pending_admin'
  ).length;

  return (
    <div className="bg-[#101726] border border-slate-800 rounded-3xl p-5 sm:p-6 mb-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Módulo de Segurança, Recuperação de Senhas &amp; Anti-Golpe PIX</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {pendingCount} pendente(s)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Valide solicitações de senha no WhatsApp oficial do anunciante, evite invasões e gerencie travas de segurança na troca de PIX.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOverview}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Segurança</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Password Reset Requests */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-400" />
          <span>Solicitações de Recuperação de Senha ({resetRequests.length})</span>
        </h3>

        {resetRequests.length === 0 ? (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
            Nenhuma solicitação de recuperação de senha registrada até o momento.
          </div>
        ) : (
          <div className="space-y-3">
            {resetRequests.map((req) => {
              const plainCode = issuedTokens[req.id];
              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    !req.whatsappMatched && req.status === 'pending_admin'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-900/75 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-white">
                          {req.businessName}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            req.status === 'pending_admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                              : req.status === 'approved_ready'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                              : req.status === 'used'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/35'
                          }`}
                        >
                          {req.status === 'pending_admin'
                            ? 'Aguardando Validação'
                            : req.status === 'approved_ready'
                            ? 'Código Gerado (30 min)'
                            : req.status === 'used'
                            ? 'Utilizado'
                            : req.status === 'expired'
                            ? 'Expirado'
                            : 'Recusado'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        E-mail: <strong className="text-slate-200">{req.email}</strong> •{' '}
                        {new Date(req.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                      <span
                        className={`px-2.5 py-1 rounded-lg border ${
                          req.whatsappMatched
                            ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                            : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {req.whatsappMatched
                          ? '✅ WhatsApp confere'
                          : '🚨 WhatsApp DIVERGENTE'}
                      </span>
                      {req.providedPixHint && (
                        <span
                          className={`px-2.5 py-1 rounded-lg border ${
                            req.pixHintMatched
                              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                              : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                          }`}
                        >
                          {req.pixHintMatched
                            ? '✅ PIX confere'
                            : '⚠️ PIX informado não bate'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                    <div>
                      <span className="text-slate-400 block">
                        WhatsApp REAL cadastrado (use ESTE para confirmar):
                      </span>
                      <span className="font-mono font-bold text-emerald-300">
                        {req.registeredWhatsapp || 'Não cadastrado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        WhatsApp digitado na solicitação:
                      </span>
                      <span className="font-mono font-bold text-white">
                        {req.providedWhatsapp}
                      </span>
                    </div>
                  </div>

                  {!req.whatsappMatched && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-[11px] text-rose-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        <strong>Alerta de possível golpe:</strong> o WhatsApp digitado não bate com o cadastro oficial! Só envie código após confirmar por chamada/áudio no número oficial cadastrado.
                      </span>
                    </div>
                  )}

                  {plainCode && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-300 uppercase block">
                          Código Único Gerado (válido 30 minutos):
                        </span>
                        <span className="font-mono text-sm font-extrabold text-white">
                          {plainCode}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyResetMessage(req, plainCode)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1"
                        >
                          {copiedId === req.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Código + Link</span>
                            </>
                          )}
                        </button>
                        <a
                          href={buildOfficialWhatsAppUrl(req, plainCode)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar p/ WhatsApp Oficial</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {(req.status === 'pending_admin' ||
                    req.status === 'approved_ready') && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href={buildOfficialWhatsAppUrl(req)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Confirmar no WhatsApp Oficial</span>
                      </a>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => handleApproveReset(req.id)}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>
                          {req.status === 'approved_ready'
                            ? 'Gerar Novo Código (30 min)'
                            : 'Gerar Código Único (30 min)'}
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => handleRejectReset(req.id)}
                        className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Recusar / Suspeito</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accounts PIX Quarantine & Suspension Controls */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Contas de Clientes, Chaves PIX &amp; Quarentena ({usersSecurity.length})</span>
        </h3>

        <div className="space-y-2.5">
          {usersSecurity.map((u) => (
            <div
              key={u.id}
              className={`p-3.5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                u.isSuspended
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : u.isPixLocked
                  ? 'bg-amber-950/20 border-amber-500/35'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold text-white">
                    {u.businessName}
                  </span>
                  <span className="text-[11px] text-slate-400">({u.email})</span>
                  {u.isPixLocked && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      🔒 PIX em Quarentena 24h
                    </span>
                  )}
                  {u.isSuspended && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      ⛔ Conta Suspensa
                    </span>
                  )}
                </div>
                {u.stores.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                    {u.stores.map((s) => (
                      <span
                        key={s.slug}
                        className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800"
                      >
                        <strong className="text-slate-200">{s.storeCode}</strong> /{s.slug} • PIX:{' '}
                        <span className="text-emerald-300 font-mono">
                          {s.pixKey || 'sem PIX'}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() => handlePixLock(u.id, !u.isPixLocked)}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition ${
                    u.isPixLocked
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-300'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-300'
                  }`}
                >
                  {u.isPixLocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Liberar Troca de PIX</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Travar PIX 24h</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() => handleToggleSuspend(u.id, !u.isSuspended)}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition ${
                    u.isSuspended
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-300'
                      : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/35 text-rose-300'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>
                    {u.isSuspended ? 'Reativar Conta' : 'Suspender Conta'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

