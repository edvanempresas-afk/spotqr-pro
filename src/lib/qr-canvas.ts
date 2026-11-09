import QRCode from 'qrcode';
import { QRConfig } from './types';

export interface RenderQROptions {
  config: QRConfig;
  targetContent: string;
  canvas: HTMLCanvasElement;
  width?: number;
  height?: number;
}

/**
 * Avalia o contraste óptico entre a cor dos pontos e o fundo do QR Code
 * para garantir que nenhuma câmera de celular falhe na leitura física.
 */
export function evaluateQRContrast(fgHex: string, bgHex: string): {
  ratio: number;
  status: 'excellent' | 'good' | 'warning';
  label: string;
} {
  const getLuminance = (hex: string) => {
    const clean = (hex || '#000000').replace('#', '');
    if (clean.length !== 6) return 0;
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(fgHex);
  const l2 = getLuminance(bgHex);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  const ratio = Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(1));

  // QR scanners also prefer darker foreground than background
  const isInverted = l1 > l2;

  if (isInverted) {
    return {
      ratio,
      status: 'warning',
      label: 'Atenção: Pontos mais claros que o fundo podem dificultar a leitura em alguns celulares.',
    };
  }

  if (ratio >= 4.5) {
    return {
      ratio,
      status: 'excellent',
      label: `Leitura Óptica Perfeita (${ratio}:1) • 100% Compatível iPhone & Android`,
    };
  }

  if (ratio >= 3.0) {
    return {
      ratio,
      status: 'good',
      label: `Bom Contraste (${ratio}:1) • Recomendado testar antes de imprimir`,
    };
  }

  return {
    ratio,
    status: 'warning',
    label: `Contraste Baixo (${ratio}:1) • Escureça a cor dos pontos para garantir leitura rápida`,
  };
}

export async function renderStyledQR({
  config,
  targetContent,
  canvas,
  width = 800,
  height = 800,
}: RenderQROptions): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Use High error correction (H) especially when logo is present (tolerates up to 30% obstruction)
  const qrData = QRCode.create(targetContent || 'https://spotqr.pro', {
    errorCorrectionLevel: 'H',
  });

  const modules = qrData.modules;
  const moduleCount = modules.size;

  // Set internal canvas resolution
  canvas.width = width;
  canvas.height = height;

  // Frame layout dimensions
  let qrSize = width * 0.76;
  let qrX = (width - qrSize) / 2;
  let qrY = (height - qrSize) / 2;

  // Adjust positioning based on frame style
  if (config.frameStyle === 'bottom_tag') {
    qrSize = width * 0.72;
    qrX = (width - qrSize) / 2;
    qrY = height * 0.12;
  } else if (
    config.frameStyle === 'polaroid' ||
    config.frameStyle === 'table_tent'
  ) {
    qrSize = width * 0.68;
    qrX = (width - qrSize) / 2;
    qrY = height * 0.16;
  } else if (config.frameStyle === 'badge') {
    qrSize = width * 0.66;
    qrX = (width - qrSize) / 2;
    qrY = height * 0.19;
  }

  // 1. Draw Background
  ctx.fillStyle = config.bgColor || '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Frame if enabled
  drawFrame(ctx, config, width, height, qrX, qrY, qrSize);

  // 3. Draw QR Matrix Modules
  const cellSize = qrSize / moduleCount;

  // Check if a module is part of the 3 Corner Finder Patterns (7x7 corners)
  const isFinderPattern = (row: number, col: number): boolean => {
    if (row < 7 && col < 7) return true;
    if (row < 7 && col >= moduleCount - 7) return true;
    if (row >= moduleCount - 7 && col < 7) return true;
    return false;
  };

  // Center logo safety zone calculation (STRICT RULE: Logo in center is ONLY for PRO / isDynamic)
  const hasLogo = Boolean(config.isDynamic && config.logoUrl);
  const logoPercentage = (config.logoSize || 22) / 100;
  const logoModulesSize = Math.floor(moduleCount * logoPercentage);
  const logoStart = Math.floor((moduleCount - logoModulesSize) / 2);
  const logoEnd = logoStart + logoModulesSize;

  const isInLogoZone = (row: number, col: number): boolean => {
    if (!hasLogo) return false;
    return (
      row >= logoStart - 1 &&
      row <= logoEnd &&
      col >= logoStart - 1 &&
      col <= logoEnd
    );
  };

  // Prepare Fill Style (Solid or Linear Gradient)
  let moduleFill: string | CanvasGradient = config.fgColor || '#000000';
  if (config.useGradient && config.fgGradientColor) {
    const grad = ctx.createLinearGradient(
      qrX,
      qrY,
      qrX + qrSize,
      qrY + qrSize
    );
    grad.addColorStop(0, config.fgColor || '#0f172a');
    grad.addColorStop(1, config.fgGradientColor);
    moduleFill = grad;
  }

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinderPattern(r, c)) continue;
      if (isInLogoZone(r, c)) continue;

      if (modules.get(r, c)) {
        const x = qrX + c * cellSize;
        const y = qrY + r * cellSize;

        drawModule(ctx, x, y, cellSize, config.dotStyle, moduleFill);
      }
    }
  }

  // 4. Draw Styled Finder Patterns (Corner Eyes)
  drawFinderPattern(ctx, qrX, qrY, cellSize, config); // Top-Left
  drawFinderPattern(
    ctx,
    qrX + (moduleCount - 7) * cellSize,
    qrY,
    cellSize,
    config
  ); // Top-Right
  drawFinderPattern(
    ctx,
    qrX,
    qrY + (moduleCount - 7) * cellSize,
    cellSize,
    config
  ); // Bottom-Left

  // 5. Draw Central Logo if present
  if (hasLogo && config.logoUrl) {
    await drawLogo(
      ctx,
      config.logoUrl,
      width,
      qrX,
      qrY,
      qrSize,
      logoPercentage
    );
  }
}

