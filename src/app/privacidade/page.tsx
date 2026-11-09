import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade | SpotQR Pro',
  description:
    'Política de privacidade e proteção de dados do SpotQR Pro em conformidade com a LGPD e diretrizes do Google AdSense.',
};

export default function PrivacidadePage() {
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
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacidade & LGPD</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Política de Privacidade
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Última atualização: Novembro de 2026 • Em conformidade com a Lei
              Geral de Proteção de Dados (LGPD) e diretrizes do Google AdSense.
            </p>
          </div>

          <section className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              1. Informações Gerais
            </h2>
            <p>
              A sua privacidade é de extrema importância para o{' '}
              <strong className="text-white">SpotQR Pro</strong> (disponível em{' '}
              <code className="text-emerald-400">https://spotqr.com.br</code>).
              Esta Política de Privacidade descreve como coletamos, usamos,
              armazenamos e protegemos os seus dados ao utilizar nosso gerador de
              QR Codes, cardápios digitais e serviços relacionados.
            </p>
          </section>

          <section className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              2. Dados Coletados
            </h2>
            <p>
              Coletamos apenas as informações estritamente necessárias para a
              prestação de nossos serviços:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>
                <strong>Criação de Conta e Cardápio:</strong> Nome, e-mail,
                nome do estabelecimento comercial e WhatsApp de contato.
              </li>
              <li>
                <strong>Configuração de QR Code:</strong> Links de destino,
                chaves PIX informadas para geração de pagamentos e dados de rede
                Wi-Fi inseridos pelo próprio usuário.
              </li>
              <li>
                <strong>Pagamentos:</strong> Todas as transações financeiras do
                Plano PRO são processadas de forma segura diretamente pelo{' '}
                <strong className="text-white">Mercado Pago</strong>. O SpotQR
                Pro não armazena dados de cartão de crédito.
              </li>
            </ul>
          </section>

          <section className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              3. Cookies e Anúncios do Google AdSense
            </h2>
            <p>
              O SpotQR Pro pode exibir anúncios veiculados pelo{' '}
              <strong className="text-white">Google AdSense</strong> e outras
              redes de publicidade parceiras para usuários da versão gratuita:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>
                O Google, como fornecedor terceiro, utiliza cookies para veicular
                anúncios em nosso site.
              </li>
              <li>
                Com o cookie DART, o Google pode veicular anúncios com base nas
                visitas que você fez a este ou outros sites na internet.
              </li>
              <li>
                Os usuários podem desativar a publicidade personalizada visitando
                as{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline"
                >
                  Configurações de Anúncios do Google
                </a>
                .
              </li>
              <li>
                Assinantes do <strong>Plano PRO</strong> contam com a isenção
                total de anúncios em seus cardápios e displays.
              </li>
            </ul>
          </section>

          <section className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              4. Seus Direitos (LGPD)
            </h2>
            <p>
              Você tem direito de solicitar a confirmação, o acesso, a correção
              ou a exclusão definitiva dos seus dados cadastrais a qualquer
              momento, entrando em contato através do e-mail oficial:{' '}
              <a
                href="mailto:edvandonasicmentosilva@gmail.com"
                className="text-emerald-400 underline font-semibold"
              >
                edvandonasicmentosilva@gmail.com
              </a>
              .
            </p>
          </section>

          <div className="pt-6 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider inline-block transition"
            >
              Concordar e Voltar ao Início
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

