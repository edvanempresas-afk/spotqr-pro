'use client';

import React, { useEffect, useRef } from 'react';
import { LED_PALETTE, LedBulb } from './ChristmasCardDecor';

export { ChristmasFooterScene } from './ChristmasFooterScene';

interface ChristmasPageSkinProps {
  /**
   * 'page': aplica em toda a página pública (neve real em tela inteira até o rodapé, guirlandas curvas nos cantos e laterais fixas completas).
   * 'preview': versão reduzida para a caixa de prévia ao vivo dentro do Editor Visual.
   */
  variant?: 'page' | 'preview';
  /** Ajusta o contraste suave da neve para vitrines em modo claro ou escuro. */
  isLight?: boolean;
}

type Point2D = [number, number];

// Catenária real com gravidade ligando a lateral esquerda (2,114) ao topo (218,4):
// o ponto de controle baixo e deslocado (72,174) cria barriga natural pela gravidade antes de subir ao teto.
const LEFT_P0: Point2D = [2, 114];
const LEFT_P1: Point2D = [72, 174];
const LEFT_P2: Point2D = [218, 4];

// Espelho simétrico para o canto superior direito.
const RIGHT_P0: Point2D = [218, 114];
const RIGHT_P1: Point2D = [148, 174];
const RIGHT_P2: Point2D = [2, 4];

const BULB_T_STOPS = [0.14, 0.3, 0.46, 0.64, 0.82];

interface PreviewSnowSpec {
  leftPct: number;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  isStarFlake?: boolean;
}

const PREVIEW_SNOW_FLAKES: PreviewSnowSpec[] = [
  { leftPct: 6, sizePx: 3.5, durationSec: 4.8, delaySec: -1.1 },
  { leftPct: 16, sizePx: 5.5, durationSec: 6.1, delaySec: -3.2, isStarFlake: true },
  { leftPct: 28, sizePx: 3.5, durationSec: 5.0, delaySec: -2.0 },
  { leftPct: 39, sizePx: 5, durationSec: 6.4, delaySec: -4.1 },
  { leftPct: 51, sizePx: 6, durationSec: 5.4, delaySec: -0.6, isStarFlake: true },
  { leftPct: 62, sizePx: 3.5, durationSec: 5.9, delaySec: -2.9 },
  { leftPct: 74, sizePx: 5.5, durationSec: 4.9, delaySec: -1.7, isStarFlake: true },
  { leftPct: 86, sizePx: 4, durationSec: 6.0, delaySec: -3.6 },
  { leftPct: 94, sizePx: 4.5, durationSec: 5.2, delaySec: -0.9 },
];

function evalQuad(t: number, p0: Point2D, p1: Point2D, p2: Point2D) {
  const u = 1 - t;
  return {
    x: u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    y: u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  };
}

function evalQuadNormal(t: number, p0: Point2D, p1: Point2D, p2: Point2D) {
  const tx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const ty = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  const len = Math.hypot(tx, ty) || 1;
  return { nx: -ty / len, ny: tx / len };
}

