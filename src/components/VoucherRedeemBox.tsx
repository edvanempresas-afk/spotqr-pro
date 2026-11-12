'use client';

import React, { useState } from 'react';
import { Ticket, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import ClientAuthModal from './ClientAuthModal';
import { DynamicQRRecord } from '@/lib/types';

export interface VoucherRedeemResult {
  success: boolean;
  days: number;
  code: string;
  slug?: string;
  storeName?: string;
  proExpiresAt: string;
  creditOnly: boolean;
}

interface VoucherRedeemBoxProps {
  compact?: boolean;
  targetSlug?: string;
  stores?: DynamicQRRecord[];
  onRedeemed?: (result: VoucherRedeemResult) => void;
  className?: string;
}

export default function VoucherRedeemBox({
  compact = false,
  targetSlug,
  stores,
  onRedeemed,
  className = '',
}: VoucherRedeemBoxProps) {
  const [code, setCode] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string>(targetSlug || '');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const realStores = (stores || []).filter(
    (s) => s.slug !== 'demo-restaurante' && s.slug !== 'demo-catalogo'
  );
  const resolvedSlug =
    targetSlug ||
    selectedSlug ||
    (realStores.length === 1 ? realStores[0].slug : '');

  const executeRedeem = async (codeToUse: string) => {
    const clean = codeToUse.trim().toUpperCase();
    if (!clean) {
      setFeedback({
        type: 'error',
        text: 'Digite o seu código voucher para liberar o PRO.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: clean,
          slug: resolvedSlug || undefined,
        }),
      });
      const data = await res.json();

      if (res.status === 401 && data?.requiresAuth) {
        setIsAuthModalOpen(true);
        return;
      }

      if (!res.ok) {
        setFeedback({
          type: 'error',
          text: data?.error || 'Código inválido ou já utilizado.',
        });
        return;
      }

      const expLabel = data.proExpiresAt
        ? new Date(data.proExpiresAt).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';

      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.65 },
      });

      setCode('');
      setFeedback({
        type: 'success',
        text: data.creditOnly
          ? `🎉 Código ${data.code} ativado por ${data.days} ${
              data.days === 1 ? 'dia' : 'dias'
            }! Crie seu primeiro cardápio/catálogo e ele já nascerá PRO (até ${expLabel}).`
          : `🎉 Plano PRO liberado por ${data.days} ${
              data.days === 1 ? 'dia' : 'dias'
            }${data.storeName ? ` para "${data.storeName}"` : ''}! Válido até ${expLabel}.`,
      });

      onRedeemed?.(data as VoucherRedeemResult);
    } catch {
      setFeedback({
        type: 'error',
        text: 'Erro de conexão ao validar seu código voucher.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeRedeem(code);
  };

  return (
    <>
      <div
        className={`rounded-2xl border ${
          compact
            ? 'bg-slate-900/90 border-amber-500/35 p-3.5'
            : 'bg-gradient-to-r from-[#121c2e] via-[#101726] to-[#0f1d22] border-amber-500/40 p-5 shadow-lg'
        } ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h4
                className={`font-extrabold text-white flex items-center gap-1.5 ${
                  compact ? 'text-xs' : 'text-sm'
                }`}
              >
                <span>Possui um Voucher / Código PRO? Digite o seu código aqui</span>
              </h4>
              {!compact && (
                <p className="text-[11px] text-slate-400">
                  Recebeu um código teste com dias grátis de PRO? Insira abaixo para remover anúncios e liberar sua logomarca na hora.
                </p>
              )}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          {realStores.length > 1 && !targetSlug && (
            <select
              value={resolvedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none sm:max-w-[200px]"
            >
              <option value="">Selecionar loja automaticamente</option>
              {realStores.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title} ({s.storeCode ? `#${s.storeCode}` : `/${s.slug}`})
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (feedback) setFeedback(null);
            }}
            placeholder="Digite o seu código aqui (ex: SPOT-7D-XXXX)"
            className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold tracking-wider text-white placeholder-slate-500 outline-none transition uppercase"
          />

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold transition shadow-md flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{submitting ? 'Validando...' : 'Liberar PRO'}</span>
          </button>
        </form>

        {feedback && (
          <div
            className={`mt-2.5 p-2.5 rounded-xl border text-xs font-semibold flex items-start gap-2 text-left ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      <ClientAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab="login"
        contextMessage={`Entre ou crie sua conta gratuita para ativar o código voucher ${code.trim().toUpperCase()} no seu catálogo ou cardápio.`}
        onAuthSuccess={() => {
          setIsAuthModalOpen(false);
          if (code.trim()) {
            executeRedeem(code);
          }
        }}
      />
    </>
  );
}

