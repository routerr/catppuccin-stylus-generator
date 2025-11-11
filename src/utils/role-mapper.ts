/**
 * Role-based color mapping algorithm for Catppuccin themes.
 * 
 * This module implements the SPEC algorithm for mapping source colors to semantic roles
 * in the Catppuccin design system, avoiding single-accent flooding through intelligent
 * accent selection and role distribution.
 * 
 * Key features:
 * - Automatic primary/secondary accent detection with hue-based distribution
 * - Semantic role mapping (success, warning, danger, info)
 * - Derived interaction states (hover, active, focus)
 * - WCAG contrast validation with automatic remediation
 * - Perceptual color science (Delta E, LAB color space)
 */

import type { CatppuccinFlavor, CatppuccinPalette, AccentColor, ColorValue } from '../types/catppuccin';
import type { 
  MappingInput, 
  MappingOutput, 
  RoleMap, 
  DerivedScales, 
  MappingConfig,
  ColorUsage,
  ClassificationResult
} from '../types/theme';
import { CATPPUCCIN_PALETTES, makeColorValue } from '../constants/catppuccin-colors';
import { 
  classifyAll, 
  nearestNeutralToken, 
  nearestAccentToken, 
  contrastRatio, 
  passesContrast, 
  hexToRgb, 
  rgbToHsl,
  relativeLuminance
} from './color-analysis';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract hue from hex color.
 */
function hueOf(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return hsl.h;
}

/**
 * Get hex value from palette token.
 */
function tokenHex(palette: CatppuccinPalette, key: keyof CatppuccinPalette): string {
  return palette[key].hex;
}

/**
 * Blend two colors using alpha compositing (Porter-Duff over).
 * 
 * @param hexA - Base color
 * @param hexB - Overlay color
 * @param alpha - Overlay opacity (0-1)
 * @returns Blended color as ColorValue
 */
function blend(hexA: string, hexB: string, alpha: number): ColorValue {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  
  if (!rgbA || !rgbB) return makeColorValue(hexA);
  
  // Alpha compositing: C = αB·B + (1-αB)·A
  const r = Math.round(alpha * rgbB.r + (1 - alpha) * rgbA.r);
  const g = Math.round(alpha * rgbB.g + (1 - alpha) * rgbA.g);
  const b = Math.round(alpha * rgbB.b + (1 - alpha) * rgbA.b);
  
  // Convert back to hex
  const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  return makeColorValue(hex);
}

/**
 * Choose a secondary accent that is hue-adjacent to primary but distinct.
 * 
 * Strategy: Find accent within ±30-60° hue range that is not the same as primary.
 * Fallback order ensures deterministic selection.
 */
function chooseSecondaryAccent(
  primary: AccentColor,
  palette: CatppuccinPalette
): AccentColor {
  const primaryHue = hueOf(tokenHex(palette, primary));
  
  const accents: AccentColor[] = [
    'rosewater', 'flamingo', 'pink', 'mauve',
    'red', 'maroon', 'peach', 'yellow',
    'green', 'teal', 'sky', 'sapphire',
    'blue', 'lavender'
  ];
  
  // Score each accent by hue proximity (prefer 30-60° range)
  const scored = accents
    .filter(a => a !== primary)
    .map(accent => {
      const accentHue = hueOf(tokenHex(palette, accent));
      let hueDiff = Math.abs(accentHue - primaryHue);
      
      // Handle hue wrap-around (e.g., 350° to 10° = 20° diff)
      if (hueDiff > 180) hueDiff = 360 - hueDiff;
      
      // Optimal range: 30-60°
      let score = 0;
      if (hueDiff >= 30 && hueDiff <= 60) {
        score = 100 - Math.abs(hueDiff - 45); // Prefer 45°
      } else if (hueDiff > 60 && hueDiff <= 120) {
        score = 50 - (hueDiff - 60) / 2;
      } else if (hueDiff < 30) {
        score = hueDiff; // Too close
      }
      
      return { accent, score, hueDiff };
    })
    .sort((a, b) => b.score - a.score);
  
  // Return best match or deterministic fallback
  if (scored.length > 0 && scored[0].score > 0) {
    return scored[0].accent;
  }
  
  // Deterministic fallback based on primary
  const fallbackMap: Record<AccentColor, AccentColor> = {
    'mauve': 'sapphire',
    'blue': 'lavender',
    'sapphire': 'teal',
    'lavender': 'mauve',
    'sky': 'blue',
    'teal': 'green',
    'green': 'yellow',
    'yellow': 'peach',
    'peach': 'red',
    'red': 'pink',
    'maroon': 'flamingo',
    'pink': 'mauve',
    'flamingo': 'rosewater',
    'rosewater': 'pink'
  };
  
  return fallbackMap[primary] || 'sapphire';
}

