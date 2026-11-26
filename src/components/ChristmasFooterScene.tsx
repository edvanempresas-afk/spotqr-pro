'use client';

import React from 'react';

interface ChristmasFooterSceneProps {
  /** Adapta suavemente a transição superior da paisagem ao fundo claro ou escuro da vitrine. */
  isLight?: boolean;
}

type IdHelper = (name: string) => string;

function makeId(prefix: string): IdHelper {
  return (name: string) => `natal3d-${prefix}-${name}`;
}

/**
 * Definições 3D estilo Pixar / Clay:
 * Sombras de oclusão suave entre camadas, gradientes esféricos volumétricos com luz-chave superior esquerda,
 * sombras de rebote quentes e halos luminosos suaves para luzes neon e estrela guia.
 */
function ChristmasSceneDefs({ prefix }: { prefix: string }) {
  const id = makeId(prefix);
  return (
    <defs>
      {/* Filtros de Oclusão 3D (dão volume tátil de massinha / vinil fosco entre camadas) */}
      <filter id={id('clayShadow')} x="-25%" y="-25%" width="150%" height="165%">
        <feDropShadow dx="0" dy="4.5" stdDeviation="3.2" floodColor="#040814" floodOpacity="0.46" />
      </filter>
      <filter id={id('claySoftShadow')} x="-25%" y="-25%" width="150%" height="165%">
        <feDropShadow dx="0" dy="2.5" stdDeviation="1.8" floodColor="#070e20" floodOpacity="0.34" />
      </filter>
      <filter id={id('auroraBlur')} x="-25%" y="-40%" width="150%" height="180%">
        <feGaussianBlur stdDeviation="17" />
      </filter>
      <filter id={id('softBeamBlur')} x="-30%" y="-20%" width="160%" height="150%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <filter id={id('softGlow')} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5.5" />
      </filter>

      {/* Céu noturno profundo */}
      <linearGradient id={id('skyGrad')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#070d1e" />
        <stop offset="46%" stopColor="#0d1b3f" />
        <stop offset="84%" stopColor="#162e5e" />
        <stop offset="100%" stopColor="#1e3c72" />
      </linearGradient>

      {/* Aurora Boreal orgânica */}
      <linearGradient id={id('auroraGreen')} x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
        <stop offset="32%" stopColor="#34d399" stopOpacity="0.3" />
        <stop offset="66%" stopColor="#38bdf8" stopOpacity="0.24" />
        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={id('auroraViolet')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
        <stop offset="45%" stopColor="#a78bfa" stopOpacity="0.2" />
        <stop offset="80%" stopColor="#2dd4bf" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
      </linearGradient>

      {/* Estrela Cadente com cauda suave */}
      <linearGradient id={id('shootingTail')} x1="0" y1="0" x2="1" y2="0.35">
        <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0" />
        <stop offset="55%" stopColor="#bae6fd" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
      </linearGradient>

      {/* Estrela Guia & Luzes Quentes */}
      <radialGradient id={id('starAura')} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
        <stop offset="30%" stopColor="#fef08a" stopOpacity="0.72" />
        <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={id('starBeam')} x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.44" />
        <stop offset="48%" stopColor="#fde047" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={id('hearthGlow')} cx="50%" cy="55%" r="52%">
        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.82" />
        <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.34" />
        <stop offset="78%" stopColor="#b45309" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('rudolphGlow')} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fecaca" stopOpacity="1" />
        <stop offset="36%" stopColor="#ff2e4c" stopOpacity="0.72" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>

      {/* Montanhas e Neve 3D suave */}
      <linearGradient id={id('mountainFar')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e3561" />
        <stop offset="100%" stopColor="#112142" />
      </linearGradient>
      <linearGradient id={id('mountainMid')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#264273" />
        <stop offset="100%" stopColor="#15294f" />
      </linearGradient>
      <linearGradient id={id('snowHorizon')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e4efff" />
        <stop offset="60%" stopColor="#cadcf5" />
        <stop offset="100%" stopColor="#a0b9dc" />
      </linearGradient>
      <linearGradient id={id('snowMid')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#e2edfb" />
        <stop offset="100%" stopColor="#bfd3ed" />
      </linearGradient>
      <linearGradient id={id('snowFront')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor="#eff6ff" />
        <stop offset="100%" stopColor="#d7e4f5" />
      </linearGradient>
      <linearGradient id={id('valleyMist')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#93c5fd" stopOpacity="0" />
        <stop offset="60%" stopColor="#bfdbfe" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.28" />
      </linearGradient>

      {/* === MATERIAIS CLAY-3D (Inspirados diretamente nas referências 3D Pixar) === */}
      {/* Folhagem 3D almofadada verde-oliva/musgo quente da árvore */}
      <radialGradient id={id('clayPineTop')} cx="45%" cy="22%" r="78%">
        <stop offset="0%" stopColor="#86bf3b" />
        <stop offset="52%" stopColor="#4f8021" />
        <stop offset="100%" stopColor="#25420e" />
      </radialGradient>
      <radialGradient id={id('clayPineMid')} cx="42%" cy="24%" r="78%">
        <stop offset="0%" stopColor="#74ad30" />
        <stop offset="55%" stopColor="#3f6b18" />
        <stop offset="100%" stopColor="#1b3409" />
      </radialGradient>
      <radialGradient id={id('clayPineDeep')} cx="44%" cy="24%" r="80%">
        <stop offset="0%" stopColor="#5d9423" />
        <stop offset="58%" stopColor="#335912" />
        <stop offset="100%" stopColor="#152806" />
      </radialGradient>

      {/* Peles 3D macias (Clay) */}
      <radialGradient id={id('claySkinLight')} cx="38%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#ffedd5" />
        <stop offset="58%" stopColor="#fdba8c" />
        <stop offset="100%" stopColor="#c97a4b" />
      </radialGradient>
      <radialGradient id={id('claySkinMedium')} cx="38%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#fde0c4" />
        <stop offset="58%" stopColor="#db9463" />
        <stop offset="100%" stopColor="#8c4f27" />
      </radialGradient>
      <radialGradient id={id('claySkinDeep')} cx="38%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#bd8158" />
        <stop offset="58%" stopColor="#7e4a29" />
        <stop offset="100%" stopColor="#46240f" />
      </radialGradient>

      {/* Barba nuvem, pelúcia branca, neve no telhado e ovelhinha 3D */}
      <radialGradient id={id('claySnowWhite')} cx="38%" cy="26%" r="76%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="62%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#c5d2e3" />
      </radialGradient>

      {/* Roupa Papai Noel / Saco / Trenó 3D Carmesim */}
      <radialGradient id={id('clayRedVelvet')} cx="35%" cy="26%" r="76%">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="48%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#7a1111" />
      </radialGradient>

      {/* Ouro 3D fosco/cetim (Fivela, Sino, Estrela da Árvore, Coroas) */}
      <radialGradient id={id('clayGold3D')} cx="34%" cy="26%" r="76%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="45%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#b45309" />
      </radialGradient>

      {/* Biscoito Gingerbread 3D */}
      <radialGradient id={id('clayGingerbread')} cx="35%" cy="28%" r="76%">
        <stop offset="0%" stopColor="#e59d52" />
        <stop offset="60%" stopColor="#b46321" />
        <stop offset="100%" stopColor="#6e360c" />
      </radialGradient>

      {/* Couro / Madeira 3D (Botas, Cinto, Estábulo, Manjedoura) */}
      <radialGradient id={id('clayBrown')} cx="35%" cy="28%" r="76%">
        <stop offset="0%" stopColor="#a86a3d" />
        <stop offset="58%" stopColor="#6e3f1d" />
        <stop offset="100%" stopColor="#3b1e0a" />
      </radialGradient>

      {/* Pelagem Clay das Renas 3D */}
      <radialGradient id={id('clayReindeer')} cx="36%" cy="28%" r="76%">
        <stop offset="0%" stopColor="#dc924f" />
        <stop offset="58%" stopColor="#9c5622" />
        <stop offset="100%" stopColor="#522608" />
      </radialGradient>

      {/* Mantos 3D dos Reis Magos e Maria */}
      <radialGradient id={id('clayPurple3D')} cx="35%" cy="26%" r="78%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="52%" stopColor="#7e22ce" />
        <stop offset="100%" stopColor="#3b0764" />
      </radialGradient>
      <radialGradient id={id('clayEmerald3D')} cx="35%" cy="26%" r="78%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="52%" stopColor="#0f766e" />
        <stop offset="100%" stopColor="#022c22" />
      </radialGradient>
      <radialGradient id={id('clayMaryBlue')} cx="36%" cy="25%" r="78%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="52%" stopColor="#1d4ed8" />
        <stop offset="100%" stopColor="#172554" />
      </radialGradient>
      <radialGradient id={id('clayJosephOchre')} cx="36%" cy="26%" r="78%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="52%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#451a03" />
      </radialGradient>

      {/* Bolinhas 3D brilhantes */}
      <radialGradient id={id('clayBaubleRuby')} cx="34%" cy="28%" r="68%">
        <stop offset="0%" stopColor="#fda4af" />
        <stop offset="45%" stopColor="#e11d48" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </radialGradient>
      <radialGradient id={id('clayBaubleBlue')} cx="34%" cy="28%" r="68%">
        <stop offset="0%" stopColor="#bae6fd" />
        <stop offset="45%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0c4a6e" />
      </radialGradient>

      {/* Rastro mágico luminoso do trenó */}
      <linearGradient id={id('magicCometGold')} x1="0" y1="0.8" x2="1" y2="0.2">
        <stop offset="0%" stopColor="#fde047" stopOpacity="0" />
        <stop offset="35%" stopColor="#facc15" stopOpacity="0.68" />
        <stop offset="100%" stopColor="#fef9c3" stopOpacity="0.98" />
      </linearGradient>
    </defs>
  );
}

/** Céu estrelado, aurora boreal animada, estrela cadente com cauda suave e montanhas nevadas. */
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
    { x: 0.04, y: 0.16, r: 1.5, diamond: false },
    { x: 0.09, y: 0.28, r: 1.2, diamond: false },
    { x: 0.14, y: 0.14, r: 2.2, diamond: true },
    { x: 0.2, y: 0.34, r: 1.3, diamond: false },
    { x: 0.26, y: 0.19, r: 1.5, diamond: false },
    { x: 0.36, y: 0.24, r: 1.8, diamond: true },
    { x: 0.42, y: 0.12, r: 1.4, diamond: false },
    { x: 0.56, y: 0.18, r: 2.1, diamond: true },
    { x: 0.63, y: 0.29, r: 1.4, diamond: false },
    { x: 0.69, y: 0.15, r: 1.8, diamond: true },
    { x: 0.76, y: 0.24, r: 1.3, diamond: false },
    { x: 0.82, y: 0.13, r: 1.6, diamond: false },
    { x: 0.89, y: 0.22, r: 2.1, diamond: true },
    { x: 0.95, y: 0.15, r: 1.5, diamond: false },
  ];

  // Silhuetas arredondadas suaves de pinheiros ao longe
  const distantPinesX = [78, 122, 168, 495, 540, 835, 882, 1300, 1352, 1396];

  return (
    <g>
      <rect x="0" y="0" width={width} height={height} fill={`url(#${id('skyGrad')})`} />

      {/* Cortinas de Aurora Boreal ondulando */}
      <g filter={`url(#${id('auroraBlur')})`} className="natal-aurora-wave">
        <path
          d={`M${-60 * scaleX} ${height * 0.22} C${280 * scaleX} ${height * 0.07}, ${560 * scaleX} ${height * 0.31}, ${940 * scaleX} ${height * 0.15} C${1160 * scaleX} ${height * 0.05}, ${1340 * scaleX} ${height * 0.24}, ${width + 60} ${height * 0.13} L${width + 60} ${height * 0.38} C${1220 * scaleX} ${height * 0.41}, ${860 * scaleX} ${height * 0.24}, ${520 * scaleX} ${height * 0.39} C${240 * scaleX} ${height * 0.48}, ${40 * scaleX} ${height * 0.28}, ${-60 * scaleX} ${height * 0.35} Z`}
          fill={`url(#${id('auroraGreen')})`}
        />
        <path
          d={`M${120 * scaleX} ${height * 0.16} C${480 * scaleX} ${height * 0.28}, ${790 * scaleX} ${height * 0.06}, ${1180 * scaleX} ${height * 0.2} L${1260 * scaleX} ${height * 0.34} C${880 * scaleX} ${height * 0.19}, ${540 * scaleX} ${height * 0.38}, ${120 * scaleX} ${height * 0.29} Z`}
          fill={`url(#${id('auroraViolet')})`}
        />
      </g>

      {/* Estrelas */}
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

      {/* Estrela Cadente afunilada com cauda gradiente luminosa */}
      <g className="natal-shooting-star">
        <path
          d={`M${width * 0.56} ${height * 0.17} Q${width * 0.61} ${height * 0.185}, ${width * 0.66} ${height * 0.21} Q${width * 0.61} ${height * 0.193}, ${width * 0.56} ${height * 0.17} Z`}
          fill={`url(#${id('shootingTail')})`}
        />
        <line
          x1={width * 0.56}
          y1={height * 0.17}
          x2={width * 0.66}
          y2={height * 0.21}
          stroke={`url(#${id('shootingTail')})`}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle
          cx={width * 0.66}
          cy={height * 0.21}
          r="5"
          fill="#fef9c3"
          opacity="0.55"
          filter={`url(#${id('softGlow')})`}
        />
        <circle cx={width * 0.66} cy={height * 0.21} r="2.2" fill="#ffffff" />
      </g>

      {/* Montanhas distantes */}
      <path
        d={`M0 ${height * 0.64} C${180 * scaleX} ${height * 0.52}, ${310 * scaleX} ${height * 0.61}, ${490 * scaleX} ${height * 0.53} C${670 * scaleX} ${height * 0.46}, ${820 * scaleX} ${height * 0.59}, ${1020 * scaleX} ${height * 0.5} C${1190 * scaleX} ${height * 0.43}, ${1320 * scaleX} ${height * 0.55}, ${width} ${height * 0.52} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('mountainFar')})`}
      />
      <path
        d={`M0 ${height * 0.7} C${190 * scaleX} ${height * 0.6}, ${360 * scaleX} ${height * 0.67}, ${580 * scaleX} ${height * 0.59} C${790 * scaleX} ${height * 0.53}, ${980 * scaleX} ${height * 0.65}, ${1180 * scaleX} ${height * 0.57} C${1310 * scaleX} ${height * 0.53}, ${1390 * scaleX} ${height * 0.61}, ${width} ${height * 0.63} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('mountainMid')})`}
      />

      {/* Bosques distantes suaves arredondados */}
      {distantPinesX.map((px, i) => {
        const x = px * scaleX;
        const baseY = height * (0.63 + (i % 3) * 0.02);
        const h = 21 + (i % 3) * 7;
        return (
          <path
            key={`dp-${i}`}
            d={`M${x} ${baseY - h} C${x - 5} ${baseY - h * 0.55}, ${x - 10} ${baseY - 4}, ${x - 9} ${baseY} C${x - 3} ${baseY + 2}, ${x + 3} ${baseY + 2}, ${x + 9} ${baseY} C${x + 10} ${baseY - 4}, ${x + 5} ${baseY - h * 0.55}, ${x} ${baseY - h} Z`}
            fill="#102145"
            opacity="0.72"
          />
        );
      })}

      {/* Névoa prateada suave entre as montanhas e as colinas */}
      <rect
        x="0"
        y={height * 0.54}
        width={width}
        height={height * 0.24}
        fill={`url(#${id('valleyMist')})`}
      />
    </g>
  );
}

/** Estrela Guia 3D dourada chanfrada com feixe difuso iluminando a Manjedoura. */
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
  const halfSpan = 120;
  return (
    <g>
      <path
        d={`M${x - 6} ${y + 6} C${x - 45} ${y + 68}, ${targetX - halfSpan * 0.8} ${targetY - 42}, ${targetX - halfSpan} ${targetY} L${targetX + halfSpan} ${targetY} C${targetX + halfSpan * 0.8} ${targetY - 42}, ${x + 45} ${y + 68}, ${x + 6} ${y + 6} Z`}
        fill={`url(#${id('starBeam')})`}
        filter={`url(#${id('softBeamBlur')})`}
      />
      <g
        transform={`translate(${x}, ${y})`}
        filter={`url(#${id('claySoftShadow')})`}
        className="natal-star-twinkle"
      >
        <circle cx="0" cy="0" r="46" fill={`url(#${id('starAura')})`} />
        <path
          d="M0 -30 C4 -9 8 -6 26 0 C8 6 4 9 0 38 C-4 9 -8 6 -26 0 C-8 -6 -4 -9 0 -30 Z"
          fill={`url(#${id('clayGold3D')})`}
        />
        <path
          d="M0 -18 C3 -6 5 -4 14 -12 C6 -3 5 3 13 13 C3 5 -2 6 0 18 C-2 6 -4 4 -13 13 C-5 3 -6 -3 -14 -12 C-5 -4 -3 -6 0 -18 Z"
          fill="#fef9c3"
          opacity="0.88"
        />
        <circle cx="-1" cy="-2" r="4.5" fill="#ffffff" />
      </g>
    </g>
  );
}

/** Rosto 3D expressivo compartilhado (olhos brilhantes com catchlight, sobrancelhas, bochechas rosadas e nariz fofo). */
function CuteClayFace({
  cx,
  cy,
  skinFill,
  cheeksOpacity = 0.6,
  noseColor = '#f59e0b',
  isSleeping = false,
}: {
  cx: number;
  cy: number;
  skinFill: string;
  cheeksOpacity?: number;
  noseColor?: string;
  isSleeping?: boolean;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="9.5" fill={skinFill} />
      {/* Bochechas rosadas 3D */}
      <ellipse
        cx={cx - 4.8}
        cy={cy + 2.4}
        rx="2.6"
        ry="1.6"
        fill="#fb7185"
        opacity={cheeksOpacity}
      />
      <ellipse
        cx={cx + 4.8}
        cy={cy + 2.4}
        rx="2.6"
        ry="1.6"
        fill="#fb7185"
        opacity={cheeksOpacity}
      />
      {/* Olhos 3D com reflexo de estúdio */}
      {isSleeping ? (
        <g stroke="#451a03" strokeWidth="1.4" strokeLinecap="round" fill="none">
          <path d={`M${cx - 5.2} ${cy - 0.5} Q${cx - 3.6} ${cy + 1.2} ${cx - 2} ${cy - 0.5}`} />
          <path d={`M${cx + 2} ${cy - 0.5} Q${cx + 3.6} ${cy + 1.2} ${cx + 5.2} ${cy - 0.5}`} />
        </g>
      ) : (
        <g>
          <circle cx={cx - 3.5} cy={cy - 1} r="1.75" fill="#1c1917" />
          <circle cx={cx - 4} cy={cy - 1.6} r="0.6" fill="#ffffff" />
          <circle cx={cx + 3.5} cy={cy - 1} r="1.75" fill="#1c1917" />
          <circle cx={cx + 3} cy={cy - 1.6} r="0.6" fill="#ffffff" />
        </g>
      )}
      {/* Narizinho fofo 3D */}
      <circle cx={cx} cy={cy + 1.3} r="2.2" fill={noseColor} opacity="0.92" />
    </g>
  );
}

/** Os Três Reis Magos em estilo Clay-3D expressivo chegando pela colina com presentes, incenso e lanterna. */
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
      {/* Pegadas suaves na neve */}
      <g fill="#93c5fd" opacity="0.34">
        <ellipse cx="-18" cy="108" rx="5.5" ry="2.2" />
        <ellipse cx="-2" cy="106" rx="5.2" ry="2" />
        <ellipse cx="14" cy="107" rx="4.8" ry="1.8" />
      </g>

      {/* Mago 1: Melquior (Clay Roxo + Gola Peluda 3D + Rosto fofo + Coroa Dourada + Cofre 3D) */}
      <g transform="translate(0, 6)" filter={`url(#${id('clayShadow')})`}>
        <ellipse cx="22" cy="99" rx="22" ry="5" fill="#64748b" opacity="0.32" />
        {/* Corpo gordinho 3D curvado em sino */}
        <path
          d="M11 32 C6 52, 4 76, 6 95 C14 100, 31 100, 38 95 C40 76, 36 52, 31 32 Z"
          fill={`url(#${id('clayPurple3D')})`}
        />
        {/* Faixa de ouro 3D na frente */}
        <path
          d="M21 35 C20 56, 20 76, 22 97"
          stroke={`url(#${id('clayGold3D')})`}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Capa peluda fofa branca */}
        <path
          d="M9 32 C14 40, 29 40, 33 32 C31 27, 11 27, 9 32 Z"
          fill={`url(#${id('claySnowWhite')})`}
          filter={`url(#${id('claySoftShadow')})`}
        />
        {/* Cabeça + Barba nuvem fofa */}
        <CuteClayFace
          cx={21.5}
          cy={20}
          skinFill={`url(#${id('claySkinLight')})`}
          noseColor="#f4a261"
        />
        <path
          d="M12.5 22 C12 31, 31 31, 30.5 22 C26 24, 17 24, 12.5 22 Z"
          fill={`url(#${id('claySnowWhite')})`}
        />
        {/* Coroa 3D arredondada */}
        <path
          d="M13 13 C12 7, 17 5, 19 9 C20.5 4, 22.5 4, 24 9 C26 5, 31 7, 30 13 C26 15, 17 15, 13 13 Z"
          fill={`url(#${id('clayGold3D')})`}
        />
        {/* Braço e Bauzinho 3D */}
        <path
          d="M28 38 C34 43, 38 47, 40 50"
          stroke={`url(#${id('clayPurple3D')})`}
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <circle cx="40.5" cy="50.5" r="3" fill={`url(#${id('claySkinLight')})`} />
        <rect
          x="35"
          y="42"
          width="13"
          height="10"
          rx="3"
          fill={`url(#${id('clayGold3D')})`}
          filter={`url(#${id('claySoftShadow')})`}
        />
        <rect x="35" y="45.5" width="13" height="2" rx="1" fill="#78350f" opacity="0.45" />
      </g>

      {/* Mago 2: Gaspar (Clay Carmesim + Turbante 3D + Incensário com Fumaça Animada) */}
      <g transform="translate(56, 2)" filter={`url(#${id('clayShadow')})`}>
        <ellipse cx="22" cy="103" rx="22" ry="5" fill="#64748b" opacity="0.32" />
        <path
          d="M10 34 C6 54, 4 80, 6 99 C14 104, 31 104, 38 99 C40 80, 36 54, 32 34 Z"
          fill={`url(#${id('clayRedVelvet')})`}
        />
        {/* Faixa de seda dourada almofadada */}
        <path
          d="M8 58 C16 63, 28 63, 36 58"
          stroke={`url(#${id('clayGold3D')})`}
          strokeWidth="4.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Rosto + barba fofa */}
        <CuteClayFace
          cx={21.5}
          cy={21}
          skinFill={`url(#${id('claySkinMedium')})`}
          noseColor="#c97a4b"
        />
        <path
          d="M14 23 C14 31, 29 31, 29 23 C25 25, 18 25, 14 23 Z"
          fill="#451a03"
        />
        {/* Turbante Real Clay 3D fofo */}
        <path
          d="M10 17 C9 6, 33 5, 33 17 C27 20, 16 20, 10 17 Z"
          fill={`url(#${id('claySnowWhite')})`}
        />
        <path
          d="M12 13 C18 8, 25 8, 31 13"
          stroke={`url(#${id('clayGold3D')})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="21.5" cy="9.5" r="2.6" fill="#10b981" />
        {/* Braço e Incensário dourado */}
        <path
          d="M29 40 C35 44, 39 48, 41 51"
          stroke={`url(#${id('clayRedVelvet')})`}
          strokeWidth="6.2"
          strokeLinecap="round"
        />
        <g transform="translate(42, 51)" className="natal-ornament-sway">
          <line x1="0" y1="0" x2="0" y2="9" stroke="#fde047" strokeWidth="1.4" />
          <ellipse cx="0" cy="12.5" rx="5" ry="4.5" fill={`url(#${id('clayGold3D')})`} />
          <path
            d="M0 7 C-2 3, 3 -2, 0 -7"
            stroke="#e2e8f0"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className="natal-incense-float"
          />
        </g>
      </g>

      {/* Mago 3: Baltazar (Clay Esmeralda + Gola Dourada + Vaso de Mirra + Lanterna Quente) */}
      <g transform="translate(112, 8)" filter={`url(#${id('clayShadow')})`}>
        <ellipse cx="21" cy="97" rx="21" ry="4.8" fill="#64748b" opacity="0.3" />
        <circle
          cx="43"
          cy="66"
          r="24"
          fill={`url(#${id('hearthGlow')})`}
          className="natal-hearth-breath"
        />
        <path
          d="M10 31 C6 50, 5 74, 7 93 C15 98, 29 98, 36 93 C38 74, 34 50, 30 31 Z"
          fill={`url(#${id('clayEmerald3D')})`}
        />
        <path
          d="M10 31 C15 37, 26 37, 31 31"
          stroke={`url(#${id('clayGold3D')})`}
          strokeWidth="3.6"
          strokeLinecap="round"
          fill="none"
        />
        <CuteClayFace
          cx={20.5}
          cy={19.5}
          skinFill={`url(#${id('claySkinDeep')})`}
          cheeksOpacity={0.35}
          noseColor="#6b3e1f"
        />
        {/* Coroa curvada dourada */}
        <path
          d="M12 13 C12 8, 28 8, 29 13 C25 15, 16 15, 12 13 Z"
          fill={`url(#${id('clayGold3D')})`}
        />
        <path
          d="M27 38 C34 42, 38 46, 41 49"
          stroke={`url(#${id('clayEmerald3D')})`}
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Lanterna 3D quente oscilante */}
        <g transform="translate(42, 49)" className="natal-ornament-sway">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#facc15" strokeWidth="1.5" />
          <rect
            x="-5.5"
            y="6"
            width="11"
            height="12"
            rx="3.5"
            fill="#fef08a"
            stroke="#92400e"
            strokeWidth="1.6"
          />
          <circle cx="0" cy="12" r="3" fill="#ffffff" />
        </g>
      </g>
    </g>
  );
}

/**
 * Presépio Clay-3D: Estábulo de madeira arredondada com neve fofa de marshmallow,
 * clarão acolhedor animado, Maria, José, Menino Jesus dormindo na palha e ovelhinha fofa.
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
      {/* Clarão dourado vivo de dentro da manjedoura */}
      <circle
        cx="114"
        cy="98"
        r="92"
        fill={`url(#${id('hearthGlow')})`}
        className="natal-hearth-breath"
      />
      <ellipse cx="114" cy="145" rx="96" ry="10" fill="#64748b" opacity="0.32" />

      {/* Interior aquecido sombreado */}
      <path
        d="M26 58 C56 36, 86 20, 114 10 C142 20, 172 36, 202 58 L200 142 L28 142 Z"
        fill="#24170e"
        opacity="0.88"
      />
      <path
        d="M52 46 L52 140 M82 28 L82 140 M146 28 L146 140 M176 46 L176 140"
        stroke="#362315"
        strokeWidth="2.5"
        opacity="0.6"
      />

      {/* Troncos 3D grossos com pontas arredondadas */}
      <g filter={`url(#${id('clayShadow')})`}>
        <path
          d="M32 54 C30 82, 32 112, 30 142"
          stroke={`url(#${id('clayBrown')})`}
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M196 54 C198 82, 196 112, 198 142"
          stroke={`url(#${id('clayBrown')})`}
          strokeWidth="11"
          strokeLinecap="round"
        />
        {/* Telhado rústico espesso 3D */}
        <path
          d="M10 62 C50 38, 84 22, 114 4 C144 22, 178 38, 218 62"
          stroke={`url(#${id('clayBrown')})`}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        {/* Almofada espessa de neve macia sobre o telhado */}
        <path
          d="M8 57 C46 35, 82 18, 114 1 C146 18, 182 35, 220 57 C216 66, 200 66, 186 58 C162 44, 138 30, 114 16 C90 30, 66 44, 42 58 C28 66, 12 66, 8 57 Z"
          fill={`url(#${id('claySnowWhite')})`}
        />
      </g>

      {/* MARIA Clay-3D ajoelhada com rosto expressivo, auréola e manto azul-celeste */}
      <g transform="translate(46, 56)" filter={`url(#${id('clayShadow')})`}>
        <circle
          cx="21"
          cy="19"
          r="14.5"
          fill="none"
          stroke="#fde047"
          strokeWidth="1.8"
          opacity="0.82"
        />
        {/* Corpo curvado fofo */}
        <path
          d="M4 82 C6 52, 12 32, 22 26 C32 32, 38 52, 38 82 C26 87, 14 87, 4 82 Z"
          fill={`url(#${id('clayMaryBlue')})`}
        />
        {/* Manto claro curvado emoldurando o rosto */}
        <path
          d="M9 19 C9 6, 33 6, 33 19 C33 34, 28 52, 21 58 C14 52, 9 34, 9 19 Z"
          fill="#60a5fa"
        />
        <CuteClayFace
          cx={21}
          cy={20}
          skinFill={`url(#${id('claySkinLight')})`}
          noseColor="#f4a261"
        />
        {/* Mãos rosadas postas em oração */}
        <ellipse
          cx="32"
          cy="44"
          rx="4.5"
          ry="3.2"
          transform="rotate(-18 32 44)"
          fill={`url(#${id('claySkinLight')})`}
        />
      </g>

      {/* MANJEDOURA 3D + MENINO JESUS DORMINDO NA PALHA */}
      <g transform="translate(90, 92)" filter={`url(#${id('claySoftShadow')})`}>
        {/* Pernas grossas 3D em X */}
        <path
          d="M9 22 L43 50 M43 22 L9 50"
          stroke={`url(#${id('clayBrown')})`}
          strokeWidth="5.2"
          strokeLinecap="round"
        />
        {/* Palha fofa dourada */}
        <path
          d="M2 18 C11 6, 24 4, 34 12 C42 6, 48 10, 50 18 Z"
          fill={`url(#${id('clayGold3D')})`}
        />
        {/* Auréola e Menino Jesus com rostinho doce dormindo */}
        <circle
          cx="26"
          cy="11"
          r="16"
          fill={`url(#${id('hearthGlow')})`}
          className="natal-hearth-breath"
        />
        <ellipse
          cx="30"
          cy="15"
          rx="12.5"
          ry="6"
          fill={`url(#${id('claySnowWhite')})`}
        />
        <CuteClayFace
          cx={17}
          cy={11}
          skinFill={`url(#${id('claySkinLight')})`}
          noseColor="#f4a261"
          isSleeping
        />
        {/* Berço de madeira curvado 3D na frente da palha */}
        <path
          d="M2 18 C16 21, 36 21, 50 18 C48 30, 44 33, 41 34 C30 36, 22 36, 11 34 C8 33, 4 30, 2 18 Z"
          fill={`url(#${id('clayBrown')})`}
        />
      </g>

      {/* Cordeirinho 3D de algodão doce descansando na neve */}
      <g transform="translate(139, 121)" filter={`url(#${id('claySoftShadow')})`}>
        <ellipse cx="11" cy="11" rx="9" ry="6.5" fill={`url(#${id('claySnowWhite')})`} />
        <circle cx="5" cy="9" r="5" fill="#ffffff" />
        <circle cx="15" cy="8" r="5.5" fill="#ffffff" />
        <circle cx="20" cy="6" r="4.2" fill={`url(#${id('claySkinLight')})`} />
        <circle cx="21.5" cy="5.5" r="0.9" fill="#1c1917" />
        <ellipse cx="16.5" cy="5" rx="2.6" ry="1.4" transform="rotate(-30 16.5 5)" fill="#e2e8f0" />
      </g>

      {/* JOSÉ Clay-3D protetor com cajado e lanterna acesa */}
      <g transform="translate(150, 44)" filter={`url(#${id('clayShadow')})`}>
        <circle
          cx="20"
          cy="19"
          r="14"
          fill="none"
          stroke="#fde047"
          strokeWidth="1.6"
          opacity="0.78"
        />
        <path
          d="M5 94 C6 58, 10 34, 21 28 C31 34, 36 58, 36 94 C24 99, 13 99, 5 94 Z"
          fill={`url(#${id('clayJosephOchre')})`}
        />
        <path
          d="M7 30 C16 42, 26 42, 33 30 L34 62 C24 66, 15 66, 7 62 Z"
          fill="#7c2d12"
          opacity="0.65"
        />
        <CuteClayFace
          cx={20.5}
          cy={20}
          skinFill={`url(#${id('claySkinMedium')})`}
          noseColor="#c97a4b"
        />
        {/* Capuz fofo & barba */}
        <path
          d="M11 16 C11 6, 30 6, 30 16"
          stroke="#7c2d12"
          strokeWidth="5.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M13 22 C13 30, 28 30, 28 22 C24 24, 17 24, 13 22 Z"
          fill="#5c3a21"
        />
        {/* Cajado de madeira 3D + lanterna quente */}
        <path
          d="M39 18 L36 95"
          stroke={`url(#${id('clayBrown')})`}
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        <path
          d="M31 18 C35 8, 45 8, 46 20"
          stroke={`url(#${id('clayBrown')})`}
          strokeWidth="3.8"
          strokeLinecap="round"
          fill="none"
        />
        <g transform="translate(46, 21)" className="natal-ornament-sway">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#facc15" strokeWidth="1.4" />
          <rect
            x="-4.5"
            y="6"
            width="9"
            height="10"
            rx="3"
            fill="#fde047"
            stroke="#78350f"
            strokeWidth="1.3"
          />
          <circle cx="0" cy="11" r="2.4" fill="#ffffff" />
        </g>
      </g>
    </g>
  );
}

