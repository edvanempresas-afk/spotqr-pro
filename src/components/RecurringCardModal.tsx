'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  Check,
  AlertTriangle,
  RefreshCw,
  Trash2,
  X,
  CalendarClock,
} from 'lucide-react';
import { AutoRenewConfig } from '@/lib/types';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago?: any;
  }
}

interface RecurringCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  storeTitle: string;
  isCurrentlyPro: boolean;
  proExpiresAt?: string | null;
  currentAutoRenew?: AutoRenewConfig | null;
  proPriceReais: number;
  mpPublicKey?: string;
  defaultChargeNow?: boolean;
  onSuccess: () => void;
}

function formatCpfMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9
  )}-${digits.slice(9, 11)}`;
}

function formatCardNumberMask(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiryMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

function inferBrand(cardDigits: string): { brand: string; methodId: string } {
  if (/^4/.test(cardDigits)) return { brand: 'Visa', methodId: 'visa' };
  if (/^(5[1-5]|2[2-7])/.test(cardDigits)) {
    return { brand: 'Mastercard', methodId: 'master' };
  }
  if (/^3[47]/.test(cardDigits)) return { brand: 'Amex', methodId: 'amex' };
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|6277|6362|6363|6504|6505|6516)/.test(cardDigits)) {
    return { brand: 'Elo', methodId: 'elo' };
  }
  if (/^(606282|3841)/.test(cardDigits)) {
    return { brand: 'Hipercard', methodId: 'hipercard' };
  }
  return { brand: 'Cartão de Crédito', methodId: 'visa' };
}

export default function RecurringCardModal({
  isOpen,
  onClose,
  slug,
  storeTitle,
  isCurrentlyPro,
  proExpiresAt,
  currentAutoRenew,
  proPriceReais,
  mpPublicKey: propPublicKey,
  defaultChargeNow = false,
  onSuccess,
}: RecurringCardModalProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [mpPublicKey, setMpPublicKey] = useState(propPublicKey || '');
  const [showCardForm, setShowCardForm] = useState(
    !currentAutoRenew?.enabled
  );

  const [holderName, setHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [chargeNow, setChargeNow] = useState(
    !isCurrentlyPro || defaultChargeNow
  );

  const [submitting, setSubmitting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowCardForm(!currentAutoRenew?.enabled);
    setChargeNow(!isCurrentlyPro || defaultChargeNow);
    if (typeof window !== 'undefined' && window.MercadoPago) {
      setSdkReady(true);
    }
    if (!propPublicKey) {
      fetch('/api/pro-price')
        .then((r) => r.json())
        .then((d) => {
          if (d?.mpPublicKey) setMpPublicKey(d.mpPublicKey);
        })
        .catch(() => {});
    } else {
      setMpPublicKey(propPublicKey);
    }
  }, [isOpen, currentAutoRenew, isCurrentlyPro, defaultChargeNow, propPublicKey]);

  if (!isOpen) return null;

  const priceFormatted = (Number(proPriceReais) || 10.9)
    .toFixed(2)
    .replace('.', ',');

  const nextBillingFormatted = (
    currentAutoRenew?.nextBillingAt || proExpiresAt
  )
    ? new Date(
        (currentAutoRenew?.nextBillingAt || proExpiresAt) as string
      ).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Em 30 dias';

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const digits = cardNumber.replace(/\D/g, '');
    const cpfDigits = cpf.replace(/\D/g, '');
    const [expMonthRaw, expYearRaw] = expiry.split('/');
    const expMonth = (expMonthRaw || '').padStart(2, '0');
    const expYear =
      expYearRaw && expYearRaw.length === 2 ? `20${expYearRaw}` : expYearRaw || '';

    if (holderName.trim().length < 3) {
      setErrorMsg('Informe o nome completo impresso no cartão.');
      return;
    }
    if (digits.length < 13 || digits.length > 16) {
      setErrorMsg('Número do cartão inválido (13 a 16 dígitos).');
      return;
    }
    if (
      !expMonth ||
      Number(expMonth) < 1 ||
      Number(expMonth) > 12 ||
      expYear.length !== 4
    ) {
      setErrorMsg('Validade inválida. Use o formato MM/AA.');
      return;
    }
    if (cvv.replace(/\D/g, '').length < 3) {
      setErrorMsg('Código de segurança (CVV) inválido.');
      return;
    }
    if (cpfDigits.length !== 11) {
      setErrorMsg('Informe um CPF válido com 11 dígitos.');
      return;
    }

    if (!window.MercadoPago || !mpPublicKey) {
      setErrorMsg(
        'SDK seguro do Mercado Pago ainda carregando. Aguarde 2 segundos e tente novamente.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const mp = new window.MercadoPago(mpPublicKey, { locale: 'pt-BR' });
      const tokenResponse = await mp.createCardToken({
        cardNumber: digits,
        cardholderName: holderName.trim(),
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear,
        securityCode: cvv.replace(/\D/g, ''),
        identificationType: 'CPF',
        identificationNumber: cpfDigits,
      });

      if (!tokenResponse?.id) {
        setErrorMsg(
          'Não foi possível validar este cartão no Mercado Pago. Confira número, validade, CVV e CPF.'
        );
        return;
      }

      const inferred = inferBrand(digits);
      const res = await fetch('/api/subscription/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          cardToken: tokenResponse.id,
          holderName: holderName.trim(),
          cpf: cpfDigits,
          cardBrand: inferred.brand,
          cardLast4: digits.slice(-4),
          expiryMonth: expMonth,
          expiryYear: expYear,
          paymentMethodId: tokenResponse.payment_method_id || inferred.methodId,
          chargeNow,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Falha ao salvar o cartão.');
        return;
      }

      setSuccessMsg(
        data.chargedNow
          ? 'Pagamento aprovado e renovação automática mensal ativada com sucesso!'
          : 'Cartão salvo com segurança! A próxima mensalidade será cobrada automaticamente no vencimento.'
      );
      setCardNumber('');
      setCvv('');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Erro ao criptografar os dados do cartão no Mercado Pago.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAutoRenew = async () => {
    setCanceling(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/subscription/card?slug=${encodeURIComponent(slug)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setSuccessMsg(
          'Renovação automática desativada. Seu PRO permanece ativo apenas até a data de vencimento atual.'
        );
        setTimeout(() => onSuccess(), 1200);
      } else {
        setErrorMsg('Não foi possível cancelar a renovação automática.');
      }
    } catch {
      setErrorMsg('Erro de rede ao cancelar renovação.');
    } finally {
      setCanceling(false);
    }
  };

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-lg bg-[#101726] border-2 border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-4">
            <div className="space-y-1 pr-8">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-bold uppercase">
                <RefreshCw className="w-3 h-3" />
                <span>Renovação Mensal Automática</span>
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Cartão Salvo — {storeTitle}
              </h3>
              <p className="text-xs text-slate-400">
                Deixe seu cartão vinculado com segurança via Mercado Pago para
                renovar automaticamente por <strong className="text-emerald-400">R$ {priceFormatted}/mês</strong>.
              </p>
            </div>

            {/* Saved Card Summary if Active */}
            {currentAutoRenew?.enabled && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/35 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white">
                        {currentAutoRenew.cardBrand || 'Cartão'} ••••{' '}
                        {currentAutoRenew.cardLast4 || '****'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Validade {currentAutoRenew.expiryMonth || '--'}/
                        {currentAutoRenew.expiryYear || '----'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      currentAutoRenew.status === 'past_due'
                        ? 'bg-red-500/15 border-red-500/40 text-red-300'
                        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    {currentAutoRenew.status === 'past_due'
                      ? `Tentando Cobrar (${currentAutoRenew.retryCount}/10)`
                      : 'Ativa'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <CalendarClock className="w-3.5 h-3.5 text-sky-400" />
                    Próxima cobrança programada:
                  </span>
                  <strong className="text-white">{nextBillingFormatted}</strong>
                </div>

                {currentAutoRenew.lastError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] text-red-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>
                      Última falha: <strong>{currentAutoRenew.lastError}</strong>.
                      Troque o cartão abaixo para não perder o PRO.
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCardForm((v) => !v)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition"
                  >
                    {showCardForm ? 'Ocultar Formulário' : 'Trocar Cartão'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAutoRenew}
                    disabled={canceling}
                    className="py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold text-red-300 flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {canceling ? 'Cancelando...' : 'Desativar Auto-Renovação'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Policy Transparency Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Como funciona a renovação automática mensal:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>
                  No vencimento do mês seguinte, o sistema tenta cobrar{' '}
                  <strong className="text-slate-200">R$ {priceFormatted}</strong>{' '}
                  automaticamente no cartão tokenizado.
                </li>
                <li>
                  Se a cobrança falhar, realizamos novas tentativas por{' '}
                  <strong className="text-slate-200">5 dias consecutivos</strong>,
                  sempre às <strong className="text-slate-200">10h da manhã</strong>{' '}
                  e às <strong className="text-slate-200">18h da noite</strong>.
                </li>
                <li>
                  Se após 5 dias todas as tentativas falharem (ou o PRO vencer sem
                  renovação), a loja volta automaticamente para o plano{' '}
                  <strong className="text-slate-200">Free</strong> (vídeo animado volta
                  para foto estática, anúncios retornam e link amigável volta ao anterior).
                </li>
              </ul>
            </div>

            {showCardForm && (
              <form onSubmit={handleSaveCard} className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Nome impresso no cartão
                  </label>
                  <input
                    type="text"
                    required
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="EX: ADRIANA CELLIS"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Número do Cartão de Crédito
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(formatCardNumberMask(e.target.value))
                    }
                    placeholder="0000 0000 0000 0000"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Validade
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiryMask(e.target.value))}
                      placeholder="MM/AA"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      value={cvv}
                      onChange={(e) =>
                        setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      placeholder="123"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      CPF Titular
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={cpf}
                      onChange={(e) => setCpf(formatCpfMask(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white font-mono outline-none"
                    />
                  </div>
                </div>

                {isCurrentlyPro && (
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={chargeNow}
                      onChange={(e) => setChargeNow(e.target.checked)}
                      className="mt-0.5 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>
                      <strong>Cobrar +30 dias agora (R$ {priceFormatted})</strong>{' '}
                      somando aos dias atuais. Se desmarcado, apenas salva o cartão
                      para cobrar no próximo vencimento ({nextBillingFormatted}).
                    </span>
                  </label>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !sdkReady}
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-glow transition flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Validando e Salvando no Mercado Pago...'
                      : chargeNow
                      ? `Pagar R$ ${priceFormatted} e Ativar Renovação Automática`
                      : 'Salvar Cartão e Ativar Renovação Automática'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

