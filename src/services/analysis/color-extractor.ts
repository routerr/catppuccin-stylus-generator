/**
 * Color Extractor - Extracts and aggregates colors from CSS.
 *
 * This is the first step of the Deep Analysis pipeline.
 * It parses CSS content and extracts all color values with their usage context.
 */

import type {
  ColorOccurrence,
  AggregatedColor,
  ColorExtractionResult,
} from "../../types/analysis";

// ============================================================================
// COLOR PARSING UTILITIES
// ============================================================================

/**
 * Regex patterns for different color formats.
 */
const COLOR_PATTERNS = {
  hex6: /#([0-9A-Fa-f]{6})\b/g,
  hex3: /#([0-9A-Fa-f]{3})\b/g,
  rgb: /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi,
  rgba: /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*[\d.]+\s*\)/gi,
  hsl: /hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)/gi,
  hsla: /hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*,\s*[\d.]+\s*\)/gi,
};

/**
 * Properties that contain color values.
 */
const COLOR_PROPERTIES = [
  "color",
  "background-color",
  "background",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border",
  "outline-color",
  "outline",
  "box-shadow",
  "text-shadow",
  "fill",
  "stroke",
  "stop-color",
  "caret-color",
  "accent-color",
  "text-decoration-color",
];

/**
 * Normalize any color format to 6-digit hex.
 */
