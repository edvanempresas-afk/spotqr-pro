'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  LogIn,
  Mail,
  KeyRound,
  User,
  Building2,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any, role: 'client' | 'admin') => void;
  defaultTab?: 'register' | 'login';
  defaultBusinessName?: string;
  defaultWhatsapp?: string;
  contextMessage?: string;
}

export default function ClientAuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  defaultTab = 'register',
  defaultBusinessName = '',
  defaultWhatsapp = '',
  contextMessage = 'Cadastre seu login e senha para salvar seu Cardápio Digital e gerenciar seus QR Codes quando quiser.',
}: ClientAuthModalProps) {
  const [tab, setTab] = useState<'register' | 'login'>(defaultTab);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [whatsapp, setWhatsapp] = useState(defaultWhatsapp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (defaultBusinessName && !businessName) {
      setBusinessName(defaultBusinessName);
    }
    if (defaultWhatsapp && !whatsapp) {
      setWhatsapp(defaultWhatsapp);
    }
  }, [defaultBusinessName, defaultWhatsapp]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: tab,
          name,
          businessName: businessName || name,
          whatsapp,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.authenticated) {
        if (data.role === 'admin') {
          window.location.href = '/admin';
          return;
        }
        onAuthSuccess(data.user, data.role || 'client');
      } else {
        setErrorMsg(
          data.error ||
          'Não foi possível autenticar. Verifique os dados informados.'
        );
      }
    } catch (err) {
      console.error('Error in ClientAuthModal:', err);
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoClient = () => {
    setTab('login');
    setEmail('cliente@restaurante.com.br');
    setPassword('123456');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#101726] border-2 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CONTA DO CLIENTE • CARDÁPIO & QR PRO</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            {tab === 'register'
              ? 'Crie Seu Login e Senha'
              : 'Acesse Sua Conta de Cliente'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {contextMessage}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition ${tab === 'register'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar Minha Conta</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition ${tab === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Já Tenho Login</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Seu Nome *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nome do Restaurante / Loja *
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ex: Smash Burger"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Seu WhatsApp com DDD
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: (11) 99999-8888"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              {tab === 'register'
                ? 'Seu E-mail (Será seu Login de Acesso) *'
                : 'Seu E-mail ou Login de Acesso *'}
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: contato@seurestaurante.com.br"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              {tab === 'register'
                ? 'Crie uma Senha de Acesso *'
                : 'Sua Senha *'}
            </label>
            <div className="relative">
              <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-glow transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {loading
                ? 'Processando...'
                : tab === 'register'
                  ? 'Cadastrar Conta e Continuar'
                  : 'Entrar na Minha Conta'}
            </span>
          </button>
        </form>

        {/* Security Footer */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 text-center">
          <span className="text-[11px] text-slate-400">
            🔒 Acesso seguro e exclusivo para gerenciar seu Cardápio Digital e QR Codes.
          </span>
        </div>
      </div>
    </div>
  );
}