/** Biscoito Gingerbread 3D fofo inspirado diretamente na Imagem 2. */
function Gingerbread3D({
  x,
  y,
  scale = 1,
  rotate = 0,
  prefix,
}: {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  prefix: string;
}) {
  const id = makeId(prefix);
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}
      filter={`url(#${id('claySoftShadow')})`}
      className="natal-bauble-swing"
    >
      {/* Corpo arredondado de biscoito de gengibre 3D */}
      <path
        d="M0 -13 C4.5 -13 7 -9.5 7 -6 C7 -3.5 5.5 -2 4 -1 C8 -1 12 0 13 2.5 C13.5 4.5 11 6 7 5.5 C6 9 7.5 13 8.5 16 C9 18.5 5.5 19.5 4 17.5 C2.5 15.5 1 13 0 12.5 C-1 13 -2.5 15.5 -4 17.5 C-5.5 19.5 -9 18.5 -8.5 16 C-7.5 13 -6 9 -7 5.5 C-11 6 -13.5 4.5 -13 2.5 C-12 0 -8 -1 -4 -1 C-5.5 -2 -7 -3.5 -7 -6 C-7 -9.5 -4.5 -13 0 -13 Z"
        fill={`url(#${id('clayGingerbread')})`}
      />
      {/* Olhinhos, sorriso e botões de glacê branco */}
      <circle cx="-2.2" cy="-7" r="1" fill="#ffffff" />
      <circle cx="2.2" cy="-7" r="1" fill="#ffffff" />
      <path d="M-2.2 -4.2 Q0 -2.6 2.2 -4.2" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <circle cx="0" cy="2.2" r="1.2" fill="#ef4444" />
      <circle cx="0" cy="6.2" r="1.2" fill="#ffffff" />
      <path d="M-9.5 2 L-8 4.8 M8 4.8 L9.5 2" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

