/**
 * Utility functions for color analysis and manipulation.
 * Implements perceptual color science for role-based classification.
 *
 * Color science references:
 * - ΔE (Delta E): Perceptual color difference in CIE LAB space
 *   Formula: ΔE₇₆ = √[(L₂-L₁)² + (a₂-a₁)² + (b₂-b₁)²]
 * - Contrast Ratio: WCAG 2.1 relative luminance contrast
 *   Formula: CR = (L_lighter + 0.05) / (L_darker + 0.05)
 * - Color palette: Catppuccin colors (MIT license)
 */

import type { CatppuccinFlavor, CatppuccinPalette, AccentColor } from '../types/catppuccin';
import type { ColorUsage, RoleLabel, ClassificationResult } from '../types/theme';
import { CATPPUCCIN_PALETTES } from '../constants/catppuccin-colors';

// ============================================================================
// MEMOIZATION CACHES
// ============================================================================

const rgbCache = new Map<string, { r: number; g: number; b: number }>();
const hslCache = new Map<string, { h: number; s: number; l: number }>();
const labCache = new Map<string, { L: number; a: number; b: number }>();

// ============================================================================
// CORE COLOR CONVERSIONS (with memoization)
// ============================================================================

/**
 * Convert hex color to RGB (0-255 scale).
 * Memoized for performance.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().toLowerCase();
  
  if (rgbCache.has(normalized)) {
    return rgbCache.get(normalized)!;
  }
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
  if (!result) return null;
  
  const rgb = {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
  
  rgbCache.set(normalized, rgb);
  return rgb;
}

/**
 * Convert RGB (0-255) to hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Convert RGB (0-255) to HSL.
 * H: 0-360, S: 0-100, L: 0-100
 * Memoized via hex lookup.
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const hex = rgbToHex(r, g, b);
  
  if (hslCache.has(hex)) {
    return hslCache.get(hex)!;
  }
  
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  const hsl = {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
  
  hslCache.set(hex, hsl);
  return hsl;
}

/**
 * Convert RGB (0-255) to linear RGB (0-1).
 * Applies sRGB gamma correction.
 */
export function rgbToLinear(r: number, g: number, b: number): { r: number; g: number; b: number } {
  const toLinear = (val: number): number => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  
  return {
    r: toLinear(r),
    g: toLinear(g),
    b: toLinear(b)
  };
}

/**
 * Calculate relative luminance (WCAG 2.1).
 * Input: RGB in 0-255 or linear RGB in 0-1
 * Output: Luminance in 0-1
 */
export function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  // Check if already linear (values 0-1) or needs conversion (0-255)
  const isLinear = rgb.r <= 1 && rgb.g <= 1 && rgb.b <= 1;
  
  if (isLinear) {
    return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  }
  
  const linear = rgbToLinear(rgb.r, rgb.g, rgb.b);
  return 0.2126 * linear.r + 0.7152 * linear.g + 0.0722 * linear.b;
}

/**
 * Calculate contrast ratio between two colors.
 * Formula: CR = (L_lighter + 0.05) / (L_darker + 0.05)
 * Returns: 1 (no contrast) to 21 (maximum contrast)
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  
  if (!rgbA || !rgbB) return 1;
  
  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert RGB (0-255) to CIE XYZ color space.
 * Uses D65 illuminant (standard daylight).
 */
export function rgbToXyz(r: number, g: number, b: number): { X: number; Y: number; Z: number } {
  const linear = rgbToLinear(r, g, b);
  
  // D65 illuminant transformation matrix
  const X = linear.r * 0.4124564 + linear.g * 0.3575761 + linear.b * 0.1804375;
  const Y = linear.r * 0.2126729 + linear.g * 0.7151522 + linear.b * 0.0721750;
  const Z = linear.r * 0.0193339 + linear.g * 0.1191920 + linear.b * 0.9503041;
  
  return { X: X * 100, Y: Y * 100, Z: Z * 100 };
}

