/**
 * Catppuccin Mocha Theme Colors
 * Using official Catppuccin Mocha palette for the website UI
 * Source: https://github.com/catppuccin/catppuccin
 */

// Base colors
export const base = '#1e1e2e';
export const mantle = '#181825';
export const crust = '#11111b';

// Surface colors
export const surface0 = '#313244';
export const surface1 = '#45475a';
export const surface2 = '#585b70';

// Overlay colors
export const overlay0 = '#6c7086';
export const overlay1 = '#7f849c';
export const overlay2 = '#9399b2';

// Text colors
export const subtext0 = '#a6adc8';
export const subtext1 = '#bac2de';
export const text = '#cdd6f4';

// Accent colors
export const rosewater = '#f5e0dc';
export const flamingo = '#f2cdcd';
export const pink = '#f5c2e7';
export const mauve = '#cba6f7';
export const red = '#f38ba8';
export const maroon = '#eba0ac';
export const peach = '#fab387';
export const yellow = '#f9e2af';
export const green = '#a6e3a1';
export const teal = '#94e2d5';
export const sky = '#89dceb';
export const sapphire = '#74c7ec';
export const blue = '#89b4fa';
export const lavender = '#b4befe';

// Color Scheme for Mauve accent
// Main accent: Mauve (purple)
// Bi-accent: Pink (most similar to mauve, used for gradients)
// Co-accents: Sapphire (blue) + Green (triadic harmony, main accents)
export const accent = mauve;
export const biAccent = pink;  // Similar to mauve for smooth gradients
export const coAccent1 = sapphire;
export const coAccent2 = green;

// Semantic colors
export const success = green;
export const warning = yellow;
export const error = red;
export const info = blue;

/**
 * Catppuccin Mocha Tailwind Config
 * For use in className strings
 */
export const catppuccinColors = {
  // Base
  'ctp-base': base,
  'ctp-mantle': mantle,
  'ctp-crust': crust,

  // Surface
  'ctp-surface0': surface0,
  'ctp-surface1': surface1,
  'ctp-surface2': surface2,

  // Overlay
  'ctp-overlay0': overlay0,
  'ctp-overlay1': overlay1,
  'ctp-overlay2': overlay2,

  // Text
  'ctp-subtext0': subtext0,
  'ctp-subtext1': subtext1,
  'ctp-text': text,

  // Accents
  'ctp-rosewater': rosewater,
  'ctp-flamingo': flamingo,
  'ctp-pink': pink,
  'ctp-mauve': mauve,
  'ctp-red': red,
  'ctp-maroon': maroon,
  'ctp-peach': peach,
  'ctp-yellow': yellow,
  'ctp-green': green,
  'ctp-teal': teal,
  'ctp-sky': sky,
  'ctp-sapphire': sapphire,
  'ctp-blue': blue,
  'ctp-lavender': lavender,

  // Accent scheme
  'ctp-accent': accent,
  'ctp-bi-accent': biAccent,
  'ctp-co-accent1': coAccent1,
  'ctp-co-accent2': coAccent2,

  // Semantic
  'ctp-success': success,
  'ctp-warning': warning,
  'ctp-error': error,
  'ctp-info': info,
};