/**
 * Árvore de Natal Clay-3D (Modelada exatamente pela Referência 2 enviada pelo usuário):
 * Lobos almofadados 3D empilhados com sombras de oclusão, estrela dourada chanfrada no topo,
 * fios escuros com lâmpadas ciano/pink/amarelo neon, biscoitos gingerbread, bengalas doces e bolinhas listradas!
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

  // Luzes neon sobre os fios escuros (exatamente nas cores ciano #22d3ee, pink #f43f5e/#ec4899 e ouro #fde047 da Imagem 2)
  const wireBulbs = [
    // Fio 1 (topo)
    { x: -24, y: 74, c: '#22d3ee', g: 'rgba(34,211,238,0.85)', p: 0 },
    { x: -1, y: 80, c: '#fde047', g: 'rgba(253,224,71,0.88)', p: 1 },
    { x: 22, y: 78, c: '#ec4899', g: 'rgba(236,72,153,0.88)', p: 0 },
    // Fio 2
    { x: -46, y: 108, c: '#ec4899', g: 'rgba(236,72,153,0.88)', p: 1 },
    { x: -20, y: 117, c: '#fde047', g: 'rgba(253,224,71,0.88)', p: 0 },
    { x: 10, y: 119, c: '#22d3ee', g: 'rgba(34,211,238,0.85)', p: 1 },
    { x: 40, y: 112, c: '#ec4899', g: 'rgba(236,72,153,0.88)', p: 0 },
    // Fio 3
    { x: -64, y: 152, c: '#22d3ee', g: 'rgba(34,211,238,0.85)', p: 0 },
    { x: -34, y: 162, c: '#fde047', g: 'rgba(253,224,71,0.88)', p: 1 },
    { x: -2, y: 164, c: '#22d3ee', g: 'rgba(34,211,238,0.85)', p: 0 },
    { x: 32, y: 161, c: '#ec4899', g: 'rgba(236,72,153,0.88)', p: 1 },
    { x: 64, y: 151, c: '#22d3ee', g: 'rgba(34,211,238,0.85)', p: 0 },
    // Fio 4
    { x: -82, y: 194, c: '#fde047', g: 'rgba(253,224,71,0.88)', p: 1 },
    { x: -48, y: 204, c: '#22d3ee', g: 'rgba(34,211,238,0.85)', p: 0 },
    { x: -10, y: 208, c: '#fde047', g: 'rgba(253,224,71,0.88)', p: 1 },
    { x: 30, y: 207, c: '#ec4899', g: 'rgba(236,72,153,0.88)', p: 0 },
    { x: 70, y: 198, c: '#fde047', g: 'rgba(253,224,71,0.88)', p: 1 },
    // Fio 5 (base)
    { x: -96, y: 229, c: '#ec4899', g: 'rgba(236,72,153,0.88)', p: 0 },
    { x: -58, y: 238, c: '#22d3ee', g: 'rgba(34,211,238,0.85)', p: 1 },
    { x: 4, y: 243, c: '#fde047', g: 'rgba(253,224,71,0.88)', p: 0 },
    { x: 48, y: 241, c: '#22d3ee', g: 'rgba(34,211,238,0.85)', p: 1 },
    { x: 92, y: 231, c: '#ec4899', g: 'rgba(236,72,153,0.88)', p: 0 },
  ];

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Sombra suave na neve + reflexo quente */}
      <ellipse cx="0" cy="272" rx="112" ry="15" fill="#64748b" opacity="0.3" />

      {/* Vaso/Tronco 3D marrom robusto (estilo Imagem 2) */}
      <path
        d="M-22 238 L22 238 L17 270 C10 274, -10 274, -17 270 Z"
        fill={`url(#${id('clayBrown')})`}
        filter={`url(#${id('clayShadow')})`}
      />

      {/* === CAMADA 5 (BASE - 5 lobos almofadados 3D arredondados) === */}
      <g filter={`url(#${id('clayShadow')})`}>
        <path
          d="M-38 186 C-72 204, -104 222, -110 236 C-112 248, -88 256, -66 244 C-56 238, -42 252, -26 248 C-16 256, 16 256, 26 248 C42 252, 56 238, 66 244 C88 256, 112 248, 110 236 C104 222, 72 204, 38 186 Z"
          fill={`url(#${id('clayPineDeep')})`}
        />
        {/* Almofada central direita/esquerda para volume extra */}
        <ellipse cx="-32" cy="236" rx="22" ry="16" fill={`url(#${id('clayPineMid')})`} />
        <ellipse cx="32" cy="236" rx="22" ry="16" fill={`url(#${id('clayPineMid')})`} />
        <ellipse cx="0" cy="238" rx="24" ry="17" fill={`url(#${id('clayPineTop')})`} />
      </g>

      {/* Bengalas doces listradas encaixadas nos galhos inferiores */}
      <g transform="translate(-38, 224) rotate(24)" filter={`url(#${id('claySoftShadow')})`}>
        <path d="M0 24 L0 6 C0 -2, 10 -2, 10 6" stroke="#ffffff" strokeWidth="5.2" strokeLinecap="round" fill="none" />
        <path d="M0 24 L0 6 C0 -2, 10 -2, 10 6" stroke="#dc2626" strokeWidth="5.2" strokeDasharray="4.5 4.5" strokeLinecap="round" fill="none" />
      </g>
      <g transform="translate(36, 178) rotate(-32)" filter={`url(#${id('claySoftShadow')})`}>
        <path d="M0 24 L0 6 C0 -2, 10 -2, 10 6" stroke="#ffffff" strokeWidth="4.8" strokeLinecap="round" fill="none" />
        <path d="M0 24 L0 6 C0 -2, 10 -2, 10 6" stroke="#dc2626" strokeWidth="4.8" strokeDasharray="4.5 4.5" strokeLinecap="round" fill="none" />
      </g>

      {/* === CAMADA 4 === */}
      <g filter={`url(#${id('clayShadow')})`}>
        <path
          d="M-32 146 C-62 164, -90 184, -94 198 C-96 210, -74 216, -54 206 C-42 216, -18 216, 0 208 C18 216, 42 216, 54 206 C74 216, 96 210, 94 198 C90 184, 62 164, 32 146 Z"
          fill={`url(#${id('clayPineMid')})`}
        />
        <ellipse cx="-24" cy="198" rx="20" ry="14" fill={`url(#${id('clayPineTop')})`} />
        <ellipse cx="24" cy="198" rx="20" ry="14" fill={`url(#${id('clayPineTop')})`} />
      </g>

      {/* === CAMADA 3 === */}
      <g filter={`url(#${id('clayShadow')})`}>
        <path
          d="M-24 108 C-50 126, -72 146, -76 159 C-78 170, -56 176, -38 167 C-22 178, 22 178, 38 167 C56 176, 78 170, 76 159 C72 146, 50 126, 24 108 Z"
          fill={`url(#${id('clayPineMid')})`}
        />
        <ellipse cx="0" cy="162" rx="22" ry="15" fill={`url(#${id('clayPineTop')})`} />
      </g>

      {/* === CAMADA 2 === */}
      <g filter={`url(#${id('clayShadow')})`}>
        <path
          d="M-16 74 C-36 92, -52 108, -56 119 C-57 129, -40 134, -24 126 C-12 135, 12 135, 24 126 C40 134, 57 129, 56 119 C52 108, 36 92, 16 74 Z"
          fill={`url(#${id('clayPineTop')})`}
        />
      </g>

      {/* === CAMADA 1 (COPA ARREDONDADA FOFA) === */}
      <g filter={`url(#${id('clayShadow')})`}>
        <path
          d="M0 38 C-14 58, -32 76, -34 86 C-35 95, -20 98, -10 92 C-4 97, 4 97, 10 92 C20 98, 35 95, 34 86 C32 76, 14 58, 0 38 Z"
          fill={`url(#${id('clayPineTop')})`}
        />
      </g>

      {/* Fios escuros festonados com lâmpadas ciano/pink/amarelo neon da Imagem 2 */}
      <g stroke="#1c1917" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.88">
        <path d="M-26 70 C-8 84, 10 84, 26 72" />
        <path d="M-49 105 C-16 124, 18 124, 48 106" />
        <path d="M-68 148 C-20 170, 22 170, 68 147" />
        <path d="M-86 190 C-24 214, 26 214, 86 190" />
        <path d="M-100 225 C-28 248, 30 248, 100 226" />
      </g>

      {/* Bulbos Neon 3D nos fios */}
      {wireBulbs.map((b, i) => (
        <g key={`wb-${i}`} className={b.p === 0 ? 'natal-led-odd' : 'natal-led-even'}>
          {/* Soquete preto no fio */}
          <rect x={b.x - 2.4} y={b.y - 4.5} width="4.8" height="4" rx="1" fill="#1c1917" />
          {/* Halo colorido iluminando os galhos 3D */}
          <circle cx={b.x} cy={b.y + 3} r="10.5" fill={b.g} opacity="0.48" filter={`url(#${id('softGlow')})`} />
          <ellipse cx={b.x} cy={b.y + 3} rx="4" ry="4.8" fill={b.c} />
          <ellipse cx={b.x - 1.2} cy={b.y + 1.5} rx="1.2" ry="1.8" fill="#ffffff" opacity="0.7" />
        </g>
      ))}

      {/* Enfeites 3D da Referência 2: Gingerbread Men, Bolinhas Listradas & Rubis */}
      <Gingerbread3D x={-16} y={66} scale={0.62} rotate={-10} prefix={prefix} />
      <Gingerbread3D x={66} y={194} scale={0.76} rotate={12} prefix={prefix} />
      <Gingerbread3D x={-7} y={199} scale={0.82} rotate={-4} prefix={prefix} />

      {/* Bolinhas listradas & brilhantes 3D */}
      <g filter={`url(#${id('claySoftShadow')})`} className="natal-bauble-swing">
        <circle cx="-36" cy="128" r="8.2" fill={`url(#${id('clayBaubleRuby')})`} />
        <path d="M-43 126 Q-36 129 -29 126 M-42 130 Q-36 133 -30 130" stroke="#ffffff" strokeWidth="2.1" fill="none" opacity="0.88" />
        <circle cx="18" cy="134" r="8" fill={`url(#${id('clayBaubleRuby')})`} />
        <path d="M11 132 Q18 135 25 132 M12 136 Q18 139 24 136" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.88" />
        <circle cx="-26" cy="175" r="9.2" fill={`url(#${id('clayBaubleRuby')})`} />
        <ellipse cx="-29" cy="171.5" rx="2.5" ry="1.4" transform="rotate(-30 -29 171.5)" fill="#ffffff" opacity="0.75" />
        <circle cx="48" cy="222" r="8.4" fill={`url(#${id('clayBaubleBlue')})`} />
        <ellipse cx="45" cy="219" rx="2.2" ry="1.2" transform="rotate(-30 45 219)" fill="#ffffff" opacity="0.78" />
      </g>

      {/* Estrela 3D Dourada Chanfrada no Topo (exatamente estilo Imagem 2) */}
      <g transform="translate(0, 24)" filter={`url(#${id('clayShadow')})`} className="natal-star-twinkle">
        <circle cx="0" cy="0" r="24" fill={`url(#${id('starAura')})`} opacity="0.65" />
        <path
          d="M0 -18 C2.5 -18 4.2 -7 5.5 -6 C7 -5 18 -6 19 -3.5 C19.5 -1 11 5.5 10.5 7 C10 9 14 18 11.5 19.5 C9 20.5 1.5 14.5 0 14.5 C-1.5 14.5 -9 20.5 -11.5 19.5 C-14 18 -10 9 -10.5 7 C-11 5.5 -19.5 -1 -19 -3.5 C-18 -6 -7 -5 -5.5 -6 C-4.2 -7 -2.5 -18 0 -18 Z"
          fill={`url(#${id('clayGold3D')})`}
        />
        {/* Brilho macio no topo da estrela */}
        <path
          d="M-7 -4 Q0 -11 7 -4"
          stroke="#fef9c3"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </g>

      {/* Presentes 3D almofadados com laços fofos na neve */}
      <g transform="translate(-68, 246)" filter={`url(#${id('claySoftShadow')})`}>
        <path d="M0 6 L16 0 L34 6 L18 12 Z" fill="#f87171" />
        <path d="M0 6 L18 12 L18 28 L0 22 Z" fill="#dc2626" />
        <path d="M18 12 L34 6 L34 22 L18 28 Z" fill="#991b1b" />
        <path d="M8 3 L26 9 M26 9 L26 25 M8 9 L8 25" stroke="#fde047" strokeWidth="3.2" fill="none" />
        <path d="M17 5 C9 -3, 6 2, 16 7 C26 2, 23 -3, 17 5 Z" fill={`url(#${id('clayGold3D')})`} />
      </g>
      <g transform="translate(-32, 254)" filter={`url(#${id('claySoftShadow')})`}>
        <path d="M0 5 L13 0 L28 5 L15 10 Z" fill="#60a5fa" />
        <path d="M0 5 L15 10 L15 23 L0 18 Z" fill="#2563eb" />
        <path d="M15 10 L28 5 L28 18 L15 23 Z" fill="#1e3a8a" />
        <path d="M6.5 2.5 L21.5 7.5 M21.5 7.5 L21.5 20.5 M7.5 7.5 L7.5 20.5" stroke="#f8fafc" strokeWidth="2.6" fill="none" />
        <path d="M14 4 C9 -2, 6 2, 14 6 C22 2, 19 -2, 14 4 Z" fill="#ffffff" />
      </g>
      <g transform="translate(32, 248)" filter={`url(#${id('claySoftShadow')})`}>
        <path d="M0 6 L16 0 L34 6 L18 12 Z" fill="#fde047" />
        <path d="M0 6 L18 12 L18 28 L0 22 Z" fill="#eab308" />
        <path d="M18 12 L34 6 L34 22 L18 28 Z" fill="#b45309" />
        <path d="M8 3 L26 9 M26 9 L26 25 M8 9 L8 25" stroke="#16a34a" strokeWidth="3.2" fill="none" />
        <path d="M17 5 C9 -3, 6 2, 16 7 C26 2, 23 -3, 17 5 Z" fill="#22c55e" />
      </g>
    </g>
  );
}

