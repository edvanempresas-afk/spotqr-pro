'use client';

import React from 'react';
import Link from 'next/link';
import { QrCode, ShieldCheck, Heart, Zap, Coffee } from 'lucide-react';
import { useProPrice } from '@/lib/pro-price';

export default function Footer({
  themeMode = 'dark',
}: {
  themeMode?: 'dark' | 'light';
}) {
  const isLight = themeMode === 'light';
  const { proPriceLabel } = useProPrice();
  return (
    <footer
      className={`w-full border-t pt-16 pb-12 text-sm transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-600'
          : 'bg-[#080c14] border-slate-800/80 text-slate-400'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <QrCode className="w-5 h-5" />
              </div>
              <span
                className={`font-display font-bold text-lg ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Spot<span className={isLight ? 'text-emerald-600' : 'text-emerald-400'}>QR</span> Pro
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Plataforma 3 em 1 para criar Catálogos Digitais para lojas, roupas, artesanato e impressões 3D, além de Cardápios Digitais e QR Codes com Logo.
            </p>
            <div
              className={`flex items-center gap-2 text-xs border px-3 py-1.5 rounded-lg w-fit ${
                isLight
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Pagamento Seguro Mercado Pago</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>Recursos Gratuitos</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#gerador" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>QR Code Estático Personalizado</a></li>
              <li><a href="#gerador" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>QR Code PIX com BRCode Oficial</a></li>
              <li><a href="#gerador" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>QR Code Wi-Fi Automático</a></li>
              <li><a href="#gerador" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>QR Code WhatsApp com Mensagem</a></li>
              <li><a href="#gerador" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>Download em Alta Definição (300 DPI)</a></li>
            </ul>
          </div>

          {/* Pro Benefits */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>Recursos PRO ({proPriceLabel})</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#precos" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>Logomarca ou Imagem no Centro do QR</a></li>
              <li><a href="#precos" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>QR Code Dinâmico (Link Editável)</a></li>
              <li><a href="#precos" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>Catálogos & Cardápios Digitais</a></li>
              <li><a href="#precos" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>Pedidos sem Taxa pelo WhatsApp</a></li>
              <li><a href="#precos" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>Display de Balcão e Mesa A6/A5</a></li>
            </ul>
          </div>

          {/* Finance & Tech */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>Desenvolvimento Sob Medida</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/#desenvolvedor" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>Fale com o Desenvolvedor</a></li>
              <li><a href="/#desenvolvedor" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>IA de Atendimento 24h no WhatsApp</a></li>
              <li><a href="/#desenvolvedor" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>Sistemas para Salão & Barbearia</a></li>
              <li><a href="/#desenvolvedor" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>Sites de Marcação de Consultas</a></li>
              <li><Link href="/login" className={`font-bold transition ${isLight ? 'text-emerald-600 hover:text-emerald-700' : 'text-emerald-400 hover:text-emerald-300'}`}>Acessar Minha Conta</Link></li>
            </ul>
            <div className="pt-2 text-xs text-slate-500" suppressHydrationWarning>
              © {new Date().getFullYear()} SpotQR Pro. Todos os direitos reservados.
            </div>
          </div>
        </div>

        <div className={`pt-8 border-t flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
          <p>Feito para impulsionar pequenos e médios negócios gastronômicos e comerciais.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacidade" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>
              Política de Privacidade
            </Link>
            <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>•</span>
            <Link href="/termos" className={`transition ${isLight ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}>
              Termos de Uso
            </Link>
            <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>•</span>
            <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              API Mercado Pago Integrada
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