/**
 * Convert CIE XYZ to CIE LAB color space.
 * LAB is perceptually uniform for color difference calculations.
 */
export function xyzToLab(X: number, Y: number, Z: number): { L: number; a: number; b: number } {
  // D65 reference white point
  const Xn = 95.047;
  const Yn = 100.000;
  const Zn = 108.883;
  
  const fx = (t: number): number => {
    return t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t + 16/116);
  };
  
  const xr = fx(X / Xn);
  const yr = fx(Y / Yn);
  const zr = fx(Z / Zn);
  
  const L = 116 * yr - 16;
  const a = 500 * (xr - yr);
  const b = 200 * (yr - zr);
  
  return { L, a, b };
}

/**
 * Convert hex color to CIE LAB color space.
 * Memoized for performance.
 */
export function hexToLab(hex: string): { L: number; a: number; b: number } {
  const normalized = hex.trim().toLowerCase();
  
  if (labCache.has(normalized)) {
    return labCache.get(normalized)!;
  }
  
  const rgb = hexToRgb(normalized);
  if (!rgb) return { L: 0, a: 0, b: 0 };
  
  const xyz = rgbToXyz(rgb.r, rgb.g, rgb.b);
  const lab = xyzToLab(xyz.X, xyz.Y, xyz.Z);
  
  labCache.set(normalized, lab);
  return lab;
}

/**
 * Calculate Delta E (ΔE₇₆) color difference in LAB space.
 * Formula: ΔE₇₆ = √[(L₂-L₁)² + (a₂-a₁)² + (b₂-b₁)²]
 *
 * Interpretation:
 * - ΔE < 1.0: Not perceptible to human eye
 * - ΔE 1-2: Perceptible through close observation
 * - ΔE 2-10: Perceptible at a glance
 * - ΔE 11-49: Colors are more similar than opposite
 * - ΔE 100: Maximum difference (black vs white)
 */
export function deltaE76(lab1: { L: number; a: number; b: number }, lab2: { L: number; a: number; b: number }): number {
  const dL = lab2.L - lab1.L;
  const da = lab2.a - lab1.a;
  const db = lab2.b - lab1.b;
  
  return Math.sqrt(dL * dL + da * da + db * db);
}

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================

/**
 * @deprecated Use deltaE76 with hexToLab for perceptual distance.
 * This calculates Euclidean distance in RGB space (less accurate).
 */
export function calculateColorDistance(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return Infinity;

  // Euclidean distance in RGB space
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

/**
 * @deprecated Use relativeLuminance(hexToRgb(hex)) instead.
 */
export function getColorLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return relativeLuminance(rgb);
}

/**
 * Check if a color is light (luminance > 0.5).
 */
export function isLightColor(hex: string): boolean {
  return getColorLuminance(hex) > 0.5;
}

/**
 * @deprecated Use contrastRatio instead.
 */
export function getContrastRatio(color1: string, color2: string): number {
  return contrastRatio(color1, color2);
}

// ============================================================================
// CONTRAST UTILITIES
// ============================================================================

/**
 * Check if contrast ratio passes WCAG guidelines.
 *
 * @param hexFg - Foreground color
 * @param hexBg - Background color
 * @param mode - Contrast mode
 *   - 'strict': CR ≥ 4.5 (WCAG AA for normal text)
 *   - 'normal': CR ≥ 3.0 (WCAG AA for large text)
 *   - 'relaxed': CR ≥ 2.5 (minimum perceptibility)
 */
export function passesContrast(
  hexFg: string,
  hexBg: string,
  mode: 'strict' | 'normal' | 'relaxed' = 'normal'
): boolean {
  const cr = contrastRatio(hexFg, hexBg);
  
  switch (mode) {
    case 'strict': return cr >= 4.5;
    case 'normal': return cr >= 3.0;
    case 'relaxed': return cr >= 2.5;
    default: return cr >= 3.0;
  }
}

// ============================================================================
// CATPPUCCIN PALETTE UTILITIES
// ============================================================================