/**
 * Papai Noel Clay-3D (modelado pela Referência 3: olhos brilhantes, nariz redondo fofo,
 * barba nuvem, fivela dourada 3D, saco de presentes com azevinho e sino dourado),
 * em trenó vitoriano 3D puxado por 4 renas fofas galopando rumo ao céu estrelado.
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

  const reindeerTeam = [
    { rx: 148, ry: -24, phase: 0, lead: false },
    { rx: 215, ry: -54, phase: 0.22, lead: false },
    { rx: 282, ry: -86, phase: 0.44, lead: false },
    { rx: 350, ry: -118, phase: 0.12, lead: true },
  ];

  const magicSparkles = [
    { sx: -94, sy: 62, delay: '0.1s', r: 4 },
    { sx: -52, sy: 48, delay: '0.7s', r: 5 },
    { sx: -12, sy: 34, delay: '1.3s', r: 3.8 },
    { sx: 36, sy: 16, delay: '0.4s', r: 4.5 },
    { sx: -74, sy: 74, delay: '1.1s', r: 3.4 },
    { sx: 14, sy: 46, delay: '1.7s', r: 4 },
  ];

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Rastro Mágico Duplo fluindo das pistas na neve */}
      <path
        d="M-130 86 C-64 76, 8 54, 72 16"
        stroke={`url(#${id('magicCometGold')})`}
        strokeWidth="4.8"
        strokeDasharray="16 12"
        strokeLinecap="round"
        fill="none"
        className="natal-magic-trail"
      />
      <path
        d="M-110 96 C-42 84, 24 62, 86 24"
        stroke="#7dd3fc"
        strokeWidth="2.8"
        strokeDasharray="10 14"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
        className="natal-magic-trail"
      />

      {magicSparkles.map((sp, i) => (
        <path
          key={`sp-${i}`}
          d={`M${sp.sx} ${sp.sy - sp.r} Q${sp.sx + 0.6} ${sp.sy - 0.6} ${sp.sx + sp.r} ${sp.sy} Q${sp.sx + 0.6} ${sp.sy + 0.6} ${sp.sx} ${sp.sy + sp.r} Q${sp.sx - 0.6} ${sp.sy + 0.6} ${sp.sx - sp.r} ${sp.sy} Q${sp.sx - 0.6} ${sp.sy - 0.6} ${sp.sx} ${sp.sy - sp.r} Z`}
          fill={i % 2 === 0 ? '#fef08a' : '#bae6fd'}
          className="natal-star-twinkle"
          style={{ animationDelay: sp.delay }}
        />
      ))}

      {/* Conjunto Trenó + Papai Noel Clay-3D + 4 Renas Clay-3D */}
      <g className="natal-santa-flight">
        {/* Rédeas douradas até o arreio de cada rena */}
        <path
          d="M52 -15 C106 -22, 130 -27, 160 -32 C194 -43, 212 -52, 227 -62 C260 -73, 280 -83, 294 -94 C328 -106, 348 -116, 362 -126"
          stroke="#facc15"
          strokeWidth="1.8"
          fill="none"
          opacity="0.9"
        />

        {/* TRENÓ 3D & PAPAI NOEL CLAY-3D (Inspirado diretamente na Referência 3) */}
        <g transform="translate(22, 0) rotate(-18)" filter={`url(#${id('clayShadow')})`}>
          {/* Saco vermelho gordinho 3D com azevinho e sino dourado da Referência 3 */}
          <g transform="translate(-26, -24)">
            <ellipse cx="0" cy="4" rx="22" ry="18" fill={`url(#${id('clayRedVelvet')})`} />
            {/* Folhas verdes 3D de azevinho e frutinhas no topo do saco */}
            <ellipse cx="-6" cy="-14" rx="7" ry="4" transform="rotate(-24 -6 -14)" fill={`url(#${id('clayPineTop')})`} />
            <ellipse cx="7" cy="-13" rx="7" ry="4" transform="rotate(24 7 -13)" fill={`url(#${id('clayPineTop')})`} />
            <circle cx="-1" cy="-11" r="2.6" fill="#dc2626" />
            <circle cx="3" cy="-12" r="2.4" fill="#ef4444" />
            {/* Sino dourado 3D brilhando na bolsa */}
            <g transform="translate(8, -22) rotate(14)">
              <path d="M-5 8 C-5 2, 5 2, 5 8 L7 15 L-7 15 Z" fill={`url(#${id('clayGold3D')})`} />
              <circle cx="0" cy="16" r="2.2" fill="#b45309" />
            </g>
            {/* Presente fofo e bengala doce saindo */}
            <path d="M-16 -22 L-4 -25 L-1 -12 L-13 -9 Z" fill="#60a5fa" />
            <path d="M-10 -24 L-7 -10" stroke="#ef4444" strokeWidth="2.4" />
            <path d="M10 -16 C12 -30, 20 -29, 19 -21" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            <path d="M10 -16 C12 -30, 20 -29, 19 -21" stroke="#dc2626" strokeWidth="3.4" strokeDasharray="3.2 3.2" strokeLinecap="round" fill="none" />
          </g>

          {/* PAPAI NOEL CLAY-3D (Olhos com brilho, nariz redondo, bigode e barba nuvem, fivela 3D!) */}
          <g transform="translate(6, -34)">
            {/* Tronco fofo vermelho */}
            <path
              d="M-14 30 C-14 8, 18 6, 22 30 Z"
              fill={`url(#${id('clayRedVelvet')})`}
            />
            {/* Cinto marrom escuro + FIVELA DOURADA GROSSA 3D da Imagem 3 */}
            <path d="M-12 22 C-2 25, 10 25, 20 22" stroke="#451a03" strokeWidth="4.8" fill="none" />
            <rect
              x="-1.5"
              y="19"
              width="9"
              height="7.5"
              rx="2"
              fill="none"
              stroke={`url(#${id('clayGold3D')})`}
              strokeWidth="2.4"
            />
            {/* Barra branca peluda do casaco */}
            <path d="M-13 28 C-2 31, 10 31, 21 28" stroke={`url(#${id('claySnowWhite')})`} strokeWidth="4.5" strokeLinecap="round" />

            {/* Rosto fofo 3D com olhos expressivos, bochechas e nariz redondinho */}
            <CuteClayFace
              cx={5}
              cy={1}
              skinFill={`url(#${id('claySkinLight')})`}
              cheeksOpacity={0.75}
              noseColor="#f87171"
            />
            {/* Sobrancelhas fofas brancas 3D */}
            <path d="M-1.5 -3.5 Q1.5 -5 3.5 -3.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M6.5 -3.5 Q8.5 -5 11.5 -3.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" />

            {/* Barba nuvem fofa + Bigode escultural 3D da Referência 3 */}
            <path
              d="M-7 4 C-8 19, 18 19, 17 4 C11 7, -1 7, -7 4 Z"
              fill={`url(#${id('claySnowWhite')})`}
              filter={`url(#${id('claySoftShadow')})`}
            />
            <ellipse cx="1.2" cy="4.2" rx="4.2" ry="2.2" transform="rotate(-12 1.2 4.2)" fill="#ffffff" />
            <ellipse cx="8.8" cy="4.2" rx="4.2" ry="2.2" transform="rotate(12 8.8 4.2)" fill="#ffffff" />

            {/* Gorro vermelho curvado com aba fofa branca e POMPOM gigante */}
            <path
              d="M-6 -4 C-3 -20, 14 -20, 16 -4 C10 -2, 0 -2, -6 -4 Z"
              fill={`url(#${id('clayRedVelvet')})`}
            />
            <path d="M-8 -4 C-1 -7, 11 -7, 17 -4" stroke={`url(#${id('claySnowWhite')})`} strokeWidth="5.2" strokeLinecap="round" />
            <circle cx="-11" cy="-12" r="4.4" fill={`url(#${id('claySnowWhite')})`} />

            {/* Braço direito animadamente acenando com punho peludo + luva fofa */}
            <g className="natal-santa-wave">
              <path
                d="M14 14 C21 8, 27 1, 30 -5"
                stroke={`url(#${id('clayRedVelvet')})`}
                strokeWidth="6.2"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="27.5" cy="-1" r="3.4" fill={`url(#${id('claySnowWhite')})`} />
              <circle cx="30.5" cy="-6" r="4.2" fill={`url(#${id('clayRedVelvet')})`} />
            </g>
          </g>

          {/* Carroceria escultural vitoriana do Trenó 3D */}
          <path
            d="M-48 -18 C-46 8, -37 14, -20 14 L26 14 C42 14, 51 -4, 44 -17 C36 -21, 29 -10, 22 -8 C14 -6, 6 -16, -2 -14 C-12 -12, -16 -24, -48 -18 Z"
            fill={`url(#${id('clayRedVelvet')})`}
            stroke={`url(#${id('clayGold3D')})`}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path
            d="M-28 3 C-10 8, 10 8, 28 -2"
            stroke="#fef08a"
            strokeWidth="2"
            fill="none"
            opacity="0.9"
          />
          {/* Patins grossos dourados 3D */}
          <path
            d="M-52 22 L35 22 C52 22, 58 9, 50 2 C45 0, 41 4, 46 8"
            stroke={`url(#${id('clayGold3D')})`}
            strokeWidth="4.2"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M-26 14 L-28 22 M17 14 L19 22" stroke="#d97706" strokeWidth="3.4" strokeLinecap="round" />
        </g>

        {/* 4 RENAS CLAY-3D ARTICULADAS GALOPANDO */}
        {reindeerTeam.map((rd, rIdx) => (
          <g
            key={`rd3d-${rIdx}`}
            transform={`translate(${rd.rx}, ${rd.ry}) rotate(-20)`}
            filter={`url(#${id('claySoftShadow')})`}
          >
            {/* Pernas traseiras grossinhas 3D articuladas */}
            <g className="natal-gallop-hind" style={{ animationDelay: `${rd.phase}s` }}>
              <path d="M-12 6 C-18 12, -25 16, -28 20" stroke={`url(#${id('clayReindeer')})`} strokeWidth="4.6" strokeLinecap="round" fill="none" />
              <circle cx="-28" cy="20" r="2.2" fill="#291206" />
              <path d="M-8 7 C-12 14, -18 19, -22 23" stroke="#5c2d0c" strokeWidth="4" strokeLinecap="round" fill="none" />
              <circle cx="-22" cy="23" r="2" fill="#291206" />
            </g>

            {/* Pernas dianteiras grossinhas 3D articuladas */}
            <g className="natal-gallop-fore" style={{ animationDelay: `${rd.phase}s` }}>
              <path d="M12 5 C19 8, 26 9, 30 6" stroke={`url(#${id('clayReindeer')})`} strokeWidth="4.6" strokeLinecap="round" fill="none" />
              <circle cx="30" cy="6" r="2.2" fill="#291206" />
              <path d="M10 7 C15 13, 21 17, 26 16" stroke="#5c2d0c" strokeWidth="4" strokeLinecap="round" fill="none" />
              <circle cx="26" cy="16" r="2" fill="#291206" />
            </g>

            {/* Rabo fofo branco */}
            <ellipse cx="-19" cy="-2" rx="4.2" ry="2.8" transform="rotate(-35 -19 -2)" fill={`url(#${id('claySnowWhite')})`} />

            {/* Corpo rechonchudo Clay-3D */}
            <ellipse cx="-1" cy="3" rx="17" ry="8.5" fill={`url(#${id('clayReindeer')})`} />
            {/* Barriguinha creme */}
            <path d="M-10 8 C-2 11, 8 10, 12 7" stroke="#fef3c7" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.82" />

            {/* Coleira vermelha 3D com guizo dourado grande */}
            <path d="M8 -3 L10 9" stroke="#dc2626" strokeWidth="4.2" strokeLinecap="round" />
            <circle cx="13" cy="2" r="3" fill={`url(#${id('clayGold3D')})`} />

            {/* Pescoço & Cabeça fofa 3D com leve balanço no galope */}
            <g className="natal-reindeer-bob" style={{ animationDelay: `${rd.phase}s` }}>
              <path
                d="M9 1 C11 -6, 15 -14, 19 -17 C24 -19, 30 -15, 31 -9 C31 -5, 25 -4, 19 -5 L15 5 Z"
                fill={`url(#${id('clayReindeer')})`}
              />
              {/* Focinho claro & Olho 3D brilhante */}
              <ellipse cx="26" cy="-9.5" rx="4.8" ry="3.6" fill="#fde68a" opacity="0.85" />
              <circle cx="20.5" cy="-12" r="2" fill="#1c1917" />
              <circle cx="19.9" cy="-12.6" r="0.7" fill="#ffffff" />
              {/* Orelhinha curvada */}
              <ellipse cx="14" cy="-14" rx="3.4" ry="1.8" transform="rotate(-40 14 -14)" fill="#78350f" />
              {/* Galhada 3D arredondada */}
              <path
                d="M17 -16 C15 -24, 11 -27, 8 -28 M15 -21 C12 -22, 9 -22, 7 -21 M16 -23 C19 -28, 22 -29, 25 -28"
                stroke="#fde68a"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
              {/* Nariz luminoso vermelho 3D de Rodolfo na vanguarda */}
              {rd.lead ? (
                <g>
                  <path
                    d="M31 -10 L70 -24 L70 4 Z"
                    fill={`url(#${id('rudolphGlow')})`}
                    opacity="0.48"
                    filter={`url(#${id('softGlow')})`}
                  />
                  <circle
                    cx="30.5"
                    cy="-10"
                    r="10"
                    fill={`url(#${id('rudolphGlow')})`}
                    className="natal-rudolph-beacon"
                  />
                  <circle cx="30.5" cy="-10" r="3.6" fill="#ff2e4c" />
                  <circle cx="29.4" cy="-11.2" r="1.2" fill="#ffffff" />
                </g>
              ) : (
                <circle cx="29.8" cy="-10" r="2.2" fill="#291206" />
              )}
            </g>
          </g>
        ))}
      </g>
    </g>
  );
}

