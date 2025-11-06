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
export type CatppuccinPalette = Record<CatppuccinColor, ColorValue>;

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
}

// Theme generation config
export interface ThemeConfig {
  url: string;
  flavors: CatppuccinFlavor[];
  accentPriority: AccentColor[];
  colorAnalysis: WebsiteColorAnalysis;
  colorMappings: ColorMapping[];
}
