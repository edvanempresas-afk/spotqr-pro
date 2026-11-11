'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ImageUploadPreset } from '@/lib/image-upload';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  preset: ImageUploadPreset;
  title?: string;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
}

const VIEWPORT_DIMS: Record<
  ImageUploadPreset,
  { vpW: number; vpH: number; outW: number; outH: number; quality: number }
> = {
  product: { vpW: 272, vpH: 272, outW: 640, outH: 640, quality: 0.82 },
  logo: { vpW: 272, vpH: 272, outW: 360, outH: 360, quality: 0.86 },
  cover: { vpW: 336, vpH: 156, outW: 1200, outH: 560, quality: 0.8 },
};

export default function ImageCropModal({
  isOpen,
  imageSrc,
  preset,
  title,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const { vpW, vpH, outW, outH, quality } = VIEWPORT_DIMS[preset];

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({
    w: 1,
    h: 1,
  });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [exporting, setExporting] = useState(false);

  // Reset state when opening with a new image
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setExporting(false);
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const safeImageSrc =
    imageSrc.startsWith('http')
      ? `${imageSrc}${imageSrc.includes('?') ? '&' : '?'}crop=1`
      : imageSrc;

  // Effective rotated image dimensions
  const isQuarterTurn = rotation % 180 !== 0;
  const effW = isQuarterTurn ? naturalSize.h : naturalSize.w;
  const effH = isQuarterTurn ? naturalSize.w : naturalSize.h;

  // Base scale so zoom=1 fills the viewport edge-to-edge cleanly
  const coverScale = Math.max(vpW / effW, vpH / effH);
  const fitScale = Math.min(vpW / effW, vpH / effH);
  const minZoom = Math.max(0.35, Number((fitScale / coverScale).toFixed(2)));
  const currentScale = coverScale * zoom;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    if (el.naturalWidth && el.naturalHeight) {
      setNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    setOffset({
      x: dragStartRef.current.origX + dx,
      y: dragStartRef.current.origY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if not captured
      }
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirmCrop = () => {
    const img = imgRef.current;
    if (!img || !naturalSize.w || !naturalSize.h) return;
    setExporting(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (preset !== 'logo') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, outW, outH);
      }

      const outFactor = outW / vpW;
      const drawScale = currentScale * outFactor;

      ctx.save();
      ctx.translate(
        outW / 2 + offset.x * outFactor,
        outH / 2 + offset.y * outFactor
      );
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        img,
        (-naturalSize.w * drawScale) / 2,
        (-naturalSize.h * drawScale) / 2,
        naturalSize.w * drawScale,
        naturalSize.h * drawScale
      );
      ctx.restore();

      const mime = preset === 'logo' ? 'image/webp' : 'image/jpeg';
      const resultDataUrl = canvas.toDataURL(mime, quality);
      onConfirm(resultDataUrl);
    } catch {
      alert(
        'Este servidor externo bloqueou o recorte da imagem. Envie a foto do seu dispositivo usando "Enviar Foto".'
      );
    } finally {
      setExporting(false);
    }
  };

  const defaultTitle =
    preset === 'logo'
      ? 'Enquadrar Logo da Empresa'
      : preset === 'cover'
      ? 'Enquadrar Imagem de Fundo (Banner)'
      : 'Enquadrar Foto do Produto';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#101726] border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              {title || defaultTitle}
            </h3>
            <p className="text-[11px] text-slate-400">
              Arraste a foto para centralizar e use o zoom para o melhor enquadramento.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Framing Box */}
        <div className="flex flex-col items-center">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ width: vpW, height: vpH, touchAction: 'none' }}
            className={`relative overflow-hidden rounded-2xl border-2 border-emerald-500/80 shadow-glow select-none ${
              preset === 'logo' ? 'bg-slate-900' : 'bg-[#0b0f17]'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <img
              ref={imgRef}
              src={safeImageSrc}
              alt="Prévia do enquadramento"
              crossOrigin={imageSrc.startsWith('http') ? 'anonymous' : undefined}
              onLoad={handleImageLoad}
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: naturalSize.w,
                height: naturalSize.h,
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${currentScale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
              className="pointer-events-none select-none"
            />

            {/* Subtle Rule-of-Thirds Framing Guide */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-white/40" />
              <div className="border-r border-white/40" />
              <div />
            </div>

            <div className="absolute bottom-2 right-2 pointer-events-none px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-slate-200 flex items-center gap-1">
              <Move className="w-3 h-3 text-emerald-400" />
              <span>Arraste</span>
            </div>
          </div>
        </div>

        {/* Zoom & Tools */}
        <div className="space-y-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.max(minZoom, Number((z - 0.15).toFixed(2))))
              }
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={minZoom}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-emerald-500 cursor-pointer"
            />
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.min(3, Number((z + 0.15).toFixed(2))))
              }
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-emerald-400 w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition"
                title="Preencher todo o quadro"
              >
                <Maximize2 className="w-3 h-3 text-emerald-400" />
                <span>Preencher</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(minZoom);
                  setOffset({ x: 0, y: 0 });
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition"
                title="Mostrar a foto inteira sem cortar bordas"
              >
                <Minimize2 className="w-3 h-3 text-amber-400" />
                <span>Inteira</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRotate}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition"
            >
              <RotateCw className="w-3 h-3 text-emerald-400" />
              <span>Girar 90°</span>
            </button>
          </div>
        </div>

        {/* Confirm / Cancel Actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            disabled={exporting}
            className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition shadow-glow flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{exporting ? 'Aplicando...' : 'Aplicar Enquadramento'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