/** Colinas de neve 3D contínua e fundo espesso até a última linha inferior (sem espigões cortados nos cantos). */
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
  const horizonY = isDesktop ? 320 : 418;

  return (
    <g>
      <path
        d={`M0 ${horizonY + 12} C${220 * scaleX} ${horizonY - 22}, ${460 * scaleX} ${horizonY + 14}, ${treeX} ${horizonY - 2} C${960 * scaleX} ${horizonY - 18}, ${1190 * scaleX} ${horizonY - 34}, ${width} ${horizonY - 8} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('snowHorizon')})`}
      />
      <path
        d={`M0 ${horizonY + 34} C${280 * scaleX} ${horizonY + 12}, ${520 * scaleX} ${horizonY + 38}, ${treeX + 40 * scaleX} ${horizonY + 18} C${990 * scaleX} ${horizonY + 2}, ${1210 * scaleX} ${horizonY - 12}, ${width} ${horizonY + 20} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('snowMid')})`}
      />

      {isDesktop && (
        <g opacity="0.55">
          <path
            d="M842 350 C908 338, 972 324, 1018 308"
            stroke="#93c5fd"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M860 357 C926 344, 988 330, 1034 313"
            stroke="#93c5fd"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}

      {/* Neve macia no primeiro plano até o rodapé — sem formas recortadas nas bordas laterais */}
      <path
        d={`M0 ${height - (isDesktop ? 82 : 92)} C${320 * scaleX} ${height - (isDesktop ? 104 : 114)}, ${680 * scaleX} ${height - (isDesktop ? 76 : 84)}, ${1040 * scaleX} ${height - (isDesktop ? 96 : 104)} C${1240 * scaleX} ${height - (isDesktop ? 104 : 112)}, ${1360 * scaleX} ${height - (isDesktop ? 86 : 94)}, ${width} ${height - (isDesktop ? 78 : 86)} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('snowFront')})`}
      />
    </g>
  );
}

