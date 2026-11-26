'use client';

import React from 'react';
import { LED_PALETTE } from './ChristmasCardDecor';

interface ChristmasFooterSceneProps {
  /** Adapta suavemente a transição superior da paisagem ao fundo claro ou escuro da vitrine. */
  isLight?: boolean;
}

type IdHelper = (name: string) => string;

function makeId(prefix: string): IdHelper {
  return (name: string) => `natal-${prefix}-${name}`;
}

/**
 * Definições compartilhadas de gradientes e filtros atmosféricos (IDs isolados por prefixo
 * para evitar colisões entre as composições desktop e mobile no DOM).
 */
function ChristmasSceneDefs({ prefix }: { prefix: string }) {
  const id = makeId(prefix);
  return (
    <defs>
      {/* Céu noturno de Natal */}
      <linearGradient id={id('skyGrad')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#070d1f" />
        <stop offset="45%" stopColor="#0d1b3e" />
        <stop offset="82%" stopColor="#162d59" />
        <stop offset="100%" stopColor="#1e3a6d" />
      </linearGradient>

      {/* Aurora Boreal orgânica */}
      <linearGradient id={id('auroraGreen')} x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
        <stop offset="32%" stopColor="#34d399" stopOpacity="0.32" />
        <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={id('auroraViolet')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
        <stop offset="45%" stopColor="#a78bfa" stopOpacity="0.22" />
        <stop offset="80%" stopColor="#2dd4bf" stopOpacity="0.24" />
        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
      </linearGradient>

      {/* Filtros Gaussianos suaves (sem recortes duros) */}
      <filter id={id('auroraBlur')} x="-25%" y="-40%" width="150%" height="180%">
        <feGaussianBlur stdDeviation="16" />
      </filter>
      <filter id={id('softBeamBlur')} x="-30%" y="-20%" width="160%" height="150%">
        <feGaussianBlur stdDeviation="13" />
      </filter>
      <filter id={id('softGlow')} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="6" />
      </filter>

      {/* Estrela Guia e Luz Acolhedora do Presépio */}
      <radialGradient id={id('starAura')} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
        <stop offset="28%" stopColor="#fef08a" stopOpacity="0.72" />
        <stop offset="62%" stopColor="#f59e0b" stopOpacity="0.24" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={id('starBeam')} x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.46" />
        <stop offset="45%" stopColor="#fde047" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={id('hearthGlow')} cx="50%" cy="55%" r="52%">
        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.78" />
        <stop offset="38%" stopColor="#f59e0b" stopOpacity="0.34" />
        <stop offset="78%" stopColor="#b45309" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('rudolphGlow')} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fecaca" stopOpacity="0.98" />
        <stop offset="35%" stopColor="#ef4444" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>

      {/* Montanhas distantes e Colinas Nevadas */}
      <linearGradient id={id('mountainFar')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e335c" />
        <stop offset="100%" stopColor="#122142" />
      </linearGradient>
      <linearGradient id={id('mountainMid')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#26406e" />
        <stop offset="100%" stopColor="#16294d" />
      </linearGradient>
      <linearGradient id={id('snowHorizon')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e2edff" />
        <stop offset="55%" stopColor="#cbdcf3" />
        <stop offset="100%" stopColor="#9fb8db" />
      </linearGradient>
      <linearGradient id={id('snowMid')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8fbff" />
        <stop offset="65%" stopColor="#dfeaf9" />
        <stop offset="100%" stopColor="#bdd0ea" />
      </linearGradient>
      <linearGradient id={id('snowFront')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#eff5fd" />
        <stop offset="100%" stopColor="#d7e4f5" />
      </linearGradient>
      <linearGradient id={id('valleyMist')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#93c5fd" stopOpacity="0" />
        <stop offset="55%" stopColor="#bfdbfe" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.32" />
      </linearGradient>

      {/* Pinheiro da Árvore Central (sombras ricas e brilho suave) */}
      <linearGradient id={id('pineTierDark')} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#14532d" />
        <stop offset="100%" stopColor="#052e16" />
      </linearGradient>
      <linearGradient id={id('pineTierMid')} x1="0.25" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#16a34a" />
        <stop offset="65%" stopColor="#15803d" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>
      <linearGradient id={id('pineTierBright')} x1="0.3" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="65%" stopColor="#16a34a" />
        <stop offset="100%" stopColor="#14532d" />
      </linearGradient>

      {/* Bolinhas 3D da Árvore */}
      <radialGradient id={id('baubleRuby')} cx="35%" cy="32%" r="65%">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="45%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </radialGradient>
      <radialGradient id={id('baubleGold')} cx="35%" cy="32%" r="65%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="45%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#854d0e" />
      </radialGradient>
      <radialGradient id={id('baubleIce')} cx="35%" cy="32%" r="65%">
        <stop offset="0%" stopColor="#bae6fd" />
        <stop offset="45%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0c4a6e" />
      </radialGradient>

      {/* Mantos dos Reis Magos e Sagrada Família */}
      <linearGradient id={id('robePurple')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9333ea" />
        <stop offset="100%" stopColor="#4c1d95" />
      </linearGradient>
      <linearGradient id={id('robeCrimson')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e11d48" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>
      <linearGradient id={id('robeEmerald')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0d9488" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>
      <linearGradient id={id('maryMantle')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="45%" stopColor="#1d4ed8" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
      <linearGradient id={id('sleighRuby')} x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="55%" stopColor="#b91c1c" />
        <stop offset="100%" stopColor="#6b0f0f" />
      </linearGradient>
      <linearGradient id={id('goldTrim')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id={id('reindeerCoat')} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#b45309" />
        <stop offset="65%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id={id('magicCometGold')} x1="0" y1="0.8" x2="1" y2="0.2">
        <stop offset="0%" stopColor="#fde047" stopOpacity="0" />
        <stop offset="35%" stopColor="#facc15" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#fef9c3" stopOpacity="0.95" />
      </linearGradient>
    </defs>
  );
}

/** Céu estrelado, aurora boreal animada, estrela cadente e cordilheiras nevadas orgânicas. */
function SkyAndMountains({
  width,
  height,
  prefix,
}: {
  width: number;
  height: number;
  prefix: string;
}) {
  const id = makeId(prefix);
  const scaleX = width / 1440;

  const stars = [
    { x: 0.04, y: 0.14, r: 1.4, diamond: false },
    { x: 0.08, y: 0.28, r: 1.1, diamond: false },
    { x: 0.13, y: 0.12, r: 2.1, diamond: true },
    { x: 0.19, y: 0.34, r: 1.3, diamond: false },
    { x: 0.25, y: 0.18, r: 1.5, diamond: false },
    { x: 0.33, y: 0.26, r: 1.9, diamond: true },
    { x: 0.41, y: 0.11, r: 1.4, diamond: false },
    { x: 0.47, y: 0.32, r: 1.2, diamond: false },
    { x: 0.55, y: 0.16, r: 2.2, diamond: true },
    { x: 0.62, y: 0.29, r: 1.4, diamond: false },
    { x: 0.68, y: 0.13, r: 1.8, diamond: true },
    { x: 0.74, y: 0.24, r: 1.2, diamond: false },
    { x: 0.81, y: 0.11, r: 1.6, diamond: false },
    { x: 0.88, y: 0.22, r: 2.0, diamond: true },
    { x: 0.94, y: 0.14, r: 1.4, diamond: false },
    { x: 0.97, y: 0.36, r: 1.3, diamond: false },
  ];

  // Silhuetas suaves de pinheiros distantes ao longo das colinas
  const distantPinesX = [85, 130, 175, 480, 520, 815, 860, 1295, 1345, 1390];

  return (
    <g>
      <rect x="0" y="0" width={width} height={height} fill={`url(#${id('skyGrad')})`} />

      {/* Cortinas de Aurora Boreal ondulando suavemente no céu */}
      <g filter={`url(#${id('auroraBlur')})`} className="natal-aurora-wave">
        <path
          d={`M${-60 * scaleX} ${height * 0.22} C${280 * scaleX} ${height * 0.06}, ${560 * scaleX} ${height * 0.32}, ${940 * scaleX} ${height * 0.14} C${1160 * scaleX} ${height * 0.04}, ${1340 * scaleX} ${height * 0.24}, ${width + 60} ${height * 0.12} L${width + 60} ${height * 0.38} C${1220 * scaleX} ${height * 0.42}, ${860 * scaleX} ${height * 0.24}, ${520 * scaleX} ${height * 0.4} C${240 * scaleX} ${height * 0.5}, ${40 * scaleX} ${height * 0.28}, ${-60 * scaleX} ${height * 0.36} Z`}
          fill={`url(#${id('auroraGreen')})`}
        />
        <path
          d={`M${120 * scaleX} ${height * 0.16} C${480 * scaleX} ${height * 0.28}, ${790 * scaleX} ${height * 0.04}, ${1180 * scaleX} ${height * 0.2} L${1260 * scaleX} ${height * 0.34} C${880 * scaleX} ${height * 0.18}, ${540 * scaleX} ${height * 0.4}, ${120 * scaleX} ${height * 0.3} Z`}
          fill={`url(#${id('auroraViolet')})`}
        />
      </g>

      {/* Estrelas cintilantes */}
      {stars.map((s, idx) => {
        const cx = s.x * width;
        const cy = s.y * height;
        if (s.diamond) {
          return (
            <path
              key={`st-${idx}`}
              d={`M${cx} ${cy - s.r * 3} Q${cx + 0.5} ${cy - 0.5} ${cx + s.r * 3} ${cy} Q${cx + 0.5} ${cy + 0.5} ${cx} ${cy + s.r * 3} Q${cx - 0.5} ${cy + 0.5} ${cx - s.r * 3} ${cy} Q${cx - 0.5} ${cy - 0.5} ${cx} ${cy - s.r * 3} Z`}
              fill="#fefce8"
              className="natal-star-twinkle"
              style={{ animationDelay: `${(idx * 0.42).toFixed(2)}s` }}
            />
          );
        }
        return (
          <circle
            key={`st-${idx}`}
            cx={cx}
            cy={cy}
            r={s.r}
            fill="#e2e8f0"
            className="natal-star-twinkle"
            style={{ animationDelay: `${(idx * 0.37).toFixed(2)}s` }}
          />
        );
      })}

      {/* Estrela Cadente atravessando o céu */}
      <g className="natal-shooting-star">
        <path
          d={`M${width * 0.58} ${height * 0.16} L${width * 0.68} ${height * 0.21}`}
          stroke="#fef9c3"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d={`M${width * 0.56} ${height * 0.15} L${width * 0.68} ${height * 0.21}`}
          stroke="#7dd3fc"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle cx={width * 0.68} cy={height * 0.21} r="2.2" fill="#ffffff" />
      </g>

      {/* Cadeia de Montanhas Distantes (curvas suaves, sem quinas) */}
      <path
        d={`M0 ${height * 0.66} C${180 * scaleX} ${height * 0.52}, ${310 * scaleX} ${height * 0.62}, ${490 * scaleX} ${height * 0.54} C${670 * scaleX} ${height * 0.46}, ${820 * scaleX} ${height * 0.6}, ${1020 * scaleX} ${height * 0.51} C${1190 * scaleX} ${height * 0.43}, ${1320 * scaleX} ${height * 0.56}, ${width} ${height * 0.52} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('mountainFar')})`}
      />
      <path
        d={`M0 ${height * 0.72} C${190 * scaleX} ${height * 0.62}, ${360 * scaleX} ${height * 0.69}, ${580 * scaleX} ${height * 0.61} C${790 * scaleX} ${height * 0.54}, ${980 * scaleX} ${height * 0.67}, ${1180 * scaleX} ${height * 0.58} C${1310 * scaleX} ${height * 0.54}, ${1390 * scaleX} ${height * 0.62}, ${width} ${height * 0.64} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('mountainMid')})`}
      />

      {/* Bosques distantes em silhueta orgânica curvada */}
      {distantPinesX.map((px, i) => {
        const x = px * scaleX;
        const baseY = height * (0.64 + (i % 3) * 0.02);
        const h = 22 + (i % 3) * 7;
        return (
          <path
            key={`dp-${i}`}
            d={`M${x} ${baseY - h} C${x - 4} ${baseY - h * 0.5}, ${x - 9} ${baseY - 4}, ${x - 10} ${baseY} C${x - 3} ${baseY - 2}, ${x + 3} ${baseY - 2}, ${x + 10} ${baseY} C${x + 9} ${baseY - 4}, ${x + 4} ${baseY - h * 0.5}, ${x} ${baseY - h} Z`}
            fill="#112244"
            opacity="0.72"
          />
        );
      })}

      {/* Névoa prateada de inverno entre as montanhas e as colinas */}
      <rect
        x="0"
        y={height * 0.56}
        width={width}
        height={height * 0.24}
        fill={`url(#${id('valleyMist')})`}
      />
    </g>
  );
}

/** Estrela Guia de Belém com feixe de luz volumétrico suave iluminando a manjedoura. */
function StarOfBethlehem({
  x,
  y,
  targetX,
  targetY,
  prefix,
}: {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  prefix: string;
}) {
  const id = makeId(prefix);
  const halfSpan = 105;
  return (
    <g>
      {/* Feixe luminoso difuso com Gaussian Blur — sem pontas rígidas */}
      <path
        d={`M${x - 4} ${y} C${x - 42} ${y + 65}, ${targetX - halfSpan * 0.78} ${targetY - 45}, ${targetX - halfSpan} ${targetY} L${targetX + halfSpan} ${targetY} C${targetX + halfSpan * 0.78} ${targetY - 45}, ${x + 42} ${y + 65}, ${x + 4} ${y} Z`}
        fill={`url(#${id('starBeam')})`}
        filter={`url(#${id('softBeamBlur')})`}
      />

      {/* Corpo radiante da Estrela Guia */}
      <g transform={`translate(${x}, ${y})`} className="natal-star-twinkle">
        <circle cx="0" cy="0" r="46" fill={`url(#${id('starAura')})`} />
        {/* Raios principais alongados com pontas finas */}
        <path
          d="M0 -34 C2.5 -8 6 -4.5 28 0 C6 4.5 2.5 8 0 42 C-2.5 8 -6 4.5 -28 0 C-6 -4.5 -2.5 -8 0 -34 Z"
          fill="#fef9c3"
        />
        {/* Raios diagonais menores */}
        <path
          d="M0 -18 C1.6 -5 4.2 -3 15 -11 C5.5 -2 4.5 2 14 13 C3 4 -1 6 0 18 C-1 6 -3 4 -14 13 C-4.5 2 -5.5 -2 -15 -11 C-4.2 -3 -1.6 -5 0 -18 Z"
          fill="#fde047"
          opacity="0.88"
        />
        <circle cx="0" cy="0" r="5" fill="#ffffff" />
      </g>
    </g>
  );
}

/** Os Três Reis Magos caminhando pela colina nevada acompanhando a Estrela Guia. */
function ThreeWiseMenCaravan({
  x,
  y,
  scale = 1,
  prefix,
}: {
  x: number;
  y: number;
  scale?: number;
  prefix: string;
}) {
  const id = makeId(prefix);
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Pegadas sutis iluminadas pelo luar na neve atrás dos Reis */}
      <g fill="#93c5fd" opacity="0.32">
        <ellipse cx="-26" cy="108" rx="4.5" ry="1.8" />
        <ellipse cx="-12" cy="106" rx="4.5" ry="1.8" />
        <ellipse cx="4" cy="107" rx="4.2" ry="1.6" />
      </g>

      {/* Mago 1: Melquior (manto real roxo + borda de arminho + cofre dourado) */}
      <g transform="translate(0, 12)">
        <ellipse cx="22" cy="96" rx="18" ry="4" fill="#64748b" opacity="0.3" />
        {/* Manto esvoaçante atrás */}
        <path
          d="M14 28 C5 48, 0 74, -6 93 C6 96, 18 96, 28 94 C26 68, 25 46, 22 28 Z"
          fill="#581c87"
        />
        {/* Túnica principal com caimento curvo */}
        <path
          d="M13 24 C11 52, 8 76, 8 95 C18 98, 30 98, 36 93 C35 72, 31 46, 27 24 Z"
          fill={`url(#${id('robePurple')})`}
        />
        {/* Estola dourada */}
        <path
          d="M19 25 C17 48, 17 72, 20 94"
          stroke="#facc15"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        {/* Gola de arminho fofa */}
        <path
          d="M12 24 C17 29, 25 29, 29 24 C27 21, 14 21, 12 24 Z"
          fill="#f8fafc"
        />
        {/* Cabeça e barba branca real */}
        <circle cx="21.5" cy="14.5" r="6" fill="#fed7aa" />
        <path
          d="M17 16 C18 23, 25 23, 27 16 C25 18, 19 18, 17 16 Z"
          fill="#f1f5f9"
        />
        {/* Coroa curvada ornamentada */}
        <path
          d="M14.5 11 C15 6, 18 5, 19.5 8 C20.5 4, 23 4, 24 8 C25.5 5, 28 6, 28.5 11 Z"
          fill={`url(#${id('goldTrim')})`}
        />
        {/* Braço e cofre de ouro */}
        <path
          d="M24 30 C29 36, 33 41, 35 44"
          stroke="#9333ea"
          strokeWidth="4.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M32 39 C35 37, 42 37, 44 40 L43 47 C39 48, 34 48, 32 46 Z"
          fill={`url(#${id('goldTrim')})`}
          stroke="#92400e"
          strokeWidth="0.9"
        />
      </g>

      {/* Mago 2: Gaspar (manto carmesim + turbante real + incensário com fumaça animada) */}
      <g transform="translate(52, 6)">
        <ellipse cx="22" cy="100" rx="18" ry="4" fill="#64748b" opacity="0.3" />
        {/* Capa carmesim ampla em curva */}
        <path
          d="M15 26 C6 48, 2 76, 1 98 C12 101, 25 101, 34 97 C34 72, 30 48, 26 26 Z"
          fill={`url(#${id('robeCrimson')})`}
        />
        {/* Faixa de seda dourada */}
        <path
          d="M13 48 C18 53, 25 53, 29 48"
          stroke="#fde047"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Cabeça & barba castanha */}
        <circle cx="21" cy="15" r="6" fill="#f1b488" />
        <path
          d="M16.5 17 C18.5 22.5, 24.5 22.5, 26.5 16.5"
          fill="#451a03"
        />
        {/* Turbante real em camadas curvas */}
        <path
          d="M13.5 12 C13 4, 28 3, 28.5 12 C24 14, 17 14, 13.5 12 Z"
          fill="#f8fafc"
        />
        <path
          d="M14.5 10 C19 6.5, 24 7, 27.5 10"
          stroke="#facc15"
          strokeWidth="1.6"
          fill="none"
        />
        <circle cx="21" cy="7.5" r="2" fill="#10b981" />
        {/* Incensário suspenso */}
        <g transform="translate(33, 39)">
          <path
            d="M-3 -3 L4 11"
            stroke="#fde047"
            strokeWidth="1.1"
          />
          <path
            d="M1 11 C3 8, 8 8, 10 11 C10 16, 7 18, 5.5 18 C4 18, 1 16, 1 11 Z"
            fill={`url(#${id('goldTrim')})`}
          />
          {/* Fumaça suave de incenso subindo */}
          <path
            d="M5.5 7 C3 3, 8 -1, 5.5 -6"
            stroke="#e2e8f0"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            className="natal-incense-float"
          />
        </g>
      </g>

      {/* Mago 3: Baltazar (manto esmeralda + lanterna luminosa guiando o caminho) */}
      <g transform="translate(104, 14)">
        <ellipse cx="21" cy="94" rx="17" ry="4" fill="#64748b" opacity="0.3" />
        {/* Halo aconchegante da lanterna na neve */}
        <circle
          cx="39"
          cy="62"
          r="20"
          fill={`url(#${id('hearthGlow')})`}
          className="natal-hearth-breath"
        />
        <path
          d="M14 24 C6 46, 4 72, 6 92 C16 95, 27 95, 34 91 C32 68, 29 46, 26 24 Z"
          fill={`url(#${id('robeEmerald')})`}
        />
        <path
          d="M16 25 C12 44, 10 68, 13 91"
          stroke="#34d399"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />
        <circle cx="20.5" cy="14" r="5.8" fill="#8d5524" />
        <path
          d="M13.5 11.5 C15 6.5, 25 6.5, 27.5 11.5"
          stroke="#facc15"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
        {/* Braço segurando lanterna oscilante e vaso de mirra */}
        <path
          d="M24 30 C30 35, 34 40, 38 44"
          stroke="#0f766e"
          strokeWidth="4.4"
          strokeLinecap="round"
          fill="none"
        />
        <g transform="translate(38, 44)" className="natal-ornament-sway">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#facc15" strokeWidth="1.2" />
          <path
            d="M-4 7 L4 7 L5 16 L-5 16 Z"
            fill="#fef08a"
            stroke="#92400e"
            strokeWidth="1.2"
          />
          <circle cx="0" cy="11.5" r="2.2" fill="#ffffff" />
        </g>
      </g>
    </g>
  );
}

/**
 * Estábulo de Belém com Menino Jesus na Manjedoura, Maria, José com lanterna,
 * cordeirinho sereno e telhado curvo coberto por neve macia.
 */
function BethlehemNativityStable({
  x,
  y,
  scale = 1,
  prefix,
}: {
  x: number;
  y: number;
  scale?: number;
  prefix: string;
}) {
  const id = makeId(prefix);
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Tamareira de Belém curvando suavemente atrás da cabana */}
      <g opacity="0.48">
        <path
          d="M24 132 C16 95, 10 62, 18 32"
          stroke="#3f2718"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M18 32 C4 20, -10 26, -18 38 M18 32 C6 14, -4 10, -14 14 M18 32 C26 15, 38 14, 48 22 M18 32 C32 28, 42 36, 46 46"
          stroke="#064e3b"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Clarão dourado acolhedor emanando da Manjedoura */}
      <circle
        cx="112"
        cy="98"
        r="86"
        fill={`url(#${id('hearthGlow')})`}
        className="natal-hearth-breath"
      />

      {/* Sombra macia do abrigo na neve */}
      <ellipse cx="112" cy="144" rx="92" ry="9" fill="#64748b" opacity="0.32" />

      {/* Parede traseira orgânica sombreada do estábulo */}
      <path
        d="M28 56 C58 34, 88 20, 112 10 C136 20, 166 34, 196 56 L194 140 L30 140 Z"
        fill="#1e150e"
        opacity="0.82"
      />
      {/* Ripas rústicas sutis no fundo */}
      <path
        d="M58 44 L58 138 M84 28 L84 138 M140 28 L140 138 M166 44 L166 138"
        stroke="#2c1d12"
        strokeWidth="1.6"
        opacity="0.55"
      />

      {/* Colunas de madeira natural curvada */}
      <path
        d="M34 54 C33 82, 34 110, 32 140"
        stroke="#6b3410"
        strokeWidth="8.5"
        strokeLinecap="round"
      />
      <path
        d="M190 54 C191 82, 189 110, 192 140"
        stroke="#6b3410"
        strokeWidth="8.5"
        strokeLinecap="round"
      />
      <path
        d="M34 66 L54 46 M190 66 L170 46"
        stroke="#78350f"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Telhado de palha e madeira orgânica */}
      <path
        d="M14 60 C52 38, 84 22, 112 6 C140 22, 172 38, 210 60"
        stroke="#854d0e"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      {/* Cobertor espesso e macio de neve sobre o telhado */}
      <path
        d="M12 56 C48 36, 82 20, 112 4 C142 20, 176 36, 212 56 C204 62, 194 60, 184 54 C162 42, 138 28, 112 16 C86 28, 62 42, 40 54 C30 60, 20 62, 12 56 Z"
        fill="#f1f5f9"
      />
      {/* Pequenos pingentes de gelo cristalinos sob o beiral */}
      <path
        d="M24 58 L26 68 L28 58 M194 58 L196 67 L198 58"
        fill="#bae6fd"
        opacity="0.75"
      />

      {/* MARIA ajoelhada em oração à esquerda da Manjedoura */}
      <g transform="translate(46, 62)">
        <circle
          cx="18"
          cy="14"
          r="12"
          fill="none"
          stroke="#fde047"
          strokeWidth="1.4"
          opacity="0.78"
        />
        {/* Manto azul esvoaçante curvado */}
        <path
          d="M3 76 C6 48, 11 28, 20 22 C30 28, 35 48, 35 76 C24 80, 12 80, 3 76 Z"
          fill={`url(#${id('maryMantle')})`}
        />
        {/* Véu claro em cascata sobre o ombro */}
        <path
          d="M11 16 C12 7, 25 6, 26 16 C27 32, 23 48, 16 54 C11 45, 9 30, 11 16 Z"
          fill="#7dd3fc"
          opacity="0.92"
        />
        <circle cx="20.5" cy="15.5" r="5" fill="#fed7aa" />
        {/* Mãos unidas suavemente em direção à manjedoura */}
        <path
          d="M23 36 C28 38, 31 41, 32 44"
          stroke="#fed7aa"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </g>

      {/* MANJEDOURA COM PALHA DOURADA E MENINO JESUS */}
      <g transform="translate(88, 92)">
        {/* Pernas em X entalhadas em madeira */}
        <path
          d="M10 22 L42 48 M42 22 L10 48"
          stroke="#78350f"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Berço de tábuas curvas */}
        <path
          d="M4 18 C16 20, 36 20, 48 18 L43 32 C32 34, 20 34, 9 32 Z"
          fill="#92400e"
          stroke="#451a03"
          strokeWidth="1.2"
        />
        {/* Fios dourados de palha saindo do berço */}
        <path
          d="M4 18 C12 8, 24 6, 32 14 C38 7, 45 10, 48 18 Z"
          fill="#facc15"
        />
        <path
          d="M6 16 L14 9 M19 14 L23 7 M30 14 L36 8 M39 16 L46 11"
          stroke="#fef08a"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Auréola celeste e Menino Jesus em panos brancos */}
        <circle
          cx="25"
          cy="11"
          r="13"
          fill={`url(#${id('hearthGlow')})`}
          className="natal-hearth-breath"
        />
        <ellipse
          cx="29"
          cy="14.5"
          rx="11"
          ry="5.2"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        <path
          d="M22 12 C26 15, 31 15, 36 12"
          stroke="#cbd5e1"
          strokeWidth="1"
          fill="none"
        />
        <circle cx="17.5" cy="11.5" r="4.6" fill="#fed7aa" />
      </g>

      {/* Cordeirinho sereno descansando na neve ao pé da Manjedoura */}
      <g transform="translate(136, 124)">
        <ellipse cx="10" cy="8" rx="9" ry="6" fill="#f8fafc" />
        <circle cx="4" cy="6" r="4.2" fill="#ffffff" />
        <circle cx="15" cy="6" r="4.5" fill="#ffffff" />
        <circle cx="19" cy="4" r="3.2" fill="#fed7aa" />
        <ellipse cx="16.5" cy="3.2" rx="2.2" ry="1.2" transform="rotate(-25 16.5 3.2)" fill="#e2e8f0" />
      </g>

      {/* JOSÉ protetor com cajado e lanterna acesa à direita */}
      <g transform="translate(148, 48)">
        <circle
          cx="17"
          cy="14"
          r="12"
          fill="none"
          stroke="#fde047"
          strokeWidth="1.3"
          opacity="0.72"
        />
        {/* Manto castanho-dourado com dobras */}
        <path
          d="M5 88 C6 54, 10 30, 18 24 C27 30, 31 54, 31 88 C21 91, 12 91, 5 88 Z"
          fill="#9a3412"
        />
        <path
          d="M7 26 C14 38, 22 38, 28 26 L29 58 C20 62, 12 62, 6 58 Z"
          fill="#d97706"
          opacity="0.78"
        />
        <circle cx="17.5" cy="15.5" r="5.4" fill="#fed7aa" />
        {/* Capuz e barba de José */}
        <path
          d="M11 14 C11 6, 24 6, 24 14"
          stroke="#7c2d12"
          strokeWidth="4.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M13 18 C15 23, 20 23, 22 18"
          fill="#5c3a21"
        />
        {/* Cajado de pastor + lanterna quente balançando */}
        <path
          d="M34 15 L31 88"
          stroke="#92400e"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M27 15 C31 6, 39 6, 40 16"
          stroke="#92400e"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
        <g transform="translate(39, 17)" className="natal-ornament-sway">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#facc15" strokeWidth="1.2" />
          <path
            d="M-3.5 6 L3.5 6 L4.5 14 L-4.5 14 Z"
            fill="#fde047"
            stroke="#78350f"
            strokeWidth="1.1"
          />
          <circle cx="0" cy="10" r="2" fill="#ffffff" />
        </g>
      </g>
    </g>
  );
}

/**
 * Árvore de Natal Majestosa & Esculpida (ZERO triângulos retos):
 * Galhos orgânicos ondulados em 6 camadas sombreadas, festões curvos, bolinhas 3D,
 * lâmpadas LED alternadas, neve nos galhos e presentes com laços na base.
 */
function OrnateChristmasTree({
  x,
  y,
  scale = 1,
  prefix,
}: {
  x: number;
  y: number;
  scale?: number;
  prefix: string;
}) {
  const id = makeId(prefix);

  // Galhos orgânicos recortados em curvas Bezier (sem lados retos de triângulo)
  const boughs = [
    {
      path: 'M0 158 C-34 176, -68 188, -104 226 C-76 234, -52 222, -26 234 C-10 240, 10 240, 26 234 C52 222, 76 234, 104 226 C68 188, 34 176, 0 158 Z',
      fill: `url(#${id('pineTierDark')})`,
    },
    {
      path: 'M0 124 C-28 142, -58 156, -88 192 C-62 200, -40 190, -18 200 C-4 206, 4 206, 18 200 C40 190, 62 200, 88 192 C58 156, 28 142, 0 124 Z',
      fill: `url(#${id('pineTierMid')})`,
    },
    {
      path: 'M0 92 C-24 110, -48 124, -72 156 C-50 163, -32 155, -14 164 C-4 168, 4 168, 14 164 C32 155, 50 163, 72 156 C48 124, 24 110, 0 92 Z',
      fill: `url(#${id('pineTierDark')})`,
    },
    {
      path: 'M0 64 C-20 80, -38 92, -56 120 C-38 126, -24 119, -10 127 C-2 130, 2 130, 10 127 C24 119, 38 126, 56 120 C38 92, 20 80, 0 64 Z',
      fill: `url(#${id('pineTierMid')})`,
    },
    {
      path: 'M0 36 C-15 50, -28 62, -40 86 C-26 91, -15 86, 0 92 C15 86, 26 91, 40 86 C28 62, 15 50, 0 36 Z',
      fill: `url(#${id('pineTierBright')})`,
    },
  ];

  const bulbs = [
    { bx: -14, by: 76, p: 0 },
    { bx: 15, by: 82, p: 1 },
    { bx: -30, by: 108, p: 2 },
    { bx: 2, by: 115, p: 3 },
    { bx: 32, by: 112, p: 4 },
    { bx: -45, by: 145, p: 1 },
    { bx: -12, by: 151, p: 0 },
    { bx: 20, by: 148, p: 2 },
    { bx: 48, by: 144, p: 3 },
    { bx: -60, by: 184, p: 4 },
    { bx: -24, by: 192, p: 1 },
    { bx: 16, by: 191, p: 0 },
    { bx: 58, by: 182, p: 2 },
    { bx: -72, by: 222, p: 3 },
    { bx: -28, by: 229, p: 2 },
    { bx: 28, by: 228, p: 4 },
    { bx: 74, by: 221, p: 1 },
  ];

  const baubles = [
    { cx: -21, cy: 96, r: 5.2, type: 'baubleRuby' },
    { cx: 19, cy: 102, r: 4.8, type: 'baubleGold' },
    { cx: -38, cy: 132, r: 5.8, type: 'baubleIce' },
    { cx: 6, cy: 134, r: 5.4, type: 'baubleRuby' },
    { cx: 36, cy: 130, r: 5.2, type: 'baubleGold' },
    { cx: -50, cy: 170, r: 6.2, type: 'baubleGold' },
    { cx: -8, cy: 175, r: 6, type: 'baubleRuby' },
    { cx: 38, cy: 172, r: 6, type: 'baubleIce' },
    { cx: -64, cy: 208, r: 6.4, type: 'baubleRuby' },
    { cx: -16, cy: 214, r: 6.2, type: 'baubleGold' },
    { cx: 34, cy: 213, r: 6.2, type: 'baubleRuby' },
    { cx: 68, cy: 206, r: 5.8, type: 'baubleIce' },
  ];

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Reflexo caloroso da árvore sobre a neve */}
      <ellipse cx="0" cy="254" rx="108" ry="16" fill="#64748b" opacity="0.28" />
      <ellipse cx="0" cy="250" rx="88" ry="12" fill={`url(#${id('hearthGlow')})`} opacity="0.48" />

      {/* Tronco orgânico esculpido com base enraizada */}
      <path
        d="M-13 218 C-12 230, -14 244, -20 254 L20 254 C14 244, 12 230, 13 218 Z"
        fill="#5c2d0c"
      />

      {/* Camadas orgânicas dos galhos */}
      {boughs.map((b, i) => (
        <path key={`bough-${i}`} d={b.path} fill={b.fill} />
      ))}

      {/* Toques sutis de neve repousando nos galhos superiores */}
      <path
        d="M-38 84 C-26 88, -16 84, -8 87 M12 85 C22 88, 30 84, 38 84 M-68 154 C-52 159, -38 154, -24 157 M28 155 C44 158, 56 153, 70 154 M-96 223 C-78 229, -62 220, -44 225 M44 224 C62 228, 78 220, 98 223"
        stroke="#e0f2fe"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.58"
      />

      {/* Festões sedosos dourados & vermelhos em curvas naturais */}
      <path
        d="M-26 76 C-8 90, 10 90, 28 78"
        stroke={`url(#${id('goldTrim')})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M-48 114 C-14 132, 16 132, 48 112"
        stroke="#dc2626"
        strokeWidth="3.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M-66 150 C-18 172, 20 172, 66 148"
        stroke={`url(#${id('goldTrim')})`}
        strokeWidth="3.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M-84 188 C-26 212, 28 212, 84 186"
        stroke="#dc2626"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bolinhas 3D sombreadas com reflexo */}
      {baubles.map((b, i) => (
        <g key={`bauble-${i}`}>
          <rect x={b.cx - 1.6} y={b.cy - b.r - 2} width="3.2" height="2.6" rx="0.8" fill="#facc15" />
          <circle cx={b.cx} cy={b.cy} r={b.r} fill={`url(#${id(b.type)})`} />
          <path
            d={`M${b.cx - b.r * 0.45} ${b.cy - b.r * 0.15} C${b.cx - b.r * 0.45} ${b.cy - b.r * 0.55}, ${b.cx - b.r * 0.1} ${b.cy - b.r * 0.55}, ${b.cx + b.r * 0.1} ${b.cy - b.r * 0.45}`}
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
        </g>
      ))}

      {/* Luzes LED piscantes */}
      {bulbs.map((pt, i) => {
        const pal = LED_PALETTE[pt.p % LED_PALETTE.length];
        const cls = i % 2 === 0 ? 'natal-led-odd' : 'natal-led-even';
        return (
          <g key={`tl-${i}`} className={cls}>
            <circle cx={pt.bx} cy={pt.by} r="7.5" fill={pal.glow} opacity="0.34" />
            <circle cx={pt.bx} cy={pt.by} r="3.4" fill={pal.fill} />
          </g>
        );
      })}

      {/* Estrela Dourada no Topo da Árvore */}
      <g transform="translate(0, 28)" className="natal-star-twinkle">
        <circle cx="0" cy="0" r="24" fill={`url(#${id('starAura')})`} />
        <path
          d="M0 -18 C2 -5 4 -4 17 -4 C6 2 5 5 10 16 C1 8 -1 8 -10 16 C-5 5 -6 2 -17 -4 C-4 -4 -2 -5 0 -18 Z"
          fill={`url(#${id('goldTrim')})`}
          stroke="#fef9c3"
          strokeWidth="0.9"
        />
      </g>

      {/* Presentes curvados em perspectiva 3D e laços ao pé da árvore */}
      {/* Presente Esquerdo (Carmesim com laço dourado) */}
      <g transform="translate(-62, 232)">
        <path
          d="M0 5 L16 0 L34 6 L18 11 Z"
          fill="#ef4444"
        />
        <path
          d="M0 5 L18 11 L18 27 L0 21 Z"
          fill="#b91c1c"
        />
        <path
          d="M18 11 L34 6 L34 22 L18 27 Z"
          fill="#991b1b"
        />
        {/* Fitas douradas acompanhando os 3 planos */}
        <path d="M8 2.5 L26 8.5 M26 8.5 L26 24.5 M8 8 L8 24 M8 8 L25 3" stroke="#facc15" strokeWidth="2.8" fill="none" />
        {/* Laço fofo no topo */}
        <path
          d="M17 5 C11 -2, 8 2, 16 6 C24 2, 22 -2, 17 5 Z"
          fill="#fde047"
        />
      </g>

      {/* Presente Central-Esquerdo (Azul Real com laço prata) */}
      <g transform="translate(-26, 240)">
        <path d="M0 4 L12 0 L26 5 L14 9 Z" fill="#3b82f6" />
        <path d="M0 4 L14 9 L14 21 L0 16 Z" fill="#1d4ed8" />
        <path d="M14 9 L26 5 L26 17 L14 21 Z" fill="#1e3a8a" />
        <path d="M6 2 L20 7 M20 7 L20 19 M7 6.5 L7 18.5" stroke="#f8fafc" strokeWidth="2.2" fill="none" />
        <path d="M13 4 C9 -1, 7 2, 13 5 C19 2, 17 -1, 13 4 Z" fill="#ffffff" />
      </g>

      {/* Presente Direito (Dourado & Esmeralda) */}
      <g transform="translate(26, 234)">
        <path d="M0 5 L15 0 L32 6 L17 11 Z" fill="#facc15" />
        <path d="M0 5 L17 11 L17 26 L0 20 Z" fill="#d97706" />
        <path d="M17 11 L32 6 L32 21 L17 26 Z" fill="#b45309" />
        <path d="M7.5 2.5 L24.5 8.5 M24.5 8.5 L24.5 23.5 M8 8 L8 23" stroke="#16a34a" strokeWidth="2.8" fill="none" />
        <path d="M16 5 C10 -2, 8 2, 16 6 C24 2, 22 -2, 16 5 Z" fill="#22c55e" />
      </g>
    </g>
  );
}

/**
 * Papai Noel no Trenó Ornamentado levantando voo em formação diagonal
 * com 4 renas articuladas galopando (Rodolfo na ponta com farol vermelho vivo)
 * e rastro mágico contínuo saindo das pistas na neve.
 */
function SantaSleighTakeoffTeam({
  x,
  y,
  scale = 1,
  prefix,
}: {
  x: number;
  y: number;
  scale?: number;
  prefix: string;
}) {
  const id = makeId(prefix);

  // 4 renas em formação dinâmica curva subindo para a direita superior
  const reindeerTeam = [
    { rx: 145, ry: -24, phase: 0, lead: false },
    { rx: 215, ry: -54, phase: 0.22, lead: false },
    { rx: 285, ry: -86, phase: 0.44, lead: false },
    { rx: 356, ry: -118, phase: 0.12, lead: true },
  ];

  // Faíscas mágicas flutuantes ao longo do rastro
  const magicSparkles = [
    { sx: -92, sy: 62, delay: '0.1s', r: 3.5 },
    { sx: -48, sy: 48, delay: '0.7s', r: 4.5 },
    { sx: -12, sy: 34, delay: '1.3s', r: 3.2 },
    { sx: 38, sy: 16, delay: '0.4s', r: 4.2 },
    { sx: -72, sy: 74, delay: '1.1s', r: 3 },
    { sx: 14, sy: 46, delay: '1.7s', r: 3.8 },
  ];

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Rastro Mágico Duplo animado fluindo de baixo da neve até o trenó */}
      <path
        d="M-128 84 C-64 74, 8 54, 72 16"
        stroke={`url(#${id('magicCometGold')})`}
        strokeWidth="4.2"
        strokeDasharray="16 12"
        strokeLinecap="round"
        fill="none"
        className="natal-magic-trail"
      />
      <path
        d="M-108 94 C-42 82, 24 62, 86 24"
        stroke="#7dd3fc"
        strokeWidth="2.4"
        strokeDasharray="10 14"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
        className="natal-magic-trail"
      />

      {/* Partículas cintilantes atrás da decolagem */}
      {magicSparkles.map((sp, i) => (
        <path
          key={`sp-${i}`}
          d={`M${sp.sx} ${sp.sy - sp.r} Q${sp.sx + 0.5} ${sp.sy - 0.5} ${sp.sx + sp.r} ${sp.sy} Q${sp.sx + 0.5} ${sp.sy + 0.5} ${sp.sx} ${sp.sy + sp.r} Q${sp.sx - 0.5} ${sp.sy + 0.5} ${sp.sx - sp.r} ${sp.sy} Q${sp.sx - 0.5} ${sp.sy - 0.5} ${sp.sx} ${sp.sy - sp.r} Z`}
          fill={i % 2 === 0 ? '#fef08a' : '#bae6fd'}
          className="natal-star-twinkle"
          style={{ animationDelay: sp.delay }}
        />
      ))}

      {/* Conjunto Trenó + Papai Noel + 4 Renas em voo fluido */}
      <g className="natal-santa-flight">
        {/* Rédeas douradas contínuas do Papai Noel até o arreio de cada rena */}
        <path
          d="M54 -14 C105 -20, 128 -26, 158 -32 C192 -42, 212 -52, 228 -62 C262 -72, 282 -82, 298 -94 C332 -106, 354 -116, 368 -126"
          stroke="#facc15"
          strokeWidth="1.6"
          fill="none"
          opacity="0.88"
        />

        {/* TRENÓ VITORIANO E PAPAI NOEL inclinados levantando voo (-18deg) */}
        <g transform="translate(24, 0) rotate(-18)">
          {/* Saco volumoso de veludo com brinquedos e presentes saindo */}
          <path
            d="M-38 -20 C-42 -42, -14 -48, -6 -24 C-2 -12, -10 -4, -32 -6 Z"
            fill="#7f1d1d"
          />
          <path
            d="M-28 -44 C-26 -48, -19 -48, -17 -43"
            stroke="#facc15"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Presentes em curva peeking do saco */}
          <path d="M-36 -48 L-24 -52 L-21 -38 L-33 -34 Z" fill="#22c55e" />
          <path d="M-30 -50 L-27 -36" stroke="#facc15" strokeWidth="2.2" />
          <path d="M-22 -52 L-10 -50 L-12 -36 L-24 -38 Z" fill="#3b82f6" />
          <path d="M-16 -51 L-18 -37" stroke="#f8fafc" strokeWidth="2.2" />
          {/* Bengala doce natalina */}
          <path
            d="M-10 -42 C-7 -56, 1 -55, 0 -47"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M-10 -42 C-7 -56, 1 -55, 0 -47"
            stroke="#ef4444"
            strokeWidth="3.2"
            strokeDasharray="3 3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Papai Noel alegre acenando com barba esvoaçante */}
          <g transform="translate(6, -34)">
            {/* Corpo aconchegante vermelho com barra branca */}
            <path
              d="M-10 26 C-8 6, 14 4, 18 26 Z"
              fill="#dc2626"
            />
            <path d="M-10 25 C-2 27, 10 27, 18 25" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
            {/* Rosto rosado + barba branca ondulada ao vento */}
            <circle cx="5" cy="4" r="6.8" fill="#fed7aa" />
            <circle cx="7" cy="4" r="1.4" fill="#fb7185" />
            <path
              d="M-2 5 C0 18, 12 19, 13 6 C8 8, 2 8, -2 5 Z"
              fill="#ffffff"
            />
            {/* Gorro macio dobrado para trás pelo vento */}
            <path
              d="M-3 0 C0 -14, 12 -14, 14 -1 C10 1, 2 1, -3 0 Z"
              fill="#dc2626"
            />
            <path d="M-4 0 C1 -2, 10 -2, 14 0" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" />
            <circle cx="-6" cy="-7" r="2.8" fill="#ffffff" />
            {/* Braço erguido acenando */}
            <path
              d="M12 12 C18 6, 24 0, 26 -6"
              stroke="#dc2626"
              strokeWidth="4.6"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="26.5" cy="-6.5" r="3" fill="#ffffff" />
          </g>

          {/* Carroceria escultural vitoriana do trenó */}
          <path
            d="M-46 -18 C-44 6, -36 12, -20 12 L24 12 C40 12, 48 -4, 42 -16 C34 -20, 28 -10, 22 -8 C14 -6, 6 -16, -2 -14 C-12 -12, -16 -24, -46 -18 Z"
            fill={`url(#${id('sleighRuby')})`}
            stroke={`url(#${id('goldTrim')})`}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Filigrana dourada lateral */}
          <path
            d="M-28 2 C-12 6, 8 6, 26 -2"
            stroke="#fde047"
            strokeWidth="1.6"
            fill="none"
            opacity="0.85"
          />
          {/* Patins dourados longos com ponta enrolada em espiral */}
          <path
            d="M-50 20 L34 20 C50 20, 56 8, 48 2 C44 0, 40 4, 44 7"
            stroke={`url(#${id('goldTrim')})`}
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M-26 12 L-28 20 M16 12 L18 20"
            stroke="#eab308"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </g>

        {/* 4 RENAS ARTICULADAS EM GALOPE ASCENDENTE */}
        {reindeerTeam.map((rd, rIdx) => (
          <g
            key={`rd-${rIdx}`}
            transform={`translate(${rd.rx}, ${rd.ry}) rotate(-21)`}
          >
            {/* Pernas traseiras em movimento articulado */}
            <g
              className="natal-gallop-hind"
              style={{ animationDelay: `${rd.phase}s` }}
            >
              <path
                d="M-12 5 C-18 11, -24 14, -27 17"
                stroke="#6b2d0c"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M-8 6 C-12 13, -17 17, -21 21"
                stroke="#451a03"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* Pernas dianteiras em movimento articulado alternado */}
            <g
              className="natal-gallop-fore"
              style={{ animationDelay: `${rd.phase}s` }}
            >
              <path
                d="M11 4 C18 7, 24 8, 28 5"
                stroke="#78350f"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M9 6 C14 12, 19 15, 24 14"
                stroke="#451a03"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* Rabo erguido fofo branco por baixo */}
            <path
              d="M-15 0 C-21 -4, -22 -7, -18 -8 C-15 -7, -14 -4, -15 0 Z"
              fill="#f8fafc"
            />

            {/* Silhueta anatômica curvada da rena (peito, dorso, pescoço arqueado, focinho) */}
            <path
              d="M-16 2 C-16 -4, -6 -6, 3 -4 C8 -3, 12 -9, 15 -14 C18 -16, 24 -14, 26 -10 C26 -8, 22 -6, 17 -6 C16 -1, 14 5, 6 7 C-2 8, -14 7, -16 2 Z"
              fill={`url(#${id('reindeerCoat')})`}
            />

            {/* Peitoral peludo creme + arreio vermelho com guizo dourado */}
            <path
              d="M9 -3 C12 0, 14 2, 14 5"
              stroke="#fef3c7"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
            <path d="M5 -4 L7 7" stroke="#dc2626" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="11" cy="-2" r="2.2" fill="#facc15" />

            {/* Galhada real curvada */}
            <path
              d="M17 -14 C15 -21, 12 -24, 9 -25 M15 -19 C12 -20, 10 -20, 8 -19 M16 -21 C18 -25, 20 -26, 22 -26"
              stroke="#fde68a"
              strokeWidth="1.7"
              strokeLinecap="round"
              fill="none"
            />

            {/* Rodolfo na dianteira com farol vermelho vivo */}
            {rd.lead ? (
              <g>
                {/* Cone sutil de luz vermelha à frente de Rodolfo */}
                <path
                  d="M27 -10 L62 -22 L62 2 Z"
                  fill={`url(#${id('rudolphGlow')})`}
                  opacity="0.45"
                  filter={`url(#${id('softGlow')})`}
                />
                <circle
                  cx="26.5"
                  cy="-10"
                  r="8.5"
                  fill={`url(#${id('rudolphGlow')})`}
                  className="natal-rudolph-beacon"
                />
                <circle cx="26.5" cy="-10" r="2.8" fill="#ef4444" />
                <circle cx="25.8" cy="-10.8" r="0.9" fill="#ffffff" />
              </g>
            ) : (
              <circle cx="26" cy="-10" r="1.5" fill="#291206" />
            )}
          </g>
        ))}
      </g>
    </g>
  );
}

