// Catppuccin flavor types
export type CatppuccinFlavor = 'latte' | 'frappe' | 'macchiato' | 'mocha';

// Catppuccin color names
export type CatppuccinColor =
  // Base colors
  | 'base' | 'mantle' | 'crust'
  // Surface colors
  | 'surface0' | 'surface1' | 'surface2'
  // Overlay colors
  | 'overlay0' | 'overlay1' | 'overlay2'
  // Text colors
  | 'subtext0' | 'subtext1' | 'text'
  // Accent colors
  | 'rosewater' | 'flamingo' | 'pink' | 'mauve' | 'red' | 'maroon'
  | 'peach' | 'yellow' | 'green' | 'teal' | 'sky' | 'sapphire'
  | 'blue' | 'lavender';

// Accent colors specifically
export type AccentColor =
  | 'rosewater' | 'flamingo' | 'pink' | 'mauve' | 'red' | 'maroon'
  | 'peach' | 'yellow' | 'green' | 'teal' | 'sky' | 'sapphire'
  | 'blue' | 'lavender';

// Color value with RGB
export interface ColorValue {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
  };
}

// Complete palette for a flavor
export interface CatppuccinPalette {
  base: ColorValue;
  mantle: ColorValue;
  crust: ColorValue;
  surface0: ColorValue;
  surface1: ColorValue;
  surface2: ColorValue;
  overlay0: ColorValue;
  overlay1: ColorValue;
  overlay2: ColorValue;
  subtext0: ColorValue;
  subtext1: ColorValue;
  text: ColorValue;
  rosewater: ColorValue;
  flamingo: ColorValue;
  pink: ColorValue;
  mauve: ColorValue;
  red: ColorValue;
  maroon: ColorValue;
  peach: ColorValue;
  yellow: ColorValue;
  green: ColorValue;
  teal: ColorValue;
  sky: ColorValue;
  sapphire: ColorValue;
  blue: ColorValue;
  lavender: ColorValue;
}

// All palettes
export type CatppuccinPalettes = Record<CatppuccinFlavor, CatppuccinPalette>;

// Website color analysis result
export interface WebsiteColorAnalysis {
  primaryColors: string[];
  secondaryColors: string[];
  backgroundColor: string;
  textColor: string;
  accentColors: string[];
}

// Color mapping result
export interface ColorMapping {
  originalColor: string;
  catppuccinColor: CatppuccinColor;
  reason: string;
  // Hover gradient properties
  hasVisibleBackground?: boolean; // Element has visible background different from parent
  hasBorder?: boolean; // Element has visible borders
  isTextOnly?: boolean; // Element is text-only with invisible background
  hoverGradientAngle?: number; // Random angle (0-360°) for hover gradient
}

// CSS class mapping result
export interface CSSClassMapping {
  className: string;
  selector: string;
  properties: Array<{
    property: string;
    originalValue: string;
    catppuccinValue: string;
    catppuccinColor?: CatppuccinColor;
  }>;
  purpose: string; // e.g., "button", "link", "background", "text"
  // Hover gradient properties
  hasVisibleBackground?: boolean; // Element has visible background different from parent
  hasBorder?: boolean; // Element has visible borders
  isTextOnly?: boolean; // Element is text-only with invisible background
  hoverGradientAngle?: number; // Random angle (0-360°) for hover gradient
}

// Enhanced website analysis with CSS classes
export interface EnhancedWebsiteAnalysis extends WebsiteColorAnalysis {
  cssClasses: CSSClassMapping[];
  classUsage: Record<string, number>;
}

// Theme generation config
export interface ThemeConfig {
  url: string;
  flavors: CatppuccinFlavor[];
  accentPriority: AccentColor[];
  colorAnalysis: WebsiteColorAnalysis;
  colorMappings: ColorMapping[];
  cssClassMappings?: CSSClassMapping[];
}
