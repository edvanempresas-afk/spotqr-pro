import QRCode from 'qrcode';
import { QRConfig, QRType } from './types';

export function getDefaultFrameTexts(type: QRType): {
  topText: string;
  bottomText: string;
} {
  switch (type) {
    case 'menu':
      return {
        topText: '📱 CARDÁPIO NA MESA',
        bottomText: 'VER CARDÁPIO & PEDIR',
      };
    case 'catalog':
      return {
        topText: '🛍️ CATÁLOGO DIGITAL',
        bottomText: 'VER PRODUTOS & PEDIR',
      };
    case 'pix':
      return {
        topText: '💠 PAGAMENTO VIA PIX',
        bottomText: 'PAGUE COM PIX',
      };
    case 'whatsapp':
      return {
        topText: '💬 ATENDIMENTO WHATSAPP',
        bottomText: 'CHAMAR NO WHATSAPP',
      };
    case 'wifi':
      return {
        topText: '📶 WI-FI PARA CLIENTES',
        bottomText: 'CONECTAR NO WI-FI',
      };
    case 'google_reviews':
      return {
        topText: '⭐ AVALIE NO GOOGLE',
        bottomText: 'DEIXE 5 ESTRELAS',
      };
    case 'instagram':
      return {
        topText: '📸 SIGA NO INSTAGRAM',
        bottomText: 'SIGA NO INSTAGRAM',
      };
    case 'vcard':
      return {
        topText: '👤 CARTÃO DIGITAL',
        bottomText: 'SALVAR CONTATO',
      };
    case 'url':
    default:
      return {
        topText: '🌐 ACESSE NOSSO LINK',
        bottomText: 'ESCANEIE AQUI',
      };
  }
}

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
  const defaults = getDefaultFrameTexts(config.type);
  const text = config.frameText || defaults.bottomText;

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
      ctx.font = `bold ${Math.floor(tagH * 0.36)}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.toUpperCase(), w / 2, tagY + tagH / 2, tagW * 0.9);
      break;
    }

    case 'polaroid':
    case 'table_tent': {
      ctx.save();
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = Math.max(4, Math.round(w * 0.006));
      roundRect(ctx, 24, 24, w - 48, h - 48, 28);
      ctx.stroke();

      const bannerH = Math.round(h * 0.068);
      ctx.fillStyle = frameColor;
      roundRect(ctx, 34, 34, w - 68, bannerH, 18);
      ctx.fill();

      const topLabel = (
        config.frameTopText ||
        (config.frameStyle === 'table_tent'
          ? defaults.topText
          : 'ESCANEIE COM SEU CELULAR')
      ).toUpperCase();

      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.round(w * 0.025)}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(topLabel, w / 2, 34 + bannerH / 2, w - 104);

      const bottomTagH = Math.round(h * 0.058);
      const bottomTagY = h - Math.round(h * 0.095);
      ctx.fillStyle = frameColor;
      roundRect(
        ctx,
        w * 0.14,
        bottomTagY,
        w * 0.72,
        bottomTagH,
        bottomTagH / 2
      );
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.round(w * 0.022)}px Inter, -apple-system, sans-serif`;
      ctx.fillText(
        text.toUpperCase(),
        w / 2,
        bottomTagY + bottomTagH / 2,
        w * 0.66
      );
      ctx.restore();
      break;
    }

    case 'badge': {
      ctx.save();
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = Math.max(6, Math.round(w * 0.007));
      roundRect(ctx, 30, 30, w - 60, h - 60, 40);
      ctx.stroke();

      const pillW = Math.round(w * 0.34);
      const pillH = Math.round(h * 0.052);
      ctx.fillStyle = frameColor;
      roundRect(ctx, (w - pillW) / 2, 10, pillW, pillH, pillH / 2);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.round(w * 0.02)}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        (config.frameTopText || 'APONTE A CÂMERA').toUpperCase(),
        w / 2,
        10 + pillH / 2,
        pillW * 0.9
      );

      const bottomW = w * 0.75;
      const bottomH = Math.round(h * 0.065);
      ctx.fillStyle = frameColor;
      roundRect(
        ctx,
        (w - bottomW) / 2,
        h - Math.round(h * 0.098),
        bottomW,
        bottomH,
        20
      );
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.round(w * 0.023)}px Inter, -apple-system, sans-serif`;
      ctx.fillText(
        text.toUpperCase(),
        w / 2,
        h - Math.round(h * 0.098) + bottomH / 2,
        bottomW * 0.9
      );
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
      ctx.font = `bold ${Math.round(w * 0.022)}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`✦ ${text.toUpperCase()} ✦`, w / 2, h - 60, w - 120);
      ctx.restore();
      break;
    }

    default:
      break;
  }
}

function loadCanvasSafeImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const trimmed = (url || '').trim();
    if (!trimmed || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    if (!trimmed.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = trimmed;
  });
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
  const img = await loadCanvasSafeImage(logoUrl);
  if (!img) return;

  const centerX = qrX + qrSize / 2;
  const centerY = qrY + qrSize / 2;
  const logoBoxSize = qrSize * logoPercentage;
  const padding = Math.max(6, Math.round(canvasWidth * 0.01));
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

  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  const sSide = Math.min(natW, natH);
  if (sSide > 0) {
    const sx = (natW - sSide) / 2;
    const sy = (natH - sSide) / 2;
    ctx.drawImage(
      img,
      sx,
      sy,
      sSide,
      sSide,
      centerX - logoBoxSize / 2,
      centerY - logoBoxSize / 2,
      logoBoxSize,
      logoBoxSize
    );
  } else {
    ctx.drawImage(
      img,
      centerX - logoBoxSize / 2,
      centerY - logoBoxSize / 2,
      logoBoxSize,
      logoBoxSize
    );
  }

  ctx.restore();
  ctx.restore();
}

export interface RenderPixQrOptions {
  payload: string;
  logoUrl?: string;
  isPro?: boolean;
}

export interface RenderPixQrResult {
  dataUrl: string;
  hasEmbeddedLogo: boolean;
}

/**
 * Renders a high-contrast EMVCo PIX QR Code using Level H error correction.
 * For PRO showcases with a store/restaurant logo, embeds the centered logo inside
 * the cleared quiet center zone so bank scanners read reliably.
 */
export async function renderPixQrDataUrl({
  payload,
  logoUrl,
  isPro = false,
}: RenderPixQrOptions): Promise<RenderPixQrResult> {
  if (typeof document === 'undefined') {
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      width: 320,
      margin: 2,
    });
    return { dataUrl, hasEmbeddedLogo: false };
  }

  const cleanLogo = isPro && logoUrl?.trim() ? logoUrl.trim() : '';
  const preloadedLogo = cleanLogo ? await loadCanvasSafeImage(cleanLogo) : null;
  const canEmbedLogo = Boolean(preloadedLogo);

  const buildConfig = (withLogo: boolean): QRConfig => ({
    type: 'pix',
    url: '',
    whatsappPhone: '',
    whatsappMessage: '',
    pixKey: '',
    pixKeyType: 'email',
    pixName: 'PIX',
    pixCity: 'BRASIL',
    wifiSSID: '',
    wifiPassword: '',
    wifiEncryption: 'WPA',
    googleReviewUrl: '',
    fgColor: '#000000',
    bgColor: '#ffffff',
    cornerColor: '#000000',
    dotStyle: 'squares',
    logoUrl: withLogo ? cleanLogo : undefined,
    logoSize: 22,
    frameStyle: 'none',
    frameText: '',
    frameColor: '#000000',
    frameTextColor: '#ffffff',
    isDynamic: withLogo,
  });

  const canvas = document.createElement('canvas');

  if (canEmbedLogo) {
    try {
      await renderStyledQR({
        config: buildConfig(true),
        targetContent: payload,
        canvas,
        width: 640,
        height: 640,
      });
      return {
        dataUrl: canvas.toDataURL('image/png'),
        hasEmbeddedLogo: true,
      };
    } catch {
      // Fallback cleanly to plain Level-H QR if canvas becomes tainted
    }
  }

  await renderStyledQR({
    config: buildConfig(false),
    targetContent: payload,
    canvas,
    width: 640,
    height: 640,
  });

  return {
    dataUrl: canvas.toDataURL('image/png'),
    hasEmbeddedLogo: false,
  };
}
