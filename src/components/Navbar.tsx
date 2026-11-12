'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Sparkles,
  Utensils,
  ShoppingBag,
  LayoutDashboard,
  Code2,
  UserCheck,
  LogIn,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useProPrice } from '@/lib/pro-price';

export default function Navbar() {
  const router = useRouter();
  const { proPriceLabel } = useProPrice();
  const [authUser, setAuthUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setAuthUser(data.user);
          setIsAdmin(Boolean(data.isAdmin));
        } else {
          setAuthUser(null);
          setIsAdmin(false);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => {});
    setAuthUser(null);
    setIsAdmin(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 h-20 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform shrink-0">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white">
                Spot<span className="text-emerald-400">QR</span>
              </span>
              <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 tracking-wide uppercase">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap hidden sm:inline xl:hidden 2xl:inline">
              QR Codes, Cardápios & Catálogos
            </span>
          </div>
        </Link>

        {/* Navigation Links - Balanced responsive spacing for 1280px+ */}
        <nav className="hidden xl:flex items-center gap-2.5 2xl:gap-5 text-[11px] 2xl:text-xs font-semibold text-slate-300">
          <Link
            href="/#gerador"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            Gerador Grátis
          </Link>
          <Link
            href="/cardapio/demo-restaurante"
            className="hover:text-emerald-400 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Utensils className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Cardápio Demo</span>
          </Link>
          <Link
            href="/catalogo/demo-catalogo"
            className="hover:text-emerald-400 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Catálogo Demo</span>
          </Link>
          <Link
            href="/#precos"
            className="hover:text-emerald-400 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Vantagens PRO ({proPriceLabel})</span>
          </Link>
          <Link
            href="/#desenvolvedor"
            className="hover:text-emerald-300 transition-colors flex items-center gap-1 text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 2xl:px-3 py-1.5 rounded-full whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Contratar Desenvolvedor</span>
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {authUser ? (
            <>
              <Link
                href={isAdmin ? '/admin' : '/dashboard'}
                className="flex items-center gap-1.5 px-2.5 2xl:px-3 py-2 text-[11px] 2xl:text-xs font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 rounded-xl border border-emerald-500/30 transition whitespace-nowrap"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="max-w-[115px] 2xl:max-w-[150px] truncate">
                  {authUser.businessName || authUser.name}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 bg-slate-900 rounded-xl border border-slate-800 transition shrink-0"
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-2.5 2xl:px-3 py-2 text-[11px] 2xl:text-xs font-bold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 rounded-xl border border-slate-700 transition whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Entrar / Criar Conta</span>
            </Link>
          )}

          <Link
            href={isAdmin ? '/admin' : '/dashboard'}
            className="hidden sm:flex items-center gap-1.5 px-2.5 2xl:px-3 py-2 text-[11px] 2xl:text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 transition whitespace-nowrap"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{isAdmin ? 'Meu Painel' : 'Meus Catálogos & QRs'}</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="xl:hidden p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 transition shrink-0"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Drawer for viewports below 1280px */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-800/80 bg-[#0b101b]/95 backdrop-blur-md px-4 py-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-200">
            <Link
              href="/#gerador"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Gerador Grátis</span>
            </Link>
            <Link
              href="/cardapio/demo-restaurante"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition flex items-center gap-2"
            >
              <Utensils className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cardápio Demo</span>
            </Link>
            <Link
              href="/catalogo/demo-catalogo"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Catálogo Demo</span>
            </Link>
            <Link
              href="/#precos"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Vantagens PRO ({proPriceLabel})</span>
            </Link>
            <Link
              href="/#desenvolvedor"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 transition flex items-center gap-2"
            >
              <Code2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Contratar Desenvolvedor</span>
            </Link>
            <Link
              href={isAdmin ? '/admin' : '/dashboard'}
              onClick={() => setMobileMenuOpen(false)}
              className="sm:hidden px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isAdmin ? 'Meu Painel' : 'Meus Catálogos & QRs'}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