/**
 * Detect primary accent from classified colors.
 * 
 * Strategy:
 * 1. Look for 'interactive.link' or 'semantic.primary' classifications
 * 2. Find most frequent candidate and map to nearest accent
 * 3. Fallback order: mauve → blue → sapphire → lavender → teal
 */
function detectPrimaryAccent(
  classifications: Map<string, ClassificationResult>,
  sourceColors: Map<string, ColorUsage>,
  palette: CatppuccinPalette
): AccentColor {
  const candidates: Array<{ hex: string; frequency: number }> = [];
  
  // Collect interactive and primary candidates
  for (const [hex, classification] of classifications.entries()) {
    if (
      classification.role === 'interactive.link' ||
      classification.role === 'semantic.primary'
    ) {
      const usage = sourceColors.get(hex);
      if (usage) {
        candidates.push({ hex, frequency: usage.frequency });
      }
    }
  }
  
  // Sort by frequency and pick most frequent
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.frequency - a.frequency);
    return nearestAccentToken(candidates[0].hex, palette);
  }
  
  // Fallback order
  const fallbackOrder: AccentColor[] = ['mauve', 'blue', 'sapphire', 'lavender', 'teal'];
  return fallbackOrder[0];
}

/**
 * Choose appropriate text color on accent background for maximum contrast.
 * 
 * @param accentHex - Background accent color
 * @param palette - Catppuccin palette
 * @param contrastMode - Target contrast mode
 * @returns Best text token (crust, base, or text)
 */
function textOnAccent(
  accentHex: string,
  palette: CatppuccinPalette,
  flavor: CatppuccinFlavor,
  contrastMode: 'strict' | 'normal' | 'relaxed' = 'normal'
): ColorValue {
  // For latte (light theme), prefer text over base when base is very light
  if (flavor === 'latte') {
    const baseHex = tokenHex(palette, 'base');
    const baseRgb = hexToRgb(baseHex);
    const baseLum = baseRgb ? relativeLuminance(baseRgb) : 1;
    const baseContrast = contrastRatio(accentHex, baseHex);
    const textHex = tokenHex(palette, 'text');
    const textContrast = contrastRatio(accentHex, textHex);

    // If base background is extremely light, favor text when it performs better
    if (baseLum > 0.85) {
      if (textContrast >= baseContrast && textContrast >= 3.0) {
        return palette.text;
      }
      if (baseContrast >= 3.0) {
        return palette.base;
      }
    }

    // Otherwise follow contrast checks
    if (passesContrast(baseHex, accentHex, contrastMode)) return palette.base;
    if (textContrast >= baseContrast) return palette.text;
    return palette.base;
  }
  
  // For dark themes, prefer crust/base
  const crustContrast = contrastRatio(accentHex, tokenHex(palette, 'crust'));
  const baseContrast = contrastRatio(accentHex, tokenHex(palette, 'base'));
  
  if (passesContrast(tokenHex(palette, 'crust'), accentHex, contrastMode)) {
    return palette.crust;
  }
  
  if (passesContrast(tokenHex(palette, 'base'), accentHex, contrastMode)) {
    return palette.base;
  }
  
  // Return whichever has better contrast
  return crustContrast > baseContrast ? palette.crust : palette.base;
}

/**
 * Try to fix contrast by swapping text token to next level.
 * 
 * @returns Fixed text token or null if unfixable
 */
