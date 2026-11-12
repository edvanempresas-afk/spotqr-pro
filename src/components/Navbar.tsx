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

export default function Navbar({
  themeMode = 'dark',
}: {
  themeMode?: 'dark' | 'light';
}) {
  const isLight = themeMode === 'light';
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
    <header
      className={`sticky top-0 z-40 w-full border-b transition-colors ${
        isLight
          ? 'bg-white/90 backdrop-blur-md border-slate-200 shadow-sm'
          : 'glass-panel border-slate-800/80'
      }`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 h-20 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform shrink-0">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className={`font-display font-extrabold text-lg sm:text-xl tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Spot<span className={isLight ? 'text-emerald-600' : 'text-emerald-400'}>QR</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                PRO
              </span>
            </div>
            <span
              className={`text-[11px] font-medium whitespace-nowrap hidden sm:inline xl:hidden 2xl:inline ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              QR Codes, Cardápios & Catálogos
            </span>
          </div>
        </Link>

        {/* Navigation Links - Balanced responsive spacing for 1280px+ */}
        <nav
          className={`hidden xl:flex items-center gap-2.5 2xl:gap-5 text-[11px] 2xl:text-xs font-semibold ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          <Link
            href="/#gerador"
            className={`transition-colors whitespace-nowrap ${
              isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'
            }`}
          >
            Gerador Grátis
          </Link>
          <Link
            href="/cardapio/demo-restaurante"
            className={`transition-colors flex items-center gap-1 whitespace-nowrap ${
              isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'
            }`}
          >
            <Utensils
              className={`w-3.5 h-3.5 shrink-0 ${
                isLight ? 'text-emerald-600' : 'text-emerald-400'
              }`}
            />
            <span>Cardápio Demo</span>
          </Link>
          <Link
            href="/catalogo/demo-catalogo"
            className={`transition-colors flex items-center gap-1 whitespace-nowrap ${
              isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'
            }`}
          >
            <ShoppingBag
              className={`w-3.5 h-3.5 shrink-0 ${
                isLight ? 'text-amber-600' : 'text-amber-400'
              }`}
            />
            <span>Catálogo Demo</span>
          </Link>
          <Link
            href="/#precos"
            className={`transition-colors flex items-center gap-1 whitespace-nowrap ${
              isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'
            }`}
          >
            <Sparkles
              className={`w-3.5 h-3.5 shrink-0 ${
                isLight ? 'text-amber-600' : 'text-amber-400'
              }`}
            />
            <span>Vantagens PRO ({proPriceLabel})</span>
          </Link>
          <Link
            href="/#desenvolvedor"
            className={`transition-colors flex items-center gap-1 border px-2.5 2xl:px-3 py-1.5 rounded-full whitespace-nowrap ${
              isLight
                ? 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 border-emerald-200'
                : 'hover:text-emerald-300 text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
            }`}
          >
            <Code2
              className={`w-3.5 h-3.5 shrink-0 ${
                isLight ? 'text-emerald-600' : 'text-emerald-400'
              }`}
            />
            <span>Contratar Desenvolvedor</span>
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {authUser ? (
            <>
              <Link
                href={isAdmin ? '/admin' : '/dashboard'}
                className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-2 text-[11px] 2xl:text-xs font-bold rounded-xl border transition whitespace-nowrap ${
                  isLight
                    ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                    : 'text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30'
                }`}
              >
                <UserCheck
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isLight ? 'text-emerald-600' : 'text-emerald-400'
                  }`}
                />
                <span className="max-w-[115px] 2xl:max-w-[150px] truncate">
                  {authUser.businessName || authUser.name}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={`p-2 rounded-xl border transition shrink-0 ${
                  isLight
                    ? 'text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 border-slate-200'
                    : 'text-slate-400 hover:text-red-400 bg-slate-900 border-slate-800'
                }`}
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-2 text-[11px] 2xl:text-xs font-bold rounded-xl border transition whitespace-nowrap ${
                isLight
                  ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                  : 'text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 border-slate-700'
              }`}
            >
              <LogIn
                className={`w-3.5 h-3.5 shrink-0 ${
                  isLight ? 'text-emerald-600' : 'text-emerald-400'
                }`}
              />
              <span>Entrar / Criar Conta</span>
            </Link>
          )}

          <Link
            href={isAdmin ? '/admin' : '/dashboard'}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 2xl:px-3 py-2 text-[11px] 2xl:text-xs font-semibold rounded-xl border transition whitespace-nowrap ${
              isLight
                ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                : 'text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60'
            }`}
          >
            <LayoutDashboard
              className={`w-3.5 h-3.5 shrink-0 ${
                isLight ? 'text-emerald-600' : 'text-emerald-400'
              }`}
            />
            <span>{isAdmin ? 'Meu Painel' : 'Meus Catálogos & QRs'}</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`xl:hidden p-2 rounded-xl border transition shrink-0 ${
              isLight
                ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60'
            }`}
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Drawer for viewports below 1280px */}
      {mobileMenuOpen && (
        <div
          className={`xl:hidden border-t backdrop-blur-md px-4 py-4 space-y-2 ${
            isLight
              ? 'border-slate-200 bg-white/95'
              : 'border-slate-800/80 bg-[#0b101b]/95'
          }`}
        >
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold ${
              isLight ? 'text-slate-700' : 'text-slate-200'
            }`}
          >
            <Link
              href="/#gerador"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl border transition flex items-center gap-2 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                  : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Gerador Grátis</span>
            </Link>
            <Link
              href="/cardapio/demo-restaurante"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl border transition flex items-center gap-2 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                  : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <Utensils className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Cardápio Demo</span>
            </Link>
            <Link
              href="/catalogo/demo-catalogo"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl border transition flex items-center gap-2 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                  : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Catálogo Demo</span>
            </Link>
            <Link
              href="/#precos"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl border transition flex items-center gap-2 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                  : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Vantagens PRO ({proPriceLabel})</span>
            </Link>
            <Link
              href="/#desenvolvedor"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl border transition flex items-center gap-2 ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <Code2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Contratar Desenvolvedor</span>
            </Link>
            <Link
              href={isAdmin ? '/admin' : '/dashboard'}
              onClick={() => setMobileMenuOpen(false)}
              className={`sm:hidden px-3 py-2.5 rounded-xl border transition flex items-center gap-2 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                  : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{isAdmin ? 'Meu Painel' : 'Meus Catálogos & QRs'}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
