/**
 * Semantic Classifier - Classifies colors into semantic roles.
 *
 * This is the second step of the Deep Analysis pipeline.
 * It takes extracted colors and assigns semantic roles based on:
 * - Usage context (background, text, border, etc.)
 * - Color properties (luminance, saturation)
 * - Selector patterns (button, link, card, etc.)
 */

import type {
  AggregatedColor,
  ColorExtractionResult,
  SemanticRole,
  SemanticClassification,
} from "../../types/analysis";

// ============================================================================
// SELECTOR PATTERN DETECTION
// ============================================================================

/**
 * Patterns to detect element types from selectors.
 */
const SELECTOR_PATTERNS: Record<string, RegExp[]> = {
  button: [
    /\bbutton\b/i,
    /\bbtn\b/i,
    /\[type=["']?submit["']?\]/i,
    /\[type=["']?button["']?\]/i,
    /\.button/i,
    /\.btn-/i,
  ],
  link: [/\ba\b(?![a-z-])/i, /\.link/i, /\[href\]/i],
  card: [/\.card/i, /\.panel/i, /\.box/i, /\.tile/i, /\.modal/i, /\.dialog/i],
  nav: [
    /\bnav\b/i,
    /\.nav/i,
    /\.menu/i,
    /\.sidebar/i,
    /\.header/i,
    /\.footer/i,
    /\.toolbar/i,
  ],
  input: [
    /\binput\b/i,
    /\btextarea\b/i,
    /\bselect\b/i,
    /\.form-control/i,
    /\.input/i,
  ],
  status: [
    /\.success/i,
    /\.error/i,
    /\.warning/i,
    /\.danger/i,
    /\.info/i,
    /\.alert/i,
    /\.badge/i,
    /\.tag/i,
  ],
};

/**
 * Semantic keywords found in selectors or class names.
 */
const SEMANTIC_KEYWORDS: Record<SemanticRole, RegExp[]> = {
  "semantic.success": [
    /success/i,
    /valid/i,
    /ok/i,
    /check/i,
    /confirm/i,
    /complete/i,
  ],
  "semantic.warning": [/warn/i, /caution/i, /attention/i, /notice/i],
  "semantic.error": [
    /error/i,
    /danger/i,
    /fail/i,
    /invalid/i,
    /critical/i,
    /delete/i,
    /remove/i,
  ],
  "semantic.info": [/info/i, /help/i, /tip/i, /hint/i, /note/i],
  "accent.brand": [/brand/i, /primary/i, /accent/i, /main/i, /hero/i, /cta/i],
  "accent.link": [/link/i, /href/i],
  "accent.interactive": [/button/i, /btn/i, /action/i, /interactive/i],
  "background.primary": [/bg-?main/i, /body/i, /page/i, /container/i],
  "background.secondary": [/bg-?alt/i, /bg-?secondary/i],
  "surface.card": [/card/i, /panel/i, /modal/i],
  "surface.overlay": [/overlay/i, /backdrop/i, /scrim/i],
  "text.primary": [/text-?primary/i, /content/i, /body/i],
  "text.secondary": [/text-?secondary/i, /subtitle/i, /caption/i],
  "text.muted": [/muted/i, /disabled/i, /placeholder/i, /hint/i],
  "border.subtle": [/border-?subtle/i, /divider/i, /separator/i],
  "border.default": [/border/i, /outline/i],
  unknown: [],
};

// ============================================================================
// CLASSIFICATION LOGIC
// ============================================================================

/**
 * Detect element type from selector.
 */
function detectElementType(
  selector: string
): "button" | "link" | "card" | "nav" | "input" | "text" | "other" {
  for (const [type, patterns] of Object.entries(SELECTOR_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(selector)) {
        return type as "button" | "link" | "card" | "nav" | "input";
      }
    }
  }
  return "other";
}

/**
 * Check selectors for semantic keywords.
 */
function findSemanticKeywords(selectors: string[]): SemanticRole | null {
  const combined = selectors.join(" ");

  for (const [role, patterns] of Object.entries(SEMANTIC_KEYWORDS)) {
    if (role === "unknown") continue;

    for (const pattern of patterns) {
      if (pattern.test(combined)) {
        return role as SemanticRole;
      }
    }
  }

  return null;
}

/**
 * Classify a color based on luminance.
 */
function classifyByLuminance(
  hsl: { h: number; s: number; l: number },
  mode: "light" | "dark"
): SemanticRole | null {
  const { s, l } = hsl;
  const isNeutral = s < 10;

  if (mode === "dark") {
    // Dark mode: high luminance = text, low luminance = background
    if (isNeutral) {
      if (l <= 15) return "background.primary";
      if (l <= 30) return "background.secondary";
      if (l <= 50) return "surface.card";
      if (l >= 90) return "text.primary";
      if (l >= 70) return "text.secondary";
      if (l >= 50) return "text.muted";
    }
  } else {
    // Light mode: low luminance = text, high luminance = background
    if (isNeutral) {
      if (l >= 95) return "background.primary";
      if (l >= 85) return "background.secondary";
      if (l >= 70) return "surface.card";
      if (l <= 20) return "text.primary";
      if (l <= 40) return "text.secondary";
      if (l <= 60) return "text.muted";
    }
  }

  return null;
}

/**
 * Classify a color as a potential accent/brand color.
 */
function classifyAccentColor(hsl: {
  h: number;
  s: number;
  l: number;
}): SemanticRole | null {
  const { h, s, l } = hsl;

  // Must be saturated
  if (s < 30) return null;

  // Must not be too dark or too light
  if (l < 20 || l > 90) return null;

  // Classify by hue range
  // Red range: 340-20
  if (h >= 340 || h <= 20) return "semantic.error";

  // Orange/Yellow range: 20-60
  if (h > 20 && h <= 60) return "semantic.warning";

  // Green range: 80-160
  if (h > 80 && h <= 160) return "semantic.success";

  // Cyan/Blue range: 180-260
  if (h > 180 && h <= 260) return "semantic.info";

  // Purple/Magenta range: 260-340
  if (h > 260 && h < 340) return "accent.brand";

  return "accent.interactive";
}

/**
 * Classify a single color into a semantic role.
 */
export function classifyColor(
  color: AggregatedColor,
  mode: "light" | "dark"
): SemanticClassification {
  const reasoning: string[] = [];
  let role: SemanticRole = "unknown";
  let confidence = 0.5;

  // 1. Check for semantic keywords in selectors (highest priority)
  const keywordRole = findSemanticKeywords(color.selectors);
  if (keywordRole) {
    reasoning.push(`Semantic keyword detected in selectors`);
    role = keywordRole;
    confidence = 0.9;
    return { hex: color.hex, role, confidence, reasoning };
  }

  // 2. Check property distribution
  const hasBgUsage = color.propertyDistribution.has("background-color");
  const hasTextUsage = color.propertyDistribution.has("color");
  const hasBorderUsage = color.propertyDistribution.has("border-color");
  const hasFillUsage =
    color.propertyDistribution.has("fill") ||
    color.propertyDistribution.has("stroke");

  // 3. Check luminance-based classification for neutrals
  const luminanceRole = classifyByLuminance(color.hsl, mode);
  if (luminanceRole) {
    if (hasBgUsage && luminanceRole.startsWith("background")) {
      reasoning.push(`Neutral color used as background (L=${color.hsl.l}%)`);
      role = luminanceRole;
      confidence = 0.8;
      return { hex: color.hex, role, confidence, reasoning };
    }
    if (hasTextUsage && luminanceRole.startsWith("text")) {
      reasoning.push(`Neutral color used as text (L=${color.hsl.l}%)`);
      role = luminanceRole;
      confidence = 0.8;
      return { hex: color.hex, role, confidence, reasoning };
    }
  }

  // 4. Check if it's a saturated accent color
  const accentRole = classifyAccentColor(color.hsl);
  if (accentRole) {
    reasoning.push(`Saturated color (S=${color.hsl.s}%, H=${color.hsl.h}°)`);

    // Refine based on usage
    if (hasBgUsage && color.frequency > 0.1) {
      role = "accent.brand";
      confidence = 0.75;
    } else if (hasTextUsage) {
      // Check if it's likely a link
      const hasLinkSelector = color.selectors.some((s) =>
        /\ba\b|link/i.test(s)
      );
      if (hasLinkSelector) {
        role = "accent.link";
        confidence = 0.85;
      } else {
        role = accentRole;
        confidence = 0.7;
      }
    } else {
      role = accentRole;
      confidence = 0.6;
    }
    return { hex: color.hex, role, confidence, reasoning };
  }

  // 5. Border-only usage
  if (hasBorderUsage && !hasBgUsage && !hasTextUsage) {
    reasoning.push("Used only for borders");
    role = color.hsl.s < 15 ? "border.subtle" : "border.default";
    confidence = 0.7;
    return { hex: color.hex, role, confidence, reasoning };
  }

  // 6. SVG fill/stroke
  if (hasFillUsage) {
    reasoning.push("Used as SVG fill/stroke");
    if (color.hsl.s > 30) {
      role = "accent.interactive";
      confidence = 0.6;
    } else {
      role = "text.secondary";
      confidence = 0.5;
    }
    return { hex: color.hex, role, confidence, reasoning };
  }

  // 7. Fallback based on luminance
  if (luminanceRole) {
    role = luminanceRole;
    reasoning.push(`Fallback based on luminance (L=${color.hsl.l}%)`);
    confidence = 0.4;
  } else {
    role = "unknown";
    reasoning.push("Could not determine role");
    confidence = 0.2;
  }

  return { hex: color.hex, role, confidence, reasoning };
}

/**
 * Classify all colors from an extraction result.
 */
export function classifyAllColors(
  result: ColorExtractionResult
): Map<string, SemanticClassification> {
  const classifications = new Map<string, SemanticClassification>();

  for (const color of result.colors.values()) {
    const classification = classifyColor(color, result.detectedMode);
    classifications.set(color.hex, classification);
  }

  return classifications;
}

/**
 * Group classifications by role.
 */
export function groupByRole(
  classifications: Map<string, SemanticClassification>
): Map<SemanticRole, SemanticClassification[]> {
  const groups = new Map<SemanticRole, SemanticClassification[]>();

  for (const classification of classifications.values()) {
    const existing = groups.get(classification.role) || [];
    existing.push(classification);
    groups.set(classification.role, existing);
  }

  return groups;
}

/**
 * Get the most confident classification for each role.
 */
export function getBestClassifications(
  classifications: Map<string, SemanticClassification>
): Map<SemanticRole, SemanticClassification> {
  const best = new Map<SemanticRole, SemanticClassification>();

  for (const classification of classifications.values()) {
    const existing = best.get(classification.role);
    if (!existing || classification.confidence > existing.confidence) {
      best.set(classification.role, classification);
    }
  }

  return best;
}
