'use client';

import React from 'react';
import { LED_PALETTE, LedBulb } from './ChristmasCardDecor';

interface ChristmasPageSkinProps {
  /**
   * 'page': aplica em toda a página pública (topo, guirlandas curvas nos cantos e laterais fixas completas).
   * 'preview': versão reduzida para a caixa de prévia ao vivo dentro do Editor Visual.
   */
  variant?: 'page' | 'preview';
}

type Point2D = [number, number];

// Guirlanda do canto superior ESQUERDO:
// Sai do canto esq. do topo (0,0), cai em arco pela gravidade (catenária), termina
// na borda sup. direita do SVG (220,0). Ponto de controle bem abaixo = queda real.
const LEFT_P0: Point2D = [0, 2];
const LEFT_P1: Point2D = [110, 148];
const LEFT_P2: Point2D = [220, 2];

// Guirlanda do canto superior DIREITO (espelho):
// Sai do canto dir. do topo (220,0), cai em arco, termina na borda sup. esq. (0,0).
const RIGHT_P0: Point2D = [220, 2];
const RIGHT_P1: Point2D = [110, 148];
const RIGHT_P2: Point2D = [0, 2];

const BULB_T_STOPS = [0.14, 0.28, 0.42, 0.57, 0.72, 0.86];

interface SnowFlakeSpec {
  leftPct: number;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  isStarFlake?: boolean;
}

const TOP_SNOW_FLAKES: SnowFlakeSpec[] = [
  { leftPct: 4, sizePx: 4, durationSec: 5.2, delaySec: -1.1 },
  { leftPct: 9, sizePx: 6, durationSec: 6.8, delaySec: -4.2, isStarFlake: true },
  { leftPct: 14, sizePx: 3.5, durationSec: 4.9, delaySec: -2.4 },
  { leftPct: 19, sizePx: 5, durationSec: 7.1, delaySec: -5.3 },
  { leftPct: 24, sizePx: 7, durationSec: 6.2, delaySec: -0.7, isStarFlake: true },
  { leftPct: 29, sizePx: 4, durationSec: 5.6, delaySec: -3.6 },
  { leftPct: 35, sizePx: 5.5, durationSec: 7.4, delaySec: -1.9 },
  { leftPct: 41, sizePx: 3.5, durationSec: 5.0, delaySec: -4.8 },
  { leftPct: 46, sizePx: 6.5, durationSec: 6.4, delaySec: -2.8, isStarFlake: true },
  { leftPct: 52, sizePx: 4.5, durationSec: 5.9, delaySec: -0.4 },
  { leftPct: 57, sizePx: 4, durationSec: 6.9, delaySec: -3.1 },
  { leftPct: 63, sizePx: 7, durationSec: 5.4, delaySec: -5.0, isStarFlake: true },
  { leftPct: 68, sizePx: 3.5, durationSec: 7.6, delaySec: -1.6 },
  { leftPct: 73, sizePx: 5, durationSec: 6.1, delaySec: -3.9 },
  { leftPct: 78, sizePx: 6.5, durationSec: 5.3, delaySec: -2.1, isStarFlake: true },
  { leftPct: 83, sizePx: 4, durationSec: 6.7, delaySec: -4.5 },
  { leftPct: 88, sizePx: 5, durationSec: 5.7, delaySec: -0.9 },
  { leftPct: 93, sizePx: 6, durationSec: 7.2, delaySec: -3.3, isStarFlake: true },
  { leftPct: 96, sizePx: 4, durationSec: 5.8, delaySec: -2.6 },
];

function evalQuad(t: number, p0: Point2D, p1: Point2D, p2: Point2D) {
  const u = 1 - t;
  return {
    x: u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    y: u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  };
}

function buildCurvedRibbonPath(p0: Point2D, p1: Point2D, p2: Point2D): string {
  const steps = 16;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pt = evalQuad(t, p0, p1, p2);
    const wave = i === 0 || i === steps ? 0 : i % 2 === 1 ? -4.5 : 4.5;
    const cmd = i === 0 ? 'M' : 'L';
    parts.push(`${cmd} ${pt.x.toFixed(1)} ${(pt.y + wave).toFixed(1)}`);
  }
  return parts.join(' ');
}

