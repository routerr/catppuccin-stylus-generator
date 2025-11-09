import type { CatppuccinFlavor, AccentColor, CatppuccinColor } from '../types/catppuccin';
import { CATPPUCCIN_PALETTES } from '../constants/catppuccin-colors';

type RGB = { r: number; g: number; b: number };

export interface AccentSet {
  biAccent1: AccentColor;
  biAccent2: AccentColor;
  coAccent1: AccentColor;
  coAccent2: AccentColor;
}

export type PrecomputedAccents = Record<CatppuccinFlavor, Record<AccentColor, AccentSet>>;

const ACCENT_NAMES: AccentColor[] = [
  'rosewater','flamingo','pink','mauve','red','maroon','peach','yellow','green','teal','sky','sapphire','blue','lavender'
];

function hexToRgb(hex: string): RGB {
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

function nearestAccentByRGB(target: RGB, palette: Record<CatppuccinColor, { hex: string }>, exclude?: AccentColor[]): AccentColor {
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

function computeAccentSetFor(palette: Record<CatppuccinColor, { hex: string }>, main: AccentColor): AccentSet {
  const mainHex = palette[main]?.hex;
  const { h, s, l } = hexToHsl(mainHex);
  // Pentagonal scheme offsets (nearest: ±72°, farther: ±144°)
  const nearA = h + 72;
  const nearB = h - 72;
  const farA = h + 144;
  const farB = h - 144;

  const nearARGB = hslToRgb(nearA, s, l);
  const nearBRGB = hslToRgb(nearB, s, l);
  const farARGB = hslToRgb(farA, s, l);
  const farBRGB = hslToRgb(farB, s, l);

  const bi1 = nearestAccentByRGB(nearARGB, palette, [main]);
  const bi2 = nearestAccentByRGB(nearBRGB, palette, [main, bi1]);
  const co1 = nearestAccentByRGB(farARGB, palette, [main, bi1, bi2]);
  const co2 = nearestAccentByRGB(farBRGB, palette, [main, bi1, bi2, co1]);

  return { biAccent1: bi1, biAccent2: bi2, coAccent1: co1, coAccent2: co2 };
}

export const PRECOMPUTED_ACCENTS: PrecomputedAccents = (() => {
  const result: Partial<PrecomputedAccents> = {};
  for (const [flavor, palette] of Object.entries(CATPPUCCIN_PALETTES) as [CatppuccinFlavor, any][]) {
    const perAccent: Record<AccentColor, AccentSet> = {} as any;
    for (const accent of ACCENT_NAMES) {
      perAccent[accent] = computeAccentSetFor(palette, accent);
    }
    result[flavor] = perAccent as any;
  }
  return result as PrecomputedAccents;
})();

/**
 * Generates a comprehensive guide for AI systems explaining the Catppuccin accent system
 * including main-accents, bi-accents, and co-accents with their usage rules.
 */
export function generateAccentSystemGuide(flavor: CatppuccinFlavor = 'mocha'): string {
  const examples = [
    { main: 'blue', desc: 'Primary interactive elements (buttons, CTAs)' },
    { main: 'sapphire', desc: 'Links and navigation items' },
    { main: 'mauve', desc: 'Headings and emphasized text' },
    { main: 'green', desc: 'Success states and confirmations' },
  ];

  let guide = `CATPPUCCIN ADVANCED ACCENT SYSTEM - Color Harmony Guide:

═══════════════════════════════════════════════════════════

MAIN-ACCENT: The primary accent color selected for an element.

BI-ACCENTS (Gradient Companions at ±72° hue):
- Two harmonious colors that create ANALOGOUS color harmony
- ALWAYS used as gradient partners WITH their main-accent
- Create subtle, pleasing gradients (e.g., linear-gradient(main-accent, bi-accent))
- NEVER appear alone; always paired with their main-accent

CO-ACCENTS (Independent Companions at ±144° hue):
- Two TRIADIC harmony colors (complementary color theory)
- NEVER appear in the same element as their originating main-accent
- Used as INDEPENDENT main-accents on DIFFERENT elements
- Create visual separation and color diversity across the UI

═══════════════════════════════════════════════════════════

CASCADING ACCENT HIERARCHY:

When a co-accent becomes a main-accent on a different element,
it gets its own bi-accents for gradients:

Primary Element:
  main-accent: Blue
  ├─ bi-accent1: Sapphire (gradient with Blue)
  ├─ bi-accent2: Lavender (gradient with Blue)
  └─ co-accents: Peach, Pink (used elsewhere, NOT with Blue)

Secondary Element (uses Blue's co-accent):
  main-accent: Peach (from Blue's co-accent)
  ├─ bi-accent1: Yellow (gradient with Peach)
  ├─ bi-accent2: Maroon (gradient with Peach)
  └─ co-accents: Sky, Mauve (used elsewhere, NOT with Peach)

Tertiary Element (uses Peach's co-accent):
  main-accent: Sky (from Peach's co-accent)
  ├─ bi-accent1: Sapphire (gradient with Sky)
  ├─ bi-accent2: Teal (gradient with Sky)

═══════════════════════════════════════════════════════════

ACCENT SCHEME REFERENCE TABLE (${flavor} flavor):

`;

  // Generate table for all accents
  for (const mainAccent of ACCENT_NAMES) {
    const set = PRECOMPUTED_ACCENTS[flavor][mainAccent];
    guide += `${mainAccent.padEnd(12)} → bi: [${set.biAccent1}, ${set.biAccent2}] | co: [${set.coAccent1}, ${set.coAccent2}]\n`;
  }

  guide += `
═══════════════════════════════════════════════════════════

USAGE RULES:

1. GRADIENT CREATION:
   - Use main-accent + bi-accent (e.g., linear-gradient(blue, sapphire))
   - Bi-accents at 8-12% opacity for subtle effect
   - Common angles: 45deg, 135deg, 225deg

2. CO-ACCENT SEPARATION:
   - Co-accents MUST NOT appear with their originating main-accent
   - Co-accents become main-accents on OTHER elements
   - Example: If blue is used for buttons, peach/pink (blue's co-accents)
     should be used for DIFFERENT elements like badges or secondary CTAs

3. VISUAL HARMONY EXAMPLES:

   Primary Button:
     background: linear-gradient(135deg, blue, sapphire 10%)
     ❌ WRONG: color: peach (peach is blue's co-accent!)
     ✅ RIGHT: color: text

   Secondary Badge (uses blue's co-accent):
     background: linear-gradient(45deg, peach, yellow 10%)
     ❌ WRONG: color: blue (blue is peach's originator!)
     ✅ RIGHT: color: text

   Focus Ring (uses co-accent from current element):
     outline: 2px solid peach (if main element uses blue)

═══════════════════════════════════════════════════════════

PRACTICAL MAPPING STRATEGY:

${examples.map((ex, i) => {
  const set = PRECOMPUTED_ACCENTS[flavor][ex.main as AccentColor];
  return `${i + 1}. ${ex.desc}
   → main: ${ex.main}
   → gradients: ${ex.main} + ${set.biAccent1} OR ${set.biAccent2}
   → other elements can use: ${set.coAccent1}, ${set.coAccent2}`;
}).join('\n\n')}

═══════════════════════════════════════════════════════════`;

  return guide;
}

