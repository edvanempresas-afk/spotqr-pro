'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import AdBanner from '@/components/AdBanner';
import ProFeatureLockModal from '@/components/ProFeatureLockModal';
import DeveloperContactSection from '@/components/DeveloperContactSection';
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Utensils,
  DollarSign,
  Smartphone,
  ArrowRight,
  Zap,
  HelpCircle,
  QrCode,
  Flame,
  Award,
  Layers,
  Lock,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { FEATURES_MATRIX } from '@/lib/permissions';

export default function HomePage() {
  const [tableCount, setTableCount] = useState(15);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const costPerTablePrint = 18; // Average price in BRL for acrylic tent + vinyl sticker printing
  const printingsPerYear = 3;
  const annualLossWithoutDynamic = tableCount * costPerTablePrint * printingsPerYear;

  const handleOpenProCheckout = () => {
    // Scroll smoothly to generator and open dynamic
    const gen = document.getElementById('gerador');
    if (gen) {
      gen.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] pb-16">
      <Navbar />

      {/* STRATEGIC AD 1: Top Leaderboard Banner (Visible only for free users) */}
      <AdBanner
        format="leaderboard"
        isPro={false}
        onUpgradeClick={handleOpenProCheckout}
        className="pt-2"
      />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-8 pb-14 overflow-hidden">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>O Segredo dos Restaurantes e Comércios Mais Lucrativos</span>
            </div>

            {/* Hero Highlight */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
              QR Code Dinâmico com Logomarca &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
                Cardápio ou Catálogo Digital
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Crie vitrines digitais para restaurantes, roupas, artesanato, impressões 3D e comércios em geral.{' '}
              <strong className="text-white"> Mude o link de destino ou os preços a qualquer hora</strong> sem nunca mais jogar dinheiro fora reimprimindo adesivos ou acrílicos.
            </p>

            {/* Quick Proof Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Versão Gratuita Ilimitada
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Download em Alta Definição (300 DPI)
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Pagamento Oficial Mercado Pago
              </span>
            </div>
          </div>
        </section>

        {/* THE MAIN GENERATOR COMPONENT */}
        <QRCodeGenerator />

        {/* STRATEGIC AD 2: In-Feed Banner Between Generator & ROI Calculator */}
        <div className="max-w-5xl mx-auto px-4">
          <AdBanner
            format="leaderboard"
            isPro={false}
            onUpgradeClick={handleOpenProCheckout}
          />
        </div>

        {/* BUSINESS CONSULTING SECTION: THE FINANCIAL ROI / CALCULATOR */}
        <section id="como-funciona" className="py-20 bg-[#080d16] border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: The Financial Problem */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>ANÁLISE DE IMPACTO FINANCEIRO</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Por que restaurantes perdem até <span className="text-amber-400">R$ 810 por ano</span> com QR Codes estáticos?
                </h2>

                <p className="text-sm text-slate-400 leading-relaxed">
                  Quando você imprime uma placa de acrílico ou adesivo com um QR Code estático comum (gratuito básico), aquele código é gravado fisicamente para sempre.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    <span className="font-bold text-rose-400">❌ O Erro Caro:</span>
                    <span>
                      Trocou o WhatsApp, mudou a promoção do mês ou atualizou os preços do cardápio? Todas as plaquinhas das suas mesas viram lixo.
                    </span>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <span className="font-bold text-emerald-400">✅ A Solução Inteligente (PRO R$ 10,90):</span>
                    <span>
                      Com o QR Code Dinâmico SpotQR, o adesivo físico fica nas mesas para sempre. Você acessa seu celular e muda o destino em 1 segundo.
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Loss vs Economy Calculator */}
              <div className="lg:col-span-6 bg-[#111728] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Calculadora de Economia para seu Negócio
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Arraste para simular o tamanho do seu estabelecimento:
                </p>

                {/* Slider */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Número de Mesas / Balcões:</span>
                    <span className="text-base font-extrabold text-emerald-400">{tableCount} mesas</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={50}
                    value={tableCount}
                    onChange={(e) => setTableCount(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>4 mesas (Pequeno)</span>
                    <span>25 mesas (Médio)</span>
                    <span>50 mesas (Grande)</span>
                  </div>
                </div>

                {/* Numbers Comparison */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Gasto anual em gráficas com QR estático:</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-rose-400 font-mono">
                      - R$ {annualLossWithoutDynamic.toFixed(0)}
                    </div>
                  </div>

                  <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/40">
                    <span className="text-[11px] text-emerald-300 block mb-1">Investimento único SpotQR PRO:</span>
                    <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
                      R$ 10,90
                    </div>
                  </div>
                </div>

                <div className="mt-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-300 font-semibold">
                  🎉 Você economiza <strong className="text-white text-sm">R$ {(annualLossWithoutDynamic - 10.90).toFixed(0)}</strong> logo no primeiro ano!
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DIGITAL MENU HIGHLIGHT */}
        <section className="py-20 bg-[#0b0f17]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
                <Utensils className="w-3.5 h-3.5" />
                <span>INCLUSO NO PACOTE PRO</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Cardápio Digital Mobile que Vende pelo WhatsApp
              </h2>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Pare de perder 27% do seu faturamento com taxas de marketplaces de entrega. Dê aos seus clientes na mesa uma experiência veloz com fotos, descrições e comanda direta.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Zero Aplicativos para Baixar</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  O cliente apenas aponta a câmera nativa do iPhone ou Android e o cardápio abre em menos de 1 segundo direto no navegador.
                </p>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Comanda Direta no WhatsApp</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Os itens escolhidos na mesa chegam prontos e formatados no WhatsApp da cozinha ou do balcão, com número da mesa e valor total somado.
                </p>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Display de Mesa para Imprimir</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gerador automático de folhas A4 com linha de corte e vinco para suportes de mesa em acrílico nos formatos A6 e A5.
                </p>
              </div>
            </div>

            {/* STRATEGIC AD 3: In-Feed Banner within Digital Menu */}
            <AdBanner
              format="in-feed"
              isPro={false}
              onUpgradeClick={handleOpenProCheckout}
              className="max-w-4xl mx-auto"
            />

            {/* Demo Links (Menu + Non-Food Catalog) */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/cardapio/demo-restaurante"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition shadow-md"
              >
                <span>🍔 Ver Demo de Cardápio (Restaurante)</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>
              <Link
                href="/catalogo/demo-catalogo"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/40 transition shadow-md"
              >
                <span>🛍️ Ver Demo de Catálogo (Roupas, 3D & Artesanato)</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>
            </div>
          </div>
        </section>

        {/* DETAILED ACCESS RULES MATRIX SECTION: WHO GETS WHAT (FREE VS PRO) */}
        <section className="py-20 bg-[#080d16] border-y border-slate-800/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>TRANSPARÊNCIA TOTAL</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Regras de Acesso: O que é Grátis vs O que é PRO
              </h2>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Entenda exatamente o que você pode usar sem pagar nada e o que é desbloqueado no plano PRO.
              </p>
            </div>

            {/* Comprehensive Permissions Table */}
            <div className="bg-[#101726] border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-4 px-6 font-bold">Recurso / Funcionalidade</th>
                      <th className="py-4 px-6 font-bold text-center w-40">
                        <span className="text-slate-300">Plano Grátis</span>
                      </th>
                      <th className="py-4 px-6 font-bold text-center w-52 bg-emerald-950/30 border-l border-emerald-500/20">
                        <span className="text-emerald-400 font-extrabold flex items-center justify-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          PRO (R$ 10,90)
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {FEATURES_MATRIX.map((feature) => (
                      <tr key={feature.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white mb-0.5">{feature.name}</div>
                          <div className="text-xs text-slate-400">{feature.description}</div>
                        </td>

                        <td className="py-4 px-6 text-center">
                          {feature.freeAccess ? (
                            <span className="inline-flex items-center gap-1 text-slate-300 font-medium text-xs">
                              <Check className="w-4 h-4 text-emerald-400" />
                              {feature.freeLimitText}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-medium text-xs">
                              <Lock className="w-3.5 h-3.5 text-rose-500" />
                              {feature.freeLimitText}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-center bg-emerald-950/20 border-l border-emerald-500/20">
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                            <Check className="w-4 h-4 text-emerald-400" />
                            {feature.proLimitText}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-400">
                  Dúvidas? Todos os pagamentos são protegidos pela API oficial do Mercado Pago.
                </span>
                <button
                  onClick={handleOpenProCheckout}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-glow flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Desbloquear Recursos PRO (R$ 10,90)</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING TABLE (Free vs PRO R$ 10,90) */}
        <section id="precos" className="py-20 bg-[#090e18]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              Planos Transparentes. Lucro Máximo.
            </h2>
            <p className="text-sm text-slate-400 mb-12">
              Comece 100% grátis ou desbloqueie o poder dos QR Codes Dinâmicos por uma taxa simbólica.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {/* FREE CARD */}
              <div className="bg-[#101726] border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Para Quem Está Começando
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-white">R$ 0</span>
                    <span className="text-xs text-slate-500">/ grátis para sempre</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Crie quantos QR Codes estáticos precisar com cores e molduras personalizadas (com anúncios).
                  </p>

                  <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>QR Codes Estáticos Ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>PIX Oficial com Chave e BRCode</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Wi-Fi Automático, WhatsApp e Links</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Molduras com Chamada para Ação (CTA)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <X className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Sem logomarca ou imagem no centro (Exclusivo PRO)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <X className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Sem alteração de link após impressão</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <X className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Sujeito a anúncios e espera de download</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <a
                    href="#gerador"
                    className="block w-full py-3 px-4 rounded-xl text-center text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                  >
                    Criar QR Code Grátis
                  </a>
                </div>
              </div>

              {/* PRO CARD */}
              <div className="relative bg-gradient-to-b from-[#151f33] to-[#101726] border-2 border-emerald-500 rounded-3xl p-8 flex flex-col justify-between shadow-glow">
                {/* Popular Pill */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  Mais Recomendado para Negócios
                </div>

                <div className="space-y-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    QR Dinâmico + Cardápio PRO
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-white">R$ 10,90</span>
                    <span className="text-xs text-slate-400 font-semibold">/ ativação única</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    O adesivo ou acrílico que você imprime nunca mais vai para o lixo. Mude o destino sempre que quiser.
                  </p>

                  <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Logomarca ou Imagem Personalizada no Centro do QR</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>QR Code Dinâmico com Link Curto Editável</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>100% Livre de Anúncios (Ad-Free)</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Cardápio Digital Mobile Interativo</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Receba Pedidos Formatados no WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Display de Mesa A6/A5 White-Label sem marca d'água</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Contador de Leituras e Métricas em Tempo Real</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Pagamento via Mercado Pago Pix Instantâneo</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <a
                    href="#gerador"
                    className="block w-full py-3.5 px-4 rounded-xl text-center text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-glow transition-all"
                  >
                    Ativar QR Dinâmico PRO (R$ 10,90)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HIRE THE DEVELOPER / CUSTOM PROJECTS & AI SECTION */}
        <DeveloperContactSection />

        {/* FAQ SECTION */}
        <section className="py-16 bg-[#0b0f17]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-8">
              Perguntas Frequentes
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: 'Por que o site tem anúncios na versão gratuita?',
                  a: 'Os anúncios viabilizam manter a infraestrutura 100% gratuita para quem precisa apenas de um QR Code estático básico. Ao assinar a versão PRO por R$ 10,90, todos os anúncios são completamente removidos do seu painel e do cardápio visualizado pelos seus clientes.',
                },
                {
                  q: 'Qual a diferença entre o QR Code Estático e o Dinâmico?',
                  a: 'No QR Code Estático, o link é codificado de forma fixa dentro dos pontos pretos. Se você mudar seu WhatsApp, seu site ou os preços, precisa imprimir novas plaquinhas. No QR Code Dinâmico PRO, o QR aponta para o seu link inteligente SpotQR (ex: spotqr.pro/r/seu-restaurante), permitindo que você altere o destino quantas vezes quiser pelo painel, sem nunca precisar reimprimir.',
                },
                {
                  q: 'Como funciona o pagamento de R$ 10,90?',
                  a: 'O pagamento é processado oficialmente via Mercado Pago através do PIX instantâneo. Assim que o Pix é pago, o sistema libera imediatamente a ativação do seu QR Code Dinâmico e o painel de gerenciamento.',
                },
                {
                  q: 'Eu preciso pagar mensalidade para manter meu QR Code funcionando?',
                  a: 'Não! A taxa de R$ 10,90 é um valor de ativação única para o QR Code criado. Não cobramos taxas surpresas nem mensalidades ocultas.',
                },
                {
                  q: 'Como meus clientes fazem pedidos pelo Cardápio Digital?',
                  a: 'O cliente aponta a câmera para o QR na mesa e o cardápio abre no celular. Ele escolhe os pratos, adiciona ao carrinho, digita o número da mesa e clica em "Enviar Pedido pelo WhatsApp". O restaurante recebe a mensagem com o pedido pronto, economizando tempo dos garçons e sem pagar comissões para aplicativos de terceiros.',
                },
                {
                  q: 'O QR Code funciona em qualquer celular?',
                  a: 'Sim! Utilizamos o nível mais alto de correção de erros do padrão ISO (Nível H), garantindo que tanto iPhones quanto qualquer aparelho Android leiam o código com a câmera comum em fração de segundos, mesmo com logotipo central.',
                },
              ].map((faq, i) => (
                <div key={i} className="bg-[#121929] border border-slate-800 rounded-2xl p-5 text-left">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{faq.q}</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* STRATEGIC AD 4: Sticky Footer Banner on Free Pages */}
      <AdBanner
        format="sticky-footer"
        isPro={false}
        onUpgradeClick={handleOpenProCheckout}
      />

      <Footer />

      <ProFeatureLockModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        onUpgrade={handleOpenProCheckout}
      />
    </div>
  );
}
