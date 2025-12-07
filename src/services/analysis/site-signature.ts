/**
 * Site Signature Builder - Creates a unique fingerprint for each website.
 *
 * This is the CORE of the new system that ensures different sites
 * produce different themes.
 *
 * The SiteSignature captures:
 * - Dominant hue and color profile
 * - Brand colors
 * - Semantic role assignments
 * - Selector mappings
 * - Suggested Catppuccin accent
 */

import type {
  ColorExtractionResult,
  SemanticClassification,
  SemanticRole,
  SiteSignature,
  SaturationLevel,
} from "../../types/analysis";
import type { AccentColor } from "../../types/catppuccin";
import { extractColors, getSaturatedColors } from "./color-extractor";
import {
  classifyAllColors,
  getBestClassifications,
} from "./semantic-classifier";
import { CATPPUCCIN_PALETTES } from "../../constants/catppuccin-colors";

// ============================================================================
// HUE NAME MAPPING
// ============================================================================

/**
 * Map hue degrees to human-readable names.
 */
function getHueName(hue: number): string {
  if (hue >= 0 && hue < 15) return "Red";
  if (hue >= 15 && hue < 45) return "Orange";
  if (hue >= 45 && hue < 75) return "Yellow";
  if (hue >= 75 && hue < 105) return "Lime";
  if (hue >= 105 && hue < 135) return "Green";
  if (hue >= 135 && hue < 165) return "Teal";
  if (hue >= 165 && hue < 195) return "Cyan";
  if (hue >= 195 && hue < 225) return "Sky";
  if (hue >= 225 && hue < 255) return "Blue";
  if (hue >= 255 && hue < 285) return "Purple";
  if (hue >= 285 && hue < 315) return "Magenta";
  if (hue >= 315 && hue < 345) return "Pink";
  return "Red"; // 345-360
}

/**
 * Map hue to nearest Catppuccin accent.
 */
function hueToAccent(hue: number): AccentColor {
  // Map major hue ranges to Catppuccin accents
  if (hue >= 0 && hue < 15) return "red";
  if (hue >= 15 && hue < 30) return "maroon";
  if (hue >= 30 && hue < 45) return "peach";
  if (hue >= 45 && hue < 70) return "yellow";
  if (hue >= 70 && hue < 150) return "green";
  if (hue >= 150 && hue < 180) return "teal";
  if (hue >= 180 && hue < 200) return "sky";
  if (hue >= 200 && hue < 220) return "sapphire";
  if (hue >= 220 && hue < 260) return "blue";
  if (hue >= 260 && hue < 290) return "lavender";
  if (hue >= 290 && hue < 320) return "mauve";
  if (hue >= 320 && hue < 340) return "pink";
  if (hue >= 340 && hue < 355) return "flamingo";
  return "rosewater"; // 355-360
}

/**
 * Find the nearest Catppuccin accent to a given hex color.
 */
function findNearestAccent(hex: string): AccentColor {
  const palette = CATPPUCCIN_PALETTES.mocha; // Use mocha as reference
  const targetRgb = hexToRgb(hex);
  if (!targetRgb) return "blue";

  const targetLab = rgbToLab(targetRgb.r, targetRgb.g, targetRgb.b);

  let minDistance = Infinity;
  let nearest: AccentColor = "blue";

  const accents: AccentColor[] = [
    "rosewater",
    "flamingo",
    "pink",
    "mauve",
    "red",
    "maroon",
    "peach",
    "yellow",
    "green",
    "teal",
    "sky",
    "sapphire",
    "blue",
    "lavender",
  ];

  for (const accent of accents) {
    const accentRgb = palette[accent].rgb;
    const accentLab = rgbToLab(accentRgb.r, accentRgb.g, accentRgb.b);
    const distance = deltaE(targetLab, accentLab);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = accent;
    }
  }

  return nearest;
}

// ============================================================================
// COLOR SPACE UTILITIES
// ============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