/**
 * Find the nearest neutral token from Catppuccin palette using perceptual distance.
 * Neutral tokens: base, mantle, crust, surface0-2, overlay0-2, subtext0-1, text
 */
export function nearestNeutralToken(
  hex: string,
  palette: CatppuccinPalette
): keyof CatppuccinPalette {
  const neutralKeys: (keyof CatppuccinPalette)[] = [
    'base', 'mantle', 'crust',
    'surface0', 'surface1', 'surface2',
    'overlay0', 'overlay1', 'overlay2',
    'subtext0', 'subtext1', 'text'
  ];
  
  return nearestFromSet(hex, palette, neutralKeys);
}

/**
 * Find the nearest accent token from Catppuccin palette using perceptual distance.
 */
export function nearestAccentToken(
  hex: string,
  palette: CatppuccinPalette
): AccentColor {
  const accentKeys: AccentColor[] = [
    'rosewater', 'flamingo', 'pink', 'mauve',
    'red', 'maroon', 'peach', 'yellow',
    'green', 'teal', 'sky', 'sapphire',
    'blue', 'lavender'
  ];

  return nearestFromSet(hex, palette, accentKeys) as AccentColor;
}

/**
 * Calculate triadic color scheme from an accent color.
 * Triadic colors are evenly spaced 120° apart on the color wheel.
 * Returns the two companion colors that form a harmonious triadic scheme.
 *
 * @param accentName - The main accent color name
 * @param palette - The Catppuccin palette to search in
 * @returns Object with co-accent1 and co-accent2 (the two triadic companions)
 */
export function calculateTriadicAccents(
  accentName: AccentColor,
  palette: CatppuccinPalette
): { coAccent1: AccentColor; coAccent2: AccentColor } {
  const accentHex = palette[accentName].hex;
  const rgb = hexToRgb(accentHex);

  if (!rgb) {
    // Fallback to safe defaults
    return { coAccent1: 'blue', coAccent2: 'green' };
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const baseHue = hsl.h;

  // Calculate triadic hues (120° and 240° apart)
  const triadic1Hue = (baseHue + 120) % 360;
  const triadic2Hue = (baseHue + 240) % 360;

  // Convert triadic hues back to RGB (keep same saturation and lightness)
  const triadic1Rgb = hslToRgb(triadic1Hue, hsl.s, hsl.l);
  const triadic2Rgb = hslToRgb(triadic2Hue, hsl.s, hsl.l);

  // Convert to hex
  const triadic1Hex = rgbToHex(triadic1Rgb.r, triadic1Rgb.g, triadic1Rgb.b);
  const triadic2Hex = rgbToHex(triadic2Rgb.r, triadic2Rgb.g, triadic2Rgb.b);

  // Find nearest Catppuccin accent colors
  const coAccent1 = nearestAccentToken(triadic1Hex, palette);
  const coAccent2 = nearestAccentToken(triadic2Hex, palette);

  return { coAccent1, coAccent2 };
}

/**
 * Calculate bi-accent color - the accent color most similar to the main accent.
 * Used for smooth, elegant gradients that maintain color harmony.
 *
 * Uses perceptual Delta E distance in CIE LAB space to find the closest
 * accent color (excluding the main accent itself).
 *
 * @param accentName - The main accent color name
 * @param palette - The Catppuccin palette to search in
 * @returns The most similar accent color for gradient pairing
 */
export function calculateBiAccent(
  accentName: AccentColor,
  palette: CatppuccinPalette
): AccentColor {
  const accentHex = palette[accentName].hex;
  const accentLab = hexToLab(accentHex);

  const accentKeys: AccentColor[] = [
    'rosewater', 'flamingo', 'pink', 'mauve',
    'red', 'maroon', 'peach', 'yellow',
    'green', 'teal', 'sky', 'sapphire',
    'blue', 'lavender'
  ];

  // Find the closest accent color (excluding the main accent itself)
  let minDistance = Infinity;
  let biAccent: AccentColor = 'pink'; // Safe fallback

  for (const key of accentKeys) {
    // Skip the main accent itself
    if (key === accentName) continue;

    const tokenHex = palette[key].hex;
    const tokenLab = hexToLab(tokenHex);
    const distance = deltaE76(accentLab, tokenLab);

    if (distance < minDistance) {
      minDistance = distance;
      biAccent = key;
    }
  }

  return biAccent;
}

/**
 * Calculate two bi-accents: the two accent tokens nearest to the main accent
 * on the color wheel (by perceptual ΔE distance in LAB), excluding the accent itself.
 * Returns the closest (biAccent1) and second-closest (biAccent2).
 */
export function calculateBiAccents(
  accentName: AccentColor,
  palette: CatppuccinPalette
): { biAccent1: AccentColor; biAccent2: AccentColor } {
  const accentHex = palette[accentName].hex;
  const accentLab = hexToLab(accentHex);

  const accentKeys: AccentColor[] = [
    'rosewater', 'flamingo', 'pink', 'mauve',
    'red', 'maroon', 'peach', 'yellow',
    'green', 'teal', 'sky', 'sapphire',
    'blue', 'lavender'
  ];

  const distances: Array<{ key: AccentColor; d: number }> = [];
  for (const key of accentKeys) {
    if (key === accentName) continue;
    const tokenLab = hexToLab(palette[key].hex);
    distances.push({ key, d: deltaE76(accentLab, tokenLab) });
  }

  distances.sort((a, b) => a.d - b.d);
  const biAccent1 = distances[0]?.key || 'pink';
  const biAccent2 = distances[1]?.key || 'lavender';
  return { biAccent1, biAccent2 };
}

/**
 * Convert HSL to RGB.
 * H: 0-360, S: 0-100, L: 0-100
 * Returns RGB in 0-255 scale.
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s = s / 100;
  l = l / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

/**
 * Find the nearest token from a specific set using Delta E distance.
 */
export function nearestFromSet(
  hex: string,
  palette: CatppuccinPalette,
  keys: (keyof CatppuccinPalette)[]
): keyof CatppuccinPalette {
  const inputLab = hexToLab(hex);
  let minDistance = Infinity;
  let nearest = keys[0];
  
  for (const key of keys) {
    const tokenHex = palette[key].hex;
    const tokenLab = hexToLab(tokenHex);
    const distance = deltaE76(inputLab, tokenLab);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = key;
    }
  }
  
  return nearest;
}