export async function generateQRVectorSVG(
  config: QRConfig,
  targetContent: string
): Promise<string> {
  return QRCode.toString(targetContent || 'https://spotqr.pro', {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: config.fgColor || '#000000',
      light: config.bgColor || '#ffffff',
    },
  });
}

function drawModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  style: QRConfig['dotStyle'],
  fillStyle: string | CanvasGradient
) {
  ctx.fillStyle = fillStyle;

  switch (style) {
    case 'dots': {
      const radius = size * 0.42;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'rounded': {
      const radius = size * 0.35;
      roundRect(
        ctx,
        x + size * 0.05,
        y + size * 0.05,
        size * 0.9,
        size * 0.9,
        radius
      );
      ctx.fill();
      break;
    }
    case 'classy': {
      const padding = size * 0.12;
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + padding);
      ctx.lineTo(x + size - padding, y + size / 2);
      ctx.lineTo(x + size / 2, y + size - padding);
      ctx.lineTo(x + padding, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'squares':
    default: {
      ctx.fillRect(x, y, Math.ceil(size), Math.ceil(size));
      break;
    }
  }
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  config: QRConfig
) {
  const eyeColor = config.cornerColor || config.fgColor;
  const size = 7 * cellSize;

  // Outer border
  ctx.fillStyle = eyeColor;
  roundRect(ctx, x, y, size, size, cellSize * 1.8);
  ctx.fill();

  // White inner gap
  ctx.fillStyle = config.bgColor || '#ffffff';
  roundRect(
    ctx,
    x + cellSize,
    y + cellSize,
    5 * cellSize,
    5 * cellSize,
    cellSize * 1.2
  );
  ctx.fill();

  // Inner center eyeball
  ctx.fillStyle = eyeColor;
  roundRect(
    ctx,
    x + 2 * cellSize,
    y + 2 * cellSize,
    3 * cellSize,
    3 * cellSize,
    cellSize * 0.9
  );
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  config: QRConfig,
  w: number,
  h: number,
  qrX: number,
  qrY: number,
  qrSize: number
) {
  const frameColor = config.frameColor || '#16a34a';
  const textColor = config.frameTextColor || '#ffffff';
  const text = config.frameText || 'ESCANEIE AQUI';

  switch (config.frameStyle) {
    case 'bottom_tag': {
      const tagW = w * 0.78;
      const tagH = h * 0.11;
      const tagX = (w - tagW) / 2;
      const tagY = qrY + qrSize + 24;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = frameColor;
      roundRect(ctx, tagX, tagY, tagW, tagH, tagH / 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.floor(tagH * 0.38)}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.toUpperCase(), w / 2, tagY + tagH / 2);
      break;
    }

    case 'polaroid':
    case 'table_tent': {
      ctx.save();
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 6;
      roundRect(ctx, 24, 24, w - 48, h - 48, 28);
      ctx.stroke();

      const bannerH = 64;
      ctx.fillStyle = frameColor;
      roundRect(ctx, 32, 32, w - 64, bannerH, 18);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = `bold 24px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        config.frameStyle === 'table_tent'
          ? '📱 CARDÁPIO NA MESA'
          : 'ESCANEIE COM SEU CELULAR',
        w / 2,
        32 + bannerH / 2
      );

      const bottomTagH = 58;
      const bottomTagY = h - 100;
      ctx.fillStyle = frameColor;
      roundRect(ctx, w * 0.15, bottomTagY, w * 0.7, bottomTagH, bottomTagH / 2);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = `bold 20px Inter, sans-serif`;
      ctx.fillText(text.toUpperCase(), w / 2, bottomTagY + bottomTagH / 2);
      ctx.restore();
      break;
    }

    case 'badge': {
      ctx.save();
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 8;
      roundRect(ctx, 30, 30, w - 60, h - 60, 40);
      ctx.stroke();

      const pillW = 260;
      const pillH = 46;
      ctx.fillStyle = frameColor;
      roundRect(ctx, (w - pillW) / 2, 10, pillW, pillH, pillH / 2);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('APONTE A CÂMERA', w / 2, 10 + pillH / 2);

      const bottomW = w * 0.75;
      const bottomH = 60;
      ctx.fillStyle = frameColor;
      roundRect(ctx, (w - bottomW) / 2, h - 84, bottomW, bottomH, 20);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText(text.toUpperCase(), w / 2, h - 84 + bottomH / 2);
      ctx.restore();
      break;
    }

    case 'luxury_border': {
      ctx.save();
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(36, 36, w - 72, h - 72);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(44, 44, w - 88, h - 88);

      ctx.fillStyle = frameColor;
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`✦ ${text.toUpperCase()} ✦`, w / 2, h - 60);
      ctx.restore();
      break;
    }

    default:
      break;
  }
}

async function drawLogo(
  ctx: CanvasRenderingContext2D,
  logoUrl: string,
  canvasWidth: number,
  qrX: number,
  qrY: number,
  qrSize: number,
  logoPercentage: number
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const centerX = qrX + qrSize / 2;
      const centerY = qrY + qrSize / 2;
      const logoBoxSize = qrSize * logoPercentage;
      const padding = 10;
      const bgBoxSize = logoBoxSize + padding * 2;

      ctx.save();

      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = '#ffffff';

      roundRect(
        ctx,
        centerX - bgBoxSize / 2,
        centerY - bgBoxSize / 2,
        bgBoxSize,
        bgBoxSize,
        bgBoxSize * 0.28
      );
      ctx.fill();

      ctx.shadowColor = 'transparent';

      ctx.save();
      roundRect(
        ctx,
        centerX - logoBoxSize / 2,
        centerY - logoBoxSize / 2,
        logoBoxSize,
        logoBoxSize,
        logoBoxSize * 0.22
      );
      ctx.clip();

      ctx.drawImage(
        img,
        centerX - logoBoxSize / 2,
        centerY - logoBoxSize / 2,
        logoBoxSize,
        logoBoxSize
      );

      ctx.restore();
      ctx.restore();
      resolve();
    };

    img.onerror = () => {
      resolve();
    };

    img.src = logoUrl;
  });
}