export function normalizeToHex(color: string): string | null {
  const trimmed = color.trim().toLowerCase();

  // Already 6-digit hex
  const hex6Match = trimmed.match(/^#([0-9a-f]{6})$/);
  if (hex6Match) {
    return `#${hex6Match[1]}`;
  }

  // 3-digit hex -> 6-digit
  const hex3Match = trimmed.match(/^#([0-9a-f]{3})$/);
  if (hex3Match) {
    const [r, g, b] = hex3Match[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  // rgb() or rgba()
  const rgbMatch = trimmed.match(
    /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/
  );
  if (rgbMatch) {
    const r = Math.min(255, parseInt(rgbMatch[1]));
    const g = Math.min(255, parseInt(rgbMatch[2]));
    const b = Math.min(255, parseInt(rgbMatch[3]));
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  // hsl() or hsla()
  const hslMatch = trimmed.match(
    /hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?/
  );
  if (hslMatch) {
    const h = parseInt(hslMatch[1]);
    const s = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;
    const rgb = hslToRgb(h, s, l);
    return `#${rgb.r.toString(16).padStart(2, "0")}${rgb.g
      .toString(16)
      .padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`;
  }

  return null;
}

/**
 * Convert HSL to RGB.
 */
function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Convert RGB to HSL.
 */
function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Parse hex to RGB.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

/**
 * Calculate relative luminance (WCAG 2.1).
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (val: number): number => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// ============================================================================
// CSS PARSING
// ============================================================================

/**
 * Parse a single CSS rule and extract color occurrences.
 */
function parseRule(selector: string, declarations: string): ColorOccurrence[] {
  const occurrences: ColorOccurrence[] = [];

  // Parse each declaration
  const declPairs = declarations.split(";").filter((d) => d.trim());

  for (const decl of declPairs) {
    const colonIdx = decl.indexOf(":");
    if (colonIdx === -1) continue;

    const property = decl.slice(0, colonIdx).trim().toLowerCase();
    const value = decl.slice(colonIdx + 1).trim();

    // Check if this is a color-related property
    const isColorProp = COLOR_PROPERTIES.some((p) => property.includes(p));
    if (!isColorProp) continue;

    // Extract all colors from the value
    const colors = extractColorsFromValue(value);

    for (const color of colors) {
      const normalized = normalizeToHex(color);
      if (!normalized) continue;

      // Determine property type
      let propType: ColorOccurrence["property"] = "other";
      if (property === "color") propType = "color";
      else if (property.includes("background")) propType = "background-color";
      else if (property.includes("border")) propType = "border-color";
      else if (property === "fill") propType = "fill";
      else if (property === "stroke") propType = "stroke";
      else if (property.includes("shadow")) propType = "box-shadow";
      else if (property.includes("outline")) propType = "outline";

      occurrences.push({
        hex: normalized,
        property: propType,
        selectors: [selector],
        count: 1,
      });
    }
  }

  return occurrences;
}

/**
 * Extract all color values from a CSS value string.
 */
function extractColorsFromValue(value: string): string[] {
  const colors: string[] = [];

  // Match hex colors
  const hex6Matches = value.matchAll(COLOR_PATTERNS.hex6);
  for (const match of hex6Matches) {
    colors.push(`#${match[1]}`);
  }

  const hex3Matches = value.matchAll(COLOR_PATTERNS.hex3);
  for (const match of hex3Matches) {
    colors.push(`#${match[1]}`);
  }

  // Match rgb/rgba
  const rgbMatches = value.matchAll(/rgba?\([^)]+\)/gi);
  for (const match of rgbMatches) {
    colors.push(match[0]);
  }

  // Match hsl/hsla
  const hslMatches = value.matchAll(/hsla?\([^)]+\)/gi);
  for (const match of hslMatches) {
    colors.push(match[0]);
  }

  return colors;
}

/**
 * Extract CSS variables and their values.
 */
function extractCssVariables(css: string): Map<string, string> {
  const variables = new Map<string, string>();

  // Match variable definitions: --name: value;
  const varPattern = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match;

  while ((match = varPattern.exec(css)) !== null) {
    const name = `--${match[1]}`;
    const value = match[2].trim();

    // Try to normalize to hex if it's a color
    const normalized = normalizeToHex(value);
    if (normalized) {
      variables.set(name, normalized);
    } else {
      variables.set(name, value);
    }
  }

  return variables;
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract all colors from CSS content.
 *
 * @param css - Raw CSS string
 * @returns ColorExtractionResult with aggregated colors
 */
export function extractColors(css: string): ColorExtractionResult {
  const occurrences: ColorOccurrence[] = [];
  const variables = extractCssVariables(css);

  // Parse CSS rules
  // Simple regex-based parsing (handles most cases)
  const rulePattern = /([^{}]+)\{([^{}]+)\}/g;
  let match;

  while ((match = rulePattern.exec(css)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2];

    // Skip @-rules that don't contain color info
    if (selector.startsWith("@") && !selector.includes("supports")) continue;

    const ruleOccurrences = parseRule(selector, declarations);
    occurrences.push(...ruleOccurrences);
  }

  // Aggregate colors
  const colorMap = new Map<string, AggregatedColor>();
  let totalOccurrences = 0;

  for (const occ of occurrences) {
    totalOccurrences += occ.count;

    const existing = colorMap.get(occ.hex);
    if (existing) {
      existing.totalCount += occ.count;
      existing.selectors.push(...occ.selectors);

      const propCount = existing.propertyDistribution.get(occ.property) || 0;
      existing.propertyDistribution.set(occ.property, propCount + occ.count);
    } else {
      const rgb = hexToRgb(occ.hex);
      const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 };

      // Check if this color matches any CSS variable
      const matchingVars: string[] = [];
      for (const [varName, varValue] of variables) {
        if (varValue === occ.hex) {
          matchingVars.push(varName);
        }
      }

      colorMap.set(occ.hex, {
        hex: occ.hex,
        totalCount: occ.count,
        frequency: 0, // Will be calculated after
        propertyDistribution: new Map([[occ.property, occ.count]]),
        selectors: [...occ.selectors],
        variableNames: matchingVars,
        hsl,
      });
    }
  }

  // Calculate frequencies
  for (const color of colorMap.values()) {
    color.frequency =
      totalOccurrences > 0 ? color.totalCount / totalOccurrences : 0;
    // Deduplicate selectors
    color.selectors = [...new Set(color.selectors)];
  }

  // Detect light/dark mode based on background colors
  let detectedMode: "light" | "dark" = "dark";
  let maxBgFrequency = 0;

  for (const color of colorMap.values()) {
    const bgCount = color.propertyDistribution.get("background-color") || 0;
    const bgFrequency = bgCount / (totalOccurrences || 1);

    if (bgFrequency > maxBgFrequency) {
      maxBgFrequency = bgFrequency;
      const rgb = hexToRgb(color.hex);
      if (rgb) {
        const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
        detectedMode = lum > 0.5 ? "light" : "dark";
      }
    }
  }

  return {
    colors: colorMap,
    variables,
    totalOccurrences,
    detectedMode,
  };
}

/**
 * Get top N colors by frequency.
 */
export function getTopColors(
  result: ColorExtractionResult,
  n: number = 10
): AggregatedColor[] {
  const sorted = [...result.colors.values()].sort(
    (a, b) => b.frequency - a.frequency
  );
  return sorted.slice(0, n);
}

/**
 * Get colors used in specific property types.
 */
export function getColorsByProperty(
  result: ColorExtractionResult,
  property: ColorOccurrence["property"]
): AggregatedColor[] {
  return [...result.colors.values()].filter((c) =>
    c.propertyDistribution.has(property)
  );
}

/**
 * Filter to only saturated (non-neutral) colors.
 * These are likely accent/brand colors.
 */
export function getSaturatedColors(
  result: ColorExtractionResult,
  minSaturation: number = 20
): AggregatedColor[] {
  return [...result.colors.values()].filter((c) => c.hsl.s >= minSaturation);
}
