import type { CatppuccinFlavor } from './catppuccin';

// Crawler service types
export type CrawlerService = 'browserbase' | 'exa' | 'firecrawl' | 'brave';

export interface CrawlerConfig {
  service: CrawlerService;
  apiKey: string;
}

export interface CrawlerResult {
  url: string;
  title: string;
  content: string;
  html?: string;
  screenshot?: string;
  colors?: string[];
}

// AI service types
export type AIProvider = 'openrouter' | 'chutes';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  isFree: boolean;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

// Theme output formats
export interface ThemeOutput {
  stylus: string;
  less: string;
  css: string;
}

export interface GeneratedTheme {
  flavor: CatppuccinFlavor;
  output: ThemeOutput;
}

export interface ThemePackage {
  url: string;
  timestamp: string;
  themes?: GeneratedTheme[]; // Old multi-theme format (optional for backward compatibility)
  userStyle?: string; // New single UserStyle format
  metadata: {
    accentColors: string[];
    crawlerUsed: CrawlerService;
    aiModelUsed: string;
  };
}

// Color classification types for role-based mapping

/**
 * Semantic role labels for colors in the design system.
 * Organized by function: backgrounds, surfaces, borders, text, interactive, and semantic states.
 */
export type RoleLabel =
  // Background roles (main canvas layers)
  | 'background.primary'
  | 'background.secondary'
  | 'background.tertiary'
  // Surface roles (cards, panels, elevated elements)
  | 'surface.0'
  | 'surface.1'
  | 'surface.2'
  // Border roles (separators, outlines)
  | 'border.subtle'
  | 'border.default'
  | 'border.strong'
  // Text roles (content hierarchy)
  | 'text.primary'
  | 'text.secondary'
  | 'text.muted'
  | 'text.disabled'
  // Interactive roles (user actions)
  | 'interactive.link'
  | 'interactive.selection'
  | 'interactive.focus'
  // Semantic state roles (feedback)
  | 'semantic.success'
  | 'semantic.warning'
  | 'semantic.danger'
  | 'semantic.info'
  | 'semantic.primary'
  | 'semantic.secondary';

/**
 * Usage context for a color in the original design.
 * Describes where and how a color appears.
 */
export interface ColorUsage {
  /** The color value in hex format */
  hex: string;
  /** Relative frequency of this color (0-1 scale) */
  frequency: number;
  /** Context types where this color appears */
  contexts: Array<'background' | 'text' | 'border' | 'button' | 'link' | 'other'>;
  /** Optional semantic hints from CSS classes, IDs, or surrounding text */
  semanticHints?: string[];
}

/**
 * Result of classifying a color into a semantic role.
 */
export interface ClassificationResult {
  /** The assigned semantic role */
  role: RoleLabel;
  /** Confidence score 0-1 for this classification */
  confidence: number;
  /** Optional hints explaining the classification decision */
  hints?: string[];
}

// ============================================================================
// ROLE-BASED MAPPING TYPES (for role-mapper.ts)
// ============================================================================

/**
 * Configuration for role-based mapping algorithm.
 */
export interface MappingConfig {
  /** Primary accent color (defaults to auto-detected from source) */
  primaryAccent?: import('./catppuccin').AccentColor;
  /** Secondary accent color (defaults to hue-adjacent to primary) */
  secondaryAccent?: import('./catppuccin').AccentColor;
  /** Semantic state color overrides */
  semanticOverrides?: {
    success?: import('./catppuccin').AccentColor;
    warning?: import('./catppuccin').AccentColor;
    danger?: import('./catppuccin').AccentColor;
    info?: import('./catppuccin').AccentColor;
  };
  /** Contrast validation mode for WCAG compliance */
  contrastMode?: 'strict' | 'normal' | 'relaxed';
}

/**
 * Input for the role mapping algorithm.
 */
export interface MappingInput {
  /** Source colors with usage statistics from the original design */
  sourceColors: Map<string, ColorUsage>;
  /** Target Catppuccin flavor for mapping */
  selectedFlavor: import('./catppuccin').CatppuccinFlavor;
  /** Optional mapping configuration */
  config?: MappingConfig;
}

/**
 * Semantic role keys for the design system.
 * Maps abstract roles to concrete Catppuccin tokens.
 */
export type RoleKey =
  // Background roles (main canvas layers)
  | 'background.primary'
  | 'background.secondary'
  | 'background.tertiary'
  // Surface roles (cards, panels, elevated elements)
  | 'surface.0'
  | 'surface.1'
  | 'surface.2'
  // Border roles (separators, outlines)
  | 'border.subtle'
  | 'border.default'
  | 'border.strong'
  // Text roles (content hierarchy)
  | 'text.primary'
  | 'text.secondary'
  | 'text.muted'
  | 'text.disabled'
  // Interactive accent roles (UI feedback)
  | 'accent.interactive'
  | 'accent.selection'
  | 'accent.focus'
  // Semantic base roles (state colors)
  | 'primary.base'
  | 'primary.text'
  | 'secondary.base'
  | 'secondary.text'
  | 'success.base'
  | 'success.text'
  | 'warning.base'
  | 'warning.text'
  | 'danger.base'
  | 'danger.text'
  | 'info.base'
  | 'info.text';

/**
 * Map of semantic roles to Catppuccin color values.
 */
export interface RoleMap {
  [role: string]: import('./catppuccin').ColorValue | undefined;
}

/**
 * Derived state keys for interaction states and effects.
 * Generated algorithmically from base semantic roles.
 */
export type DerivedKey =
  // Semantic hover states
  | 'primary.hover'
  | 'primary.active'
  | 'secondary.hover'
  | 'secondary.active'
  | 'success.hover'
  | 'success.active'
  | 'warning.hover'
  | 'warning.active'
  | 'danger.hover'
  | 'danger.active'
  | 'info.hover'
  | 'info.active'
  // Focus and selection states
  | 'focus.ring'
  | 'selection.bg';

/**
 * Map of derived interaction states to color values.
 */
export interface DerivedScales {
  [key: string]: import('./catppuccin').ColorValue | undefined;
}

/**
 * Output from the role mapping algorithm.
 */
export interface MappingOutput {
  /** Base role assignments */
  roleMap: RoleMap;
  /** Derived interaction states */
  derivedScales: DerivedScales;
  /** Mapping metadata and diagnostics */
  metadata: {
    /** Target Catppuccin flavor */
    flavor: import('./catppuccin').CatppuccinFlavor;
    /** Chosen primary accent */
    primaryAccent: import('./catppuccin').AccentColor;
    /** Chosen secondary accent */
    secondaryAccent: import('./catppuccin').AccentColor;
    /** Whether all contrast validations passed */
    contrastValidated: boolean;
    /** Warning messages if any validations failed */
    warnings?: string[];
  };
}
