'use client';

import React, { useState } from 'react';
import {
  Code2,
  Bot,
  CalendarCheck,
  Scissors,
  Globe,
  UtensilsCrossed,
  Sparkles,
  Send,
  CheckCircle2,
  MessageCircle,
  Phone,
  User,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { DeveloperServiceType } from '@/lib/types';
import Link from 'next/link';

interface ServiceOption {
  id: DeveloperServiceType;
  label: string;
  shortTitle: string;
  description: string;
  badge?: string;
  icon: React.ElementType;
  color: string;
}

export const DEVELOPER_SERVICES: ServiceOption[] = [
  {
    id: 'ia_atendimento',
    label: 'IA de Atendimento Automático (WhatsApp 24h)',
    shortTitle: 'IA de Atendimento 24h',
    description:
      'Robô inteligente com IA no WhatsApp que responde clientes na hora, envia preços, tira dúvidas, agenda horários e fecha vendas sozinho 24h.',
    badge: 'Alta Procura 🔥',
    icon: Bot,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'salao_barbearia',
    label: 'Sistema para Salão de Beleza, Barbearia & Estética',
    shortTitle: 'Salão de Beleza & Barbearia',
    description:
      'Site e app de agendamento online por profissional (corte, barba, manicure, estética), lembrete automático no WhatsApp e controle de comissões.',
    badge: 'Top Negócios',
    icon: Scissors,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'marcacao_consultas',
    label: 'Site de Marcação de Consultas & Clínicas',
    shortTitle: 'Marcação de Consultas',
    description:
      'Plataforma para médicos, dentistas, psicólogos e clínicas com agenda online, confirmação automática de pacientes e prontuário digital.',
    badge: 'Saúde & Clínicas',
    icon: CalendarCheck,
    color: 'from-sky-500 to-blue-600',
  },
  {
    id: 'sites_landing_pages',
    label: 'Sites Profissionais, Lojas & Landing Pages',
    shortTitle: 'Sites & Landing Pages',
    description:
      'Sites institucionais de alta conversão, páginas de vendas ultra rápidas e posicionamento no Google para atrair clientes todos os dias.',
    icon: Globe,
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'delivery_restaurante',
    label: 'Sistema Completo de Delivery & Gestão Gastronômica',
    shortTitle: 'Delivery & Restaurantes',
    description:
      'Sistema próprio de pedidos online, painel de cozinha (KDS), integração PIX automática e fidelização sem pagar taxas para aplicativos.',
    icon: UtensilsCrossed,
    color: 'from-rose-500 to-red-600',
  },
  {
    id: 'sistema_sob_medida',
    label: 'Aplicativos, SaaS & Sistemas Web Sob Medida',
    shortTitle: 'Sistema Sob Medida / SaaS',
    description:
      'Tem uma ideia de negócio digital ou precisa automatizar sua empresa? Desenvolvemos seu sistema personalizado do zero.',
    icon: Layers,
    color: 'from-emerald-400 to-cyan-500',
  },
];

export default function DeveloperContactSection() {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contact, setContact] = useState('');
  const [selectedService, setSelectedService] =
    useState<DeveloperServiceType>('ia_atendimento');
  const [urgency, setUrgency] = useState('Urgente (Esta semana)');
  const [budgetRange, setBudgetRange] = useState('A combinar');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentServiceObj =
    DEVELOPER_SERVICES.find((s) => s.id === selectedService) ||
    DEVELOPER_SERVICES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !contact.trim() || !description.trim()) {
      setErrorMsg(
        'Por favor, preencha seu nome, seu WhatsApp/contato e descreva brevemente o que deseja desenvolver.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/developer-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          businessName,
          contact,
          serviceType: selectedService,
          serviceLabel: currentServiceObj.label,
          urgency,
          budgetRange,
          description,
        }),
      });

      if (res.ok) {
        setSubmittedSuccess(true);
      } else {
        const errData = await res.json();
        setErrorMsg(
          errData.error || 'Ocorreu um erro ao enviar. Tente novamente.'
        );
      }
    } catch (err) {
      console.error('Error submitting developer lead:', err);
      setErrorMsg('Erro de conexão ao enviar sua mensagem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedSuccess(false);
    setName('');
    setBusinessName('');
    setContact('');
    setDescription('');
  };

  return (
    <section
      id="desenvolvedor"
      className="py-20 bg-gradient-to-b from-[#090e18] via-[#0d1526] to-[#0b0f17] border-t border-slate-800/80 relative overflow-hidden"
    >
      {/* Subtle Ambient Glow */}
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
            <Code2 className="w-4 h-4" />
            <span>CONTRATE O DESENVOLVEDOR • SOLUÇÕES SOB MEDIDA</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Quer Desenvolver um{' '}
            <span className="gradient-text">
              Site, IA de Atendimento ou Sistema
            </span>{' '}
            para o Seu Negócio?
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Gostou da tecnologia deste site? Entre em contato direto com nosso
            engenheiro de software para criar a solução perfeita para sua{' '}
            <strong className="text-white">
              Barbearia, Salão de Beleza, Clínica, Consultório, Restaurante ou
              Empresa
            </strong>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT COLUMN: Showcase of Services */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>O Que Podemos Desenvolver Para Você:</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-semibold">
                Clique para selecionar 👇
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {DEVELOPER_SERVICES.map((service) => {
                const Icon = service.icon;
                const isSelected = selectedService === service.id;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedService(service.id)}
                    className={`text-left p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#152238] border-emerald-500 shadow-glow ring-1 ring-emerald-500/50'
                        : 'bg-[#111827]/90 border-slate-800/90 hover:border-slate-700 hover:bg-[#141d2f]'
                    }`}
                  >
                    {service.badge && (
                      <span className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                        {service.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-3 mb-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shrink-0 shadow-md`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {service.shortTitle}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold">
                      <span
                        className={
                          isSelected ? 'text-emerald-400' : 'text-slate-500'
                        }
                      >
                        {isSelected
                          ? '✓ Selecionado no formulário'
                          : 'Selecionar este serviço'}
                      </span>
                      <ArrowRight
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Trust Banner */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Atendimento Direto com o Engenheiro Responsável
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Orçamento rápido, sigiloso e sem compromisso. Receba sua
                    proposta diretamente no seu WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Lead Capture Form */}
          <div className="lg:col-span-6 bg-[#101726] border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            {submittedSuccess ? (
              <div className="py-8 text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-glow">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Solicitação Recebida com Sucesso!
                  </span>
                  <h3 className="text-2xl font-extrabold text-white">
                    Parabéns, {name}! Já recebemos seu pedido.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Sua mensagem sobre{' '}
                    <strong className="text-emerald-400">
                      {currentServiceObj.shortTitle}
                    </strong>{' '}
                    já está salva no painel do desenvolvedor. Entraremos em
                    contato no número/contato{' '}
                    <strong className="text-white">{contact}</strong> muito em
                    breve!
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 max-w-md mx-auto text-left space-y-1.5 text-xs">
                  <div className="text-slate-400">
                    <strong className="text-slate-200">Projeto:</strong>{' '}
                    {currentServiceObj.label}
                  </div>
                  {businessName && (
                    <div className="text-slate-400">
                      <strong className="text-slate-200">Negócio:</strong>{' '}
                      {businessName}
                    </div>
                  )}
                  <div className="text-slate-400">
                    <strong className="text-slate-200">Resumo:</strong>{' '}
                    {description}
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                  >
                    Enviar Outra Mensagem
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-b border-slate-800 pb-4 mb-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    Fale com o Desenvolvedor
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-0.5">
                    Solicite Seu Orçamento Sob Medida
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Preencha seus dados abaixo e conte o que você quer
                    desenvolver.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* Row 1: Name & Business Name */}
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
                        placeholder="Ex: João Silva"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nome do Negócio (Opcional)
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Ex: Barbearia / Salão / Clínica..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Contact (WhatsApp / Phone / Email) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Seu WhatsApp (com DDD) ou E-mail para Retorno *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Ex: (11) 99999-8888 ou seu@email.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Row 3: What they want to develop */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    O que você deseja desenvolver? *
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) =>
                      setSelectedService(e.target.value as DeveloperServiceType)
                    }
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                  >
                    {DEVELOPER_SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 4: Urgency & Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Prazo / Urgência
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none transition"
                      >
                        <option value="Urgente (Esta semana)">
                          Urgente (Esta semana)
                        </option>
                        <option value="Neste mês">Para este mês</option>
                        <option value="Apenas pesquisando orçamento">
                          Apenas pesquisando orçamento
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Investimento Estimado
                    </label>
                    <select
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                    >
                      <option value="A combinar">
                        Quero receber uma proposta
                      </option>
                      <option value="Até R$ 1.000">Até R$ 1.000</option>
                      <option value="R$ 1.000 a R$ 2.500">
                        R$ 1.000 a R$ 2.500
                      </option>
                      <option value="R$ 2.500 a R$ 5.000">
                        R$ 2.500 a R$ 5.000
                      </option>
                      <option value="Acima de R$ 5.000 (Projeto Completo)">
                        Acima de R$ 5.000 (Projeto Completo)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Row 5: Detailed Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Descreva o que você precisa para o seu negócio *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Tenho um salão de beleza / barbearia / clínica e quero um site para agendamento de horários + IA de atendimento no WhatsApp..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 outline-none transition resize-none"
                  />
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm uppercase tracking-wide shadow-glow hover:shadow-glow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Enviando para o Desenvolvedor...'
                      : 'Enviar Pedido para o Desenvolvedor'}
                  </span>
                </button>

                <p className="text-[11px] text-center text-slate-500">
                  🔒 Seus dados vão direto para a caixa de entrada exclusiva do
                  desenvolvedor.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

