'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface SecuritySummary {
  isPixLocked?: boolean;
  pixLockedUntil?: string | null;
  hasBackupRecoveryCode?: boolean;
  recoveryCodeHint?: string | null;
  lastPasswordResetAt?: string | null;
}

interface ClientSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  security?: SecuritySummary | null;
  onUpdated?: () => void;
}

export default function ClientSecurityModal({
  isOpen,
  onClose,
  security,
  onUpdated,
}: ClientSecurityModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  const [backupPassword, setBackupPassword] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generatedBackupCode, setGeneratedBackupCode] = useState<string | null>(
    null
  );
  const [copiedBackup, setCopiedBackup] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('A confirmação da nova senha não confere.');
      return;
    }

    setChangingPwd(true);
    try {
      const res = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao alterar senha.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg(
        data.message ||
          'Senha alterada com sucesso! Outras sessões antigas foram desconectadas.'
      );
      onUpdated?.();
    } catch {
      setErrorMsg('Erro de conexão ao alterar senha.');
    } finally {
      setChangingPwd(false);
    }
  };

  const handleRegenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!backupPassword) {
      setErrorMsg('Digite sua senha atual para gerar um novo código secreto.');
      return;
    }
    setGeneratingCode(true);
    try {
      const res = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate_backup_code',
          currentPassword: backupPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao gerar código secreto.');
        return;
      }
      setBackupPassword('');
      setGeneratedBackupCode(data.code);
      setSuccessMsg(
        'Novo Código Secreto gerado! Guarde-o em local seguro — ele só é exibido uma vez.'
      );
      onUpdated?.();
    } catch {
      setErrorMsg('Erro de conexão ao gerar código.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyBackupCode = () => {
    if (!generatedBackupCode) return;
    navigator.clipboard.writeText(generatedBackupCode);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-[#101726] border-2 border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1 pr-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CENTRAL DE SEGURANÇA & ANTI-GOLPE PIX</span>
          </span>
          <h3 className="text-xl font-extrabold text-white pt-1">
            Senha, Proteção PIX & Código de Recuperação
          </h3>
        </div>

        {/* PIX Anti-Hijack Status */}
        {security?.isPixLocked ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">
                🔒 Quarentena Anti-Golpe no PIX Ativa (24h)
              </p>
              <p className="text-amber-200/90 mt-0.5 leading-relaxed">
                Após recuperação de senha, alterações na Chave PIX da loja ficam bloqueadas até{' '}
                {security.pixLockedUntil
                  ? new Date(security.pixLockedUntil).toLocaleString('pt-BR')
                  : '24 horas'}
                . Isso impede que terceiros alterem seu PIX.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-300">
                🛡️ Proteção Ativa na Chave PIX da Loja
              </p>
              <p className="text-slate-300 mt-0.5 leading-relaxed">
                Qualquer alteração na sua Chave PIX cadastrada exige confirmação da sua senha atual e gera alerta imediato de segurança.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
            {successMsg}
          </div>
        )}

        {/* Section 1: Personal Backup Recovery Code */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Código Secreto de Recuperação Pessoal</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Guarde esse código em local seguro (bloco de notas ou papel). Se você perder sua senha, poderá recuperá-la na hora usando este código sem depender de terceiros.
              </p>
            </div>
            {security?.hasBackupRecoveryCode && security?.recoveryCodeHint && (
              <span className="shrink-0 text-[10px] font-mono bg-slate-950 border border-slate-700 text-slate-300 px-2 py-1 rounded-lg">
                Ativo (fim -{security.recoveryCodeHint})
              </span>
            )}
          </div>

          {generatedBackupCode && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase block">
                  Seu Código Secreto (anote agora):
                </span>
                <span className="font-mono text-sm font-extrabold text-white tracking-wider">
                  {generatedBackupCode}
                </span>
              </div>
              <button
                type="button"
                onClick={copyBackupCode}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1"
              >
                {copiedBackup ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          )}

          <form
            onSubmit={handleRegenerateCode}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="password"
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
              placeholder="Confirme sua senha atual para gerar/trocar código"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={generatingCode}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {generatingCode ? 'Gerando...' : 'Gerar Código Secreto'}
              </span>
            </button>
          </form>
        </div>

        {/* Section 2: Change Account Password */}
        <form
          onSubmit={handleChangePassword}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
        >
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Alterar Senha de Acesso</span>
          </h4>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Senha atual"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
            />
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={changingPwd}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition disabled:opacity-50"
          >
            {changingPwd
              ? 'Atualizando...'
              : 'Salvar Nova Senha e Desconectar Outros Aparelhos'}
          </button>
        </form>
      </div>
    </div>
  );
}

