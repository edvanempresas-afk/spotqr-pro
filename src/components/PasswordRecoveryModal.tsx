'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldAlert,
  KeyRound,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialCode?: string;
  onRecoverySuccess?: () => void;
}

export default function PasswordRecoveryModal({
  isOpen,
  onClose,
  initialEmail = '',
  initialCode = '',
  onRecoverySuccess,
}: PasswordRecoveryModalProps) {
  const [step, setStep] = useState<'request' | 'confirm'>(
    initialCode ? 'confirm' : 'request'
  );
  const [email, setEmail] = useState(initialEmail);
  const [whatsapp, setWhatsapp] = useState('');
  const [pixOrStoreHint, setPixOrStoreHint] = useState('');

  const [code, setCode] = useState(initialCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialEmail) setEmail(initialEmail);
      if (initialCode) {
        setCode(initialCode);
        setStep('confirm');
      }
      setErrorMsg('');
    }
  }, [isOpen, initialEmail, initialCode]);

  if (!isOpen) return null;

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_reset',
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          pixHint: pixOrStoreHint.trim(),
          storeHint: pixOrStoreHint.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao registrar solicitação.');
        return;
      }
      setSuccessMsg(
        data.message ||
          'Solicitação registrada com segurança. Aguarde a confirmação no WhatsApp oficial.'
      );
    } catch {
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
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

    setLoading(true);
    try {
      const res = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_reset',
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Código inválido ou expirado.');
        return;
      }

      setSuccessMsg(
        data.message ||
          'Senha redefinida com sucesso! Você já pode acessar seu painel.'
      );
      setTimeout(() => {
        if (onRecoverySuccess) {
          onRecoverySuccess();
        } else {
          window.location.href = '/dashboard';
        }
      }, 1500);
    } catch {
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#101726] border-2 border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[11px] font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>RECUPERAÇÃO SEGURA • PROTEÇÃO ANTI-GOLPE PIX</span>
          </div>
          <h3 className="text-xl font-extrabold text-white">
            Recuperar Acesso à Conta
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Para impedir que golpistas invadam sua conta ou troquem sua Chave PIX, exigimos validação de identidade ou o seu Código Secreto pessoal.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setStep('request');
              setErrorMsg('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition ${
              step === 'request'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Solicitar Verificação
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('confirm');
              setErrorMsg('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition ${
              step === 'confirm'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Já Tenho o Código
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs leading-relaxed space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
            {step === 'request' && (
              <button
                type="button"
                onClick={() => {
                  setStep('confirm');
                  setErrorMsg('');
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-emerald-200 underline"
              >
                <span>Ir para digitar o código recebido</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                E-mail cadastrado na conta *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@loja.com.br"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                WhatsApp cadastrado (com DDD) *
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: (11) 99999-8888"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Chave PIX atual ou ID da loja (opcional, agiliza validação)
              </label>
              <input
                type="text"
                value={pixOrStoreHint}
                onChange={(e) => setPixOrStoreHint(e.target.value)}
                placeholder="Ex: sua chave PIX ou #ID da loja"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              🔒 <strong className="text-slate-200">Como funciona:</strong>{' '}
              enviamos o código único exclusivamente para o WhatsApp oficial do cadastro após checagem, e mudanças na Chave PIX ficam travadas por <strong className="text-amber-300">24h</strong> após a troca da senha.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition disabled:opacity-50"
            >
              {loading ? 'Enviando solicitação...' : 'Solicitar Código de Recuperação'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                E-mail da conta *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@loja.com.br"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Código Único (REC-...) ou Código Secreto Pessoal (SPOT-REC-...) *
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ex: REC-XXXX-XXXX-XXXX"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-emerald-300 font-mono uppercase outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nova Senha (mín. 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Confirmar Nova Senha *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Validando...' : 'Redefinir Senha com Segurança'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
