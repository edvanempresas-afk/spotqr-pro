'use client';

import React from 'react';

interface ChristmasFooterSceneProps {
  /** Adapta suavemente a transição superior da paisagem ao fundo claro ou escuro da vitrine. */
  isLight?: boolean;
}

function makeId(prefix: string) {
  return (name: string) => `natal-pixar-${prefix}-${name}`;
}

/**
 * Gradientes de céu noturno, aurora boreal, estrelas, halos neon e colinas de neve
 * isolados por prefixo (desktop vs mobile) para integração perfeita com os renders 3D.
 */
function ChristmasSceneDefs({ prefix }: { prefix: string }) {
  const id = makeId(prefix);
  return (
    <defs>
      <filter id={id('auroraBlur')} x="-25%" y="-40%" width="150%" height="180%">
        <feGaussianBlur stdDeviation="17" />
      </filter>
      <filter id={id('softBeamBlur')} x="-30%" y="-20%" width="160%" height="150%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <filter id={id('softGlow')} x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="6.5" />
      </filter>

      {/* Céu noturno em sintonia com o fundo escuro dos renders 3D */}
      <linearGradient id={id('skyGrad')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#060c1d" />
        <stop offset="48%" stopColor="#0a1636" />
        <stop offset="86%" stopColor="#122752" />
        <stop offset="100%" stopColor="#1a3469" />
      </linearGradient>

      {/* Aurora Boreal */}
      <linearGradient id={id('auroraGreen')} x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
        <stop offset="32%" stopColor="#34d399" stopOpacity="0.28" />
        <stop offset="66%" stopColor="#38bdf8" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={id('auroraViolet')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
        <stop offset="45%" stopColor="#a78bfa" stopOpacity="0.18" />
        <stop offset="80%" stopColor="#2dd4bf" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
      </linearGradient>

      {/* Cauda luminosa da estrela cadente */}
      <linearGradient id={id('shootingTail')} x1="0" y1="0" x2="1" y2="0.35">
        <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0" />
        <stop offset="55%" stopColor="#bae6fd" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.96" />
      </linearGradient>

      {/* Estrela Guia e Iluminação Quente */}
      <radialGradient id={id('starAura')} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
        <stop offset="28%" stopColor="#fef08a" stopOpacity="0.72" />
        <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.24" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={id('starBeam')} x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.42" />
        <stop offset="48%" stopColor="#fde047" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={id('warmLanternGlow')} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.88" />
        <stop offset="35%" stopColor="#fbbf24" stopOpacity="0.42" />
        <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('rudolphGlow')} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="30%" stopColor="#ff2e4c" stopOpacity="0.82" />
        <stop offset="70%" stopColor="#ef4444" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>

      {/* Halos neon sincronizados com as luzes da Árvore 3D */}
      <radialGradient id={id('bulbCyan')} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.95" />
        <stop offset="45%" stopColor="#22d3ee" stopOpacity="0.48" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('bulbPink')} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fbcfe8" stopOpacity="0.95" />
        <stop offset="45%" stopColor="#ec4899" stopOpacity="0.48" />
        <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('bulbGold')} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.95" />
        <stop offset="45%" stopColor="#fde047" stopOpacity="0.48" />
        <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
      </radialGradient>

      {/* Montanhas distantes e colinas contínuas de neve */}
      <linearGradient id={id('mountainFar')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1b305a" />
        <stop offset="100%" stopColor="#0f1e3d" />
      </linearGradient>
      <linearGradient id={id('mountainMid')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#223b6b" />
        <stop offset="100%" stopColor="#132549" />
      </linearGradient>
      <linearGradient id={id('snowHorizon')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#dce9fc" />
        <stop offset="65%" stopColor="#c4d8f2" />
        <stop offset="100%" stopColor="#9fb9dc" />
      </linearGradient>
      <linearGradient id={id('snowMid')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f4f9ff" />
        <stop offset="60%" stopColor="#e2edfb" />
        <stop offset="100%" stopColor="#c4d6ef" />
      </linearGradient>
      <linearGradient id={id('snowFront')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
        <stop offset="45%" stopColor="#eff6ff" />
        <stop offset="100%" stopColor="#d7e4f5" />
      </linearGradient>
      <linearGradient id={id('snowVeil')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8fbff" stopOpacity="0" />
        <stop offset="48%" stopColor="#f1f7ff" stopOpacity="0.88" />
        <stop offset="100%" stopColor="#dde9f8" stopOpacity="1" />
      </linearGradient>
      <linearGradient id={id('magicCometGold')} x1="0" y1="0.8" x2="1" y2="0.2">
        <stop offset="0%" stopColor="#fde047" stopOpacity="0" />
        <stop offset="35%" stopColor="#facc15" stopOpacity="0.72" />
        <stop offset="100%" stopColor="#fef9c3" stopOpacity="0.98" />
      </linearGradient>
    </defs>
  );
}

/** Fundo celeste animado: aurora boreal, estrelas cintilantes, estrela cadente e cordilheiras nevadas. */
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
    { x: 0.04, y: 0.14, r: 1.5, diamond: false },
    { x: 0.09, y: 0.27, r: 1.2, diamond: false },
    { x: 0.14, y: 0.13, r: 2.2, diamond: true },
    { x: 0.21, y: 0.32, r: 1.3, diamond: false },
    { x: 0.37, y: 0.21, r: 1.9, diamond: true },
    { x: 0.45, y: 0.11, r: 1.4, diamond: false },
    { x: 0.56, y: 0.17, r: 2.1, diamond: true },
    { x: 0.64, y: 0.28, r: 1.4, diamond: false },
    { x: 0.72, y: 0.14, r: 1.8, diamond: true },
    { x: 0.81, y: 0.12, r: 1.6, diamond: false },
    { x: 0.89, y: 0.21, r: 2.1, diamond: true },
    { x: 0.95, y: 0.14, r: 1.4, diamond: false },
  ];

  const distantPinesX = [88, 145, 505, 558, 848, 898, 1320, 1378];

  return (
    <g>
      <rect x="0" y="0" width={width} height={height} fill={`url(#${id('skyGrad')})`} />

      {/* Aurora Boreal suave no céu alto */}
      <g filter={`url(#${id('auroraBlur')})`} className="natal-aurora-wave">
        <path
          d={`M${-60 * scaleX} ${height * 0.22} C${280 * scaleX} ${height * 0.07}, ${560 * scaleX} ${height * 0.3}, ${940 * scaleX} ${height * 0.14} C${1160 * scaleX} ${height * 0.05}, ${1340 * scaleX} ${height * 0.22}, ${width + 60} ${height * 0.12} L${width + 60} ${height * 0.38} C${1220 * scaleX} ${height * 0.41}, ${860 * scaleX} ${height * 0.24}, ${520 * scaleX} ${height * 0.39} C${240 * scaleX} ${height * 0.48}, ${40 * scaleX} ${height * 0.28}, ${-60 * scaleX} ${height * 0.35} Z`}
          fill={`url(#${id('auroraGreen')})`}
        />
        <path
          d={`M${120 * scaleX} ${height * 0.16} C${480 * scaleX} ${height * 0.27}, ${790 * scaleX} ${height * 0.06}, ${1180 * scaleX} ${height * 0.19} L${1260 * scaleX} ${height * 0.33} C${880 * scaleX} ${height * 0.18}, ${540 * scaleX} ${height * 0.38}, ${120 * scaleX} ${height * 0.28} Z`}
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
              style={{ animationDelay: `${(idx * 0.44).toFixed(2)}s` }}
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
            style={{ animationDelay: `${(idx * 0.35).toFixed(2)}s` }}
          />
        );
      })}

      {/* Estrela cadente com cauda suave */}
      <g className="natal-shooting-star">
        <path
          d={`M${width * 0.57} ${height * 0.16} Q${width * 0.62} ${height * 0.175}, ${width * 0.67} ${height * 0.2} Q${width * 0.62} ${height * 0.183}, ${width * 0.57} ${height * 0.16} Z`}
          fill={`url(#${id('shootingTail')})`}
        />
        <line
          x1={width * 0.57}
          y1={height * 0.16}
          x2={width * 0.67}
          y2={height * 0.2}
          stroke={`url(#${id('shootingTail')})`}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx={width * 0.67} cy={height * 0.2} r="2.2" fill="#ffffff" />
      </g>

      {/* Cordilheiras e bosques distantes arredondados */}
      <path
        d={`M0 ${height * 0.64} C${180 * scaleX} ${height * 0.52}, ${310 * scaleX} ${height * 0.61}, ${490 * scaleX} ${height * 0.53} C${670 * scaleX} ${height * 0.46}, ${820 * scaleX} ${height * 0.59}, ${1020 * scaleX} ${height * 0.5} C${1190 * scaleX} ${height * 0.43}, ${1320 * scaleX} ${height * 0.55}, ${width} ${height * 0.52} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('mountainFar')})`}
      />
      <path
        d={`M0 ${height * 0.7} C${190 * scaleX} ${height * 0.6}, ${360 * scaleX} ${height * 0.67}, ${580 * scaleX} ${height * 0.59} C${790 * scaleX} ${height * 0.53}, ${980 * scaleX} ${height * 0.65}, ${1180 * scaleX} ${height * 0.57} C${1310 * scaleX} ${height * 0.53}, ${1390 * scaleX} ${height * 0.61}, ${width} ${height * 0.63} L${width} ${height} L0 ${height} Z`}
        fill={`url(#${id('mountainMid')})`}
      />
      {distantPinesX.map((px, i) => {
        const x = px * scaleX;
        const baseY = height * (0.63 + (i % 3) * 0.02);
        const h = 21 + (i % 3) * 7;
        return (
          <path
            key={`dp-${i}`}
            d={`M${x} ${baseY - h} C${x - 5} ${baseY - h * 0.55}, ${x - 10} ${baseY - 4}, ${x - 9} ${baseY} C${x - 3} ${baseY + 2}, ${x + 3} ${baseY + 2}, ${x + 9} ${baseY} C${x + 10} ${baseY - 4}, ${x + 5} ${baseY - h * 0.55}, ${x} ${baseY - h} Z`}
            fill="#0e1e40"
            opacity="0.72"
          />
        );
      })}
    </g>
  );
}

