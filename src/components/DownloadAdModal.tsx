'use client';

import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, ExternalLink, Clock, ShieldCheck, Zap } from 'lucide-react';
import { useProPrice } from '@/lib/pro-price';

interface DownloadAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadConfirmed: () => void;
  onUpgradeToPro: () => void;
}

export default function DownloadAdModal({
  isOpen,
  onClose,
  onDownloadConfirmed,
  onUpgradeToPro,
}: DownloadAdModalProps) {
  const { proPriceLabel } = useProPrice();
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [canDownload, setCanDownload] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(5);
      setCanDownload(false);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanDownload(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in no-print">
      <div className="relative w-full max-w-lg bg-[#111827] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 mb-6">
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
            Versão Gratuita (Com Suporte de Anúncios)
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            Preparando seu QR Code em Alta Resolução...
          </h3>
          <p className="text-xs text-slate-400">
            Seu download de 300 DPI será liberado assim que o cronômetro zerar.
          </p>
        </div>

        {/* Progress Bar & Countdown */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Aguarde o anúncio:</span>
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {secondsLeft > 0 ? `${secondsLeft}s` : 'Liberado!'}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 rounded-full"
              style={{ width: `${((5 - secondsLeft) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* HIGH CTR SPONSORED AD SPOT */}
        <div className="bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 rounded-2xl p-5 mb-6 text-left relative overflow-hidden">
          <span className="absolute top-2 right-2 text-[8px] font-mono uppercase text-slate-500">
            Anúncio Patrocinado
          </span>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Maquininha de Cartão Sem Aluguel</h4>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded">
                  0% Taxa no 1º Mês
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receba pagamentos das mesas na hora com a menor taxa do mercado e conta digital grátis.
              </p>

              <a
                href="https://www.mercadopago.com.br/point"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 pt-1"
              >
                <span>Conferir maquininhas Mercado Pago</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {canDownload ? (
            <button
              onClick={() => {
                onDownloadConfirmed();
                onClose();
              }}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-glow flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo PNG Agora</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3.5 px-4 bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 animate-spin" />
              <span>Liberando em {secondsLeft} segundos...</span>
            </button>
          )}

          {/* Upsell to PRO (Skip wait + Remove ads forever) */}
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                onClose();
                onUpgradeToPro();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pular Espera & Remover Todos os Anúncios ({proPriceLabel})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

