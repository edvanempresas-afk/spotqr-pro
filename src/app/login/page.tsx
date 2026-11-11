'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
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
  CheckCircle2,
  Utensils,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';

export default function ClientLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Check if already logged in
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          if (data.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }
      })
      .catch(() => {});
  }, [router]);

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
        router.push(data.redirectUrl || '/dashboard');
      } else {
        setErrorMsg(
          data.error ||
            'Não foi possível autenticar. Verifique seu login e senha.'
        );
      }
    } catch (err) {
      console.error('Error in login page:', err);
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCustomer = () => {
    setTab('login');
    setEmail('cliente@restaurante.com.br');
    setPassword('123456');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Benefits for the Client */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PORTAL DO CLIENTE • RESTAURANTES & COMÉRCIOS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Gerencie Seu{' '}
              <span className="gradient-text">
                Cardápio, Catálogo Digital & QR Codes Dinâmicos
              </span>{' '}
              em Tempo Real
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Com seu login e senha exclusivos de cliente, você tem controle
              total sobre seus pratos, produtos, preços, fotos e o link de destino dos
              seus QR Codes sem nunca precisar reimprimir os adesivos.
            </p>

            <div className="space-y-3 pt-2">
              {[
                'Altere preços, fotos e adicione itens ao seu Cardápio ou Catálogo Digital quando quiser',
                'Mude o link de destino do seu QR Code Dinâmico PRO em 1 clique',
                'Acompanhe quantas pessoas escanearam o QR Code nas mesas ou balcões',
                'Imprima plaquinhas A6/A5 prontas com a sua logomarca no centro',
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#121929] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-white block">
                  Quer ver como fica na prática antes de criar o seu?
                </span>
                <span className="text-slate-400">
                  Confira nossos modelos interativos de Cardápio e Catálogo Digital.
                </span>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Link
                  href="/cardapio/demo-restaurante"
                  className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition whitespace-nowrap"
                >
                  Cardápio Demo
                </Link>
                <Link
                  href="/catalogo/demo-catalogo"
                  className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition whitespace-nowrap"
                >
                  Catálogo Demo
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Login & Registration Card */}
          <div className="lg:col-span-6 bg-[#101726] border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold transition ${
                  tab === 'login'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar na Conta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold transition ${
                  tab === 'register'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Criar Conta Cliente</span>
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-xl font-extrabold text-white">
                {tab === 'login'
                  ? 'Acesse Seu Painel de Cliente'
                  : 'Cadastre Seu Restaurante / Negócio'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {tab === 'login'
                  ? 'Digite seu e-mail cadastrado e sua senha para editar seu cardápio e QR Codes.'
                  : 'Crie seu login e senha em segundos para salvar e gerenciar seu cardápio e QR Codes.'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Seu Nome Completo *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Marcos Silva"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Nome do Estabelecimento *
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Ex: Pizzaria Napolitana"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      WhatsApp do Estabelecimento (com DDD)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="Ex: (11) 99999-8888"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {tab === 'register'
                    ? 'Seu E-mail (Será seu Login) *'
                    : 'Seu E-mail / Login *'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@seurestaurante.com.br"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {tab === 'register' ? 'Crie sua Senha *' : 'Sua Senha *'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-3 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-glow transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Autenticando...'
                    : tab === 'login'
                    ? 'Entrar no Meu Painel'
                    : 'Criar Conta e Acessar Painel'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