/** Estrela Guia radiante com feixe volumétrico suave iluminando o Presépio 3D. */
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
  const halfSpan = 128;
  return (
    <g>
      <path
        d={`M${x - 6} ${y + 6} C${x - 45} ${y + 68}, ${targetX - halfSpan * 0.8} ${targetY - 42}, ${targetX - halfSpan} ${targetY} L${targetX + halfSpan} ${targetY} C${targetX + halfSpan * 0.8} ${targetY - 42}, ${x + 45} ${y + 68}, ${x + 6} ${y + 6} Z`}
        fill={`url(#${id('starBeam')})`}
        filter={`url(#${id('softBeamBlur')})`}
      />
      <g transform={`translate(${x}, ${y})`}>
        <g className="natal-star-twinkle">
          <circle cx="0" cy="0" r="48" fill={`url(#${id('starAura')})`} />
          <path
            d="M0 -30 C4 -9 8 -6 26 0 C8 6 4 9 0 38 C-4 9 -8 6 -26 0 C-8 -6 -4 -9 0 -30 Z"
            fill="#fde047"
          />
          <path
            d="M0 -18 C3 -6 5 -4 14 -12 C6 -3 5 3 13 13 C3 5 -2 6 0 18 C-2 6 -4 4 -13 13 C-5 3 -6 -3 -14 -12 C-5 -4 -3 -6 0 -18 Z"
            fill="#fef9c3"
          />
          <circle cx="0" cy="0" r="4.8" fill="#ffffff" />
        </g>
      </g>
    </g>
  );
}

