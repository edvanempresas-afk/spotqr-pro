import React from 'react';
import Link from 'next/link';
import { QrCode, ShieldCheck, Heart, Zap, Coffee } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#080c14] border-t border-slate-800/80 pt-16 pb-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg text-white">
                Spot<span className="text-emerald-400">QR</span> Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A ferramenta de maior retorno sobre investimento para restaurantes, bares e comércios locais no Brasil. Economize centenas de reais em impressões.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>Pagamento Seguro Mercado Pago</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recursos Gratuitos</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#gerador" className="hover:text-emerald-400 transition">QR Code Estático Personalizado</a></li>
              <li><a href="#gerador" className="hover:text-emerald-400 transition">QR Code PIX com BRCode Oficial</a></li>
              <li><a href="#gerador" className="hover:text-emerald-400 transition">QR Code Wi-Fi Automático</a></li>
              <li><a href="#gerador" className="hover:text-emerald-400 transition">QR Code WhatsApp com Mensagem</a></li>
              <li><a href="#gerador" className="hover:text-emerald-400 transition">Download em Alta Definição (300 DPI)</a></li>
            </ul>
          </div>

          {/* Pro Benefits */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recursos PRO (R$ 10,90)</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#precos" className="hover:text-emerald-400 transition">Logomarca ou Imagem no Centro do QR</a></li>
              <li><a href="#precos" className="hover:text-emerald-400 transition">QR Code Dinâmico (Link Editável)</a></li>
              <li><a href="#precos" className="hover:text-emerald-400 transition">Cardápio Digital Mobile-First</a></li>
              <li><a href="#precos" className="hover:text-emerald-400 transition">Pedidos sem Taxa pelo WhatsApp</a></li>
              <li><a href="#precos" className="hover:text-emerald-400 transition">Gerador de Plaquinhas A6/A5 para Mesas</a></li>
            </ul>
          </div>

          {/* Finance & Tech */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Desenvolvimento Sob Medida</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/#desenvolvedor" className="hover:text-emerald-400 transition">Fale com o Desenvolvedor</a></li>
              <li><a href="/#desenvolvedor" className="hover:text-emerald-400 transition">IA de Atendimento 24h no WhatsApp</a></li>
              <li><a href="/#desenvolvedor" className="hover:text-emerald-400 transition">Sistemas para Salão & Barbearia</a></li>
              <li><a href="/#desenvolvedor" className="hover:text-emerald-400 transition">Sites de Marcação de Consultas</a></li>
              <li><Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition">Acessar Minha Conta</Link></li>
            </ul>
            <div className="pt-2 text-xs text-slate-500" suppressHydrationWarning>
              © {new Date().getFullYear()} SpotQR Pro. Todos os direitos reservados.
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>Feito para impulsionar pequenos e médios negócios gastronômicos e comerciais.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              API Mercado Pago Integrada
            </span>
            <span className="text-slate-600">•</span>
            <span>PIX Imediato</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

