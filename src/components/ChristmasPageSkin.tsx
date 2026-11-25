'use client';

import React from 'react';
import { LED_PALETTE, LedBulb } from './ChristmasCardDecor';

interface ChristmasPageSkinProps {
  /**
   * 'page': aplica em toda a página pública (topo, guirlandas diagonais nos cantos e laterais fixas completas).
   * 'preview': versão reduzida para a caixa de prévia ao vivo dentro do Editor Visual.
   */
  variant?: 'page' | 'preview';
}

const DIAGONAL_BULB_COORDS = [
  { x: 26, y: 122, idx: 0 },
  { x: 64, y: 98, idx: 1 },
  { x: 102, y: 74, idx: 2 },
  { x: 142, y: 48, idx: 3 },
  { x: 184, y: 22, idx: 4 },
];

/**
 * Skin Natalina para toda a página da loja (Free e PRO):
 * Fio e pisca-pisca horizontal no topo, guirlandas diagonais com sinos/meia nos dois cantos superiores
 * e bordas luminosas verticais percorrendo as duas laterais da página.
 */
export function ChristmasPageSkin({ variant = 'page' }: ChristmasPageSkinProps) {
  const isPreview = variant === 'preview';
  const topBulbCount = isPreview ? 10 : 18;
  const sideBulbCount = isPreview ? 3 : 12;

  const sidePositionClass = isPreview
    ? 'absolute top-0 bottom-0'
    : 'fixed top-0 bottom-0';

  return (
    <>
      {/* TOPO HORIZONTAL + DIAGONAIS DOS CANTOS SUPERIORES */}
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
              className={
                !isPreview && idx % 3 === 1 ? 'hidden sm:flex' : 'flex'
              }
            >
              <LedBulb idx={idx} edge="top" />
            </div>
          ))}
        </div>

        {/* Canto Diagonal Superior Esquerdo (Guirlanda + Sinos Dourados + LEDs) */}
        <svg
          viewBox="0 0 220 150"
          className={`absolute top-0 left-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)] ${
            isPreview
              ? 'w-24 h-16'
              : 'w-28 h-20 sm:w-44 sm:h-28 md:w-56 md:h-36'
          }`}
        >
          {/* Ramo de pinheiro diagonal principal */}
          <path
            d="M4 136 Q 112 72 208 4"
            stroke="#14532d"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M4 136 Q 112 72 208 4"
            stroke="#16a34a"
            strokeWidth="6"
            strokeDasharray="6 6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Fita vermelha enrolada na guirlanda */}
          <path
            d="M12 130 Q 34 106 54 104 Q 78 100 94 78 Q 116 56 144 48 Q 168 42 196 10"
            stroke="#dc2626"
            strokeWidth="2.8"
            fill="none"
            opacity="0.9"
          />
          {/* LEDs piscantes ao longo da diagonal */}
          {DIAGONAL_BULB_COORDS.map((pt) => {
            const color = LED_PALETTE[pt.idx % LED_PALETTE.length];
            const animClass = pt.idx % 2 === 0 ? 'natal-led-odd' : 'natal-led-even';
            return (
              <g key={`diag-l-${pt.idx}`} className={animClass}>
                <circle cx={pt.x} cy={pt.y} r="7.5" fill={color.glow} opacity="0.32" />
                <circle cx={pt.x} cy={pt.y} r="4.3" fill={color.fill} />
              </g>
            );
          })}
          {/* Sinos Dourados + Laço Vermelho no encontro superior esquerdo */}
          <g transform="translate(26, 18) scale(0.92)" className="natal-ornament-sway">
            <g transform="rotate(-18 22 24)">
              <path d="M14 20 C14 14 26 14 26 20 L29 35 L11 35 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
              <circle cx="20" cy="37" r="3" fill="#dc2626" />
            </g>
            <g transform="rotate(18 40 24)">
              <path d="M34 20 C34 14 46 14 46 20 L49 35 L31 35 Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
              <circle cx="40" cy="37" r="3" fill="#dc2626" />
            </g>
            <ellipse cx="22" cy="14" rx="7" ry="4" transform="rotate(-20 22 14)" fill="#ef4444" stroke="#991b1b" strokeWidth="1.2" />
            <ellipse cx="38" cy="14" rx="7" ry="4" transform="rotate(20 38 14)" fill="#ef4444" stroke="#991b1b" strokeWidth="1.2" />
            <circle cx="30" cy="14" r="3.8" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
          </g>
        </svg>

        {/* Canto Diagonal Superior Direito (Guirlanda + Meia/Bolinhas + LEDs) */}
        <svg
          viewBox="0 0 220 150"
          className={`absolute top-0 right-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)] ${
            isPreview
              ? 'w-24 h-16'
              : 'w-28 h-20 sm:w-44 sm:h-28 md:w-56 md:h-36'
          }`}
        >
          {/* Ramo de pinheiro diagonal principal */}
          <path
            d="M216 136 Q 108 72 12 4"
            stroke="#14532d"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M216 136 Q 108 72 12 4"
            stroke="#16a34a"
            strokeWidth="6"
            strokeDasharray="6 6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Fita dourada/vermelha enrolada na guirlanda */}
          <path
            d="M208 130 Q 186 106 166 104 Q 142 100 126 78 Q 104 56 76 48 Q 52 42 24 10"
            stroke="#facc15"
            strokeWidth="2.4"
            fill="none"
            opacity="0.88"
          />
          {/* LEDs piscantes ao longo da diagonal direita */}
          {DIAGONAL_BULB_COORDS.map((pt) => {
            const mirroredX = 220 - pt.x;
            const color = LED_PALETTE[(pt.idx + 2) % LED_PALETTE.length];
            const animClass = pt.idx % 2 === 0 ? 'natal-led-even' : 'natal-led-odd';
            return (
              <g key={`diag-r-${pt.idx}`} className={animClass}>
                <circle cx={mirroredX} cy={pt.y} r="7.5" fill={color.glow} opacity="0.32" />
                <circle cx={mirroredX} cy={pt.y} r="4.3" fill={color.fill} />
              </g>
            );
          })}
          {/* Meia Natalina + Bolinha no canto superior direito */}
          <g transform="translate(132, 16) scale(0.9)" className="natal-ornament-sway">
            <path
              d="M24 14 L42 14 L42 35 C42 40 46 43 50 45 C54 47 54 55 46 56 L29 56 C22 56 20 50 23 44 L24 38 Z"
              fill="#dc2626"
              stroke="#7f1d1d"
              strokeWidth="1.6"
            />
            <path d="M46 44 C53 46 53 54 45 55 L42 55 C42 50 43 47 46 44 Z" fill="#facc15" />
            <rect x="24" y="25" width="18" height="4" fill="#16a34a" />
            <rect x="21" y="10" width="24" height="8" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
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