export function normalizeColor(color: string): string {
  // Normalize color format to hex
  color = color.trim().toLowerCase();

  // If already hex, return it
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color.toUpperCase();
  }

  // Convert 3-digit hex to 6-digit
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }

  // Parse rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return rgbToHex(r, g, b).toUpperCase();
  }

  return color;
}

export function extractColorsFromCSS(css: string): string[] {
  const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
  const colors = css.match(colorRegex) || [];
  const normalized = colors.map(normalizeColor).filter(c => c.startsWith('#'));
  return [...new Set(normalized)];
}

// ============================================================================
// COLOR ROLE CLASSIFICATION
// ============================================================================

/**
 * Classify a color into a semantic role based on usage patterns and perceptual properties.
 *
 * Implements heuristics from SPEC:
 * - Luminance thresholds (L ≤ 0.3 dark, L ≥ 0.7 light)
 * - Context weights (text, background, border, link, button)
 * - Frequency analysis (≥ 0.5 → neutral candidate)
 * - Semantic keyword detection (success, error, warning, info, primary, secondary)
 * - Saturation filtering (HSL.s < 0.1 → neutral)
 * - Perceptual distance to Catppuccin tokens
 *
 * @param hex - Color to classify
 * @param usage - Usage statistics and context
 * @param flavor - Target Catppuccin flavor
 * @param opts - Classification options
 * @returns Classification result with role and confidence
 */
