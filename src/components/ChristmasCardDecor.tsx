'use client';

import React from 'react';

const LED_PALETTE = [
  { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.95)' },   // Vermelho
  { fill: '#facc15', glow: 'rgba(250, 204, 21, 0.95)' },  // Amarelo Ouro
  { fill: '#22c55e', glow: 'rgba(34, 197, 94, 0.95)' },   // Verde
  { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.95)' },  // Azul Gelo
  { fill: '#fb923c', glow: 'rgba(251, 146, 60, 0.95)' },  // Laranja Quente
];

function LedBulb({
  idx,
  orientation = 'top',
}: {
  idx: number;
  orientation?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const palette = LED_PALETTE[idx % LED_PALETTE.length];
  const animClass = idx % 2 === 0 ? 'natal-led-odd' : 'natal-led-even';

  const socketRotate =
    orientation === 'bottom'
      ? 'rotate-180'
      : orientation === 'left'
      ? '-rotate-90'
      : orientation === 'right'
      ? 'rotate-90'
      : '';

  return (
    <span
      className={`inline-flex flex-col items-center ${socketRotate} ${animClass}`}
      style={{ color: palette.glow }}
    >
      {/* Soquete verde escuro da lâmpada */}
      <span className="w-1.5 h-1 rounded-t-sm bg-emerald-950 border border-emerald-700/80 block" />
      {/* Lâmpada LED estilo gota com brilho */}
      <span
        className="w-2.5 h-3 rounded-b-full rounded-t-[4px] block"
        style={{
          backgroundColor: palette.fill,
          boxShadow: `0 0 8px 2px ${palette.glow}, 0 0 14px ${palette.glow}`,
        }}
      />
    </span>
  );
}

/**
 * Decoração natalina completa ao redor da borda do anúncio:
 * Fio de pisca-pisca com LEDs individuais nos 4 lados, sinos dourados com badalos,
 * meia de Natal listrada e bolinhas natalinas brilhantes nos cantos.
 */
export function ChristmasCardDecor({ compact = false }: { compact?: boolean }) {
  const horizontalCount = compact ? 7 : 12;
  const verticalCount = compact ? 2 : 4;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 select-none overflow-visible"
    >
      {/* Cordão de fio verde superior */}
      <div className="absolute -top-[5px] inset-x-4 flex items-start justify-between">
        <span className="absolute top-[1px] inset-x-0 h-[2px] rounded-full bg-emerald-800/90" />
        {Array.from({ length: horizontalCount }).map((_, idx) => (
          <div key={`t-${idx}`} className="relative z-10 flex flex-col items-center">
            <LedBulb idx={idx} orientation="top" />
          </div>
        ))}
      </div>

      {/* Cordão de fio verde inferior */}
      <div className="absolute -bottom-[5px] inset-x-5 flex items-end justify-between">
        <span className="absolute bottom-[1px] inset-x-0 h-[2px] rounded-full bg-emerald-800/90" />
        {Array.from({ length: horizontalCount }).map((_, idx) => (
          <div key={`b-${idx}`} className="relative z-10 flex flex-col items-center">
            <LedBulb idx={idx + 2} orientation="bottom" />
          </div>
        ))}
      </div>

      {/* Cordão lateral esquerdo */}
      <div className="absolute -left-[5px] inset-y-6 flex flex-col justify-around">
        {Array.from({ length: verticalCount }).map((_, idx) => (
          <div key={`l-${idx}`} className="relative z-10">
            <LedBulb idx={idx + 1} orientation="left" />
          </div>
        ))}
      </div>

      {/* Cordão lateral direito */}
      <div className="absolute -right-[5px] inset-y-6 flex flex-col justify-around">
        {Array.from({ length: verticalCount }).map((_, idx) => (
          <div key={`r-${idx}`} className="relative z-10">
            <LedBulb idx={idx + 3} orientation="right" />
          </div>
        ))}
      </div>

      {/* Canto Superior Esquerdo: Sinos Dourados com Badalos + Laço Vermelho + Ramos de Pinheiro */}
      <svg
        viewBox="0 0 64 64"
        className={`natal-ornament-sway absolute -top-4 -left-3 drop-shadow-[0_3px_6px_rgba(0,0,0,0.65)] ${
          compact ? 'w-9 h-9' : 'w-12 h-12'
        }`}
      >
        {/* Ramos verdes de pinheiro */}
        <path d="M12 18 L4 10 M14 16 L10 5 M18 16 L24 6 M22 18 L34 10" stroke="#15803d" strokeWidth="3.5" strokeLinecap="round" />
        {/* Sino esquerdo + badalo */}
        <g transform="rotate(-18 22 24)">
          <path d="M14 20 C14 14 26 14 26 20 L29 35 L11 35 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="20" cy="37" r="3" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
        </g>
        {/* Sino direito + badalo */}
        <g transform="rotate(18 40 24)">
          <path d="M34 20 C34 14 46 14 46 20 L49 35 L31 35 Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="40" cy="37" r="3" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
        </g>
        {/* Laço vermelho natalino no topo */}
        <ellipse cx="22" cy="14" rx="7" ry="4" transform="rotate(-20 22 14)" fill="#ef4444" stroke="#991b1b" strokeWidth="1.2" />
        <ellipse cx="38" cy="14" rx="7" ry="4" transform="rotate(20 38 14)" fill="#ef4444" stroke="#991b1b" strokeWidth="1.2" />
        <circle cx="30" cy="14" r="3.8" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
      </svg>

      {/* Canto Superior Direito: Meia Natalina com Pelúcia Branca e Enfeite */}
      <svg
        viewBox="0 0 64 64"
        className={`natal-ornament-sway absolute -top-3.5 -right-3 drop-shadow-[0_3px_6px_rgba(0,0,0,0.65)] ${
          compact ? 'w-9 h-9' : 'w-12 h-12'
        }`}
      >
        {/* Argola de pendurar */}
        <circle cx="36" cy="8" r="3.5" fill="none" stroke="#facc15" strokeWidth="2.5" />
        {/* Corpo da meia */}
        <path
          d="M24 14 L42 14 L42 35 C42 40 46 43 50 45 C54 47 54 55 46 56 L29 56 C22 56 20 50 23 44 L24 38 Z"
          fill="#dc2626"
          stroke="#7f1d1d"
          strokeWidth="1.6"
        />
        {/* Ponta dourada da meia */}
        <path d="M46 44 C53 46 53 54 45 55 L42 55 C42 50 43 47 46 44 Z" fill="#facc15" />
        {/* Listrinha verde decorativa */}
        <rect x="24" y="25" width="18" height="4" fill="#16a34a" />
        {/* Pelúcia branca no topo */}
        <rect x="21" y="10" width="24" height="8" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
        {/* Bolinhas no topo da meia */}
        <circle cx="26" cy="14" r="1.5" fill="#ef4444" />
        <circle cx="33" cy="14" r="1.5" fill="#22c55e" />
        <circle cx="40" cy="14" r="1.5" fill="#facc15" />
      </svg>

      {/* Canto Inferior Esquerdo: Bolinhas Natalinas Vermelha e Dourada */}
      {!compact && (
        <svg
          viewBox="0 0 56 56"
          className="absolute -bottom-3 -left-2.5 w-10 h-10 drop-shadow-[0_3px_5px_rgba(0,0,0,0.65)]"
        >
          {/* Ramo verde */}
          <path d="M8 38 Q18 28 32 34" stroke="#15803d" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {/* Bola vermelha maior */}
          <rect x="14" y="18" width="6" height="4" rx="1" fill="#facc15" />
          <circle cx="17" cy="31" r="10" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.4" />
          <ellipse cx="14" cy="27" rx="2.5" ry="1.5" transform="rotate(-30 14 27)" fill="#fca5a5" opacity="0.85" />
          {/* Bola dourada menor */}
          <rect x="30" y="24" width="5" height="3.5" rx="1" fill="#94a3b8" />
          <circle cx="32.5" cy="35" r="8" fill="#facc15" stroke="#a16207" strokeWidth="1.4" />
          <ellipse cx="30" cy="32" rx="2" ry="1.2" transform="rotate(-30 30 32)" fill="#fef9c3" opacity="0.9" />
        </svg>
      )}

      {/* Canto Inferior Direito: Meia/Bolinha + Azevinho com Frutinhas */}
      {!compact && (
        <svg
          viewBox="0 0 56 56"
          className="absolute -bottom-3 -right-2.5 w-10 h-10 drop-shadow-[0_3px_5px_rgba(0,0,0,0.65)]"
        >
          {/* Folhas de azevinho */}
          <ellipse cx="22" cy="36" rx="9" ry="4.5" transform="rotate(-25 22 36)" fill="#16a34a" stroke="#14532d" strokeWidth="1.2" />
          <ellipse cx="36" cy="38" rx="9" ry="4.5" transform="rotate(20 36 38)" fill="#15803d" stroke="#14532d" strokeWidth="1.2" />
          {/* Bolinha azul/dourada */}
          <rect x="27" y="16" width="6" height="4" rx="1" fill="#facc15" />
          <circle cx="30" cy="28" r="9.5" fill="#e11d48" stroke="#881337" strokeWidth="1.4" />
          <path d="M21 28 Q30 32 39 28" stroke="#fde047" strokeWidth="2.2" fill="none" />
          {/* Frutinhas de natal */}
          <circle cx="28" cy="38" r="2.6" fill="#ef4444" />
          <circle cx="33" cy="39.5" r="2.4" fill="#ef4444" />
          <circle cx="30.5" cy="35.5" r="2.2" fill="#f87171" />
        </svg>
      )}
    </div>
  );
}
