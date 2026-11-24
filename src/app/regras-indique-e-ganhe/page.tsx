import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  Gift,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Coins,
  FileCheck,
  Zap,
  Lock,
  Sparkles,
} from 'lucide-react';

export const metadata = {
  title: 'Regulamento Oficial | Indique & Ganhe R$ 10 | SpotQR Pro',
  description:
    'Regras oficiais do programa de afiliados e indicação SpotQR Pro: ganhe R$ 10 via PIX por amigo que assinar o PRO com 15% de desconto.',
};

export default function RegrasIndiqueEGanhePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-200">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Voltar */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 font-bold mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Página Principal</span>
        </Link>

        {/* Card Principal */}
        <div className="bg-[#101726] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Topo do Regulamento */}
          <div className="border-b border-slate-800 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
              <Gift className="w-3.5 h-3.5" />
              <span>Programa Oficial de Afiliados &amp; Parcerias</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Regulamento do Programa Indique &amp; Ganhe
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Transparência total: saiba como indicar lojistas, restaurantes e comércios para a plataforma SpotQR Pro e receber <strong>R$ 10,00 via PIX</strong> por cada assinatura PRO ativada.
            </p>
          </div>

          {/* Cards Rápidos de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                <Coins className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Sua Comissão</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">R$ 10,00</div>
              <div className="text-[11px] text-slate-400 mt-1">Por amigo que pagar o Plano PRO</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Desconto do Amigo</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">15% OFF</div>
              <div className="text-[11px] text-emerald-300/80 mt-1">Paga apenas R$ 25,50 no 1º mês</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-2">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Pagamento Seguro</div>
              <div className="text-xl font-black text-teal-300 mt-0.5">Em até 48h</div>
              <div className="text-[11px] text-slate-400 mt-1">Após confirmação pelo robô</div>
            </div>
          </div>

          {/* Cláusulas Detalhadas */}
          <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {/* Cláusula 1 */}
            <section className="space-y-2 p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1. Como Participar e Ativar seu Link de Indicação</span>
              </h2>
              <p>
                Qualquer usuário cadastrado na plataforma SpotQR Pro pode participar gratuitamente do Programa Indique &amp; Ganhe. Para desbloquear e copiar seu link exclusivo de indicação, é <strong>obrigatório cadastrar sua chave PIX válida</strong> (CPF, CNPJ, E-mail, Celular ou Chave Aleatória) dentro do seu painel de controle.
              </p>
              <p className="text-slate-400 text-xs">
                A chave PIX cadastrada será o destino único e oficial de todas as transferências de comissão realizadas pela administração.
              </p>
            </section>

            {/* Cláusula 2 */}
            <section className="space-y-2 p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>2. Benefício para o Convidado: Desconto VIP de 15%</span>
              </h2>
              <p>
                Ao acessar a plataforma através do seu link de afiliado (<code className="text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">spotqr.com.br/?ref=SEU_CODIGO</code>), o seu convidado recebe automaticamente uma condição especial de <strong>15% de desconto no Plano PRO</strong>, pagando apenas <strong>R$ 25,50</strong> na primeira mensalidade (em vez do valor de tabela de R$ 29,90).
              </p>
              <p className="text-slate-400 text-xs">
                O desconto é aplicado de forma automática na tela de pagamento PIX do Mercado Pago, gerando um forte apelo de conversão para o lojista indicado.
              </p>
            </section>

            {/* Cláusula 3 */}
            <section className="space-y-2 p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>3. Condição para Recebimento da Comissão (Pagamento Confirmado do PRO)</span>
              </h2>
              <p>
                O indicador terá direito à comissão de <strong>R$ 10,00</strong> se, e somente se, o usuário indicado cumprir cumulativamente os dois requisitos:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>
                  Criar uma nova conta na plataforma através do link de indicação do parceiro;
                </li>
                <li>
                  Efetuar com sucesso o <strong>pagamento da assinatura do Plano PRO</strong> via PIX Mercado Pago.
                </li>
              </ul>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  <strong>Atenção:</strong> Cadastros que permaneçam exclusivamente na versão gratuita <strong>NÃO</strong> geram comissão. A comissão é gerada exclusivamente a partir da receita da primeira assinatura PRO paga.
                </span>
              </div>
            </section>

            {/* Cláusula 4 */}
            <section className="space-y-2 p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>4. Modalidade de Comissão: Pagamento Único (CPA / Não Recorrente)</span>
              </h2>
              <p>
                A remuneração de R$ 10,00 é estruturada como um bônus de aquisição de cliente (CPA — Custo por Aquisição). Portanto:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>
                  O valor de R$ 10,00 é pago <strong>uma única vez</strong> por cada novo assinante PRO conquistado;
                </li>
                <li>
                  O programa <strong>não é recorrente</strong>. Renovações mensais futuras efetuadas pelo mesmo cliente não geram novas comissões ao indicador.
                </li>
              </ul>
            </section>

            {/* Cláusula 5 */}
            <section className="space-y-2 p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>5. Processamento do Pagamento: Prazo de até 48h e Confirmação pelo Robô</span>
              </h2>
              <p>
                O valor da comissão de R$ 10,00 será pago <strong>após a confirmação do pagamento do Plano PRO pelo nosso robô</strong> (sistema automatizado integrado com a API do Mercado Pago).
              </p>
              <p>
                Uma vez que a primeira assinatura paga for autenticada pelo robô, o pagamento da comissão pode demorar <strong>até 48 horas úteis</strong> para ser compensado e pago na sua conta bancária via chave PIX cadastrada.
              </p>
              <p>
                Ao concluir a transferência, a administração anexa o <strong>comprovante bancário oficial</strong> (imagem ou PDF), que fica disponível no painel do afiliado para download, visualização e conferência a qualquer momento.
              </p>
            </section>

            {/* Cláusula 6 */}
            <section className="space-y-2 p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>6. Regras Anti-Fraude e Proibição de Auto-Indicação</span>
              </h2>
              <p>
                Para garantir a lisura e a sustentabilidade do programa:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>
                  <strong>Auto-indicação proibida:</strong> O usuário não pode utilizar seu próprio link para assinar o Plano PRO da sua própria conta com o objetivo de obter cashback. O sistema possui verificação automatizada de conta e IP;
                </li>
                <li>
                  Práticas de SPAM invasivo, compras com cartões/contas de terceiros sem autorização ou cadastros artificiais acarretarão na inativação do código de afiliado e cancelamento das comissões pendentes.
                </li>
              </ul>
            </section>

            {/* Cláusula 7 */}
            <section className="space-y-2 p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>7. Duração e Alterações do Regulamento</span>
              </h2>
              <p>
                A plataforma SpotQR Pro reserva-se o direito de ajustar os valores promocionais, comissões ou percentuais de desconto mediante aviso prévio e atualização deste regulamento público, mantendo preservados os direitos a saldos já gerados e aprovados anteriormente à alteração.
              </p>
            </section>
          </div>

          {/* Botão de Ação */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Dúvidas ou parcerias institucionais? Fale com nosso suporte.
            </div>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider text-center shadow-glow transition flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>Acessar Meu Painel de Indicação</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