export function classifyColorRole(
  hex: string,
  usage: ColorUsage,
  flavor: CatppuccinFlavor,
  opts: { strict?: boolean } = {}
): ClassificationResult {
  const palette = CATPPUCCIN_PALETTES[flavor];
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return { role: 'text.primary', confidence: 0, hints: ['Invalid color'] };
  }
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const luminance = relativeLuminance(rgb);
  const hints: string[] = [];
  
  // Confidence components (sum to 1.0)
  let contextScore = 0;
  let frequencyScore = 0;
  let saturationScore = 0;
  let distanceScore = 0;
  
  // 1. Check semantic keyword hints first (highest priority)
  if (usage.semanticHints && usage.semanticHints.length > 0) {
    const allHints = usage.semanticHints.join(' ').toLowerCase();
    
    // Success patterns
    if (/success|valid|ok|check|confirm/i.test(allHints)) {
      hints.push('Semantic keyword: success');
      return { role: 'semantic.success', confidence: 0.95, hints };
    }
    
    // Danger/Error patterns
    if (/error|danger|delete|invalid|fail|critical/i.test(allHints)) {
      hints.push('Semantic keyword: danger');
      return { role: 'semantic.danger', confidence: 0.95, hints };
    }
    
    // Warning patterns
    if (/warn|caution|alert|attention/i.test(allHints)) {
      hints.push('Semantic keyword: warning');
      return { role: 'semantic.warning', confidence: 0.95, hints };
    }
    
    // Info patterns
    if (/info|notice|tip|help|hint/i.test(allHints)) {
      hints.push('Semantic keyword: info');
      return { role: 'semantic.info', confidence: 0.95, hints };
    }
    
    // Primary/Brand patterns
    if (/primary|brand|accent|main|hero/i.test(allHints)) {
      hints.push('Semantic keyword: primary');
      return { role: 'semantic.primary', confidence: 0.9, hints };
    }
    
    // Secondary patterns
    if (/secondary|alt|alternative/i.test(allHints)) {
      hints.push('Semantic keyword: secondary');
      return { role: 'semantic.secondary', confidence: 0.9, hints };
    }
  }
  
  // 2. Context analysis (weight: 0.4)
  const contextWeights = {
    background: 0.3,
    text: 0.25,
    border: 0.15,
    link: 0.2,
    button: 0.1
  };
  
  let maxContext = 0;
  let dominantContext: string = 'other';
  
  for (const ctx of usage.contexts) {
    const weight = contextWeights[ctx as keyof typeof contextWeights] || 0;
    if (weight > maxContext) {
      maxContext = weight;
      dominantContext = ctx;
    }
  }
  
  contextScore = maxContext / 0.3; // Normalize to 0-1
  
  // 3. Frequency analysis (weight: 0.2)
  frequencyScore = Math.min(usage.frequency, 1.0);
  
  // 4. Saturation analysis (weight: 0.2)
  const isNeutral = hsl.s < 10; // HSL saturation < 10%
  saturationScore = isNeutral ? 0.8 : 0.3;
  
  // 5. Distance to nearest token (weight: 0.2)
  const nearestToken = nearestNeutralToken(hex, palette);
  const tokenLab = hexToLab(palette[nearestToken].hex);
  const hexLab = hexToLab(hex);
  const deltaE = deltaE76(hexLab, tokenLab);
  
  // Map ΔE (0-50) to score (1.0-0.0)
  distanceScore = Math.max(0, 1 - deltaE / 50);
  
  // Calculate overall confidence
  const confidence = (
    contextScore * 0.4 +
    frequencyScore * 0.2 +
    saturationScore * 0.2 +
    distanceScore * 0.2
  );
  
  // 6. Role determination based on heuristics
  
  // Link detection (high priority)
  if (usage.contexts.includes('link')) {
    hints.push('Link context detected');
    return { role: 'interactive.link', confidence: Math.max(confidence, 0.8), hints };
  }
  
  // Border-only detection
  if (usage.contexts.length === 1 && usage.contexts[0] === 'border') {
    const baseContrast = contrastRatio(hex, palette.base.hex);
    hints.push(`Border-only usage, contrast=${baseContrast.toFixed(2)}`);
    
    if (baseContrast < 2.0) {
      return { role: 'border.subtle', confidence, hints };
    } else if (baseContrast < 4.0) {
      return { role: 'border.default', confidence, hints };
    } else {
      return { role: 'border.strong', confidence, hints };
    }
  }
  
  // Luminance-based classification
  if (luminance <= 0.3) {
    hints.push(`Dark color (L=${luminance.toFixed(2)})`);
    
    if (isNeutral && frequencyScore >= 0.5) {
      if (dominantContext === 'background') {
        return { role: 'background.primary', confidence, hints };
      }
      return { role: 'text.primary', confidence, hints };
    }
    
    // Dark accent
    if (!isNeutral) {
      const accent = nearestAccentToken(hex, palette);
      hints.push(`Nearest accent: ${accent}`);
      return { role: 'semantic.primary', confidence: confidence * 0.8, hints };
    }
  }
  
  if (luminance >= 0.7) {
    hints.push(`Light color (L=${luminance.toFixed(2)})`);
    
    if (isNeutral && frequencyScore >= 0.5) {
      if (dominantContext === 'background') {
        return { role: 'background.primary', confidence, hints };
      }
      return { role: 'text.disabled', confidence, hints };
    }
  }
  
  // Mid-range luminance (0.3 < L < 0.7)
  if (isNeutral) {
    hints.push('Neutral color (low saturation)');
    
    if (dominantContext === 'background') {
      return { role: 'surface.1', confidence, hints };
    } else if (dominantContext === 'text') {
      return { role: 'text.secondary', confidence, hints };
    } else if (dominantContext === 'border') {
      return { role: 'border.default', confidence, hints };
    }
    
    return { role: 'surface.0', confidence, hints };
  }
  
  // Saturated color (accent candidate)
  hints.push(`Saturated color (S=${hsl.s}%)`);
  
  if (dominantContext === 'button') {
    return { role: 'interactive.focus', confidence, hints };
  }
  
  // Hue-based accent classification
  const hue = hsl.h;
  hints.push(`Hue=${hue}°`);
  
  // Red/Pink range (340-20°)
  if ((hue >= 340 || hue <= 20) && !isNeutral) {
    return { role: 'semantic.danger', confidence: confidence * 0.7, hints };
  }
  
  // Orange/Yellow range (20-60°)
  if (hue > 20 && hue <= 60) {
    return { role: 'semantic.warning', confidence: confidence * 0.7, hints };
  }
  
  // Green range (80-160°)
  if (hue > 80 && hue <= 160) {
    return { role: 'semantic.success', confidence: confidence * 0.7, hints };
  }
  
  // Blue range (180-260°)
  if (hue > 180 && hue <= 260) {
    return { role: 'semantic.info', confidence: confidence * 0.7, hints };
  }
  
  // Purple/Violet range (260-320°)
  if (hue > 260 && hue <= 320) {
    return { role: 'semantic.primary', confidence: confidence * 0.7, hints };
  }
  
  // Fallback to interactive secondary for other saturated colors
  return { role: 'interactive.selection', confidence: confidence * 0.5, hints };
}

