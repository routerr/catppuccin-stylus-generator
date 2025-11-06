// Catppuccin palette © Catppuccin community (MIT). Source: https://github.com/catppuccin/palette

import type { CatppuccinPalettes, ColorValue, CatppuccinFlavor, CatppuccinPalette } from '../types/catppuccin';

// Helper function to convert hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Helper function to convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Helper to create ColorValue from hex
export function makeColorValue(hex: string): ColorValue {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { hex, rgb, hsl };
}

// Keep internal helper for backward compatibility
const color = makeColorValue;

// Official Catppuccin color palettes
export const CATPPUCCIN_PALETTES: Record<CatppuccinFlavor, CatppuccinPalette> = {
  latte: {
    // Base colors
    base: color('#eff1f5'),
    mantle: color('#e6e9ef'),
    crust: color('#dce0e8'),
    // Surface colors
    surface0: color('#ccd0da'),
    surface1: color('#bcc0cc'),
    surface2: color('#acb0be'),
    // Overlay colors
    overlay0: color('#9ca0b0'),
    overlay1: color('#8c8fa1'),
    overlay2: color('#7c7f93'),
    // Text colors
    subtext0: color('#6c6f85'),
    subtext1: color('#5c5f77'),
    text: color('#4c4f69'),
    // Accent colors
    rosewater: color('#dc8a78'),
    flamingo: color('#dd7878'),
    pink: color('#ea76cb'),
    mauve: color('#8839ef'),
    red: color('#d20f39'),
    maroon: color('#e64553'),
    peach: color('#fe640b'),
    yellow: color('#df8e1d'),
    green: color('#40a02b'),
    teal: color('#179299'),
    sky: color('#04a5e5'),
    sapphire: color('#209fb5'),
    blue: color('#1e66f5'),
    lavender: color('#7287fd'),
  },
  frappe: {
    // Base colors
    base: color('#303446'),
    mantle: color('#292c3c'),
    crust: color('#232634'),
    // Surface colors
    surface0: color('#414559'),
    surface1: color('#51576d'),
    surface2: color('#626880'),
    // Overlay colors
    overlay0: color('#737994'),
    overlay1: color('#838ba7'),
    overlay2: color('#949cbb'),
    // Text colors
    subtext0: color('#a5adce'),
    subtext1: color('#b5bfe2'),
    text: color('#c6d0f5'),
    // Accent colors
    rosewater: color('#f2d5cf'),
    flamingo: color('#eebebe'),
    pink: color('#f4b8e4'),
    mauve: color('#ca9ee6'),
    red: color('#e78284'),
    maroon: color('#ea999c'),
    peach: color('#ef9f76'),
    yellow: color('#e5c890'),
    green: color('#a6d189'),
    teal: color('#81c8be'),
    sky: color('#99d1db'),
    sapphire: color('#85c1dc'),
    blue: color('#8caaee'),
    lavender: color('#babbf1'),
  },
  macchiato: {
    // Base colors
    base: color('#24273a'),
    mantle: color('#1e2030'),
    crust: color('#181926'),
    // Surface colors
    surface0: color('#363a4f'),
    surface1: color('#494d64'),
    surface2: color('#5b6078'),
    // Overlay colors
    overlay0: color('#6e738d'),
    overlay1: color('#8087a2'),
    overlay2: color('#939ab7'),
    // Text colors
    subtext0: color('#a5adcb'),
    subtext1: color('#b8c0e0'),
    text: color('#cad3f5'),
    // Accent colors
    rosewater: color('#f4dbd6'),
    flamingo: color('#f0c6c6'),
    pink: color('#f5bde6'),
    mauve: color('#c6a0f6'),
    red: color('#ed8796'),
    maroon: color('#ee99a0'),
    peach: color('#f5a97f'),
    yellow: color('#eed49f'),
    green: color('#a6da95'),
    teal: color('#8bd5ca'),
    sky: color('#91d7e3'),
    sapphire: color('#7dc4e4'),
    blue: color('#8aadf4'),
    lavender: color('#b7bdf8'),
  },
  mocha: {
    // Base colors
    base: color('#1e1e2e'),
    mantle: color('#181825'),
    crust: color('#11111b'),
    // Surface colors
    surface0: color('#313244'),
    surface1: color('#45475a'),
    surface2: color('#585b70'),
    // Overlay colors
    overlay0: color('#6c7086'),
    overlay1: color('#7f849c'),
    overlay2: color('#9399b2'),
    // Text colors
    subtext0: color('#a6adc8'),
    subtext1: color('#bac2de'),
    text: color('#cdd6f4'),
    // Accent colors
    rosewater: color('#f5e0dc'),
    flamingo: color('#f2cdcd'),
    pink: color('#f5c2e7'),
    mauve: color('#cba6f7'),
    red: color('#f38ba8'),
    maroon: color('#eba0ac'),
    peach: color('#fab387'),
    yellow: color('#f9e2af'),
    green: color('#a6e3a1'),
    teal: color('#94e2d5'),
    sky: color('#89dceb'),
    sapphire: color('#74c7ec'),
    blue: color('#89b4fa'),
    lavender: color('#b4befe'),
  },
};

// Accent color metadata
export const ACCENT_COLORS = [
  { name: 'rosewater', displayName: 'Rosewater' },
  { name: 'flamingo', displayName: 'Flamingo' },
  { name: 'pink', displayName: 'Pink' },
  { name: 'mauve', displayName: 'Mauve' },
  { name: 'red', displayName: 'Red' },
  { name: 'maroon', displayName: 'Maroon' },
  { name: 'peach', displayName: 'Peach' },
  { name: 'yellow', displayName: 'Yellow' },
  { name: 'green', displayName: 'Green' },
  { name: 'teal', displayName: 'Teal' },
  { name: 'sky', displayName: 'Sky' },
  { name: 'sapphire', displayName: 'Sapphire' },
  { name: 'blue', displayName: 'Blue' },
  { name: 'lavender', displayName: 'Lavender' },
] as const;

// Flavor metadata
export const FLAVORS = [
  { name: 'latte', displayName: 'Latte', emoji: '☕', description: 'Light theme' },
  { name: 'frappe', displayName: 'Frappé', emoji: '🥤', description: 'Medium dark' },
  { name: 'macchiato', displayName: 'Macchiato', emoji: '🍵', description: 'Dark' },
  { name: 'mocha', displayName: 'Mocha', emoji: '🌙', description: 'Darkest' },
] as const;
