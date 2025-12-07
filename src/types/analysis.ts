/**
 * Core types for the Deep Analysis Engine.
 * These types drive the site-specific theme generation.
 */

import type { AccentColor } from "./catppuccin";

// ============================================================================
// COLOR EXTRACTION TYPES
// ============================================================================

/**
 * Raw color occurrence extracted from CSS.
 */
export interface ColorOccurrence {
  /** The color value in normalized hex format (#RRGGBB) */
  hex: string;
  /** The CSS property where this color was found */
  property:
    | "color"
    | "background-color"
    | "border-color"
    | "fill"
    | "stroke"
    | "box-shadow"
    | "outline"
    | "other";
  /** The selector(s) where this color appears */
  selectors: string[];
  /** If from a CSS variable, the variable name */
  variableName?: string;
  /** Occurrence count in the stylesheet */
  count: number;
}

/**
 * Aggregated color with usage statistics.
 */
export interface AggregatedColor {
  hex: string;
  /** Total occurrences across all properties */
  totalCount: number;
  /** Percentage of total color usage (0-1) */
  frequency: number;
  /** Distribution by property type */
  propertyDistribution: Map<string, number>;
  /** All selectors using this color */
  selectors: string[];
  /** CSS variable names that resolve to this color */
  variableNames: string[];
  /** Computed HSL for quick access */
  hsl: { h: number; s: number; l: number };
}

/**
 * Complete color extraction result from a site.
 */
export interface ColorExtractionResult {
  /** All unique colors found */
  colors: Map<string, AggregatedColor>;
  /** CSS variables and their resolved values */
  variables: Map<string, string>;
  /** Total color occurrences analyzed */
  totalOccurrences: number;
  /** Detected color mode based on background luminance */
  detectedMode: "light" | "dark";
}

// ============================================================================
// SEMANTIC CLASSIFICATION TYPES
// ============================================================================

/**
 * Semantic role categories for colors.
 */
export type SemanticRole =
  // Layout roles
  | "background.primary"
  | "background.secondary"
  | "surface.card"
  | "surface.overlay"
  // Content roles
  | "text.primary"
  | "text.secondary"
  | "text.muted"
  // Accent roles (60/20/20 distribution)
  | "accent.brand" // The site's main brand color (primary 60%)
  | "accent.link" // Link color (primary 60%)
  | "accent.interactive" // Buttons, interactive elements (primary 60%)
  | "accent.secondary" // Secondary accent (bi-accent 20%)
  | "accent.tertiary" // Tertiary accent (bi-accent 20%)
  // Semantic state roles
  | "semantic.success"
  | "semantic.warning"
  | "semantic.error"
  | "semantic.info"
  // Border roles
  | "border.subtle"
  | "border.default"
  // Unknown
  | "unknown";

/**
 * Metadata for determining whether to apply background/color changes.
 */
export interface ElementStyleConstraints {
  /** Whether the element originally has a transparent background */
  hasTransparentBackground: boolean;
  /** Whether the element has a visible border */
  hasVisibleBorder: boolean;
  /** Whether the element has a different background than its parent */
  hasDifferentBgFromParent: boolean;
  /** Whether the element is text-only (no background, no border) */
  isTextOnly: boolean;
}

/**
 * Classification result with confidence.
 */
export interface SemanticClassification {
  hex: string;
  role: SemanticRole;
  confidence: number; // 0-1
  reasoning: string[];
}

// ============================================================================
// SITE SIGNATURE TYPES (CORE OF THE NEW SYSTEM)
// ============================================================================

/**
 * Saturation level classification.
 */
export type SaturationLevel = "vibrant" | "muted" | "neutral";

/**
 * Unique "fingerprint" of a website's color profile.
 * This is the KEY to generating site-specific themes.
 */
export interface SiteSignature {
  /** The domain this signature belongs to */
  domain: string;

  /** Color profile summary */
  colorProfile: {
    /** Dominant hue in degrees (0-360) */
    dominantHue: number;
    /** Human-readable hue name */
    dominantHueName: string;
    /** Overall saturation style */
    saturationLevel: SaturationLevel;
    /** Light or dark mode site */
    luminanceMode: "light" | "dark";
    /** Primary brand colors (max 3, ordered by prominence) */
    brandColors: string[];
    /** Accent color distribution: color -> usage percentage */
    accentDistribution: Map<string, number>;
    /** Total unique colors found */
    uniqueColorCount: number;
  };

  /** Semantic role assignments: role -> hex color */
  semanticRoles: Map<SemanticRole, string>;

  /** Reverse mapping: hex color -> which selectors use it */
  selectorMap: Map<string, string[]>;

  /** Selector classifications: selector -> element type */
  selectorClassifications: Map<
    string,
    "button" | "link" | "card" | "nav" | "input" | "text" | "other"
  >;

  /** Suggested Catppuccin accent based on brand colors */
  suggestedAccent: AccentColor;

  /** Metadata */
  metadata: {
    /** When this signature was generated */
    generatedAt: string;
    /** Source type */
    sourceType: "url" | "directory" | "mhtml";
    /** Confidence score for the overall analysis */
    overallConfidence: number;
  };
}

// ============================================================================
// AI MAPPING TYPES
// ============================================================================

/**
 * A single color mapping from original to Catppuccin.
 */
export interface ColorMapping {
  /** Original color from the site */
  original: string;
  /** Mapped Catppuccin token name */
  catppuccinToken: string;
  /** The semantic role this color serves */
  role: SemanticRole;
  /** AI's reasoning for this mapping */
  reason: string;
  /** Whether this uses the user's selected accent */
  usesAccent: boolean;
}

/**
 * Complete mapping result from AI.
 */
export interface MappingResult {
  /** All individual color mappings */
  mappings: ColorMapping[];
  /** Accent color chosen/confirmed by AI */
  chosenAccent: AccentColor;
  /** Bi-accents derived from the chosen accent */
  biAccents: [AccentColor, AccentColor];
  /** Any warnings or notes from the mapping process */
  warnings: string[];
  /** Mapping confidence score */
  confidence: number;
}

// ============================================================================
// GENERATION TYPES
// ============================================================================

/**
 * Configuration for the theme generator.
 */
export interface GenerationConfig {
  /** Target domain for the @-moz-document block */
  domain: string;
  /** Include flavor selector (Latte/Frappe/Macchiato/Mocha) */
  includeFlavors: boolean;
  /** Include accent selector */
  includeAccents: boolean;
  /** Generate gradient hover effects */
  enableGradients: boolean;
  /** Coverage level */
  coverageLevel: "minimal" | "standard" | "comprehensive";
}

/**
 * Generated theme output.
 */
export interface GeneratedThemeOutput {
  /** LESS code with Stylus UserCSS format */
  lessCode: string;
  /** Compiled CSS (for preview) */
  compiledCss?: string;
  /** Statistics about the generation */
  stats: {
    rulesGenerated: number;
    colorsReplaced: number;
    selectorsTargeted: number;
  };
}
