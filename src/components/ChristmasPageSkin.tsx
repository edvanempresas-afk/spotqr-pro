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

const LEFT_P0: Point2D = [2, 118];
const LEFT_P1: Point2D = [134, 120];
const LEFT_P2: Point2D = [214, 4];

const RIGHT_P0: Point2D = [218, 118];
const RIGHT_P1: Point2D = [86, 120];
const RIGHT_P2: Point2D = [6, 4];

const BULB_T_STOPS = [0.16, 0.34, 0.52, 0.7, 0.86];

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

  const leftBellAnchor = evalQuad(0.43, LEFT_P0, LEFT_P1, LEFT_P2);
  const rightStockingAnchor = evalQuad(0.43, RIGHT_P0, RIGHT_P1, RIGHT_P2);

  return (
    <>
      {/* TOPO HORIZONTAL + GUIRLANDAS CURVAS PELA GRAVIDADE NOS CANTOS SUPERIORES */}
      <div
        aria-hidden="true"
        className={`pointer-events-none select-none top-0 inset-x-0 overflow-hidden ${
          isPreview ? 'absolute z-20 h-full' : 'absolute z-[16] h-44 sm:h-56'
        }`}
      >
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
          viewBox="0 0 220 160"
          className={`absolute top-0 left-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)] ${
            isPreview
              ? 'w-24 h-[70px]'
              : 'w-28 h-[82px] sm:w-44 sm:h-32 md:w-56 md:h-40'
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
          viewBox="0 0 220 160"
          className={`absolute top-0 right-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)] ${
            isPreview
              ? 'w-24 h-[70px]'
              : 'w-28 h-[82px] sm:w-44 sm:h-32 md:w-56 md:h-40'
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
