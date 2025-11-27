/**
 * Deep Analysis Type Definitions
 * Comprehensive types for precision theme generation
 */

// ============================================================================
// CSS Variable Analysis
// ============================================================================

export interface CSSVariable {
  name: string; // e.g., "--theme-col-txt-title"
  value: string; // e.g., "#1a73e8" or "rgb(26, 115, 232)"
  computedValue: string; // Resolved color value
  scope: "root" | "element" | "class"; // Where it's defined
  selector: string; // Selector where defined (e.g., ":root", ".dark-theme")
  usage: string[]; // Selectors using this variable
  semanticPurpose?: string; // AI-detected purpose
  frequency: number; // How often it's used
}

export interface VariableMapping {
  original: string; // "--theme-col-txt-title"
  catppuccin: string; // "blue"
  reason: string; // "Primary link and title color"
  priority: "critical" | "high" | "medium" | "low";
  isAccent: boolean; // true if this should use accent color
}

// ============================================================================
// SVG Analysis
// ============================================================================

export interface SVGInfo {
  location: "inline" | "background" | "mask" | "img";
  selector: string; // CSS selector or element ID
  svg: string; // Raw SVG markup
  colors: SVGColor[]; // All colors found in SVG
  semanticPurpose?: string; // e.g., "search icon", "logo"
  width?: number;
  height?: number;
}

export interface SVGColor {
  type: "fill" | "stroke" | "stop-color";
  value: string; // Original color
  attribute: string; // Attribute name
  elementPath: string; // SVG element path (e.g., "path[0]")
}

export interface SVGColorMapping {
  originalColor: string; // "#1a73e8"
  catppuccinColor: string; // "blue"
  svgPurpose: string; // "Search icon in header"
  reason: string; // Explanation
}

export interface ProcessedSVG {
  selector: string;
  lessVariable: string; // e.g., "@svg"
  svg: string; // SVG with @{color} placeholders
  property: string; // e.g., "background-image", "content"
}

// ============================================================================
// Design System Detection
// ============================================================================

export type DesignSystemType =
  | "material" // Material Design
  | "bootstrap" // Bootstrap
  | "tailwind" // Tailwind CSS
  | "antd" // Ant Design
  | "chakra" // Chakra UI
  | "custom" // Custom design system
  | "unknown"; // No design system detected

export interface DesignSystem {
  framework: DesignSystemType;
  confidence: number; // 0-1, how confident the detection is
  variablePrefix: string[]; // e.g., ["--sds-", "--theme-", "--mdc-"]
  colorTokens: Map<string, string>; // Token name -> color value
  componentPatterns: string[]; // Common class patterns
  themeToggle?: {
    // Dark/light mode detection
    darkClass?: string; // e.g., ".dark", ".dark-theme"
    lightClass?: string; // e.g., ".light", ".light-theme"
    attribute?: string; // e.g., "data-theme"
    values?: [string, string]; // [dark value, light value]
  };
}

// ============================================================================
// Selector Discovery
// ============================================================================

export type SelectorCategory =
  | "button"
  | "link"
  | "card"
  | "input"
  | "text"
  | "background"
  | "border"
  | "icon"
  | "navigation"
  | "modal"
  | "header"
  | "footer"
  | "badge"
  | "switch"
  | "dropdown"
  | "sidebar"
  | "code"
  | "table"
  | "tab"
  | "alert"
  | "other";

export interface SelectorInfo {
  selector: string; // Full CSS selector
  category: SelectorCategory;
  specificity: number; // CSS specificity score
  frequency: number; // How often it appears in DOM
  currentStyles: {
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    fill?: string;
    stroke?: string;
  };
  isInteractive: boolean; // Has hover/focus states
  hasVisibleBackground: boolean;
  hasBorder: boolean;
  isTextOnly: boolean;
}

export interface SelectorGroup {
  category: SelectorCategory;
  selectors: SelectorInfo[];
  totalCount: number;
}