/** Colinas nevadas contínuas no horizonte e camada profunda de base para acomodar o rodapé flutuante. */
function SnowHillsForeground({
  width,
  height,
  treeX,
  prefix,
  isDesktop,
}: {
  width: number;
  height: number;
  treeX: number;
  prefix: string;
  isDesktop: boolean;
}) {
  const id = makeId(prefix);
  const scaleX = width / 1440;
  const horizonY = isDesktop ? 310 : 418;

  return (
    <g>
      {/* Colina distante iluminada pelo luar */}
      <path
        d={`M0 ${horizonY + 12} C${220 * scaleX} ${horizonY - 22}, ${460 * scaleX} ${horizonY + 14}, ${treeX} ${horizonY - 2} C${960 * scaleX} ${horizonY - 18}, ${1190 * scaleX} ${horizonY - 34}, ${width} ${horizonY - 8} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('snowHorizon')})`}
      />

      {/* Colina intermediária onde repousam o Presépio, os Reis e a base da Árvore */}
      <path
        d={`M0 ${horizonY + 34} C${280 * scaleX} ${horizonY + 12}, ${520 * scaleX} ${horizonY + 38}, ${treeX + 40 * scaleX} ${horizonY + 18} C${990 * scaleX} ${horizonY + 2}, ${1210 * scaleX} ${horizonY - 12}, ${width} ${horizonY + 20} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('snowMid')})`}
      />

      {/* Trilho duplo na neve onde o trenó acabou de decolar (lado direito) */}
      {isDesktop && (
        <g opacity="0.55">
          <path
            d="M845 344 C912 332, 976 318, 1020 302"
            stroke="#93c5fd"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M862 350 C928 338, 990 324, 1034 307"
            stroke="#93c5fd"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}

      {/* Primeiro plano de neve fofa até o último pixel inferior (encaixe perfeito no rodapé e doca) */}
      <path
        d={`M0 ${height - (isDesktop ? 82 : 92)} C${320 * scaleX} ${height - (isDesktop ? 104 : 114)}, ${680 * scaleX} ${height - (isDesktop ? 76 : 84)}, ${1040 * scaleX} ${height - (isDesktop ? 96 : 104)} C${1240 * scaleX} ${height - (isDesktop ? 104 : 112)}, ${1360 * scaleX} ${height - (isDesktop ? 86 : 94)}, ${width} ${height - (isDesktop ? 78 : 86)} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('snowFront')})`}
      />

      {/* Pequenos pinheiros nevados laterais emoldurando suavemente as bordas externas no desktop */}
      {isDesktop && (
        <g opacity="0.9">
          <path
            d={`M18 ${height - 68} C8 ${height - 84}, 4 ${height - 104}, 14 ${height - 124} C22 ${height - 104}, 30 ${height - 84}, 36 ${height - 68} Z`}
            fill="#064e3b"
          />
          <path
            d={`M${width - 18} ${height - 66} C${width - 8} ${height - 84}, ${width - 4} ${height - 104}, ${width - 14} ${height - 124} C${width - 22} ${height - 104}, ${width - 30} ${height - 84}, ${width - 36} ${height - 66} Z`}
            fill="#064e3b"
          />
        </g>
      )}
    </g>
  );
}

/** Neve suave adicional caindo diretamente dentro da paisagem para unir céu e solo. */
function SceneAtmosphericSnow({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const dots = [
    { x: 0.07, y: 0.28, r: 1.8, d: '0.2s' },
    { x: 0.16, y: 0.45, r: 2.3, d: '0.8s' },
    { x: 0.24, y: 0.22, r: 1.6, d: '1.4s' },
    { x: 0.34, y: 0.56, r: 2.1, d: '0.5s' },
    { x: 0.44, y: 0.31, r: 1.9, d: '1.1s' },
    { x: 0.52, y: 0.48, r: 2.4, d: '1.7s' },
    { x: 0.61, y: 0.27, r: 1.7, d: '0.4s' },
    { x: 0.69, y: 0.54, r: 2.2, d: '0.9s' },
    { x: 0.78, y: 0.35, r: 1.8, d: '1.5s' },
    { x: 0.87, y: 0.49, r: 2.4, d: '0.3s' },
    { x: 0.93, y: 0.29, r: 1.7, d: '1.2s' },
  ];
  return (
    <g>
      {dots.map((pt, i) => (
        <circle
          key={`as-${i}`}
          cx={pt.x * width}
          cy={pt.y * height}
          r={pt.r}
          fill="#ffffff"
          opacity="0.72"
          className="natal-star-twinkle"
          style={{ animationDelay: pt.d }}
        />
      ))}
    </g>
  );
}

/**
 * Paisagem Natalina Full-Bleed Integrada ao Rodapé da Vitrine (Free e PRO):
 * - Funde-se organicamente ao fundo da página (Claro ou Escuro) sem bordas ou caixas quadradas;
 * - Composição cinematográfica panorâmica no Desktop (1440×430) e dedicada no Mobile (600×520);
 * - Esquerda: Os Três Reis Magos caminhando pela neve sob a Estrela Guia até o Presépio (José, Maria, Menino Jesus e cordeirinho);
 * - Centro: Árvore de Natal orgânica esculpida e iluminada separando o cenário sagrado do festivo;
 * - Direita: Papai Noel no trenó ornamentado levantando voo com 4 renas galopando e rastro cintilante.
 */
export function ChristmasFooterScene({ isLight = false }: ChristmasFooterSceneProps) {
  const topFadeGradient = isLight
    ? 'linear-gradient(to bottom, #f8fafc 0%, rgba(248, 250, 252, 0.84) 24%, rgba(226, 232, 240, 0.35) 55%, rgba(15, 23, 42, 0) 100%)'
    : 'linear-gradient(to bottom, #090d14 0%, rgba(9, 13, 20, 0.82) 26%, rgba(9, 13, 20, 0.32) 58%, rgba(9, 13, 20, 0) 100%)';

  return (
    <section
      aria-label="Paisagem Natalina SpotQR"
      className="relative w-full overflow-hidden select-none bg-[#d7e4f5]"
    >
      {/* Transição atmosférica contínua entre o fundo da página e o céu estrelado */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-20 sm:h-28 z-10"
        style={{ background: topFadeGradient }}
      />

      {/* VERSÃO DESKTOP PANORÂMICA (1440 × 460) — Sem cortes horizontais em nenhuma tela */}
      <svg
        viewBox="0 0 1440 460"
        preserveAspectRatio="xMidYMid meet"
        className="hidden lg:block w-full h-auto"
        role="img"
        aria-label="Paisagem natalina contínua: Os Três Reis Magos e o Presépio com Menino Jesus, Maria e José sob a Estrela Guia à esquerda; Árvore de Natal ao centro; Papai Noel no trenó levantando voo com renas à direita"
      >
        <ChristmasSceneDefs prefix="desk" />
        <SkyAndMountains width={1440} height={460} prefix="desk" />
        <StarOfBethlehem x={432} y={88} targetX={432} targetY={322} prefix="desk" />
        <SnowHillsForeground width={1440} height={460} treeX={720} prefix="desk" isDesktop />

        {/* Cenário Religioso à esquerda */}
        <ThreeWiseMenCaravan x={92} y={222} scale={1.08} prefix="desk" />
        <BethlehemNativityStable x={312} y={196} scale={1.08} prefix="desk" />

        {/* Árvore Central separando os dois reinos */}
        <OrnateChristmasTree x={720} y={96} scale={1.05} prefix="desk" />

        {/* Papai Noel levantando voo à direita */}
        <SantaSleighTakeoffTeam x={1000} y={258} scale={1.04} prefix="desk" />

        <SceneAtmosphericSnow width={1440} height={460} />
      </svg>

      {/* VERSÃO MOBILE & TABLET STORYBOOK (600 × 555) — Todos os personagens nítidos e amplos sem achatar */}
      <svg
        viewBox="0 0 600 555"
        preserveAspectRatio="xMidYMid meet"
        className="block lg:hidden w-full h-auto"
        role="img"
        aria-label="Paisagem natalina: Papai Noel levantando voo no céu estrelado, Árvore de Natal ao lado do Presépio com Menino Jesus e os Três Reis Magos"
      >
        <ChristmasSceneDefs prefix="mob" />
        <SkyAndMountains width={600} height={555} prefix="mob" />
        <StarOfBethlehem x={182} y={96} targetX={254} targetY={372} prefix="mob" />
        <SnowHillsForeground width={600} height={555} treeX={455} prefix="mob" isDesktop={false} />

        {/* Papai Noel voando majestosamente no topo direito do céu */}
        <SantaSleighTakeoffTeam x={265} y={182} scale={0.76} prefix="mob" />

        {/* Árvore enfeitada separando o horizonte direito */}
        <OrnateChristmasTree x={476} y={214} scale={0.94} prefix="mob" />

        {/* Reis Magos + Presépio bem visíveis e detalhados na colina inferior esquerda */}
        <ThreeWiseMenCaravan x={26} y={348} scale={0.8} prefix="mob" />
        <BethlehemNativityStable x={148} y={306} scale={0.95} prefix="mob" />

        <SceneAtmosphericSnow width={600} height={555} />
      </svg>
    </section>
  );
}