const LEFT_RIBBON_PATH = buildCurvedRibbonPath(LEFT_P0, LEFT_P1, LEFT_P2);
const RIGHT_RIBBON_PATH = buildCurvedRibbonPath(RIGHT_P0, RIGHT_P1, RIGHT_P2);

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
      {/* Soquete preso diretamente no fio da guirlanda */}
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
      {/* Bulbo vertical apontado para baixo pela gravidade */}
      <g className={animClass}>
        <circle cx="0" cy="11" r="9.5" fill={color.glow} opacity="0.34" />
        <path
          d="M-3.6 4.2 C-3.8 11.5 -2.2 16 0 16 C2.2 16 3.8 11.5 3.6 4.2 Z"
          fill={color.fill}
        />
        <ellipse cx="-1.1" cy="8.5" rx="0.9" ry="2.2" fill="#ffffff" opacity="0.45" />
      </g>
    </g>
  );
}

/**
 * Skin Natalina para toda a página da loja (Free e PRO):
 * Fio e pisca-pisca horizontal no topo, guirlandas curvas pela gravidade nos dois cantos superiores
 * (com lâmpadas verticais penduradas para baixo) e laterais luminosas completas.
 */
export function ChristmasPageSkin({ variant = 'page' }: ChristmasPageSkinProps) {
  const isPreview = variant === 'preview';
  const topBulbCount = isPreview ? 10 : 18;
  const sideBulbCount = isPreview ? 3 : 12;

  const sidePositionClass = isPreview
    ? 'absolute top-0 bottom-0'
    : 'fixed top-0 bottom-0';

  // Ornamentos ficam no ponto mais baixo da curva (t=0.5 = centro do arco/gravidade)
  const leftBellAnchor = evalQuad(0.5, LEFT_P0, LEFT_P1, LEFT_P2);
  const rightStockingAnchor = evalQuad(0.5, RIGHT_P0, RIGHT_P1, RIGHT_P2);

  return (
    <>
      {/* TOPO HORIZONTAL + GUIRLANDAS CURVAS PELA GRAVIDADE NOS CANTOS SUPERIORES */}
      <div
        aria-hidden="true"
        className={`pointer-events-none select-none top-0 inset-x-0 ${
          isPreview ? 'absolute z-20 h-full overflow-hidden' : 'absolute z-[16] h-44 sm:h-56 overflow-visible'
        }`}
      >
        {/* Neve suave caindo apenas no topo da página */}
        <div className="absolute inset-0 overflow-hidden">
          {TOP_SNOW_FLAKES.slice(0, isPreview ? 8 : TOP_SNOW_FLAKES.length).map(
            (flake, idx) => (
              <span
                key={`top-snow-${idx}`}
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
            )
          )}
        </div>

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
          viewBox="0 0 220 165"
          className={`absolute top-0 left-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)] ${
            isPreview
              ? 'w-28 h-[75px]'
              : 'w-36 h-[96px] sm:w-56 sm:h-36 md:w-72 md:h-48'
          }`}
        >
          {/* Fio e ramo de pinheiro curvo com caimento natural (catenária) */}
          <path
            d={`M ${LEFT_P0[0]} ${LEFT_P0[1]} Q ${LEFT_P1[0]} ${LEFT_P1[1]} ${LEFT_P2[0]} ${LEFT_P2[1]}`}
            stroke="#14532d"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${LEFT_P0[0]} ${LEFT_P0[1]} Q ${LEFT_P1[0]} ${LEFT_P1[1]} ${LEFT_P2[0]} ${LEFT_P2[1]}`}
            stroke="#16a34a"
            strokeWidth="5"
            strokeDasharray="6 6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Fita vermelha acompanhando a mesma curva */}
          <path
            d={LEFT_RIBBON_PATH}
            stroke="#dc2626"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="none"
            opacity="0.92"
          />
          {/* LEDs pendurados na vertical (gravidade) ao longo do fio curvo */}
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
          {/* Sinos Dourados + Laço pendurados diretamente no meio da curva */}
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
          viewBox="0 0 220 165"
          className={`absolute top-0 right-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)] ${
            isPreview
              ? 'w-28 h-[75px]'
              : 'w-36 h-[96px] sm:w-56 sm:h-36 md:w-72 md:h-48'
          }`}
        >
          {/* Fio e ramo de pinheiro curvo com caimento natural (catenária) */}
          <path
            d={`M ${RIGHT_P0[0]} ${RIGHT_P0[1]} Q ${RIGHT_P1[0]} ${RIGHT_P1[1]} ${RIGHT_P2[0]} ${RIGHT_P2[1]}`}
            stroke="#14532d"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${RIGHT_P0[0]} ${RIGHT_P0[1]} Q ${RIGHT_P1[0]} ${RIGHT_P1[1]} ${RIGHT_P2[0]} ${RIGHT_P2[1]}`}
            stroke="#16a34a"
            strokeWidth="5"
            strokeDasharray="6 6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Fita dourada acompanhando a mesma curva */}
          <path
            d={RIGHT_RIBBON_PATH}
            stroke="#facc15"
            strokeWidth="2.3"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />
          {/* LEDs pendurados na vertical (gravidade) ao longo da curva direita */}
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
            {/* edge="right" deixa o soquete encostado na borda esquerda (left-0) e o LED voltado para dentro */}
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
            {/* edge="left" deixa o soquete encostado na borda direita (right-0) e o LED voltado para dentro */}
            <LedBulb idx={idx + 3} edge="left" />
          </div>
        ))}
      </div>
    </>
  );
}