export interface SelectorMapping {
  selector: string;
  properties: {
    color?: string; // Catppuccin color name
    backgroundColor?: string;
    borderColor?: string;
    fill?: string;
    stroke?: string;
  };
  reason: string;
  hoverGradient?: {
    angle: number;
    mainColor: string; // Catppuccin color
    biAccent: string; // Bi-accent color
    opacity: number; // 0-1
  };
  specificity: number;
  important: boolean; // Should use !important
  isAccent?: boolean; // Whether this mapping uses the accent color
}

// ============================================================================
// Deep Analysis Result
// ============================================================================

export interface DeepAnalysisResult {
  // Core website data
  url: string;
  title: string;
  content: string;
  html: string;

  // Deep analysis data
  cssVariables: CSSVariable[];
  svgs: SVGInfo[];
  designSystem: DesignSystem;
  selectorGroups: SelectorGroup[];

  // CSS extraction
  allCSS: string; // All CSS concatenated
  externalStylesheets: string[]; // URLs
  inlineStyles: string[]; // <style> blocks

  // Computed analysis
  dominantColors: string[]; // Most used colors
  accentColors: string[]; // Detected accent colors
  mode: "dark" | "light"; // Detected color scheme

  // Metadata
  analyzedAt: Date;
  analysisTime: number; // milliseconds
  coverage: {
    variables: number; // Count of CSS variables
    svgs: number; // Count of SVGs
    selectors: number; // Count of unique selectors
  };
}

// ============================================================================
// Mapping Result
// ============================================================================

export interface MappingResult {
  variableMappings: VariableMapping[];
  svgMappings: Map<string, SVGColorMapping>;
  selectorMappings: SelectorMapping[];
  processedSVGs: ProcessedSVG[];

  // Statistics
  stats: {
    totalVariables: number;
    mappedVariables: number;
    totalSVGs: number;
    processedSVGs: number;
    totalSelectors: number;
    mappedSelectors: number;
    accentUsage: {
      mainAccent: number; // Count
      biAccent1: number;
      biAccent2: number;
    };
  };
}

// ============================================================================
// Generator Output
// ============================================================================

export interface GeneratedTheme {
  less: string; // Complete LESS output
  metadata: {
    url: string;
    generatedAt: Date;
    version: string;
    mode: "dark" | "light";
    designSystem?: DesignSystemType;
  };
  sections: {
    variables: string; // CSS variable section
    svgs: string; // SVG replacement section
    selectors: string; // Specific selector section
    gradients: string; // Gradient hover section
    fallbacks: string; // Generic fallback section
  };
  coverage: {
    variableCoverage: number; // Percentage
    svgCoverage: number;
    selectorCoverage: number;
  };
}

// ============================================================================
// AI Prompts
// ============================================================================

export interface DeepAnalysisPrompt {
  type: "variables" | "svgs" | "selectors";
  context: string; // Website context
  data: any; // Analysis data to map
  instructions: string; // Specific instructions
  examples: string; // Example mappings
}

// ============================================================================
// Configuration
// ============================================================================

export interface DeepAnalysisConfig {
  // Feature flags
  enableCSSVariables: boolean;
  enableSVGReplacement: boolean;
  enableSelectorDiscovery: boolean;
  enableDesignSystemDetection: boolean;

  // Thresholds
  minVariableUsage: number; // Min usage count to include
  minSelectorFrequency: number; // Min frequency to include
  maxSelectors: number; // Max selectors to analyze

  // AI settings
  useAIForVariables: boolean;
  useAIForSVGs: boolean;
  useAIForSelectors: boolean;

  // Output settings
  includeComments: boolean;
  includeCoverage: boolean;
  groupByCategory: boolean;
}

export const DEFAULT_DEEP_ANALYSIS_CONFIG: DeepAnalysisConfig = {
  enableCSSVariables: true,
  enableSVGReplacement: true,
  enableSelectorDiscovery: true,
  enableDesignSystemDetection: true,

  minVariableUsage: 1,
  minSelectorFrequency: 1,
  maxSelectors: 500,

  useAIForVariables: true,
  useAIForSVGs: true,
  useAIForSelectors: true,

  includeComments: true,
  includeCoverage: true,
  groupByCategory: true,
};