/** Os Três Reis Magos Pixar-3D caminhando pela neve com lanterna acesa pulsante e fumaça animada. */
function WiseMen3DSprite({
  x,
  y,
  w,
  prefix,
}: {
  x: number;
  y: number;
  w: number;
  prefix: string;
}) {
  const id = makeId(prefix);
  const h = w * (564 / 760);

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Importante: classe de animação em grupo interno para não sobrescrever o translate(x,y) externo */}
      <g className="natal-magi-stride">
        <image
          href="/natal/reis-magos-3d.png"
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid meet"
        />
        {/* Halo pulsante vivo exatamente sobre a lanterna dourada de Baltazar (0.953, 0.51) */}
        <circle
          cx={w * 0.94}
          cy={h * 0.51}
          r={w * 0.11}
          fill={`url(#${id('warmLanternGlow')})`}
          className="natal-hearth-breath"
        />
        {/* Fios sutis e animados de incenso subindo acima do turíbulo de Gaspar (0.618, 0.355) */}
        <g transform={`translate(${w * 0.618}, ${h * 0.355})`}>
          <path
            d="M0 0 C-4 -10, 5 -20, -1 -32"
            stroke="#e2e8f0"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
            className="natal-incense-float"
          />
          <path
            d="M3 2 C7 -8, -2 -18, 4 -29"
            stroke="#bae6fd"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            className="natal-incense-float"
            style={{ animationDelay: '1.3s' }}
          />
        </g>
      </g>
    </g>
  );
}

