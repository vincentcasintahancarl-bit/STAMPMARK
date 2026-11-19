import { CanvasTone, ThemePreference, ThemePresetId } from '../types/school';

export interface ThemePresetMeta {
  id: Exclude<ThemePresetId, 'custom'>;
  name: string;
  subtitle: string;
  accent: string;
  accentHover: string;
  accentActive: string;
  accentBright: string;
  darkAccent: string;
  darkAccentHover: string;
  darkAccentActive: string;
  darkText: string;
  soft: string;
  softHover: string;
  border: string;
  darkSoft: string;
  darkSoftHover: string;
  darkBorder: string;
  rgb: string;
}

export const DEFAULT_THEME_PREFERENCE: ThemePreference = {
  presetId: 'crimson',
  customHex: '#7C1D1D',
  canvasTone: 'ivory',
  colorMode: 'light',
};

export const THEME_PRESETS: ThemePresetMeta[] = [
  {
    id: 'crimson',
    name: 'Oxblood Crest',
    subtitle: 'Heirloom oxblood ink & parchment',
    accent: '#7C1D1D',
    accentHover: '#631616',
    accentActive: '#4D1010',
    accentBright: '#991B1B',
    darkAccent: '#9E2626',
    darkAccentHover: '#B52E2E',
    darkAccentActive: '#7C1D1D',
    darkText: '#FCA5A5',
    soft: '#FAF3F1',
    softHover: '#F3E5E2',
    border: '#E5C9C5',
    darkSoft: '#2E1616',
    darkSoftHover: '#3D1D1D',
    darkBorder: '#9A4848',
    rgb: '124, 29, 29',
  },
  {
    id: 'forest',
    name: 'Savile Racing Green',
    subtitle: 'Clubhouse dark green & cream vellum',
    accent: '#163F2B',
    accentHover: '#103020',
    accentActive: '#0A2116',
    accentBright: '#1E563B',
    darkAccent: '#1E5E3F',
    darkAccentHover: '#26734E',
    darkAccentActive: '#163F2B',
    darkText: '#86EFAC',
    soft: '#F1F7F4',
    softHover: '#E3EFE9',
    border: '#C2DBCD',
    darkSoft: '#12281D',
    darkSoftHover: '#183627',
    darkBorder: '#3B7E5C',
    rgb: '22, 63, 43',
  },
  {
    id: 'navy',
    name: 'Regatta Navy',
    subtitle: 'Double-breasted blazer navy & linen',
    accent: '#172A4A',
    accentHover: '#101F38',
    accentActive: '#0A1426',
    accentBright: '#213D6B',
    darkAccent: '#264B87',
    darkAccentHover: '#305CA3',
    darkAccentActive: '#172A4A',
    darkText: '#93C5FD',
    soft: '#F1F4FA',
    softHover: '#E2E9F5',
    border: '#C5D0E6',
    darkSoft: '#132036',
    darkSoftHover: '#1A2C4A',
    darkBorder: '#436FB3',
    rgb: '23, 42, 74',
  },
  {
    id: 'plum',
    name: 'Bordeaux Reserve',
    subtitle: 'Vintage claret wine & ivory stock',
    accent: '#571E43',
    accentHover: '#441634',
    accentActive: '#310F25',
    accentBright: '#702756',
    darkAccent: '#7D2B60',
    darkAccentHover: '#963574',
    darkAccentActive: '#571E43',
    darkText: '#F0ABFC',
    soft: '#F8F2F6',
    softHover: '#EFE2EA',
    border: '#DFC7D6',
    darkSoft: '#2B1524',
    darkSoftHover: '#3A1C31',
    darkBorder: '#8E4775',
    rgb: '87, 30, 67',
  },
  {
    id: 'bronze',
    name: 'Tortoiseshell & Brass',
    subtitle: 'Aged saddle leather & library oak',
    accent: '#753A14',
    accentHover: '#5C2C0E',
    accentActive: '#452009',
    accentBright: '#8F481A',
    darkAccent: '#944918',
    darkAccentHover: '#AD571E',
    darkAccentActive: '#753A14',
    darkText: '#FCD34D',
    soft: '#FAF4EE',
    softHover: '#F2E7DB',
    border: '#E4CEB8',
    darkSoft: '#2C1B10',
    darkSoftHover: '#3A2416',
    darkBorder: '#9A633A',
    rgb: '117, 58, 20',
  },
  {
    id: 'slate',
    name: 'Charcoal Flannel',
    subtitle: 'Tailored worsted charcoal & stone',
    accent: '#262320',
    accentHover: '#191715',
    accentActive: '#0E0D0C',
    accentBright: '#3D3833',
    darkAccent: '#4A443E',
    darkAccentHover: '#5C544D',
    darkAccentActive: '#262320',
    darkText: '#F3ECE0',
    soft: '#F4F2EE',
    softHover: '#E8E4DC',
    border: '#D7D0C5',
    darkSoft: '#24211D',
    darkSoftHover: '#302B26',
    darkBorder: '#756C60',
    rgb: '38, 35, 32',
  },
];

