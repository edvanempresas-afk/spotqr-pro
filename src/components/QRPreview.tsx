'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Download,
  Sparkles,
  Printer,
  Check,
  Copy,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { QRConfig } from '@/lib/types';
import {
  renderStyledQR,
  generateQRVectorSVG,
  evaluateQRContrast,
} from '@/lib/qr-canvas';
import TableTentModal from './TableTentModal';
import DownloadAdModal from './DownloadAdModal';
import AdBanner from './AdBanner';
import { useProPrice } from '@/lib/pro-price';
import { getDemoDataWarning } from '@/lib/qr-demo-check';

interface QRPreviewProps {
  config: QRConfig;
  targetContent: string;
  isPro?: boolean;
  onUpgradeToPro?: () => void;
  onEditContent?: () => void;
}

export default function QRPreview({
  config,
  targetContent,
  isPro = false,
  onUpgradeToPro,
  onEditContent,
}: QRPreviewProps) {
  const effectivePro = Boolean(isPro || config.isDynamic);
  const { proPriceLabel } = useProPrice();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [isTableTentOpen, setIsTableTentOpen] = useState(false);
  const [isDownloadAdOpen, setIsDownloadAdOpen] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<'png' | 'svg'>('png');
  const [pendingDemoAction, setPendingDemoAction] = useState<
    'png' | 'svg' | 'table_tent' | null
  >(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const demoWarning = useMemo(() => getDemoDataWarning(config), [config]);

  const contrastInfo = useMemo(
    () => evaluateQRContrast(config.fgColor, config.bgColor),
    [config.fgColor, config.bgColor]
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    renderStyledQR({
      config,
      targetContent,
      canvas: canvasRef.current,
      width: 1200,
      height: 1200,
      isPro: effectivePro,
    }).then(() => {
      if (canvasRef.current) {
        setDataUrl(canvasRef.current.toDataURL('image/png'));
      }
    });
  }, [config, targetContent, effectivePro]);

  // Actual download trigger
  const executeDownload = async (formatOverride?: 'png' | 'svg') => {
    const fmt = formatOverride || pendingFormat;
    if (fmt === 'svg') {
      const svgString = await generateQRVectorSVG(config, targetContent);
      const blob = new Blob([svgString], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spotqr-${config.type}-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `spotqr-${config.type}-${Date.now()}.png`;
    a.click();
  };

  const proceedConfirmedAction = (action: 'png' | 'svg' | 'table_tent') => {
    if (action === 'table_tent') {
      setIsTableTentOpen(true);
      return;
    }
    setPendingFormat(action);
    if (effectivePro) {
      executeDownload(action);
    } else {
      setIsDownloadAdOpen(true);
    }
  };

  // Click on Download button (guards against accidental download of demo data)
  const handleDownloadClick = (format: 'png' | 'svg' = 'png') => {
    if (demoWarning.isUsingDemoData) {
      setPendingDemoAction(format);
      return;
    }
    proceedConfirmedAction(format);
  };

  const handleOpenTableTent = () => {
    if (demoWarning.isUsingDemoData) {
      setPendingDemoAction('table_tent');
      return;
    }
    setIsTableTentOpen(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetContent);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden high-res canvas used for rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Realistic Presentation Card */}
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#141c2e] to-[#0d131f] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center">
        {/* Status Badge */}
        <div className="w-full flex items-center justify-between mb-4">
          {effectivePro ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              {config.isDynamic ? 'QR DINÂMICO PRO (SEM ADS)' : 'PRO ATIVO (LOGO & SEM ADS)'}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" />
              QR ESTÁTICO GRÁTIS
            </span>
          )}

          <button
            onClick={handleOpenTableTent}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 rounded-lg border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>{config.type === 'menu' ? 'Plaquinha Mesa' : 'Plaquinha Display'}</span>
          </button>
        </div>

        {/* QR Code Canvas Preview */}
        <div className="relative group p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner flex items-center justify-center">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="QR Code Personalizado"
              className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center text-slate-500">
              Gerando visual...
            </div>
          )}

          {/* Quick hover action */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
            <button
              onClick={() => handleDownloadClick('png')}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-emerald-400 transition"
              title="Baixar imagem PNG do QR Code"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PNG</span>
            </button>
            <button
              onClick={handleOpenTableTent}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-700 transition"
              title="Imprimir Plaquinha de Mesa"
            >
              <Printer className="w-4 h-4" />
              <span>Placa</span>
            </button>
          </div>
        </div>

        {/* Real-time Scannability / Optical Contrast Validator */}
        <div
          className={`w-full mt-3 px-3 py-2 rounded-xl border text-[11px] flex items-center gap-2 ${
            contrastInfo.status === 'excellent'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
              : contrastInfo.status === 'good'
              ? 'bg-blue-500/10 border-blue-500/25 text-blue-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}
        >
          {contrastInfo.status === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="leading-tight font-medium">
            {contrastInfo.label}
          </span>
        </div>

        {/* Reminder Banner when QR still points to Demo / Sample Data */}
        {demoWarning.isUsingDemoData && (
          <div className="w-full mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-left space-y-1.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-100 leading-relaxed">
                <p className="font-bold text-amber-300">
                  Atenção: QR ainda com dados de demonstração!
                </p>
                <p className="text-amber-200/90 mt-0.5">{demoWarning.reason}</p>
              </div>
            </div>
            {onEditContent && (
              <button
                type="button"
                onClick={onEditContent}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2"
              >
                ✏️ Alterar &quot;{demoWarning.fieldHint}&quot; antes de baixar →
              </button>
            )}
          </div>
        )}

        {/* Target URL Preview */}
        <div className="w-full mt-3 bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="truncate text-slate-400 mr-2">
            <strong className="text-slate-300">Destino: </strong>
            <span
              suppressHydrationWarning
              className="font-mono text-[11px] text-slate-400"
            >
              {targetContent}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyLink}
              className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Copiar Conteúdo / Link"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            {targetContent.startsWith('http') && (
              <a
                href={targetContent}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] transition"
                title="Abrir Link em Nova Aba"
              >
                <span>Abrir</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Primary Download Buttons */}
        <div className="w-full mt-4 space-y-2">
          <button
            type="button"
            onClick={() => handleDownloadClick('png')}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-glow transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>
              {effectivePro
                ? 'Baixar PNG 1200px Instantâneo (PRO)'
                : config.type === 'catalog'
                ? 'Baixar QR do Catálogo (PNG Grátis)'
                : config.type === 'menu'
                ? 'Baixar QR do Cardápio (PNG Grátis)'
                : 'Baixar PNG Alta Definição (Grátis)'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDownloadClick('svg')}
              className="py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vetor SVG</span>
            </button>

            <button
              type="button"
              onClick={handleOpenTableTent}
              className="py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Placa de Mesa</span>
            </button>
          </div>
        </div>

        {/* Upsell Banner if not PRO */}
        {!effectivePro && onUpgradeToPro && (
          <div className="w-full mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30 text-left">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-white mb-0.5">
                  Quer colocar sua Logo no Centro + QR Dinâmico?
                </h5>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                  Na versão grátis o QR é estático e sem logo central. Com o{' '}
                  <strong className="text-amber-300">
                    Plano PRO ({proPriceLabel})
                  </strong>
                  , você insere sua logomarca ou imagem no centro e altera o link
                  de destino quando quiser sem reimprimir.
                </p>
                <button
                  onClick={onUpgradeToPro}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 flex items-center gap-1"
                >
                  <span>Desbloquear Logo no Centro + PRO ({proPriceLabel})</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STRATEGIC RECTANGLE AD BANNER BELOW PREVIEW (FOR FREE USERS) */}
      {!effectivePro && (
        <AdBanner
          format="rectangle"
          isPro={effectivePro}
          onUpgradeClick={onUpgradeToPro}
          className="mt-5"
        />
      )}

      {/* Interstitial Download Ad Modal (5s wait for free users) */}
      <DownloadAdModal
        isOpen={isDownloadAdOpen}
        onClose={() => setIsDownloadAdOpen(false)}
        onDownloadConfirmed={() => executeDownload()}
        onUpgradeToPro={onUpgradeToPro || (() => {})}
      />

      {/* Modal for restaurant table tent */}
      <TableTentModal
        isOpen={isTableTentOpen}
        onClose={() => setIsTableTentOpen(false)}
        qrDataUrl={dataUrl}
        config={config}
        isPro={effectivePro}
        onUpgradeToPro={onUpgradeToPro}
      />

      {/* Pre-download / Pre-print Demo Data Warning Modal */}
      {pendingDemoAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111827] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-white">
                  Confira o endereço antes de baixar!
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {demoWarning.reason} Se você baixar ou imprimir agora, seus clientes serão direcionados para o exemplo da plataforma em vez da sua loja.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 break-all">
              <strong className="text-slate-300 block mb-0.5">Destino atual no QR:</strong>
              <span className="font-mono text-amber-300">{targetContent}</span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPendingDemoAction(null);
                  onEditContent?.();
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-glow transition"
              >
                ✏️ Alterar Informações Agora ({demoWarning.fieldHint})
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = pendingDemoAction;
                  setPendingDemoAction(null);
                  if (action) proceedConfirmedAction(action);
                }}
                className="w-full py-2 px-3 rounded-xl font-semibold text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition"
              >
                Baixar mesmo assim (somente para teste)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