/** Presépio Pixar-3D com clarão pulsante da lanterna e da manjedoura sobre Maria, José e Menino Jesus. */
function Nativity3DSprite({
  x,
  y,
  w,
  prefix,
}: {
  x: number;
  y: number;
  w: number;
  prefix: string;
}) {
  const id = makeId(prefix);
  const h = w * (731 / 800);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <image
        href="/natal/presepio-3d.png"
        width={w}
        height={h}
        preserveAspectRatio="xMidYMid meet"
      />
      {/* Brilho acolhedor respirando sobre a lanterna suspensa (0.499, 0.464) e manjedoura (0.50, 0.69) */}
      <circle
        cx={w * 0.499}
        cy={h * 0.464}
        r={w * 0.14}
        fill={`url(#${id('warmLanternGlow')})`}
        className="natal-hearth-breath"
        style={{ mixBlendMode: 'screen' }}
      />
      <circle
        cx={w * 0.495}
        cy={h * 0.69}
        r={w * 0.16}
        fill={`url(#${id('warmLanternGlow')})`}
        opacity="0.52"
        className="natal-hearth-breath"
        style={{ animationDelay: '1.1s', mixBlendMode: 'screen' }}
      />
    </g>
  );
}

/** Árvore de Natal Pixar-3D com halos neon piscantes exatamente alinhados nas lâmpadas e estrela do topo. */
function ChristmasTree3DSprite({
  x,
  y,
  w,
  prefix,
}: {
  x: number;
  y: number;
  w: number;
  prefix: string;
}) {
  const id = makeId(prefix);
  const h = w * (1131 / 686);

  const treeBulbs = [
    // Ciano (coordenadas normalizadas medidas da arte)
    { nx: 0.417, ny: 0.234, grad: 'bulbCyan', p: 0 },
    { nx: 0.801, ny: 0.417, grad: 'bulbCyan', p: 1 },
    { nx: 0.518, ny: 0.406, grad: 'bulbCyan', p: 0 },
    { nx: 0.186, ny: 0.49, grad: 'bulbCyan', p: 1 },
    { nx: 0.476, ny: 0.534, grad: 'bulbCyan', p: 0 },
    { nx: 0.417, ny: 0.721, grad: 'bulbCyan', p: 1 },
    // Rosa Pink
    { nx: 0.632, ny: 0.259, grad: 'bulbPink', p: 1 },
    { nx: 0.269, ny: 0.369, grad: 'bulbPink', p: 0 },
    { nx: 0.258, ny: 0.539, grad: 'bulbPink', p: 1 },
    { nx: 0.745, ny: 0.558, grad: 'bulbPink', p: 0 },
    { nx: 0.88, ny: 0.746, grad: 'bulbPink', p: 1 },
    // Amarelo Ouro
    { nx: 0.642, ny: 0.233, grad: 'bulbGold', p: 0 },
    { nx: 0.706, ny: 0.429, grad: 'bulbGold', p: 1 },
    { nx: 0.265, ny: 0.734, grad: 'bulbGold', p: 0 },
    { nx: 0.656, ny: 0.776, grad: 'bulbGold', p: 1 },
  ];

  return (
    <g transform={`translate(${x}, ${y})`}>
      <image
        href="/natal/arvore-3d.png"
        width={w}
        height={h}
        preserveAspectRatio="xMidYMid meet"
      />
      {/* Halo brilhante na estrela dourada 3D no topo */}
      <circle
        cx={w * 0.495}
        cy={h * 0.088}
        r={w * 0.14}
        fill={`url(#${id('starAura')})`}
        className="natal-star-twinkle"
        style={{ mixBlendMode: 'screen' }}
      />
      {/* Halos piscantes vivos sincronizados com os piscas ciano/rosa/ouro */}
      {treeBulbs.map((b, i) => (
        <circle
          key={`tb3d-${i}`}
          cx={w * b.nx}
          cy={h * b.ny}
          r={w * 0.078}
          fill={`url(#${id(b.grad)})`}
          className={b.p === 0 ? 'natal-led-odd' : 'natal-led-even'}
          style={{ mixBlendMode: 'screen' }}
        />
      ))}
    </g>
  );
}