/**
 * Classify all colors in a collection.
 *
 * @param sourceColors - Map of hex colors to their usage data
 * @param flavor - Target Catppuccin flavor
 * @returns Map of hex colors to their classification results
 */
export function classifyAll(
  sourceColors: Map<string, ColorUsage>,
  flavor: CatppuccinFlavor
): Map<string, ClassificationResult> {
  const results = new Map<string, ClassificationResult>();

  for (const [hex, usage] of sourceColors.entries()) {
    const classification = classifyColorRole(hex, usage, flavor);
    results.set(hex, classification);
  }

  return results;
}

// ============================================================================
// BACKGROUND VISIBILITY DETECTION HELPERS
// ============================================================================

/**
 * Parse CSS color value to normalized hex or detect transparency.
 * Handles hex, rgb, rgba, transparent, and named colors.
 *
 * @param colorValue - CSS color value (e.g., "#fff", "rgba(0,0,0,0.5)", "transparent")
 * @returns Object with hex value and opacity (0-1), or null if transparent
 */
export function parseCSSColor(colorValue: string): { hex: string; opacity: number } | null {
  if (!colorValue) return null;

  const normalized = colorValue.trim().toLowerCase();

  // Handle transparent
  if (normalized === 'transparent' || normalized === 'none') {
    return null;
  }

  // Handle rgba with 0 alpha
  const rgbaMatch = normalized.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;

    if (a === 0) return null;

    return {
      hex: rgbToHex(r, g, b),
      opacity: a
    };
  }

  // Handle hex colors
  const hexMatch = normalized.match(/^#?([a-f\d]{3}|[a-f\d]{6})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    // Expand shorthand hex
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    return {
      hex: '#' + hex,
      opacity: 1
    };
  }

  // Common named colors
  const namedColors: Record<string, string> = {
    'white': '#ffffff',
    'black': '#000000',
    'red': '#ff0000',
    'green': '#008000',
    'blue': '#0000ff',
    'yellow': '#ffff00',
    'cyan': '#00ffff',
    'magenta': '#ff00ff',
    'gray': '#808080',
    'grey': '#808080'
  };

  if (namedColors[normalized]) {
    return {
      hex: namedColors[normalized],
      opacity: 1
    };
  }

  return null;
}