const FOOTER_SKY_STARS = [
  { cx: 52, cy: 36, r: 1.8 },
  { cx: 118, cy: 24, r: 1.4 },
  { cx: 192, cy: 52, r: 1.6 },
  { cx: 392, cy: 30, r: 2.0 },
  { cx: 472, cy: 48, r: 1.5 },
  { cx: 538, cy: 26, r: 1.6 },
  { cx: 668, cy: 30, r: 1.7 },
  { cx: 742, cy: 44, r: 1.9 },
  { cx: 825, cy: 24, r: 1.5 },
  { cx: 904, cy: 50, r: 1.8 },
  { cx: 985, cy: 28, r: 1.6 },
  { cx: 1068, cy: 34, r: 2.0 },
  { cx: 1152, cy: 46, r: 1.5 },
];

const FOOTER_TREE_LIGHTS = [
  { cx: 600, cy: 84, paletteIdx: 0 },
  { cx: 582, cy: 108, paletteIdx: 1 },
  { cx: 618, cy: 112, paletteIdx: 2 },
  { cx: 566, cy: 138, paletteIdx: 3 },
  { cx: 598, cy: 136, paletteIdx: 4 },
  { cx: 634, cy: 142, paletteIdx: 0 },
  { cx: 548, cy: 170, paletteIdx: 2 },
  { cx: 584, cy: 174, paletteIdx: 1 },
  { cx: 616, cy: 172, paletteIdx: 3 },
  { cx: 650, cy: 176, paletteIdx: 4 },
  { cx: 536, cy: 202, paletteIdx: 1 },
  { cx: 572, cy: 204, paletteIdx: 0 },
  { cx: 610, cy: 205, paletteIdx: 2 },
  { cx: 646, cy: 202, paletteIdx: 3 },
];

/**
 * Cenário panorâmico natalino de rodapé (Free e PRO):
 * Esquerda: Estrela Guia, Os Três Reis Magos e Menino Jesus na manjedoura com José e Maria;
 * Centro: Árvore de Natal iluminada e enfeitada dividindo os dois cenários;
 * Direita: Papai Noel no trenó com presentes levantando voo com as renas.
 */