function rgbToLab(
  r: number,
  g: number,
  b: number
): { L: number; a: number; b: number } {
  // RGB to XYZ
  let rr = r / 255,
    gg = g / 255,
    bb = b / 255;

  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;

  const x = (rr * 0.4124564 + gg * 0.3575761 + bb * 0.1804375) * 100;
  const y = (rr * 0.2126729 + gg * 0.7151522 + bb * 0.072175) * 100;
  const z = (rr * 0.0193339 + gg * 0.119192 + bb * 0.9503041) * 100;

  // XYZ to LAB (D65)
  const xn = 95.047,
    yn = 100.0,
    zn = 108.883;
  const fx = (t: number) =>
    t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;

  const xr = fx(x / xn),
    yr = fx(y / yn),
    zr = fx(z / zn);

  return {
    L: 116 * yr - 16,
    a: 500 * (xr - yr),
    b: 200 * (yr - zr),
  };
}

function deltaE(
  lab1: { L: number; a: number; b: number },
  lab2: { L: number; a: number; b: number }
): number {
  const dL = lab2.L - lab1.L;
  const da = lab2.a - lab1.a;
  const db = lab2.b - lab1.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// ============================================================================
// SIGNATURE BUILDING
// ============================================================================

/**
 * Calculate the dominant hue from saturated colors.
 */
function calculateDominantHue(
  saturatedColors: Array<{
    hex: string;
    frequency: number;
    hsl: { h: number; s: number; l: number };
  }>
): number {
  if (saturatedColors.length === 0) return 220; // Default blue

  // Weight by frequency
  let totalWeight = 0;
  let weightedHueX = 0;
  let weightedHueY = 0;

  for (const color of saturatedColors) {
    const weight = color.frequency * color.hsl.s; // More saturated = more important
    const radians = (color.hsl.h * Math.PI) / 180;

    weightedHueX += Math.cos(radians) * weight;
    weightedHueY += Math.sin(radians) * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 220;

  // Convert back to degrees
  const avgRadians = Math.atan2(
    weightedHueY / totalWeight,
    weightedHueX / totalWeight
  );
  let avgHue = (avgRadians * 180) / Math.PI;
  if (avgHue < 0) avgHue += 360;

  return Math.round(avgHue);
}

/**
 * Calculate the saturation level.
 */
function calculateSaturationLevel(
  saturatedColors: Array<{
    hsl: { h: number; s: number; l: number };
    frequency: number;
  }>
): SaturationLevel {
  if (saturatedColors.length === 0) return "neutral";

  let totalWeight = 0;
  let weightedSat = 0;

  for (const color of saturatedColors) {
    weightedSat += color.hsl.s * color.frequency;
    totalWeight += color.frequency;
  }

  if (totalWeight === 0) return "neutral";

  const avgSat = weightedSat / totalWeight;

  if (avgSat >= 60) return "vibrant";
  if (avgSat >= 30) return "muted";
  return "neutral";
}

/**
 * Build brand colors list from classifications.
 */
function extractBrandColors(
  classifications: Map<string, SemanticClassification>,
  extractionResult: ColorExtractionResult
): string[] {
  const brandRoles: SemanticRole[] = [
    "accent.brand",
    "accent.interactive",
    "accent.link",
  ];
  const candidates: Array<{ hex: string; score: number }> = [];

  for (const [hex, classification] of classifications) {
    if (brandRoles.includes(classification.role)) {
      const color = extractionResult.colors.get(hex);
      const score = (color?.frequency || 0) * classification.confidence;
      candidates.push({ hex, score });
    }
  }

  // Sort by score and take top 3
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 3).map((c) => c.hex);
}

/**
 * Build the complete SiteSignature.
 */
export function buildSiteSignature(
  css: string,
  domain: string,
  sourceType: "url" | "directory" | "mhtml" = "url"
): SiteSignature {
  // Step 1: Extract colors
  const extractionResult = extractColors(css);

  // Step 2: Classify colors
  const classifications = classifyAllColors(extractionResult);

  // Step 3: Get saturated colors for hue analysis
  const saturatedColors = getSaturatedColors(extractionResult, 20);

  // Step 4: Calculate color profile
  const dominantHue = calculateDominantHue(saturatedColors);
  const saturationLevel = calculateSaturationLevel(saturatedColors);
  const brandColors = extractBrandColors(classifications, extractionResult);

  // Step 5: Build accent distribution
  const accentDistribution = new Map<string, number>();
  for (const color of saturatedColors) {
    accentDistribution.set(color.hex, color.frequency);
  }

  // Step 6: Build semantic roles map
  const semanticRoles = new Map<SemanticRole, string>();
  const bestClassifications = getBestClassifications(classifications);
  for (const [role, classification] of bestClassifications) {
    semanticRoles.set(role, classification.hex);
  }

  // Step 7: Build selector map
  const selectorMap = new Map<string, string[]>();
  for (const color of extractionResult.colors.values()) {
    selectorMap.set(color.hex, color.selectors);
  }

  // Step 8: Build selector classifications
  const selectorClassifications = new Map<
    string,
    "button" | "link" | "card" | "nav" | "input" | "text" | "other"
  >();
  for (const color of extractionResult.colors.values()) {
    for (const selector of color.selectors) {
      if (!selectorClassifications.has(selector)) {
        selectorClassifications.set(selector, detectElementType(selector));
      }
    }
  }

  // Step 9: Suggest accent
  let suggestedAccent: AccentColor;
  if (brandColors.length > 0) {
    suggestedAccent = findNearestAccent(brandColors[0]);
  } else {
    suggestedAccent = hueToAccent(dominantHue);
  }

  // Step 10: Calculate overall confidence
  let totalConfidence = 0;
  let count = 0;
  for (const classification of classifications.values()) {
    totalConfidence += classification.confidence;
    count++;
  }
  const overallConfidence = count > 0 ? totalConfidence / count : 0.5;

  return {
    domain,
    colorProfile: {
      dominantHue,
      dominantHueName: getHueName(dominantHue),
      saturationLevel,
      luminanceMode: extractionResult.detectedMode,
      brandColors,
      accentDistribution,
      uniqueColorCount: extractionResult.colors.size,
    },
    semanticRoles,
    selectorMap,
    selectorClassifications,
    suggestedAccent,
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceType,
      overallConfidence,
    },
  };
}