/**
 * Papai Noel 3D no trenó levantando voo com as renas:
 * Rastro mágico duplo animado saindo da colina nevada + voo fluido + farol vermelho pulsante em Rodolfo.
 */
function SantaSleigh3DSprite({
  x,
  y,
  w,
  prefix,
  showGroundTracks,
}: {
  x: number;
  y: number;
  w: number;
  prefix: string;
  showGroundTracks: boolean;
}) {
  const id = makeId(prefix);
  const h = w * (653 / 1100);

  const magicSparkles = [
    { sx: -w * 0.08, sy: h * 0.94, delay: '0.1s', r: 4.5 },
    { sx: -w * 0.02, sy: h * 0.87, delay: '0.7s', r: 5.5 },
    { sx: w * 0.04, sy: h * 0.81, delay: '1.3s', r: 4 },
    { sx: w * 0.11, sy: h * 0.77, delay: '0.4s', r: 5 },
    { sx: -w * 0.05, sy: h * 0.98, delay: '1.1s', r: 3.6 },
  ];

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Trilhos na neve + rastro mágico dourado & azul acompanhando a decolagem atrás dos patins */}
      {showGroundTracks && (
        <g opacity="0.72">
          <path
            d={`M${-w * 0.16} ${h * 1.07} C${-w * 0.06} ${h * 1.01}, ${w * 0.02} ${h * 0.94}, ${w * 0.09} ${h * 0.87}`}
            stroke="#93c5fd"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M${-w * 0.12} ${h * 1.09} C${-w * 0.02} ${h * 1.03}, ${w * 0.06} ${h * 0.96}, ${w * 0.13} ${h * 0.89}`}
            stroke="#93c5fd"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}

      <path
        d={`M${-w * 0.14} ${h * 0.98} C${-w * 0.02} ${h * 0.92}, ${w * 0.08} ${h * 0.84}, ${w * 0.17} ${h * 0.73}`}
        stroke={`url(#${id('magicCometGold')})`}
        strokeWidth="4.5"
        strokeDasharray="16 12"
        strokeLinecap="round"
        fill="none"
        className="natal-magic-trail"
      />
      <path
        d={`M${-w * 0.1} ${h * 1.02} C${w * 0.01} ${h * 0.95}, ${w * 0.11} ${h * 0.87}, ${w * 0.21} ${h * 0.76}`}
        stroke="#7dd3fc"
        strokeWidth="2.6"
        strokeDasharray="10 14"
        strokeLinecap="round"
        fill="none"
        opacity="0.72"
        className="natal-magic-trail"
      />

      {magicSparkles.map((sp, i) => (
        <path
          key={`sp3d-${i}`}
          d={`M${sp.sx} ${sp.sy - sp.r} Q${sp.sx + 0.6} ${sp.sy - 0.6} ${sp.sx + sp.r} ${sp.sy} Q${sp.sx + 0.6} ${sp.sy + 0.6} ${sp.sx} ${sp.sy + sp.r} Q${sp.sx - 0.6} ${sp.sy + 0.6} ${sp.sx - sp.r} ${sp.sy} Q${sp.sx - 0.6} ${sp.sy - 0.6} ${sp.sx} ${sp.sy - sp.r} Z`}
          fill={i % 2 === 0 ? '#fef08a' : '#bae6fd'}
          className="natal-star-twinkle"
          style={{ animationDelay: sp.delay }}
        />
      ))}

      {/* Conjunto 3D completo em voo animado suave (grupo interno protege translate externo) */}
      <g className="natal-santa-flight">
        <image
          href="/natal/papai-noel-treno-3d.png"
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid meet"
        />
        {/* Farol vermelho pulsante vivo diretamente no nariz de Rodolfo (0.943, 0.216) */}
        <circle
          cx={w * 0.943}
          cy={h * 0.216}
          r={w * 0.036}
          fill={`url(#${id('rudolphGlow')})`}
          className="natal-rudolph-beacon"
          style={{ mixBlendMode: 'screen' }}
        />
      </g>
    </g>
  );
}

/** Neve suave integrada sobre toda a largura da cena para unir céu e solo. */
function SceneAtmosphericSnow({ width, height }: { width: number; height: number }) {
  const dots = [
    { x: 0.07, y: 0.24, r: 2, d: '0.2s' },
    { x: 0.16, y: 0.42, r: 2.5, d: '0.8s' },
    { x: 0.25, y: 0.21, r: 1.8, d: '1.4s' },
    { x: 0.35, y: 0.52, r: 2.3, d: '0.5s' },
    { x: 0.45, y: 0.29, r: 2, d: '1.1s' },
    { x: 0.54, y: 0.46, r: 2.6, d: '1.7s' },
    { x: 0.62, y: 0.25, r: 1.8, d: '0.4s' },
    { x: 0.71, y: 0.5, r: 2.4, d: '0.9s' },
    { x: 0.79, y: 0.34, r: 2, d: '1.5s' },
    { x: 0.88, y: 0.47, r: 2.5, d: '0.3s' },
    { x: 0.94, y: 0.27, r: 1.8, d: '1.2s' },
  ];
  return (
    <g>
      {dots.map((pt, i) => (
        <circle
          key={`as-pixar-${i}`}
          cx={pt.x * width}
          cy={pt.y * height}
          r={pt.r}
          fill="#ffffff"
          opacity="0.7"
          className="natal-star-twinkle"
          style={{ animationDelay: pt.d }}
        />
      ))}
    </g>
  );
}

/**
 * Paisagem Natalina Pixar-3D Full-Bleed Integrada ao Rodapé (Free e PRO):
 * Combina renders Pixar-3D transparentes sem caixas quadradas com fundo noturno estrelado,
 * aurora boreal, iluminação dinâmica, galope aéreo do Papai Noel e neve contínua.
 */
export function ChristmasFooterScene({ isLight = false }: ChristmasFooterSceneProps) {
  const topFadeGradient = isLight
    ? 'linear-gradient(to bottom, #f8fafc 0%, rgba(248, 250, 252, 0.72) 28%, rgba(226, 232, 240, 0.2) 65%, rgba(15, 23, 42, 0) 100%)'
    : 'linear-gradient(to bottom, #090d14 0%, rgba(9, 13, 20, 0.72) 28%, rgba(9, 13, 20, 0.2) 65%, rgba(9, 13, 20, 0) 100%)';

  return (
    <section
      aria-label="Paisagem Natalina 3D Animada SpotQR"
      className="relative w-full overflow-hidden select-none bg-[#d7e4f5]"
    >
      {/* Transição atmosférica sutil do topo da página para o céu estrelado */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-12 sm:h-16 z-10"
        style={{ background: topFadeGradient }}
      />

      {/* VERSÃO DESKTOP PANORÂMICA PIXAR-3D (1440 × 490) */}
      <svg
        viewBox="0 0 1440 490"
        preserveAspectRatio="xMidYMid meet"
        className="hidden lg:block w-full h-auto"
        role="img"
        aria-label="Paisagem natalina 3D: Os Três Reis Magos e o Presépio com Menino Jesus sob a Estrela Guia à esquerda; Árvore de Natal 3D enfeitada ao centro; Papai Noel 3D no trenó levantando voo com as renas à direita"
      >
        <ChristmasSceneDefs prefix="desk" />
        <SkyAndMountains width={1440} height={490} prefix="desk" />

        {/* Colinas nevadas contínuas atrás dos personagens */}
        <path
          d="M0 338 C220 302, 460 338, 720 322 C960 306, 1190 290, 1440 318 L1440 490 L0 490 Z"
          fill="url(#natal-pixar-desk-snowHorizon)"
        />
        <path
          d="M0 362 C280 338, 520 366, 760 344 C990 328, 1210 314, 1440 348 L1440 490 L0 490 Z"
          fill="url(#natal-pixar-desk-snowMid)"
        />

        {/* Estrela Guia iluminando suavemente o Presépio */}
        <StarOfBethlehem x={442} y={76} targetX={442} targetY={346} prefix="desk" />

        {/* Renders Pixar-3D Transparentes com animações de luz & voo acopladas */}
        <WiseMen3DSprite x={50} y={208} w={252} prefix="desk" />
        <Nativity3DSprite x={306} y={148} w={274} prefix="desk" />
        <ChristmasTree3DSprite x={617} y={54} w={206} prefix="desk" />
        <SantaSleigh3DSprite x={866} y={74} w={474} prefix="desk" showGroundTracks />

        {/* Primeiro plano contínuo de neve macia fundindo as bases à paisagem + espaço para a doca */}
        <path
          d="M0 392 C320 382, 680 396, 1040 386 C1240 378, 1360 390, 1440 396 L1440 490 L0 490 Z"
          fill="url(#natal-pixar-desk-snowVeil)"
        />
        <path
          d="M0 406 C340 396, 700 408, 1060 398 C1260 390, 1370 402, 1440 408 L1440 490 L0 490 Z"
          fill="url(#natal-pixar-desk-snowFront)"
        />

        <SceneAtmosphericSnow width={1440} height={490} />
      </svg>

      {/* VERSÃO MOBILE & TABLET PIXAR-3D (600 × 590) */}
      <svg
        viewBox="0 0 600 590"
        preserveAspectRatio="xMidYMid meet"
        className="block lg:hidden w-full h-auto"
        role="img"
        aria-label="Paisagem natalina 3D: Papai Noel levantando voo no céu estrelado, Árvore de Natal 3D, Presépio com Menino Jesus e os Três Reis Magos"
      >
        <ChristmasSceneDefs prefix="mob" />
        <SkyAndMountains width={600} height={590} prefix="mob" />

        {/* Colinas contínuas para o plano mobile */}
        <path
          d="M0 416 C140 386, 290 418, 455 402 C520 395, 565 390, 600 400 L600 590 L0 590 Z"
          fill="url(#natal-pixar-mob-snowHorizon)"
        />
        <path
          d="M0 442 C180 424, 340 446, 470 426 C530 418, 568 416, 600 428 L600 590 L0 590 Z"
          fill="url(#natal-pixar-mob-snowMid)"
        />

        <StarOfBethlehem x={144} y={76} targetX={280} targetY={400} prefix="mob" />

        {/* Papai Noel voando alto no céu estrelado do mobile */}
        <SantaSleigh3DSprite x={216} y={64} w={370} prefix="mob" showGroundTracks={false} />

        {/* Árvore + Presépio + Reis Magos amplos e nítidos na colina */}
        <ChristmasTree3DSprite x={392} y={160} w={194} prefix="mob" />
        <WiseMen3DSprite x={8} y={342} w={178} prefix="mob" />
        <Nativity3DSprite x={176} y={284} w={210} prefix="mob" />

        {/* Chão de neve macia na base para a doca móvel */}
        <path
          d="M0 472 C170 462, 340 476, 490 468 C545 464, 576 470, 600 474 L600 590 L0 590 Z"
          fill="url(#natal-pixar-mob-snowVeil)"
        />
        <path
          d="M0 486 C180 478, 350 488, 500 480 C550 476, 580 482, 600 486 L600 590 L0 590 Z"
          fill="url(#natal-pixar-mob-snowFront)"
        />

        <SceneAtmosphericSnow width={600} height={590} />
      </svg>
    </section>
  );
}