/**
 * Check if a color is considered transparent or invisible.
 *
 * @param colorValue - CSS color value
 * @returns true if transparent/invisible
 */
export function isColorTransparent(colorValue: string): boolean {
  const parsed = parseCSSColor(colorValue);
  return parsed === null || parsed.opacity < 0.1;
}

/**
 * Check if two colors are perceptually different.
 * Uses Delta E threshold to determine if colors are visually distinct.
 *
 * @param color1 - First color (hex)
 * @param color2 - Second color (hex)
 * @param threshold - Delta E threshold (default: 10, lower = more similar)
 * @returns true if colors are different enough to be visible
 */
export function areColorsDifferent(color1: string, color2: string, threshold: number = 10): boolean {
  const parsed1 = parseCSSColor(color1);
  const parsed2 = parseCSSColor(color2);

  if (!parsed1 || !parsed2) {
    // If either is transparent, they're different if the other isn't
    return parsed1 !== parsed2;
  }

  const deltaE = calculateDeltaE(parsed1.hex, parsed2.hex);
  return deltaE > threshold;
}

/**
 * Detect if an element has a visible background.
 * Compares element's background to parent's background.
 *
 * @param elementBg - Element's background-color CSS value
 * @param parentBg - Parent's background-color CSS value
 * @returns true if element has a visible background different from parent
 */
export function hasVisibleBackground(elementBg: string, parentBg: string): boolean {
  // If element has no background, it's not visible
  if (isColorTransparent(elementBg)) {
    return false;
  }

  // If parent is transparent, element's background is visible
  if (isColorTransparent(parentBg)) {
    return true;
  }

  // Check if colors are perceptually different
  return areColorsDifferent(elementBg, parentBg);
}

/**
 * Detect if an element has visible borders.
 * Checks border-width and border-color.
 *
 * @param borderWidth - CSS border-width value
 * @param borderColor - CSS border-color value
 * @returns true if element has visible borders
 */
export function hasVisibleBorder(borderWidth: string, borderColor: string): boolean {
  // Check if border width is non-zero
  const widthMatch = borderWidth.match(/(\d+(\.\d+)?)/);
  if (!widthMatch) return false;

  const width = parseFloat(widthMatch[1]);
  if (width <= 0) return false;

  // Check if border color is not transparent
  return !isColorTransparent(borderColor);
}

/**
 * Generate a random hover gradient angle.
 * Returns an angle between 0 and 360 degrees.
 *
 * @returns Random angle in degrees
 */
export function generateRandomGradientAngle(): number {
  return Math.floor(Math.random() * 361);
}
