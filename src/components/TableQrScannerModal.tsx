'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Camera,
  QrCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import jsQR from 'jsqr';

interface TableQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableDetected: (formattedTable: string) => void;
  isLight?: boolean;
  accentHex?: string;
  accentTextOnSolid?: string;
}

interface ParsedQrResult {
  table: string | null;
  reason?: string;
}

function formatMesaLabel(rawTableValue: string): string {
  const clean = rawTableValue.trim();
  if (!clean) return '';
  if (/^mesa\b/i.test(clean)) {
    const rest = clean.replace(/^mesa[\s\-:#]*/i, '').trim();
    return rest ? `Mesa ${rest}` : clean;
  }
  return `Mesa ${clean}`;
}

export function extractTableFromQrPayload(rawPayload: string): ParsedQrResult {
  const raw = String(rawPayload || '').trim();
  if (!raw) {
    return { table: null, reason: 'QR Code vazio ou ilegível.' };
  }

  // 1. URLs (such as https://spotqr.com.br/cardapio/restaurante?mesa=04)
  if (/^https?:\/\//i.test(raw) || raw.includes('?') || raw.includes('&')) {
    try {
      const parsedUrl = new URL(
        /^https?:\/\//i.test(raw) ? raw : `https://dummy.local/${raw.replace(/^\/+/, '')}`
      );
      const paramValue =
        parsedUrl.searchParams.get('mesa') ||
        parsedUrl.searchParams.get('table') ||
        parsedUrl.searchParams.get('m') ||
        parsedUrl.searchParams.get('numero');

      if (paramValue && paramValue.trim()) {
        return { table: formatMesaLabel(paramValue) };
      }
    } catch {
      // Fallback regex extraction below
    }

    const queryMatch = raw.match(/[?&#](?:mesa|table|m|numero)=([^&#]+)/i);
    if (queryMatch && queryMatch[1]) {
      const decoded = decodeURIComponent(queryMatch[1]).trim();
      if (decoded) {
        return { table: formatMesaLabel(decoded) };
      }
    }

    return {
      table: null,
      reason:
        'Este QR Code é do cardápio geral (sem número de mesa vinculado). Aponte para a plaquinha com o número da mesa ou digite manualmente.',
    };
  }

  // 2. Plain text labels ("Mesa 04", "04", "A2", etc.)
  const mesaTextMatch = raw.match(/^mesa[\s\-:#_]*([a-z0-9]{1,8})$/i);
  if (mesaTextMatch && mesaTextMatch[1]) {
    return { table: `Mesa ${mesaTextMatch[1].trim()}` };
  }

  if (/^[0-9]{1,4}[a-z]{0,2}$/i.test(raw)) {
    return { table: `Mesa ${raw}` };
  }

  if (raw.length <= 20 && !/\s{2,}/.test(raw)) {
    return { table: formatMesaLabel(raw) };
  }

  return {
    table: null,
    reason:
      'QR Code reconhecido não possui um número de mesa válido. Digite sua mesa manualmente.',
  };
}

export default function TableQrScannerModal({
  isOpen,
  onClose,
  onTableDetected,
  isLight = false,
  accentHex = '#10b981',
  accentTextOnSolid = '#0f172a',
}: TableQrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraStatus, setCameraStatus] = useState<
    'initializing' | 'scanning' | 'error' | 'detected'
  >('initializing');
  const [statusMessage, setStatusMessage] = useState<string>(
    'Iniciando câmera para ler o QR Code da mesa...'
  );
  const [detectedTable, setDetectedTable] = useState<string>('');

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore cleanup errors
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleDecodedPayload = useCallback(
    (payload: string) => {
      const parsed = extractTableFromQrPayload(payload);
      if (parsed.table) {
        stopCameraStream();
        setDetectedTable(parsed.table);
        setCameraStatus('detected');
        setStatusMessage(`✅ ${parsed.table} identificada com sucesso!`);
        setTimeout(() => {
          onTableDetected(parsed.table!);
        }, 550);
        return true;
      }
      if (parsed.reason) {
        setStatusMessage(parsed.reason);
      }
      return false;
    },
    [onTableDetected, stopCameraStream]
  );

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let lastScanAt = 0;

    setDetectedTable('');
    setCameraStatus('initializing');
    setStatusMessage('Solicitando acesso à câmera...');

    const startCamera = async () => {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        if (!cancelled) {
          setCameraStatus('error');
          setStatusMessage(
            'Seu navegador não liberou a câmera ao vivo (requer HTTPS ou permissão). Use o botão de foto abaixo ou digite sua mesa manualmente.'
          );
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play().catch(() => {});
        }

        if (!cancelled) {
          setCameraStatus('scanning');
          setStatusMessage('Aponte a câmera para o QR Code da sua mesa');
        }

        // Optional native BarcodeDetector on Chromium mobile/desktop
        type NativeBarcodeDetector = {
          detect: (src: CanvasImageSource) => Promise<{ rawValue?: string }[]>;
        };
        const BarcodeDetectorCtor = (
          window as unknown as {
            BarcodeDetector?: new (opts: { formats: string[] }) => NativeBarcodeDetector;
          }
        ).BarcodeDetector;
        const nativeDetector = BarcodeDetectorCtor
          ? new BarcodeDetectorCtor({ formats: ['qr_code'] })
          : null;

        const scanFrame = async (now: number) => {
          if (cancelled) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (
            video &&
            canvas &&
            video.readyState === video.HAVE_ENOUGH_DATA &&
            now - lastScanAt >= 180
          ) {
            lastScanAt = now;
            const w = video.videoWidth || 640;
            const h = video.videoHeight || 480;
            if (w > 0 && h > 0) {
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, w, h);

                let decodedText: string | null = null;
                if (nativeDetector) {
                  try {
                    const barcodes = await nativeDetector.detect(canvas);
                    if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                      decodedText = barcodes[0].rawValue;
                    }
                  } catch {
                    // Fallback to jsQR
                  }
                }

                if (!decodedText) {
                  const imgData = ctx.getImageData(0, 0, w, h);
                  const qrResult = jsQR(imgData.data, w, h, {
                    inversionAttempts: 'attemptBoth',
                  });
                  if (qrResult?.data) {
                    decodedText = qrResult.data;
                  }
                }

                if (decodedText) {
                  const found = handleDecodedPayload(decodedText);
                  if (found) return;
                }
              }
            }
          }

          rafId = requestAnimationFrame(scanFrame);
        };

        rafId = requestAnimationFrame(scanFrame);
      } catch (err) {
        if (cancelled) return;
        console.warn('Camera permission or device error:', err);
        setCameraStatus('error');
        setStatusMessage(
          'Não foi possível acessar a câmera ao vivo. Você pode tirar uma foto do QR Code abaixo ou digitar o número da mesa.'
        );
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      stopCameraStream();
    };
  }, [isOpen, stopCameraStream, handleDecodedPayload]);

  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrResult = jsQR(imgData.data, canvas.width, canvas.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (qrResult?.data) {
          handleDecodedPayload(qrResult.data);
        } else {
          setStatusMessage(
            'Não conseguimos identificar um QR Code nítido na foto. Tente aproximar ou digite sua mesa manualmente.'
          );
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div
        className={`relative w-full max-w-md border rounded-3xl p-5 shadow-2xl flex flex-col gap-4 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#121929] border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: accentHex, color: accentTextOnSolid }}
            >
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">Ler QR Code da Mesa</h3>
              <p
                className={`text-[11px] ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Preenchimento automático (opcional)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className={`p-1.5 rounded-xl transition ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative w-full aspect-square max-h-[290px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
          <video
            ref={videoRef}
            muted
            playsInline
            className={`w-full h-full object-cover ${
              cameraStatus === 'error' ? 'hidden' : 'block'
            }`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {cameraStatus === 'initializing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300 bg-slate-950/80 p-4 text-center">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
              <span className="text-xs font-semibold">Abrindo câmera...</span>
            </div>
          )}

          {cameraStatus === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)] relative">
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />
              </div>
            </div>
          )}

          {cameraStatus === 'detected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-emerald-950/90 text-white p-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <span className="text-base font-black">{detectedTable}</span>
              <span className="text-xs text-emerald-200">
                Mesa preenchida no pedido!
              </span>
            </div>
          )}

          {cameraStatus === 'error' && (
            <div className="flex flex-col items-center justify-center gap-2 p-5 text-center text-slate-300">
              <Camera className="w-9 h-9 text-slate-500" />
              <span className="text-xs font-bold text-white">
                Câmera indisponível neste modo
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Use o botão abaixo para fotografar o QR Code da mesa ou feche para digitar o número manualmente.
              </p>
            </div>
          )}
        </div>

        {/* Status Message */}
        <div
          className={`flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl border ${
            cameraStatus === 'detected'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : cameraStatus === 'error'
              ? isLight
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>

        {/* Actions: Upload Photo fallback + Cancel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageFileSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Foto / Imagem do QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <span>Digitar Mesa Manualmente</span>
          </button>
        </div>
      </div>
    </div>
  );
}
