'use client';

import React, { useState, useEffect } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Sparkles,
  Clock,
  CreditCard,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PixPaymentResponse } from '@/lib/types';
import QRCode from 'qrcode';

interface PixCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  paymentData: PixPaymentResponse | null;
  onPaymentSuccess: () => void;
}

export default function PixCheckoutModal({
  isOpen,
  onClose,
  slug,
  paymentData,
  onPaymentSuccess,
}: PixCheckoutModalProps) {
  const [paymentTab, setPaymentTab] = useState<'pix' | 'mercadolivre'>('pix');
  const [copied, setCopied] = useState(false);
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>('');
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [countdown, setCountdown] = useState(1800); // 30 minutes in seconds

  // Generate QR Code image for the Pix Payload
  useEffect(() => {
    if (paymentData?.qrCodeCopyPaste) {
      QRCode.toDataURL(paymentData.qrCodeCopyPaste, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setPixQrDataUrl(url))
        .catch((err) => console.error('Error generating Pix visual QR:', err));
    }
  }, [paymentData]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isApproved) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isApproved]);

  // Poll for payment approval
  useEffect(() => {
    if (!isOpen || !paymentData?.paymentId || isApproved) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/mercadopago/check-status?paymentId=${paymentData.paymentId}&slug=${slug}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'approved') {
            triggerSuccess();
          }
        }
      } catch (err) {
        // quiet polling
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, paymentData, slug, isApproved]);

  const triggerSuccess = () => {
    setIsApproved(true);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      onPaymentSuccess();
    }, 2200);
  };

  const handleCopy = () => {
    if (paymentData?.qrCodeCopyPaste) {
      navigator.clipboard.writeText(paymentData.qrCodeCopyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSimulateApproval = async () => {
    if (!paymentData?.paymentId) return;
    setIsApproving(true);
    try {
      const res = await fetch('/api/mercadopago/simulate-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentData.paymentId,
          slug,
        }),
      });
      if (res.ok) {
        triggerSuccess();
      }
    } catch (err) {
      console.error('Failed to simulate approval:', err);
    } finally {
      setIsApproving(false);
    }
  };

  if (!isOpen || !paymentData) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const priceFormatted = (paymentData.amount || 10.9)
    .toFixed(2)
    .replace('.', ',');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#101726] border-2 border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {isApproved ? (
          <div className="py-8 space-y-4 animate-scale-up">
            <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              Assinatura PRO Confirmada!
            </h3>
            <p className="text-sm text-slate-300 max-w-sm mx-auto">
              Seu QR Code Dinâmico e Cardápio{' '}
              <span className="font-semibold text-emerald-400">/{slug}</span>{' '}
              foram ativados com sucesso (Logo no Centro liberada & 100% Sem
              Anúncios)!
            </p>
            <p className="text-xs text-slate-400">
              Atualizando seu painel...
            </p>
          </div>
        ) : (
          <div className="space-y-5 relative z-10">
            {/* Header */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Checkout Oficial Mercado Livre & Mercado Pago</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Assinatura SpotQR PRO — R$ {priceFormatted}
              </h3>
              <p className="text-xs text-slate-400">
                Libere Logomarca no Centro do QR, Link Dinâmico Editável e
                Cardápio Digital sem anúncios.
              </p>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentTab('pix')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                  paymentTab === 'pix'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>PIX Instantâneo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('mercadolivre')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                  paymentTab === 'mercadolivre'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cartão / Mercado Livre</span>
              </button>
            </div>

            {paymentTab === 'pix' ? (
              <>
                {/* Pix Visual QR */}
                <div className="relative inline-block bg-white p-3.5 rounded-2xl shadow-xl mx-auto border-2 border-emerald-500/30">
                  {pixQrDataUrl ? (
                    <img
                      src={
                        paymentData.qrCodeBase64
                          ? `data:image/png;base64,${paymentData.qrCodeBase64}`
                          : pixQrDataUrl
                      }
                      alt="QR Code Pix"
                      className="w-44 h-44 object-contain rounded-lg mx-auto"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-500">
                      <Clock className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                  <div className="mt-1.5 text-center text-[11px] font-extrabold text-slate-900 tracking-wider">
                    TOTAL: R$ {priceFormatted}
                  </div>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Aguardando pagamento PIX ({minutes}:
                    {seconds.toString().padStart(2, '0')})
                  </span>
                </div>

                {/* Pix Copia e Cola Input */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-300">
                    Código PIX Copia e Cola (Banco Central / Mercado Pago):
                  </label>
                  <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 rounded-xl p-2">
                    <input
                      type="text"
                      readOnly
                      value={paymentData.qrCodeCopyPaste}
                      className="bg-transparent text-xs text-slate-300 flex-1 outline-none px-2 font-mono truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-extrabold transition shadow-sm whitespace-nowrap"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar PIX</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* MERCADO LIVRE / MERCADO PAGO CHECKOUT PRO & SUBSCRIPTION TAB */
              <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-6 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      Pague com Conta Mercado Livre ou Cartão
                    </h4>
                    <p className="text-xs text-slate-400">
                      Use seu saldo do Mercado Pago, cartão de crédito em até
                      12x ou assinatura recorrente.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Plano selecionado:</span>
                    <strong className="text-white">
                      SpotQR PRO (/{slug})
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Processador Oficial:</span>
                    <strong className="text-sky-400">
                      Mercado Livre / Mercado Pago
                    </strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Valor Total:</span>
                    <strong className="text-emerald-400 text-sm">
                      R$ {priceFormatted}
                    </strong>
                  </div>
                </div>

                {paymentData.checkoutProUrl || paymentData.ticketUrl ? (
                  <a
                    href={paymentData.checkoutProUrl || paymentData.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <span>Pagar no Ambiente Seguro Mercado Pago</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPaymentTab('pix')}
                    className="w-full py-3.5 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <span>Pagar Agora com PIX Mercado Pago</span>
                  </button>
                )}

                <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Transação criptografada pelo sistema antifraude Mercado
                    Livre
                  </span>
                </p>
              </div>
            )}

            {/* Footer & Simulator (Simulator only shown when live token isn't active yet) */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              {!paymentData.isLiveProduction && (
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/70 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Teste Rápido (Modo Demonstração):</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSimulateApproval}
                    disabled={isApproving}
                    className="text-emerald-400 hover:text-emerald-300 font-extrabold underline underline-offset-4 cursor-pointer whitespace-nowrap"
                  >
                    {isApproving
                      ? 'Aprovando...'
                      : '⚡ Simular Pagamento Aprovado'}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Voltar e Continuar Editando
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