/**
 * Detect element type from selector (simplified version for inline use).
 */
function detectElementType(
  selector: string
): "button" | "link" | "card" | "nav" | "input" | "text" | "other" {
  const s = selector.toLowerCase();
  if (/button|btn/i.test(s)) return "button";
  if (/\ba\b|link/i.test(s)) return "link";
  if (/card|panel|modal/i.test(s)) return "card";
  if (/nav|menu|sidebar/i.test(s)) return "nav";
  if (/input|textarea|select/i.test(s)) return "input";
  if (/text|content|heading|h[1-6]/i.test(s)) return "text";
  return "other";
}

/**
 * Generate a human-readable summary of a SiteSignature.
 */
export function summarizeSignature(signature: SiteSignature): string {
  const { colorProfile, suggestedAccent, metadata } = signature;

  return [
    `Domain: ${signature.domain}`,
    `Color Mode: ${colorProfile.luminanceMode}`,
    `Dominant Hue: ${colorProfile.dominantHueName} (${colorProfile.dominantHue}°)`,
    `Saturation: ${colorProfile.saturationLevel}`,
    `Brand Colors: ${colorProfile.brandColors.join(", ") || "none detected"}`,
    `Unique Colors: ${colorProfile.uniqueColorCount}`,
    `Suggested Accent: ${suggestedAccent}`,
    `Confidence: ${(metadata.overallConfidence * 100).toFixed(0)}%`,
  ].join("\n");
}

/**
 * Compare two signatures to show how different they are.
 */
export function compareSignatures(
  a: SiteSignature,
  b: SiteSignature
): {
  hueDifference: number;
  saturationMatch: boolean;
  modeMatch: boolean;
  brandOverlap: number;
} {
  // Hue difference (0-180, wrapping around)
  let hueDiff = Math.abs(
    a.colorProfile.dominantHue - b.colorProfile.dominantHue
  );
  if (hueDiff > 180) hueDiff = 360 - hueDiff;

  // Saturation level match
  const saturationMatch =
    a.colorProfile.saturationLevel === b.colorProfile.saturationLevel;

  // Mode match
  const modeMatch =
    a.colorProfile.luminanceMode === b.colorProfile.luminanceMode;

  // Brand color overlap
  const brandA = new Set(a.colorProfile.brandColors);
  const brandB = new Set(b.colorProfile.brandColors);
  let overlap = 0;
  for (const color of brandA) {
    if (brandB.has(color)) overlap++;
  }

  return {
    hueDifference: hueDiff,
    saturationMatch,
    modeMatch,
    brandOverlap: brandA.size > 0 ? overlap / brandA.size : 0,
  };
}