export const CANVAS_TONES: {
  id: CanvasTone;
  name: string;
  description: string;
  hex: string;
  darkHex: string;
  darkName: string;
  darkDescription: string;
}[] = [
  {
    id: 'ivory',
    name: 'Archival Parchment',
    description: 'Warm heirloom cotton manuscript paper',
    hex: '#F6F2E9',
    darkHex: '#0C0B09',
    darkName: 'Obsidian Inkwell',
    darkDescription: 'High-contrast warm charcoal backdrop',
  },
  {
    id: 'white',
    name: 'Alabaster Vellum',
    description: 'Soft gallery-white archival stock',
    hex: '#FAF8F3',
    darkHex: '#050504',
    darkName: 'Pitch Ebony',
    darkDescription: 'Maximum-contrast pure obsidian ground',
  },
  {
    id: 'cool',
    name: 'Limestone Linen',
    description: 'Muted estate limestone paper',
    hex: '#EFECE4',
    darkHex: '#0F1114',
    darkName: 'Midnight Slate',
    darkDescription: 'Deep tailored mineral dark ground',
  },
];

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function normalizeHex(input: string): string | null {
  const cleaned = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned
      .split('')
      .map((ch) => ch + ch)
      .join('');
    return `#${expanded.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }
  return null;
}

function hexToRgb(hex: string): RgbColor {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RgbColor): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function mixColor(base: RgbColor, target: RgbColor, weightOfTarget: number): RgbColor {
  const w = Math.max(0, Math.min(1, weightOfTarget));
  return {
    r: base.r * (1 - w) + target.r * w,
    g: base.g * (1 - w) + target.g * w,
    b: base.b * (1 - w) + target.b * w,
  };
}

function relativeLuminance({ r, g, b }: RgbColor): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Ensures the chosen custom accent maintains at least 4.5:1 contrast with white
 * text on primary buttons and readable contrast on white surfaces.
 */
function ensureReadableAccentRgb(rgb: RgbColor): RgbColor {
  let current = { ...rgb };
  for (let i = 0; i < 20; i += 1) {
    if (relativeLuminance(current) <= 0.18) break;
    current = mixColor(current, { r: 12, g: 12, b: 12 }, 0.14);
  }
  return current;
}

/**
 * Ensures an accent text/icon tone maintains high contrast (>= 6.5:1) against
 * #161412 obsidian dark surfaces in High-Contrast Dark Mode.
 */
function ensureReadableDarkTextRgb(rgb: RgbColor): RgbColor {
  let current = { ...rgb };
  const ivory: RgbColor = { r: 247, g: 243, b: 234 };
  // Dark surface #161412 has relative luminance ~0.007.
  // For >= 7:1 contrast against ~0.007, target luminance >= ~0.35.
  for (let i = 0; i < 24; i += 1) {
    if (relativeLuminance(current) >= 0.42) break;
    current = mixColor(current, ivory, 0.16);
  }
  return current;
}

export interface ComputedThemeTokens {
  accent: string;
  accentHover: string;
  accentActive: string;
  accentBright: string;
  accentText: string;
  soft: string;
  softHover: string;
  border: string;
  rgb: string;
  canvas: string;
  wasDarkenedForContrast: boolean;
}

export function computeThemeTokens(pref: ThemePreference): ComputedThemeTokens {
  const isDark = pref.colorMode === 'dark';
  const canvasObj =
    CANVAS_TONES.find((c) => c.id === pref.canvasTone) || CANVAS_TONES[0];
  const canvasHex = isDark ? canvasObj.darkHex : canvasObj.hex;

  if (pref.presetId !== 'custom') {
    const preset =
      THEME_PRESETS.find((p) => p.id === pref.presetId) || THEME_PRESETS[0];

    if (isDark) {
      return {
        accent: preset.darkAccent,
        accentHover: preset.darkAccentHover,
        accentActive: preset.darkAccentActive,
        accentBright: preset.darkText,
        accentText: preset.darkText,
        soft: preset.darkSoft,
        softHover: preset.darkSoftHover,
        border: preset.darkBorder,
        rgb: preset.rgb,
        canvas: canvasHex,
        wasDarkenedForContrast: false,
      };
    }

    return {
      accent: preset.accent,
      accentHover: preset.accentHover,
      accentActive: preset.accentActive,
      accentBright: preset.accentBright,
      accentText: preset.accent,
      soft: preset.soft,
      softHover: preset.softHover,
      border: preset.border,
      rgb: preset.rgb,
      canvas: canvasHex,
      wasDarkenedForContrast: false,
    };
  }

  const validHex = normalizeHex(pref.customHex) || '#991B1B';
  const rawRgb = hexToRgb(validHex);
  const safeRgb = ensureReadableAccentRgb(rawRgb);
  const safeHex = rgbToHex(safeRgb);
  const wasDarkened = safeHex !== validHex;

  const white: RgbColor = { r: 255, g: 255, b: 255 };
  const black: RgbColor = { r: 0, g: 0, b: 0 };

  if (isDark) {
    const darkSurface: RgbColor = { r: 22, g: 20, b: 18 };
    const textRgb = ensureReadableDarkTextRgb(rawRgb);
    const textHex = rgbToHex(textRgb);
    const ctaRgb = mixColor(safeRgb, white, 0.08);
    const hoverHex = rgbToHex(mixColor(ctaRgb, white, 0.14));
    const activeHex = safeHex;
    const softHex = rgbToHex(mixColor(darkSurface, safeRgb, 0.24));
    const softHoverHex = rgbToHex(mixColor(darkSurface, safeRgb, 0.34));
    const borderHex = rgbToHex(mixColor(darkSurface, textRgb, 0.45));

    return {
      accent: rgbToHex(ctaRgb),
      accentHover: hoverHex,
      accentActive: activeHex,
      accentBright: textHex,
      accentText: textHex,
      soft: softHex,
      softHover: softHoverHex,
      border: borderHex,
      rgb: `${Math.round(textRgb.r)}, ${Math.round(textRgb.g)}, ${Math.round(textRgb.b)}`,
      canvas: canvasHex,
      wasDarkenedForContrast: wasDarkened,
    };
  }

  const hoverHex = rgbToHex(mixColor(safeRgb, black, 0.18));
  const activeHex = rgbToHex(mixColor(safeRgb, black, 0.3));
  const brightHex = rgbToHex(mixColor(safeRgb, white, 0.12));
  const softHex = rgbToHex(mixColor(safeRgb, white, 0.92));
  const softHoverHex = rgbToHex(mixColor(safeRgb, white, 0.85));
  const borderHex = rgbToHex(mixColor(safeRgb, white, 0.72));

  return {
    accent: safeHex,
    accentHover: hoverHex,
    accentActive: activeHex,
    accentBright: brightHex,
    accentText: safeHex,
    soft: softHex,
    softHover: softHoverHex,
    border: borderHex,
    rgb: `${Math.round(safeRgb.r)}, ${Math.round(safeRgb.g)}, ${Math.round(safeRgb.b)}`,
    canvas: canvasHex,
    wasDarkenedForContrast: wasDarkened,
  };
}

export function applyThemeToDocument(pref: ThemePreference): ComputedThemeTokens {
  const tokens = computeThemeTokens(pref);
  const isDark = pref.colorMode === 'dark';
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.style.setProperty('--theme-accent', tokens.accent);
    root.style.setProperty('--theme-accent-hover', tokens.accentHover);
    root.style.setProperty('--theme-accent-active', tokens.accentActive);
    root.style.setProperty('--theme-accent-bright', tokens.accentBright);
    root.style.setProperty('--theme-accent-text', tokens.accentText);
    root.style.setProperty('--theme-accent-soft', tokens.soft);
    root.style.setProperty('--theme-accent-soft-hover', tokens.softHover);
    root.style.setProperty('--theme-accent-border', tokens.border);
    root.style.setProperty('--theme-accent-rgb', tokens.rgb);
    root.style.setProperty('--theme-canvas', tokens.canvas);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? tokens.canvas : tokens.accent);
    }
  }
  return tokens;
}