/** Constrói fita natalina enrolando suavemente ao redor da catenária (zero zigue-zague duro). */
function buildSmoothRibbonPath(p0: Point2D, p1: Point2D, p2: Point2D): string {
  const samples = 28;
  const pts: Point2D[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pos = evalQuad(t, p0, p1, p2);
    const norm = evalQuadNormal(t, p0, p1, p2);
    const envelope = Math.sin(Math.PI * t);
    const spiral = Math.sin(t * Math.PI * 7) * 4.2 * envelope;
    pts.push([pos.x + norm.nx * spiral, pos.y + norm.ny * spiral]);
  }

  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = ((pts[i][0] + pts[i + 1][0]) / 2).toFixed(1);
    const my = ((pts[i][1] + pts[i + 1][1]) / 2).toFixed(1);
    d += ` Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}, ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
  return d;
}

const LEFT_RIBBON_PATH = buildSmoothRibbonPath(LEFT_P0, LEFT_P1, LEFT_P2);
const RIGHT_RIBBON_PATH = buildSmoothRibbonPath(RIGHT_P0, RIGHT_P1, RIGHT_P2);

interface CanvasSnowflake {
  x: number;
  y: number;
  depth: 0 | 1 | 2;
  radius: number;
  vy: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  opacity: number;
  isCrystal: boolean;
  angle: number;
  spin: number;
}

function createSnowflake(
  width: number,
  height: number,
  spawnAtTop: boolean
): CanvasSnowflake {
  const roll = Math.random();
  const depth: 0 | 1 | 2 = roll < 0.44 ? 0 : roll < 0.84 ? 1 : 2;
  const isCrystal = depth >= 1 && Math.random() < (depth === 2 ? 0.34 : 0.16);

  const radius =
    depth === 0
      ? 1.1 + Math.random() * 1.1
      : depth === 1
      ? isCrystal
        ? 3.8 + Math.random() * 2.2
        : 2.0 + Math.random() * 1.5
      : isCrystal
      ? 5.2 + Math.random() * 2.8
      : 3.4 + Math.random() * 2.2;

  const vy =
    depth === 0
      ? 24 + Math.random() * 18
      : depth === 1
      ? 42 + Math.random() * 26
      : 66 + Math.random() * 34;

  return {
    x: Math.random() * (width + 40) - 20,
    y: spawnAtTop ? -12 - Math.random() * 40 : Math.random() * (height + 24) - 12,
    depth,
    radius,
    vy,
    swayAmp: (depth + 1) * (8 + Math.random() * 12),
    swayFreq: 0.45 + Math.random() * 0.75,
    phase: Math.random() * Math.PI * 2,
    opacity:
      depth === 0
        ? 0.28 + Math.random() * 0.22
        : depth === 1
        ? 0.55 + Math.random() * 0.28
        : 0.68 + Math.random() * 0.26,
    isCrystal,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.9,
  };
}

function drawCrystalFlake(
  ctx: CanvasRenderingContext2D,
  flake: CanvasSnowflake,
  isLight: boolean
) {
  ctx.save();
  ctx.translate(flake.x, flake.y);
  ctx.rotate(flake.angle);
  ctx.globalAlpha = flake.opacity;
  ctx.strokeStyle = isLight ? 'rgba(59, 130, 246, 0.72)' : '#ffffff';
  ctx.lineWidth = flake.depth === 2 ? 1.25 : 1;
  ctx.lineCap = 'round';
  if (!isLight) {
    ctx.shadowColor = 'rgba(224, 242, 254, 0.85)';
    ctx.shadowBlur = flake.depth === 2 ? 6 : 3;
  }

  const r = flake.radius;
  const branchR = r * 0.55;
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -r);
    ctx.moveTo(0, -branchR);
    ctx.lineTo(-r * 0.26, -r * 0.78);
    ctx.moveTo(0, -branchR);
    ctx.lineTo(r * 0.26, -r * 0.78);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSoftFlake(
  ctx: CanvasRenderingContext2D,
  flake: CanvasSnowflake,
  isLight: boolean
) {
  const outer = flake.radius * 1.9;
  const grad = ctx.createRadialGradient(
    flake.x,
    flake.y,
    flake.radius * 0.15,
    flake.x,
    flake.y,
    outer
  );

  if (isLight) {
    grad.addColorStop(0, `rgba(255, 255, 255, ${flake.opacity.toFixed(2)})`);
    grad.addColorStop(
      0.55,
      `rgba(147, 197, 253, ${(flake.opacity * 0.65).toFixed(2)})`
    );
    grad.addColorStop(1, 'rgba(147, 197, 253, 0)');
  } else {
    grad.addColorStop(0, `rgba(255, 255, 255, ${flake.opacity.toFixed(2)})`);
    grad.addColorStop(
      0.55,
      `rgba(224, 242, 254, ${(flake.opacity * 0.45).toFixed(2)})`
    );
    grad.addColorStop(1, 'rgba(224, 242, 254, 0)');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(flake.x, flake.y, outer, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Motor de Neve 60fps em Tela Inteira (Canvas HiDPI):
 * Cai suavemente do topo até o último pixel inferior da página em 3 planos de profundidade,
 * com turbulência natural de vento e reação sutil ao scroll sem bloquear cliques.
 */
function ChristmasPageSnowCanvas({ isLight }: { isLight: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLightRef = useRef(isLight);
  isLightRef.current = isLight;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const targetCount = width < 640 ? 48 : width < 1024 ? 68 : 92;
    const flakes: CanvasSnowflake[] = Array.from({ length: targetCount }, () =>
      createSnowflake(width, height, false)
    );

    if (reduceMotion) {
      ctx.clearRect(0, 0, width, height);
      for (const f of flakes.slice(0, 32)) {
        if (f.isCrystal) drawCrystalFlake(ctx, f, isLightRef.current);
        else drawSoftFlake(ctx, f, isLightRef.current);
      }
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    const handleScroll = () => {
      const nextY = window.scrollY;
      const dy = nextY - lastScrollY;
      lastScrollY = nextY;
      scrollVelocity = Math.max(-24, Math.min(24, scrollVelocity + dy * 0.08));
    };

    let rafId = 0;
    let lastTs = performance.now();
    let elapsed = 0;

    const renderFrame = (ts: number) => {
      const dt = Math.min(0.05, Math.max(0.004, (ts - lastTs) / 1000));
      lastTs = ts;
      elapsed += dt;

      if (!document.hidden) {
        ctx.clearRect(0, 0, width, height);
        const windGust = Math.sin(elapsed * 0.35) * 9 + Math.cos(elapsed * 0.85) * 4;
        scrollVelocity *= 0.9;

        for (let i = 0; i < flakes.length; i++) {
          const f = flakes[i];
          const sway = Math.sin(elapsed * f.swayFreq + f.phase) * f.swayAmp;
          f.y += f.vy * dt - scrollVelocity * (f.depth + 1) * 0.12;
          f.x += (windGust * (0.4 + f.depth * 0.35) + sway * 0.45) * dt;
          f.angle += f.spin * dt;

          if (f.y > height + 24) {
            flakes[i] = createSnowflake(width, height, true);
            continue;
          }
          if (f.y < -60) {
            f.y = height + 16;
          }
          if (f.x > width + 24) f.x = -20;
          else if (f.x < -24) f.x = width + 20;

          if (f.isCrystal) {
            drawCrystalFlake(ctx, f, isLightRef.current);
          } else {
            drawSoftFlake(ctx, f, isLightRef.current);
          }
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-[18]"
    />
  );
}

/** Lâmpada pendurada sempre na vertical (seguindo a gravidade) a partir do ponto exato do fio curvo. */
function GravityCornerBulb({
  x,
  y,
  paletteIdx,
  keyPrefix,
}: {
  x: number;
  y: number;
  paletteIdx: number;
  keyPrefix: string;
}) {
  const color = LED_PALETTE[paletteIdx % LED_PALETTE.length];
  const animClass = paletteIdx % 2 === 0 ? 'natal-led-odd' : 'natal-led-even';

  return (
    <g key={keyPrefix} transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}>
      {/* Soquete preso diretamente na guirlanda */}
      <rect
        x="-3"
        y="-1"
        width="6"
        height="5"
        rx="1.2"
        fill="#064e3b"
        stroke="#10b981"
        strokeWidth="0.9"
      />
      {/* Bulbo apontado sempre verticalmente para baixo pela gravidade */}
      <g className={animClass}>
        <circle cx="0" cy="11.5" r="10.5" fill={color.glow} opacity="0.34" />
        <path
          d="M-3.7 4.2 C-3.9 11.8 -2.3 16.5 0 16.5 C2.3 16.5 3.9 11.8 3.7 4.2 Z"
          fill={color.fill}
        />
        <ellipse cx="-1.1" cy="8.5" rx="0.9" ry="2.2" fill="#ffffff" opacity="0.5" />
      </g>
    </g>
  );
}

/**
 * Skin Natalina para toda a página da loja (Free e PRO):
 * - Neve real contínua em tela inteira do topo até o rodapé da página;
 * - Fio superior e guirlandas curvas pela gravidade nos dois cantos superiores;
 * - Laterais luminosas fixas de cima a baixo.
 */
export function ChristmasPageSkin({
  variant = 'page',
  isLight = false,
}: ChristmasPageSkinProps) {
  const isPreview = variant === 'preview';
  const topBulbCount = isPreview ? 10 : 18;
  const sideBulbCount = isPreview ? 3 : 12;

  const sidePositionClass = isPreview
    ? 'absolute top-0 bottom-0'
    : 'fixed top-0 bottom-0';

  const leftBellAnchor = evalQuad(0.42, LEFT_P0, LEFT_P1, LEFT_P2);
  const rightStockingAnchor = evalQuad(0.42, RIGHT_P0, RIGHT_P1, RIGHT_P2);

  return (
    <>
      {/* Neve contínua em toda a tela até o fim da página */}
      {!isPreview && <ChristmasPageSnowCanvas isLight={isLight} />}

      {/* TOPO HORIZONTAL + GUIRLANDAS CURVAS PELA GRAVIDADE NOS CANTOS SUPERIORES */}
      <div
        aria-hidden="true"
        className={`pointer-events-none select-none top-0 inset-x-0 ${
          isPreview
            ? 'absolute z-20 h-full overflow-hidden'
            : 'absolute z-[16] h-44 sm:h-56 overflow-visible'
        }`}
      >
        {/* Neve localizada apenas dentro da caixa de prévia do editor */}
        {isPreview && (
          <div className="absolute inset-0 overflow-hidden">
            {PREVIEW_SNOW_FLAKES.map((flake, idx) => (
              <span
                key={`preview-snow-${idx}`}
                className="natal-snow-flake absolute top-0 text-white"
                style={{
                  left: `${flake.leftPct}%`,
                  animationDuration: `${flake.durationSec}s`,
                  animationDelay: `${flake.delaySec}s`,
                }}
              >
                {flake.isStarFlake ? (
                  <svg
                    viewBox="0 0 16 16"
                    width={flake.sizePx + 4}
                    height={flake.sizePx + 4}
                    className="opacity-90 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                  >
                    <path
                      d="M8 1 V15 M2 4.5 L14 11.5 M14 4.5 L2 11.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <span
                    className="block rounded-full bg-white/85"
                    style={{
                      width: `${flake.sizePx}px`,
                      height: `${flake.sizePx}px`,
                      boxShadow: '0 0 6px rgba(255,255,255,0.85)',
                    }}
                  />
                )}
              </span>
            ))}
          </div>
        )}

        {/* Fio superior contínuo em verde-pinheiro com brilho natalino */}
        <div
          className="absolute top-0 inset-x-0 h-[3px]"
          style={{
            background:
              'linear-gradient(90deg, rgba(21,128,61,0.95), rgba(34,197,94,0.9), rgba(220,38,38,0.85), rgba(250,204,21,0.9), rgba(21,128,61,0.95))',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.55)',
          }}
        />

        {/* Lâmpadas LED ao longo de todo o topo */}
        <div
          className={`absolute top-[1px] flex items-start justify-between ${
            isPreview ? 'inset-x-6' : 'inset-x-10 sm:inset-x-28 md:inset-x-36'
          }`}
        >
          {Array.from({ length: topBulbCount }).map((_, idx) => (
            <div
              key={`page-top-${idx}`}
              className={!isPreview && idx % 3 === 1 ? 'hidden sm:flex' : 'flex'}
            >
              <LedBulb idx={idx} edge="top" />
            </div>
          ))}
        </div>

        {/* Canto Superior Esquerdo: Guirlanda curva pela gravidade + Lâmpadas verticais + Sinos */}
        <svg
          viewBox="0 0 225 162"
          className={`absolute top-0 left-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)] ${
            isPreview
              ? 'w-24 h-[70px]'
              : 'w-36 h-[102px] sm:w-52 sm:h-36 md:w-64 md:h-44'
          }`}
        >
          {/* Fio e ramo de pinheiro curvo com caimento orgânico (catenária) */}
          <path
            d={`M ${LEFT_P0[0]} ${LEFT_P0[1]} Q ${LEFT_P1[0]} ${LEFT_P1[1]} ${LEFT_P2[0]} ${LEFT_P2[1]}`}
            stroke="#14532d"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${LEFT_P0[0]} ${LEFT_P0[1]} Q ${LEFT_P1[0]} ${LEFT_P1[1]} ${LEFT_P2[0]} ${LEFT_P2[1]}`}
            stroke="#16a34a"
            strokeWidth="5.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Fita de cetim vermelha enrolada em curva suave (sem serrilhado) */}
          <path
            d={LEFT_RIBBON_PATH}
            stroke="#dc2626"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.94"
          />
          {/* LEDs pendurados na vertical pela gravidade */}
          {BULB_T_STOPS.map((t, idx) => {
            const pt = evalQuad(t, LEFT_P0, LEFT_P1, LEFT_P2);
            return (
              <GravityCornerBulb
                key={`gl-${idx}`}
                x={pt.x}
                y={pt.y}
                paletteIdx={idx}
                keyPrefix={`gl-${idx}`}
              />
            );
          })}
          {/* Sinos Dourados + Laço pendurados no arco */}
          <g
            transform={`translate(${(leftBellAnchor.x - 24).toFixed(1)}, ${(
              leftBellAnchor.y - 8
            ).toFixed(1)}) scale(0.82)`}
            className="natal-ornament-sway"
          >
            <g transform="rotate(-14 22 24)">
              <path
                d="M14 20 C14 14 26 14 26 20 L29 35 L11 35 Z"
                fill="#facc15"
                stroke="#ca8a04"
                strokeWidth="1.5"
              />
              <circle cx="20" cy="37" r="3" fill="#dc2626" />
            </g>
            <g transform="rotate(14 40 24)">
              <path
                d="M34 20 C34 14 46 14 46 20 L49 35 L31 35 Z"
                fill="#fde047"
                stroke="#ca8a04"
                strokeWidth="1.5"
              />
              <circle cx="40" cy="37" r="3" fill="#dc2626" />
            </g>
            <ellipse
              cx="22"
              cy="14"
              rx="7"
              ry="4"
              transform="rotate(-20 22 14)"
              fill="#ef4444"
              stroke="#991b1b"
              strokeWidth="1.2"
            />
            <ellipse
              cx="38"
              cy="14"
              rx="7"
              ry="4"
              transform="rotate(20 38 14)"
              fill="#ef4444"
              stroke="#991b1b"
              strokeWidth="1.2"
            />
            <circle
              cx="30"
              cy="14"
              r="3.8"
              fill="#dc2626"
              stroke="#991b1b"
              strokeWidth="1.2"
            />
          </g>
        </svg>

        {/* Canto Superior Direito: Guirlanda curva pela gravidade + Lâmpadas verticais + Meia */}
        <svg
          viewBox="0 0 225 162"
          className={`absolute top-0 right-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)] ${
            isPreview
              ? 'w-24 h-[70px]'
              : 'w-36 h-[102px] sm:w-52 sm:h-36 md:w-64 md:h-44'
          }`}
        >
          <path
            d={`M ${RIGHT_P0[0]} ${RIGHT_P0[1]} Q ${RIGHT_P1[0]} ${RIGHT_P1[1]} ${RIGHT_P2[0]} ${RIGHT_P2[1]}`}
            stroke="#14532d"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${RIGHT_P0[0]} ${RIGHT_P0[1]} Q ${RIGHT_P1[0]} ${RIGHT_P1[1]} ${RIGHT_P2[0]} ${RIGHT_P2[1]}`}
            stroke="#16a34a"
            strokeWidth="5.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Fita dourada suave */}
          <path
            d={RIGHT_RIBBON_PATH}
            stroke="#facc15"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.92"
          />
          {BULB_T_STOPS.map((t, idx) => {
            const pt = evalQuad(t, RIGHT_P0, RIGHT_P1, RIGHT_P2);
            return (
              <GravityCornerBulb
                key={`gr-${idx}`}
                x={pt.x}
                y={pt.y}
                paletteIdx={idx + 2}
                keyPrefix={`gr-${idx}`}
              />
            );
          })}
          {/* Meia Natalina pendurada diretamente no fio curvo */}
          <g
            transform={`translate(${(rightStockingAnchor.x - 28).toFixed(1)}, ${(
              rightStockingAnchor.y - 6
            ).toFixed(1)}) scale(0.8)`}
            className="natal-ornament-sway"
          >
            <circle cx="35" cy="6" r="3.2" fill="none" stroke="#facc15" strokeWidth="2.2" />
            <path
              d="M24 14 L42 14 L42 35 C42 40 46 43 50 45 C54 47 54 55 46 56 L29 56 C22 56 20 50 23 44 L24 38 Z"
              fill="#dc2626"
              stroke="#7f1d1d"
              strokeWidth="1.6"
            />
            <path
              d="M46 44 C53 46 53 54 45 55 L42 55 C42 50 43 47 46 44 Z"
              fill="#facc15"
            />
            <rect x="24" y="25" width="18" height="4" fill="#16a34a" />
            <rect
              x="21"
              y="10"
              width="24"
              height="8"
              rx="4"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="1.2"
            />
          </g>
        </svg>
      </div>

      {/* LATERAL ESQUERDA VERTICAL COMPLETA */}
      <div
        aria-hidden="true"
        className={`pointer-events-none select-none left-0 z-[15] flex flex-col justify-between items-start ${sidePositionClass} ${
          isPreview ? 'py-5' : 'py-20 sm:py-24'
        }`}
      >
        <div
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(21,128,61,0.95), rgba(34,197,94,0.85), rgba(220,38,38,0.8), rgba(21,128,61,0.95))',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.45)',
          }}
        />
        {Array.from({ length: sideBulbCount }).map((_, idx) => (
          <div
            key={`page-left-${idx}`}
            className="relative z-10 origin-left scale-75 sm:scale-100"
          >
            <LedBulb idx={idx + 1} edge="right" />
          </div>
        ))}
      </div>

      {/* LATERAL DIREITA VERTICAL COMPLETA */}
      <div
        aria-hidden="true"
        className={`pointer-events-none select-none right-0 z-[15] flex flex-col justify-between items-end ${sidePositionClass} ${
          isPreview ? 'py-5' : 'py-20 sm:py-24'
        }`}
      >
        <div
          className="absolute inset-y-0 right-0 w-[3px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(21,128,61,0.95), rgba(220,38,38,0.8), rgba(34,197,94,0.85), rgba(21,128,61,0.95))',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.45)',
          }}
        />
        {Array.from({ length: sideBulbCount }).map((_, idx) => (
          <div
            key={`page-right-${idx}`}
            className="relative z-10 origin-right scale-75 sm:scale-100"
          >
            <LedBulb idx={idx + 3} edge="left" />
          </div>
        ))}
      </div>
    </>
  );
}
