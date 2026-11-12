'use client';

import React from 'react';
import { Sparkles, Check, X, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { useProPrice } from '@/lib/pro-price';
import VoucherRedeemBox from './VoucherRedeemBox';

interface ProFeatureLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onVoucherRedeemed?: () => void;
  targetSlug?: string;
  featureTitle?: string;
  featureDescription?: string;
}

export default function ProFeatureLockModal({
  isOpen,
  onClose,
  onUpgrade,
  onVoucherRedeemed,
  targetSlug,
  featureTitle = 'Recurso Exclusivo do Plano PRO',
  featureDescription = 'Inserir sua logomarca ou imagem no centro do QR Code e poder alterar o link de destino sem reimprimir adesivos são recursos exclusivos da versão PRO.',
}: ProFeatureLockModalProps) {
  const { proPriceLabel } = useProPrice();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in no-print">
      <div className="relative w-full max-w-xl bg-[#111827] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-glow">
            <Lock className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Desbloqueio Imediato PRO</span>
          </div>

          <h3 className="text-2xl font-extrabold text-white tracking-tight">
            {featureTitle}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {featureDescription}
          </p>
        </div>

        {/* Rules Comparison Mini-Matrix */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
            <span>Recurso</span>
            <div className="flex gap-8">
              <span className="text-slate-500">Grátis</span>
              <span className="text-emerald-400">PRO ({proPriceLabel})</span>
            </div>
          </div>

          {[
            {
              name: 'Logo ou Imagem no Centro do QR',
              free: 'Bloqueado 🔒',
              pro: 'Liberado (Sua Logo)',
            },
            {
              name: 'Destino do QR Code',
              free: 'Fixo (Estático)',
              pro: 'Editável (Dinâmico)',
            },
            {
              name: 'Anúncios na Página',
              free: 'Com Banners',
              pro: '100% Sem Anúncios',
            },
            {
              name: 'Cardápio Digital WhatsApp',
              free: 'Demonstração',
              pro: 'Ativo & Sem Taxas',
            },
            {
              name: 'Métricas de Leitura',
              free: 'Bloqueado 🔒',
              pro: 'Tempo Real',
            },
            {
              name: 'Tempo de Download',
              free: 'Espera 5s',
              pro: 'Download Instantâneo',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1 text-slate-300"
            >
              <span className="font-medium">{item.name}</span>
              <div className="flex items-center gap-6 text-[11px]">
                <span className="text-rose-400/80 w-24 text-right">
                  {item.free}
                </span>
                <span className="text-emerald-400 font-bold w-32 text-right flex items-center justify-end gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.pro}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing CTA */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between px-2">
            <div>
              <span className="text-xs text-slate-400 block">
                Investimento único:
              </span>
              <span className="text-2xl font-extrabold text-white">
                {proPriceLabel}
              </span>
            </div>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              ⚡ Ativação via Pix Imediato
            </span>
          </div>

          <button
            onClick={() => {
              onClose();
              onUpgrade();
            }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-bold transition shadow-glow flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Desbloquear Logo no Centro + PRO por {proPriceLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-400 transition"
          >
            Continuar usando a versão gratuita (sem logo no centro)
          </button>

          <VoucherRedeemBox
            compact
            targetSlug={targetSlug}
            onRedeemed={() => {
              onVoucherRedeemed?.();
              onClose();
            }}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}