export function ChristmasFooterScene() {
  const reindeers = [
    { x: 966, y: 122, isLead: false },
    { x: 1044, y: 98, isLead: false },
    { x: 1124, y: 74, isLead: true },
  ];

  return (
    <section
      aria-label="Cenário Natalino SpotQR"
      className="relative w-full rounded-2xl overflow-hidden border border-emerald-500/35 bg-gradient-to-b from-[#060a18] via-[#0c152e] to-[#111d3a] shadow-2xl"
    >
      <svg
        viewBox="0 0 1200 280"
        className="w-full h-auto block select-none"
        role="img"
        aria-label="Presépio com Menino Jesus na manjedoura, José, Maria e os Três Reis Magos seguindo a Estrela Guia à esquerda; Árvore de Natal enfeitada ao centro; Papai Noel no trenó levantando voo com as renas à direita"
      >
        <defs>
          <radialGradient id="bethlehemStarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#facc15" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bethlehemBeam" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="snowGround" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <radialGradient id="mangerWarmGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Estrelas sutis do céu noturno */}
        {FOOTER_SKY_STARS.map((star, idx) => (
          <circle
            key={`fstar-${idx}`}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill="#f8fafc"
            className="natal-star-twinkle"
            style={{ animationDelay: `${(idx * 0.35).toFixed(2)}s` }}
          />
        ))}

        {/* ================= CENÁRIO ESQUERDO: ESTRELA GUIA + 3 REIS MAGOS + PRESÉPIO ================= */}
        {/* Raio suave da Estrela Guia iluminando a manjedoura */}
        <polygon points="315,38 205,222 425,222" fill="url(#bethlehemBeam)" />

        {/* Estrela Guia de Belém */}
        <g transform="translate(315, 38)" className="natal-star-twinkle">
          <circle cx="0" cy="0" r="34" fill="url(#bethlehemStarGlow)" />
          <path
            d="M0 -24 L4 -5 L20 -10 L6 0 L16 14 L2 5 L0 26 L-2 5 L-16 14 L-6 0 L-20 -10 L-4 -5 Z"
            fill="#fef08a"
            stroke="#facc15"
            strokeWidth="1"
          />
          <circle cx="0" cy="0" r="4" fill="#ffffff" />
        </g>

        {/* Colinas e chão de neve contínuo no horizonte */}
        <path
          d="M0 226 Q170 210 340 224 Q500 236 600 224 Q720 212 900 226 Q1060 236 1200 214 L1200 280 L0 280 Z"
          fill="#94a3b8"
          opacity="0.35"
        />
        <path
          d="M0 232 Q190 220 380 234 Q520 242 600 232 Q710 222 860 214 Q1020 206 1200 232 L1200 280 L0 280 Z"
          fill="url(#snowGround)"
        />

        {/* Os Três Reis Magos caminhando pela esquerda em direção à Estrela Guia */}
        {/* Mago 1 - Púrpura (Ouro) */}
        <g transform="translate(48, 166)">
          <path d="M6 68 L14 24 L26 24 L34 68 Z" fill="#7e22ce" />
          <path d="M2 66 Q12 42 15 24 L20 26 L11 66 Z" fill="#a855f7" />
          <circle cx="20" cy="16" r="6" fill="#fed7aa" />
          <path d="M13 13 L15 6 L18 10 L20 5 L22 10 L25 6 L27 13 Z" fill="#facc15" />
          {/* Cofre dourado */}
          <rect x="27" y="34" width="9" height="7" rx="1.5" fill="#facc15" stroke="#a16207" strokeWidth="1" />
        </g>

        {/* Mago 2 - Carmim (Incenso) */}
        <g transform="translate(96, 170)">
          <path d="M5 65 L13 22 L25 22 L33 65 Z" fill="#be123c" />
          <path d="M2 63 Q11 40 14 22 L19 24 L10 63 Z" fill="#fb7185" opacity="0.7" />
          <circle cx="19" cy="15" r="5.8" fill="#fdba74" />
          {/* Turbante real */}
          <ellipse cx="19" cy="10" rx="7.5" ry="4.5" fill="#f8fafc" />
          <circle cx="19" cy="9" r="1.8" fill="#facc15" />
          {/* Vaso de incenso */}
          <path d="M27 32 L33 32 L32 39 L28 39 Z" fill="#fde047" />
        </g>

        {/* Mago 3 - Esmeralda (Mirra) */}
        <g transform="translate(144, 174)">
          <path d="M5 62 L13 22 L24 22 L31 62 Z" fill="#0f766e" />
          <circle cx="18.5" cy="14.5" r="5.6" fill="#9a5b32" />
          <path d="M12 11 L14 6 L18.5 9 L23 6 L25 11 Z" fill="#facc15" />
          {/* Ânfora */}
          <ellipse cx="28" cy="34" rx="3.5" ry="5" fill="#eab308" />
        </g>

        {/* Estábulo rústico de Belém + Menino Jesus na Manjedoura + Maria e José */}
        <g transform="translate(215, 118)">
          {/* Luz acolhedora interna */}
          <circle cx="100" cy="82" r="55" fill="url(#mangerWarmGlow)" />
          {/* Fundo sombreado da cabana */}
          <polygon points="18,46 100,6 182,46 182,116 18,116" fill="#1e1b18" opacity="0.72" />
          {/* Vigas de madeira */}
          <rect x="20" y="46" width="8" height="72" fill="#78350f" />
          <rect x="172" y="46" width="8" height="72" fill="#78350f" />
          <path
            d="M8 50 L100 4 L192 50"
            stroke="#92400e"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Neve leve no telhado do estábulo */}
          <path
            d="M12 46 L100 2 L188 46"
            stroke="#f1f5f9"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Maria ajoelhada à esquerda da manjedoura */}
          <g transform="translate(40, 56)">
            <circle cx="16" cy="10" r="8.5" fill="none" stroke="#fde047" strokeWidth="1.2" opacity="0.75" />
            <path d="M4 59 Q8 30 16 20 Q25 28 29 59 Z" fill="#1d4ed8" />
            <path d="M9 12 Q16 4 23 14 Q24 28 19 38 Q12 28 9 12 Z" fill="#38bdf8" />
            <circle cx="17" cy="13" r="4.8" fill="#fed7aa" />
          </g>

          {/* Manjedoura com Palha Dourada e Menino Jesus */}
          <g transform="translate(78, 82)">
            {/* Palha dourada */}
            <path
              d="M4 16 Q14 6 24 14 Q34 7 42 16 Z"
              fill="#facc15"
            />
            {/* Auréola e Menino Jesus */}
            <circle cx="22" cy="10" r="9" fill="#fef9c3" opacity="0.55" />
            <circle cx="16" cy="11" r="4.2" fill="#fed7aa" />
            <ellipse cx="26" cy="13.5" rx="9.5" ry="4.8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            {/* Pernas em X da manjedoura de madeira */}
            <path d="M8 15 L36 33 M36 15 L8 33" stroke="#92400e" strokeWidth="3.2" strokeLinecap="round" />
            <polygon points="4,15 40,15 35,24 9,24" fill="#78350f" />
          </g>

          {/* José com cajado à direita da manjedoura */}
          <g transform="translate(132, 46)">
            <circle cx="16" cy="10" r="8.5" fill="none" stroke="#fde047" strokeWidth="1.2" opacity="0.7" />
            <path d="M4 70 L10 24 L23 24 L29 70 Z" fill="#b45309" />
            <path d="M6 25 Q16 32 25 25 L27 52 L6 52 Z" fill="#78350f" opacity="0.85" />
            <circle cx="16" cy="13" r="5" fill="#fed7aa" />
            <path d="M12 15 Q16 20 20 15" fill="#573b26" />
            {/* Cajado de madeira */}
            <path d="M31 12 L27 70" stroke="#a16207" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M26 12 Q31 5 35 12" stroke="#a16207" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </g>
        </g>

        {/* ================= CENTRO: ÁRVORE DE NATAL ENFEITADA SEPARANDO OS CENÁRIOS ================= */}
        <g transform="translate(600, 0)">
          {/* Sombra na neve e tronco */}
          <ellipse cx="0" cy="236" rx="56" ry="8" fill="#94a3b8" opacity="0.35" />
          <rect x="-12" y="206" width="24" height="28" rx="3" fill="#78350f" />

          {/* Camadas frondosas da árvore de Natal */}
          <polygon points="-74,210 0,136 74,210" fill="#14532d" />
          <polygon points="-62,174 0,104 62,174" fill="#15803d" />
          <polygon points="-48,138 0,76 48,138" fill="#16a34a" />
          <polygon points="-32,102 0,48 32,102" fill="#15803d" />

          {/* Guirlandas douradas curvas nos galhos */}
          <path d="M-24 96 Q0 108 24 96" stroke="#facc15" strokeWidth="2.5" fill="none" />
          <path d="M-40 132 Q0 148 40 132" stroke="#ef4444" strokeWidth="2.6" fill="none" />
          <path d="M-54 168 Q0 186 54 168" stroke="#facc15" strokeWidth="2.8" fill="none" />
          <path d="M-66 202 Q0 218 66 202" stroke="#ef4444" strokeWidth="3" fill="none" />

          {/* Estrela de Ouro no topo da Árvore */}
          <g transform="translate(0, 42)" className="natal-star-twinkle">
            <circle cx="0" cy="0" r="18" fill="url(#bethlehemStarGlow)" />
            <polygon
              points="0,-15 4,-4 15,-4 6,3 9,14 0,7 -9,14 -6,3 -15,-4 -4,-4"
              fill="#facc15"
              stroke="#fef08a"
              strokeWidth="1"
            />
          </g>

          {/* Luzes e bolinhas piscantes na árvore */}
          {FOOTER_TREE_LIGHTS.map((pt, idx) => {
            const c = LED_PALETTE[pt.paletteIdx % LED_PALETTE.length];
            const cls = idx % 2 === 0 ? 'natal-led-odd' : 'natal-led-even';
            return (
              <g key={`tree-led-${idx}`} className={cls}>
                <circle cx={pt.cx - 600} cy={pt.cy} r="6.5" fill={c.glow} opacity="0.35" />
                <circle cx={pt.cx - 600} cy={pt.cy} r="3.6" fill={c.fill} />
              </g>
            );
          })}

          {/* Presentes coloridos ao pé da árvore */}
          <g transform="translate(-48, 214)">
            <rect x="0" y="0" width="20" height="18" rx="2" fill="#dc2626" />
            <rect x="8.5" y="0" width="3" height="18" fill="#facc15" />
            <rect x="0" y="7.5" width="20" height="3" fill="#facc15" />
          </g>
          <g transform="translate(-24, 218)">
            <rect x="0" y="0" width="16" height="14" rx="2" fill="#2563eb" />
            <rect x="6.5" y="0" width="3" height="14" fill="#f8fafc" />
          </g>
          <g transform="translate(18, 215)">
            <rect x="0" y="0" width="22" height="17" rx="2" fill="#f59e0b" />
            <rect x="9.5" y="0" width="3" height="17" fill="#dc2626" />
            <rect x="0" y="7" width="22" height="3" fill="#dc2626" />
          </g>
        </g>

        {/* ================= CENÁRIO DIREITO: PAPAI NOEL NO TRENÓ LEVANTANDO VOO COM AS RENAS ================= */}
        {/* Rastro mágico cintilante de decolagem subindo da neve para o céu */}
        <path
          d="M726 226 Q816 212 874 176"
          stroke="#fde047"
          strokeWidth="2.5"
          strokeDasharray="5 6"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M744 234 Q824 220 886 184"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="3 6"
          fill="none"
          opacity="0.55"
        />

        <g className="natal-santa-flight">
          {/* Rédeas douradas ligando o trenó às renas em ascensão */}
          <path
            d="M890 144 Q945 130 982 116 Q1025 104 1060 92 Q1100 80 1138 68"
            stroke="#facc15"
            strokeWidth="1.5"
            fill="none"
            opacity="0.88"
          />

          {/* Trenó Vermelho com Saco de Presentes e Papai Noel inclinado subindo (-15deg) */}
          <g transform="translate(838, 162) rotate(-15)">
            {/* Saco grande vermelho com presentes coloridos saindo */}
            <ellipse cx="-20" cy="-16" rx="18" ry="15" fill="#991b1b" />
            <rect x="-32" y="-33" width="11" height="11" rx="1.5" fill="#22c55e" transform="rotate(-12 -26 -27)" />
            <rect x="-28" y="-33" width="2.5" height="11" fill="#facc15" transform="rotate(-12 -26 -27)" />
            <rect x="-20" y="-36" width="12" height="12" rx="1.5" fill="#3b82f6" transform="rotate(8 -14 -30)" />
            <rect x="-15.5" y="-36" width="2.8" height="12" fill="#f8fafc" transform="rotate(8 -14 -30)" />
            <rect x="-9" y="-30" width="10" height="10" rx="1.5" fill="#eab308" transform="rotate(18 -4 -25)" />

            {/* Papai Noel sentado segurando as rédeas e acenando */}
            <g transform="translate(10, -28)">
              <path d="M-8 22 Q2 2 14 22 Z" fill="#dc2626" />
              <circle cx="3" cy="3" r="6" fill="#fed7aa" />
              {/* Barba fofa branca */}
              <path d="M-3 4 Q3 15 9 4 Z" fill="#ffffff" />
              {/* Gorro do Papai Noel com pompom */}
              <path d="M-4 0 Q2 -12 10 -1 L4 2 Z" fill="#dc2626" />
              <rect x="-4" y="-1" width="12" height="3.2" rx="1.6" fill="#ffffff" />
              <circle cx="11" cy="-2" r="2.6" fill="#ffffff" />
              {/* Braço acenando com luva */}
              <path d="M10 10 L21 0" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
              <circle cx="22" cy="-1" r="2.6" fill="#ffffff" />
            </g>

            {/* Corpo ornamentado do Trenó e Patins Dourados */}
            <path
              d="M-38 -16 L-32 8 L28 8 Q40 8 44 -10 L18 -10 Q10 -2 -4 -4 L-12 -16 Z"
              fill="#dc2626"
              stroke="#facc15"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M-42 15 L36 15 Q48 15 50 4"
              stroke="#facc15"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            <line x1="-22" y1="8" x2="-22" y2="15" stroke="#eab308" strokeWidth="2.5" />
            <line x1="16" y1="8" x2="16" y2="15" stroke="#eab308" strokeWidth="2.5" />
          </g>

          {/* 3 Renas saltando para cima em formação diagonal (Rodolfo na dianteira!) */}
          {reindeers.map((reindeer, rIdx) => (
            <g
              key={`reindeer-${rIdx}`}
              transform={`translate(${reindeer.x}, ${reindeer.y}) rotate(-18)`}
            >
              {/* Pernas traseiras estendidas e dianteiras dobradas no salto */}
              <path d="M-12 6 L-22 14 M-9 7 L-17 17" stroke="#78350f" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M9 5 L19 10 M11 3 L20 3" stroke="#78350f" strokeWidth="2.6" strokeLinecap="round" />
              {/* Rabo curto */}
              <path d="M-15 0 L-20 -4" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
              {/* Tronco e pescoço erguido */}
              <ellipse cx="0" cy="3" rx="14" ry="6.5" fill="#92400e" />
              {/* Sela/coleira vermelha e dourada */}
              <path d="M2 -3 L5 9" stroke="#dc2626" strokeWidth="3" />
              <circle cx="9" cy="1" r="2" fill="#facc15" />
              {/* Pescoço e cabeça */}
              <path d="M9 1 L17 -10 L23 -9 L23 -4 L14 4 Z" fill="#92400e" />
              {/* Galhada (Chifres) */}
              <path
                d="M16 -10 L13 -20 M14 -15 L9 -17 M15 -17 L19 -21"
                stroke="#fde68a"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              {/* Nariz vermelho brilhante para Rodolfo na frente */}
              {reindeer.isLead ? (
                <>
                  <circle cx="24" cy="-7" r="6" fill="#ef4444" opacity="0.45" className="natal-led-odd" />
                  <circle cx="24" cy="-7" r="2.6" fill="#ef4444" />
                </>
              ) : (
                <circle cx="23.5" cy="-7" r="1.6" fill="#451a03" />
              )}
            </g>
          ))}
        </g>
      </svg>
    </section>
  );
}
