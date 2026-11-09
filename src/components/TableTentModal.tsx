'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Sparkles,
  Smartphone,
  Coffee,
  Hash,
} from 'lucide-react';
import { QRConfig } from '@/lib/types';

interface TableTentModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string;
  config: QRConfig;
  isPro?: boolean;
  onUpgradeToPro?: () => void;
}

export default function TableTentModal({
  isOpen,
  onClose,
  qrDataUrl,
  config,
  isPro = false,
  onUpgradeToPro,
}: TableTentModalProps) {
  const [showTableNumbers, setShowTableNumbers] = useState(true);
  const [startTableNum, setStartTableNum] = useState(1);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const t1 = String(startTableNum).padStart(2, '0');
  const t2 = String(startTableNum + 1).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#101726] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header (hidden in print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Display de Mesa & Plaquinha Acrílico (A6/A5)
                </h3>
                {isPro ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    White-Label PRO
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Versão Gratuita
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Pronto para imprimir, recortar e colocar nos suportes de mesa.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Table numbering control */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-semibold">
                <input
                  type="checkbox"
                  checked={showTableNumbers}
                  onChange={(e) => setShowTableNumbers(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>Numerar Mesas:</span>
              </label>
              {showTableNumbers && (
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={startTableNum}
                  onChange={(e) =>
                    setStartTableNum(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white font-bold"
                  title="Número da primeira mesa da folha"
                />
              )}
            </div>

            {!isPro && onUpgradeToPro && (
              <button
                onClick={onUpgradeToPro}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Remover Marca d'Água (R$ 10,90)</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-glow"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Folha A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-950/50">
          {/* Printable Sheet (Simulating an A4 sheet with 2 table tents side-by-side) */}
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-200 print-page">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Display 1 */}
              <div className="border-2 border-dashed border-slate-300 p-6 rounded-2xl flex flex-col items-center text-center relative bg-gradient-to-b from-slate-50 to-white">
                <span className="absolute top-2 left-2 text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                  ✂ Corte aqui
                </span>

                {showTableNumbers && (
                  <span className="absolute top-2 right-2 bg-slate-900 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    MESA {t1}
                  </span>
                )}

                {/* Top Badge */}
                <div
                  className="px-3 py-1 rounded-full text-white text-[11px] font-bold uppercase tracking-wider mb-3 mt-2 shadow-sm"
                  style={{ backgroundColor: config.frameColor || '#16a34a' }}
                >
                  {config.frameText || 'CARDÁPIO DIGITAL'}
                </div>

                {/* Brand Title */}
                <h4 className="text-lg font-extrabold text-slate-900 tracking-tight mb-1">
                  {config.title || 'Seja Bem-vindo!'}
                </h4>
                <p className="text-xs text-slate-500 max-w-[200px] mb-4">
                  Aponte a câmera do seu celular para ver o cardápio e pedir
                </p>

                {/* High-res QR Code */}
                <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100 mb-4">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="QR Code de Mesa"
                      className="w-44 h-44 object-contain"
                    />
                  )}
                </div>

                {/* Footer notes */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Abra a câmera e aponte para o código</span>
                </div>

                {config.wifiSSID && (
                  <div className="mt-3 text-[10px] text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    📶 <strong>Wi-Fi:</strong> {config.wifiSSID} |{' '}
                    <strong>Senha:</strong> {config.wifiPassword || 'Sem senha'}
                  </div>
                )}

                {/* FREE vs PRO watermark */}
                {!isPro && (
                  <div className="mt-4 pt-2 border-t border-slate-200 text-[8px] text-slate-400 font-mono">
                    Criado com SpotQR Grátis • spotqr.pro
                  </div>
                )}
              </div>

              {/* Display 2 */}
              <div className="border-2 border-dashed border-slate-300 p-6 rounded-2xl flex flex-col items-center text-center relative bg-gradient-to-b from-slate-50 to-white">
                <span className="absolute top-2 left-2 text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                  ✂ Corte aqui
                </span>

                {showTableNumbers && (
                  <span className="absolute top-2 right-2 bg-slate-900 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    MESA {t2}
                  </span>
                )}

                <div
                  className="px-3 py-1 rounded-full text-white text-[11px] font-bold uppercase tracking-wider mb-3 mt-2 shadow-sm"
                  style={{ backgroundColor: config.frameColor || '#16a34a' }}
                >
                  {config.type === 'pix' ? 'PAGAMENTO PIX' : 'PEÇA NA MESA'}
                </div>

                <h4 className="text-lg font-extrabold text-slate-900 tracking-tight mb-1">
                  {config.title || 'Seja Bem-vindo!'}
                </h4>
                <p className="text-xs text-slate-500 max-w-[200px] mb-4">
                  {config.type === 'pix'
                    ? 'Pague sua conta sem esperar o garçom'
                    : 'Confira nossas opções, promoções e novidades'}
                </p>

                <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100 mb-4">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="QR Code de Mesa"
                      className="w-44 h-44 object-contain"
                    />
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Rápido, fácil e sem aplicativo</span>
                </div>

                {config.wifiSSID && (
                  <div className="mt-3 text-[10px] text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    📶 <strong>Wi-Fi:</strong> {config.wifiSSID} |{' '}
                    <strong>Senha:</strong> {config.wifiPassword || 'Sem senha'}
                  </div>
                )}

                {!isPro && (
                  <div className="mt-4 pt-2 border-t border-slate-200 text-[8px] text-slate-400 font-mono">
                    Criado com SpotQR Grátis • spotqr.pro
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between no-print">
              <span>
                💡 Dica: Imprima em papel couchê 250g ou fotográfico para maior
                durabilidade.
              </span>
              <span>
                {!isPro ? 'Versão Grátis' : 'SpotQR PRO White-Label'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