/** Neve suave brilhante integrada dentro da própria paisagem. */
function SceneAtmosphericSnow({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const dots = [
    { x: 0.07, y: 0.28, r: 2, d: '0.2s' },
    { x: 0.16, y: 0.45, r: 2.5, d: '0.8s' },
    { x: 0.24, y: 0.22, r: 1.8, d: '1.4s' },
    { x: 0.34, y: 0.56, r: 2.3, d: '0.5s' },
    { x: 0.44, y: 0.31, r: 2, d: '1.1s' },
    { x: 0.52, y: 0.48, r: 2.6, d: '1.7s' },
    { x: 0.61, y: 0.27, r: 1.8, d: '0.4s' },
    { x: 0.69, y: 0.54, r: 2.4, d: '0.9s' },
    { x: 0.78, y: 0.35, r: 2, d: '1.5s' },
    { x: 0.87, y: 0.49, r: 2.6, d: '0.3s' },
    { x: 0.93, y: 0.29, r: 1.8, d: '1.2s' },
  ];
  return (
    <g>
      {dots.map((pt, i) => (
        <circle
          key={`as3d-${i}`}
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
 * Paisagem Natalina Full-Bleed Clay-3D Integrada ao Rodapé (Free e PRO):
 * Modelada em estilo Pixar / Clay-3D com sombreamento volumétrico, olhos brilhantes,
 * árvore fofa almofadada com luzes ciano/pink/ouro e biscoitos gingerbread,
 * Papai Noel 3D com saco e sino dourado decolando com renas articuladas,
 * e Presépio completo com os Três Reis Magos sob a Estrela Guia.
 */
export function ChristmasFooterScene({ isLight = false }: ChristmasFooterSceneProps) {
  const topFadeGradient = isLight
    ? 'linear-gradient(to bottom, #f8fafc 0%, rgba(248, 250, 252, 0.72) 28%, rgba(226, 232, 240, 0.2) 65%, rgba(15, 23, 42, 0) 100%)'
    : 'linear-gradient(to bottom, #090d14 0%, rgba(9, 13, 20, 0.72) 28%, rgba(9, 13, 20, 0.2) 65%, rgba(9, 13, 20, 0) 100%)';

  return (
    <section
      aria-label="Paisagem Natalina 3D SpotQR"
      className="relative w-full overflow-hidden select-none bg-[#d7e4f5]"
    >
      {/* Transição atmosférica sutil que preserva o brilho pleno das estrelas no alto */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-12 sm:h-16 z-10"
        style={{ background: topFadeGradient }}
      />

      {/* VERSÃO DESKTOP PANORÂMICA CLAY-3D (1440 × 475) */}
      <svg
        viewBox="0 0 1440 475"
        preserveAspectRatio="xMidYMid meet"
        className="hidden lg:block w-full h-auto"
        role="img"
        aria-label="Paisagem natalina 3D animada: Os Três Reis Magos e o Presépio com Menino Jesus, Maria e José sob a Estrela Guia à esquerda; Árvore de Natal 3D enfeitada ao centro; Papai Noel 3D no trenó levantando voo com renas à direita"
      >
        <ChristmasSceneDefs prefix="desk" />
        <SkyAndMountains width={1440} height={475} prefix="desk" />
        <StarOfBethlehem x={422} y={96} targetX={422} targetY={336} prefix="desk" />
        <SnowHillsForeground width={1440} height={475} treeX={720} prefix="desk" isDesktop />

        {/* Cenário Religioso 3D à esquerda (escala ampliada e expressiva) */}
        <ThreeWiseMenCaravan x={64} y={222} scale={1.18} prefix="desk" />
        <BethlehemNativityStable x={294} y={196} scale={1.16} prefix="desk" />

        {/* Árvore Central 3D estilo Clay separando os dois cenários */}
        <OrnateChristmasTree x={720} y={82} scale={1.12} prefix="desk" />

        {/* Papai Noel Clay-3D levantando voo com 4 renas à direita */}
        <SantaSleighTakeoffTeam x={960} y={262} scale={1.14} prefix="desk" />

        <SceneAtmosphericSnow width={1440} height={475} />
      </svg>

      {/* VERSÃO MOBILE & TABLET CLAY-3D (600 × 565) */}
      <svg
        viewBox="0 0 600 565"
        preserveAspectRatio="xMidYMid meet"
        className="block lg:hidden w-full h-auto"
        role="img"
        aria-label="Paisagem natalina 3D animada: Papai Noel levantando voo no céu estrelado, Árvore de Natal 3D ao lado do Presépio com Menino Jesus e os Três Reis Magos"
      >
        <ChristmasSceneDefs prefix="mob" />
        <SkyAndMountains width={600} height={565} prefix="mob" />
        <StarOfBethlehem x={182} y={96} targetX={255} targetY={385} prefix="mob" />
        <SnowHillsForeground width={600} height={565} treeX={455} prefix="mob" isDesktop={false} />

        <SantaSleighTakeoffTeam x={238} y={190} scale={0.82} prefix="mob" />
        <OrnateChristmasTree x={476} y={202} scale={0.96} prefix="mob" />
        <ThreeWiseMenCaravan x={8} y={358} scale={0.78} prefix="mob" />
        <BethlehemNativityStable x={148} y={316} scale={0.92} prefix="mob" />

        <SceneAtmosphericSnow width={600} height={565} />
      </svg>
    </section>
  );
}
