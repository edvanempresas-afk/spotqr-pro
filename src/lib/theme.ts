import { ShowcaseThemeMode } from './types';

export interface ShowcaseColorPreset {
  name: string;
  hex: string;
}

export const SHOWCASE_COLOR_PRESETS: ShowcaseColorPreset[] = [
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Rosa Vinho', hex: '#e11d48' },
  { name: 'Dourado', hex: '#d97706' },
  { name: 'Azul Royal', hex: '#2563eb' },
  { name: 'Roxo', hex: '#7c3aed' },
  { name: 'Turquesa', hex: '#0d9488' },
  { name: 'Terracota', hex: '#ea580c' },
  { name: 'Pink', hex: '#db2777' },
  { name: 'Oliva', hex: '#65a30d' },
  { name: 'Grafite', hex: '#334155' },
];

export function normalizeHexColor(hex?: string, fallback = '#10b981'): string {
  if (!hex || typeof hex !== 'string') return fallback;
  const trimmed = hex.trim();
  const fullMatch = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
  if (fullMatch) return `#${fullMatch[1].toLowerCase()}`;
  const shortMatch = trimmed.match(/^#?([0-9a-fA-F]{3})$/);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = normalizeHexColor(hex).slice(1);
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toByte = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

export function getPerceivedBrightness(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function getContrastTextColor(bgHex: string): '#0f172a' | '#ffffff' {
  return getPerceivedBrightness(bgHex) >= 152 ? '#0f172a' : '#ffffff';
}

/**
 * Ensures accent text (like prices and links) remains crisp against both
 * light (#ffffff) and dark (#090d14) backgrounds.
 */
export function getReadableAccentTextColor(
  accentHex: string,
  isLight: boolean
): string {
  const { r, g, b } = hexToRgb(accentHex);
  const brightness = getPerceivedBrightness(accentHex);

  if (isLight && brightness > 155) {
    const factor = 0.62;
    return rgbToHex(r * factor, g * factor, b * factor);
  }
  if (!isLight && brightness < 95) {
    const factor = 0.45;
    return rgbToHex(
      r + (255 - r) * factor,
      g + (255 - g) * factor,
      b + (255 - b) * factor
    );
  }
  return normalizeHexColor(accentHex);
}

export function resolveShowcaseTheme(
  themeMode?: ShowcaseThemeMode,
  themeColor?: string,
  defaultColor = '#10b981'
) {
  const resolvedMode: ShowcaseThemeMode =
    themeMode === 'light' ? 'light' : 'dark';
  const isLight = resolvedMode === 'light';
  const accentHex = normalizeHexColor(themeColor, defaultColor);
  const accentTextOnSolid = getContrastTextColor(accentHex);
  const readableAccentText = getReadableAccentTextColor(accentHex, isLight);
  const accentSoftBg = hexToRgba(accentHex, isLight ? 0.12 : 0.16);
  const accentBorder = hexToRgba(accentHex, isLight ? 0.36 : 0.42);

  return {
    themeMode: resolvedMode,
    isLight,
    accentHex,
    accentTextOnSolid,
    readableAccentText,
    accentSoftBg,
    accentBorder,
  };
}

