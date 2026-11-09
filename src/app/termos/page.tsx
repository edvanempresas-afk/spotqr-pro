import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Termos de Uso | SpotQR Pro',
  description:
    'Termos de uso e condições de prestação de serviços da plataforma SpotQR Pro.',
};

export default function TermosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-200">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 font-bold mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Página Principal</span>
        </Link>

        <div className="bg-[#101726] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="border-b border-slate-800 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
              <FileText className="w-3.5 h-3.5" />
              <span>Condições de Uso</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Termos de Uso
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Última atualização: Novembro de 2026.
            </p>
          </div>

          <section className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar ou utilizar a plataforma{' '}
              <strong className="text-white">SpotQR Pro</strong>, você concorda
              integralmente com estes Termos de Uso. Caso não concorde com
              qualquer disposição, pedimos que interrompa a utilização do
              serviço.
            </p>
          </section>

          <section className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              2. Serviços Oferecidos
            </h2>
            <p>
              O SpotQR Pro disponibiliza gerador de QR Codes estáticos e
              dinâmicos, criação e edição de cardápios digitais para mesas e
              delivery, e intermediação de propostas de desenvolvimento de
              software sob medida.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>
                <strong>Versão Gratuita:</strong> Permite gerar QR Codes
                estáticos sem logotipo central e cardápios com exibição de
                anúncios patrocinados.
              </li>
              <li>
                <strong>Plano PRO (R$ 10,90):</strong> Desbloqueia logomarca no
                centro do QR Code, link dinâmico com redirecionamento editável a
                qualquer momento e remoção de 100% dos anúncios.
              </li>
            </ul>
          </section>

          <section className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              3. Responsabilidades do Usuário
            </h2>
            <p>
              O usuário é exclusivamente responsável pelas informações, pratos,
              preços e links que insere em seus QR Codes e cardápios digitais,
              comprometendo-se a não veicular conteúdos ilícitos, ofensivos ou que
              infrinjam direitos autorais.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider inline-block transition"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

