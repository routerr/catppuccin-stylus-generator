import type { CatppuccinFlavor, AccentColor, CatppuccinColor } from '../types/catppuccin';
import { CATPPUCCIN_PALETTES } from '../constants/catppuccin-colors';

type RGB = { r: number; g: number; b: number };

export interface AccentSet {
  biAccent1: AccentColor;
  biAccent2: AccentColor;
}

export type PrecomputedAccents = Record<CatppuccinFlavor, Record<AccentColor, AccentSet>>;

export const ACCENT_NAMES: AccentColor[] = [
  'rosewater','flamingo','pink','mauve','red','maroon','peach','yellow','green','teal','sky','sapphire','blue','lavender'
];

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function rgbDistance2(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const r1 = r / 255, g1 = g / 255, b1 = b / 255;
  const max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r1: h = (g1 - b1) / d + (g1 < b1 ? 6 : 0); break;
      case g1: h = (b1 - r1) / d + 2; break;
      case b1: h = (r1 - g1) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360; // normalize
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;
  if (0 <= h && h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (60 <= h && h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (120 <= h && h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (180 <= h && h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (240 <= h && h < 300) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }
  return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) };
}

export function nearestAccentByRGB(target: RGB, palette: Record<CatppuccinColor, { hex: string }>, exclude?: AccentColor[]): AccentColor {
  let best: { name: AccentColor; d2: number } | null = null;
  for (const name of ACCENT_NAMES) {
    if (exclude && exclude.includes(name)) continue;
    const hex = palette[name]?.hex;
    if (!hex) continue;
    const d2 = rgbDistance2(target, hexToRgb(hex));
    if (!best || d2 < best.d2) best = { name, d2 };
  }
  return (best?.name || 'mauve') as AccentColor;
}

export function computeAccentSetFor(palette: Record<CatppuccinColor, { hex: string }>, main: AccentColor): AccentSet {
  const mainHex = palette[main]?.hex;
  const { h, s, l } = hexToHsl(mainHex);
  // Analogous scheme offsets (±72° for harmonious bi-accents)
  const nearA = h + 72;
  const nearB = h - 72;

  const nearARGB = hslToRgb(nearA, s, l);
  const nearBRGB = hslToRgb(nearB, s, l);

  const bi1 = nearestAccentByRGB(nearARGB, palette, [main]);
  const bi2 = nearestAccentByRGB(nearBRGB, palette, [main, bi1]);

  return { biAccent1: bi1, biAccent2: bi2 };
}

export const PRECOMPUTED_ACCENTS: PrecomputedAccents = (() => {
  const allAccents: Partial<PrecomputedAccents> = {};
  for (const flavor of Object.keys(CATPPUCCIN_PALETTES) as CatppuccinFlavor[]) {
    allAccents[flavor] = {} as Record<AccentColor, AccentSet>;
    const palette = CATPPUCCIN_PALETTES[flavor];
    for (const accent of ACCENT_NAMES) {
      allAccents[flavor]![accent] = computeAccentSetFor(palette, accent);
    }
  }
  return allAccents as PrecomputedAccents;
})();

/**
 * Generates a comprehensive guide for AI systems explaining the Catppuccin accent system
 * including main-accents and bi-accents with their usage rules.
 */
export function generateAccentSystemGuide(flavor: CatppuccinFlavor = 'mocha'): string {
  const palette = CATPPUCCIN_PALETTES[flavor];
  const examples = [
    { main: 'blue', desc: 'Primary interactive elements (buttons, CTAs)' },
    { main: 'sapphire', desc: 'Links and navigation items' },
    { main: 'mauve', desc: 'Headings and emphasized text' },
    { main: 'green', desc: 'Success states and confirmations' },
  ];

  let guide = `CATPPUCCIN ACCENT SYSTEM - Analogous Color Harmony Guide:

═══════════════════════════════════════════════════════════

MAIN-ACCENT: The primary accent color selected by the user.

BI-ACCENTS (±72° hue, Analogous Harmony):
- Two harmonious colors that create ANALOGOUS color harmony
- Calculated at ±72° on the hue wheel from the main-accent
- Used in two ways:
  1. As MAIN-COLORS for different elements (alongside main-accent)
  2. As GRADIENT companions for any main-color they're paired with

MAIN-COLORS FOR ELEMENTS:
- The three colors used as primary colors for different UI elements
- Consists of: main-accent + bi-accent1 + bi-accent2
- Example: If main-accent is Blue → main-colors are [Blue, Sapphire, Lavender]
- Each main-color can be used independently on different elements

═══════════════════════════════════════════════════════════

CASCADING BI-ACCENT SYSTEM:

When bi-accents are used as main-colors on elements,
they get their OWN bi-accents for gradients:

Element with Blue:
  main-color: Blue
  ├─ gradient-bi1: Sapphire (±72° from Blue)
  ├─ gradient-bi2: Lavender (±72° from Blue)

Element with Sapphire (Blue's bi-accent1):
  main-color: Sapphire
  ├─ gradient-bi1: Sky (±72° from Sapphire)
  ├─ gradient-bi2: Blue (±72° from Sapphire)

Element with Lavender (Blue's bi-accent2):
  main-color: Lavender
  ├─ gradient-bi1: Mauve (±72° from Lavender)
  ├─ gradient-bi2: Pink (±72° from Lavender)

═══════════════════════════════════════════════════════════

ACCENT SCHEME REFERENCE TABLE (${flavor} flavor):

Main-Accent   → Bi-Accents (±72°)
`;

  // Generate table for all accents
  for (const mainAccent of ACCENT_NAMES) {
    const set = computeAccentSetFor(palette, mainAccent);
    guide += `${mainAccent.padEnd(12)} → [${set.biAccent1}, ${set.biAccent2}]\n`;
  }

  guide += `
═══════════════════════════════════════════════════════════

USAGE RULES:

1. MAIN-COLORS ASSIGNMENT:
   - Assign main-accent to primary UI elements (e.g., primary buttons, main CTAs)
   - Assign bi-accent1 to secondary UI elements (e.g., secondary buttons, badges)
   - Assign bi-accent2 to tertiary UI elements (e.g., tags, chips, highlights)

2. GRADIENT CREATION:
   - Each main-color uses its OWN bi-accents for gradients
   - Format: linear-gradient(main-color, gradient-bi-accent)
   - Bi-accents at 8-12% opacity for subtle effect
   - Common angles: 45deg (text/links), 135deg (buttons), 225deg (panels)

3. VISUAL HARMONY EXAMPLES:

   Primary Button (Blue main-color):
     background: linear-gradient(135deg, blue, sapphire 10%)
     color: text

   Secondary Badge (Sapphire main-color, from Blue's bi-accent1):
     background: linear-gradient(45deg, sapphire, sky 10%)
     color: text

   Tertiary Tag (Lavender main-color, from Blue's bi-accent2):
     background: linear-gradient(45deg, lavender, mauve 10%)
     color: text

═══════════════════════════════════════════════════════════

PRACTICAL MAPPING STRATEGY:

${examples.map((ex, i) => {
  const set = computeAccentSetFor(palette, ex.main as AccentColor);
  return `${i + 1}. ${ex.desc}
   → main-color: ${ex.main}
   → gradients: ${ex.main} + ${set.biAccent1} OR ${set.biAccent2}
   → related elements can use: ${set.biAccent1}, ${set.biAccent2} as their main-colors`;
}).join('\n\n')}

═══════════════════════════════════════════════════════════`;

  return guide;
}