function tryFixContrast(
  textToken: keyof CatppuccinPalette,
  bgHex: string,
  palette: CatppuccinPalette,
  mode: 'strict' | 'normal' | 'relaxed'
): keyof CatppuccinPalette | null {
  const textProgression: Array<keyof CatppuccinPalette> = [
    'text', 'subtext1', 'subtext0', 'overlay2', 'overlay1'
  ];
  
  const startIdx = textProgression.indexOf(textToken);
  if (startIdx === -1) return null;
  
  // Try next levels
  for (let i = startIdx + 1; i < textProgression.length; i++) {
    const candidate = textProgression[i];
    if (passesContrast(tokenHex(palette, candidate), bgHex, mode)) {
      return candidate;
    }
  }
  
  return null;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get default role map for a flavor with optional configuration.
 * 
 * This provides a base mapping that can be customized by the caller.
 */
export function getDefaultRoleMap(
  flavor: CatppuccinFlavor,
  config?: Partial<MappingConfig>
): RoleMap {
  const palette = CATPPUCCIN_PALETTES[flavor];
  const primary = config?.primaryAccent || 'mauve';
  const secondary = config?.secondaryAccent || chooseSecondaryAccent(primary, palette);
  
  // Choose accent.interactive based on flavor
  const interactiveAccent = flavor === 'latte' ? 'sky' : 'sapphire';
  
  return {
    // Backgrounds
    'background.primary': palette.base,
    'background.secondary': palette.mantle,
    'background.tertiary': palette.crust,
    
    // Surfaces
    'surface.0': palette.surface0,
    'surface.1': palette.surface1,
    'surface.2': palette.surface2,
    
    // Borders
    'border.subtle': palette.overlay0,
    'border.default': palette.overlay1,
    'border.strong': palette.overlay2,
    
    // Text
    'text.primary': palette.text,
    'text.secondary': palette.subtext1,
    'text.muted': palette.subtext0,
    'text.disabled': palette.overlay2,
    
    // Interactive accents
    'accent.interactive': palette[interactiveAccent],
    'accent.selection': palette.sky,
    'accent.focus': palette[primary],
    
    // Semantic bases
    'primary.base': palette[primary],
    'primary.text': textOnAccent(tokenHex(palette, primary), palette, flavor),
    'secondary.base': palette[secondary],
    'secondary.text': textOnAccent(tokenHex(palette, secondary), palette, flavor),
    'success.base': palette[config?.semanticOverrides?.success || 'green'],
    'success.text': textOnAccent(
      tokenHex(palette, config?.semanticOverrides?.success || 'green'), 
      palette, 
      flavor
    ),
    'warning.base': palette[config?.semanticOverrides?.warning || 'yellow'],
    'warning.text': textOnAccent(
      tokenHex(palette, config?.semanticOverrides?.warning || 'yellow'), 
      palette, 
      flavor
    ),
    'danger.base': palette[config?.semanticOverrides?.danger || 'red'],
    'danger.text': textOnAccent(
      tokenHex(palette, config?.semanticOverrides?.danger || 'red'), 
      palette, 
      flavor
    ),
    'info.base': palette[config?.semanticOverrides?.info || 'sky'],
    'info.text': textOnAccent(
      tokenHex(palette, config?.semanticOverrides?.info || 'sky'), 
      palette, 
      flavor
    ),
  };
}

/**
 * Map source colors to Catppuccin theme roles with intelligent accent selection.
 * 
 * This is the main entry point for the role mapping algorithm.
 * 
 * @param input - Source colors, flavor, and configuration
 * @returns Complete role map with derived states and metadata
 */
export function mapToCatppuccinTheme(input: MappingInput): MappingOutput {
  const palette = CATPPUCCIN_PALETTES[input.selectedFlavor];
  const config = input.config || {};
  const contrastMode = config.contrastMode || 'normal';
  const warnings: string[] = [];
  
  // Step 1: Classify all source colors
  const classifications = classifyAll(input.sourceColors, input.selectedFlavor);
  
  // Step 2: Determine primary and secondary accents
  const primary = config.primaryAccent || detectPrimaryAccent(
    classifications, 
    input.sourceColors, 
    palette
  );
  const secondary = config.secondaryAccent || chooseSecondaryAccent(primary, palette);
  
  // Step 3: Build base role map with defaults
  const roleMap = getDefaultRoleMap(input.selectedFlavor, {
    ...config,
    primaryAccent: primary,
    secondaryAccent: secondary
  });
  
  // Step 4: Apply classification overrides
  for (const [hex, classification] of classifications.entries()) {
    const usage = input.sourceColors.get(hex);
    if (!usage) continue;
    
    // High-confidence overrides for backgrounds/surfaces
    if (classification.confidence >= 0.5) {
      if (classification.role === 'background.primary' && usage.frequency >= 0.5) {
        const nearestToken = nearestNeutralToken(hex, palette);
        roleMap['background.primary'] = palette[nearestToken];
      } else if (classification.role === 'surface.0' && usage.frequency >= 0.3) {
        const nearestToken = nearestNeutralToken(hex, palette);
        roleMap['surface.0'] = palette[nearestToken];
      }
    }
    
    // Interactive link override
    if (classification.role === 'interactive.link' && usage.frequency >= 0.2) {
      const nearestAccent = nearestAccentToken(hex, palette);
      roleMap['accent.interactive'] = palette[nearestAccent];
    }
  }
  
  // Step 5: Generate derived interaction states
  const derivedScales: DerivedScales = {};
  
  const semanticBases = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'] as const;
  
  for (const semantic of semanticBases) {
    const baseKey = `${semantic}.base` as const;
    const baseColor = roleMap[baseKey];
    
    if (baseColor) {
      derivedScales[`${semantic}.hover`] = blend(
        baseColor.hex, 
        tokenHex(palette, 'overlay1'), 
        0.2
      );
      derivedScales[`${semantic}.active`] = blend(
        baseColor.hex, 
        tokenHex(palette, 'overlay2'), 
        0.3
      );
    }
  }
  
  // Focus ring and selection
  derivedScales['focus.ring'] = blend(
    roleMap['accent.interactive']?.hex || tokenHex(palette, 'sapphire'),
    tokenHex(palette, 'overlay1'),
    0.5
  );
  derivedScales['selection.bg'] = blend(
    roleMap['accent.selection']?.hex || tokenHex(palette, 'sky'),
    tokenHex(palette, 'base'),
    0.3
  );
  
  // Step 6: Final contrast validation pass
  let contrastValidated = true;
  
  // Check text vs background
  const bgHex = roleMap['background.primary']?.hex || tokenHex(palette, 'base');
  const textHex = roleMap['text.primary']?.hex || tokenHex(palette, 'text');
  
  if (!passesContrast(textHex, bgHex, contrastMode)) {
    const fixed = tryFixContrast('text', bgHex, palette, contrastMode);
    if (fixed) {
      roleMap['text.primary'] = palette[fixed];
      warnings.push(`Adjusted text.primary to ${fixed} for contrast`);
    } else {
      contrastValidated = false;
      warnings.push('Failed to meet contrast requirements for text.primary');
    }
  }
  
  // Check semantic text vs their bases
  for (const semantic of semanticBases) {
    const baseKey = `${semantic}.base` as const;
    const textKey = `${semantic}.text` as const;
    
    const base = roleMap[baseKey];
    const text = roleMap[textKey];
    
    if (base && text && !passesContrast(text.hex, base.hex, contrastMode)) {
      // Try to fix by choosing better text-on-accent
      const betterText = textOnAccent(base.hex, palette, input.selectedFlavor, contrastMode);
      roleMap[textKey] = betterText;
      
      if (!passesContrast(betterText.hex, base.hex, contrastMode)) {
        contrastValidated = false;
        warnings.push(`Low contrast for ${semantic}: ${text.hex} on ${base.hex}`);
      }
    }
  }
  
  // Step 7: Return complete output
  return {
    roleMap,
    derivedScales,
    metadata: {
      flavor: input.selectedFlavor,
      primaryAccent: primary,
      secondaryAccent: secondary,
      contrastValidated,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  };
}
