/**
 * Guardrails module for CSS property validation and WCAG contrast enforcement.
 */

import { CATPPUCCIN_PALETTES } from '../constants/catppuccin-colors';
import type { CatppuccinFlavor, CatppuccinColor } from '../types/catppuccin';

// ============================================================================
// LAYOUT PROPERTY DETECTION
// ============================================================================

/**
 * CSS properties that affect layout and should trigger warnings.
 */
const LAYOUT_PROPERTIES = new Set([
  'width', 'min-width', 'max-width',
  'height', 'min-height', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'position', 'top', 'right', 'bottom', 'left',
  'display', 'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
  'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
  'transform', 'translate', 'rotate', 'scale',
  'float', 'clear',
  'overflow', 'overflow-x', 'overflow-y',
  'z-index',
]);

/**
 * Properties that are safe (color-only) and should not trigger warnings.
 */
const SAFE_PROPERTIES = new Set([
  'color', 'background', 'background-color', 'background-image',
  'border-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline-color', 'text-decoration-color', 'caret-color',
  'fill', 'stroke',
  'box-shadow', 'text-shadow',
  'opacity',
]);

export interface LayoutWarning {
  selector: string;
  property: string;
  value: string;
  reason: string;
}

/**
 * Scan CSS declarations for layout-affecting properties.
 */
export function scanDeclarations(css: string): LayoutWarning[] {
  const warnings: LayoutWarning[] = [];
  
  // Match rule blocks: selector { declarations }
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match;
  
  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2];
    
    // Match individual declarations: property: value;
    const declRegex = /([a-z-]+)\s*:\s*([^;]+)/gi;
    let declMatch;
    
    while ((declMatch = declRegex.exec(declarations)) !== null) {
      const property = declMatch[1].toLowerCase().trim();
      const value = declMatch[2].trim();
      
      if (LAYOUT_PROPERTIES.has(property)) {
        warnings.push({
          selector,
          property,
          value,
          reason: `Layout property "${property}" may affect page structure`,
        });
      }
    }
  }
  
  return warnings;
}

// ============================================================================
// WCAG CONTRAST VALIDATION
// ============================================================================

/**
 * Convert hex color to RGB array.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const fullHex = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  
  return [
    parseInt(fullHex.slice(0, 2), 16),
    parseInt(fullHex.slice(2, 4), 16),
    parseInt(fullHex.slice(4, 6), 16),
  ];
}

/**
 * Calculate relative luminance per WCAG 2.1.
 */
export function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors.
 * Returns value between 1 and 21.
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA requirements.
 * Normal text: 4.5:1, Large text: 3:1
 */
export function meetsWCAG_AA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
}

/**
 * Check if contrast meets WCAG AAA requirements.
 * Normal text: 7:1, Large text: 4.5:1
 */
export function meetsWCAG_AAA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7.0;
}

// ============================================================================
// CONTRAST VALIDATOR
// ============================================================================

export interface ContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  suggestion?: string;
}

/**
 * Text color options for auto-correction, ordered by preference.
 */
const TEXT_COLOR_OPTIONS: CatppuccinColor[] = [
  'text', 'subtext1', 'subtext0', 'overlay2', 'overlay1', 'overlay0',
  'surface2', 'surface1', 'surface0', 'mantle', 'crust', 'base',
];

/**
 * Background color options for auto-correction, ordered by preference.
 */
const BG_COLOR_OPTIONS: CatppuccinColor[] = [
  'base', 'mantle', 'crust', 'surface0', 'surface1', 'surface2',
];

export class ContrastValidator {
  private palette: Record<string, { hex: string }>;
  
  constructor(flavor: CatppuccinFlavor) {
    this.palette = CATPPUCCIN_PALETTES[flavor] as unknown as Record<string, { hex: string }>;
  }
  
  /**
   * Validate contrast between foreground and background.
   */
  validate(foreground: string, background: string): ContrastResult {
    const ratio = contrastRatio(foreground, background);
    return {
      foreground,
      background,
      ratio,
      meetsAA: meetsWCAG_AA(ratio),
      meetsAAA: meetsWCAG_AAA(ratio),
    };
  }
  
  /**
   * Find a Catppuccin text color that meets AA contrast against background.
   */
  findSafeTextColor(background: string): string {
    for (const colorName of TEXT_COLOR_OPTIONS) {
      const colorVal = this.palette[colorName];
      const hex = colorVal?.hex;
      if (hex && typeof hex === 'string' && meetsWCAG_AA(contrastRatio(hex, background))) {
        return hex;
      }
    }
    // Fallback to text
    return this.palette.text?.hex || '#cdd6f4';
  }
  
  /**
   * Find a Catppuccin background that meets AA contrast with text.
   */
  findSafeBackground(foreground: string): string {
    for (const colorName of BG_COLOR_OPTIONS) {
      const colorVal = this.palette[colorName];
      const hex = colorVal?.hex;
      if (hex && typeof hex === 'string' && meetsWCAG_AA(contrastRatio(foreground, hex))) {
        return hex;
      }
    }
    // Fallback to base
    return this.palette.base?.hex || '#1e1e2e';
  }
  
  /**
   * Auto-correct a color pair to meet WCAG AA.
   * Returns corrected foreground.
   */
  autoCorrectContrast(foreground: string, background: string): string {
    if (meetsWCAG_AA(contrastRatio(foreground, background))) {
      return foreground; // Already meets
    }
    return this.findSafeTextColor(background);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { LayoutWarning, ContrastResult };
