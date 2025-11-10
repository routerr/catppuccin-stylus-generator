import type { CatppuccinFlavor, CatppuccinColor, ColorMapping, AccentColor } from '../../types/catppuccin';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { computeAccentSetFor } from '../../utils/accent-schemes';

// Contrast calculation functions
function hexToRgb(hex: string): number[] {
  // Remove # if present
  const h = hex.replace(/#/, '');
  // Split the string into 2-digit pairs
  const rgb = h.match(/../g) || [];
  // Convert each pair into a number and divide by 255
  return rgb.map((v) => parseInt(v, 16) / 255);
}

function luminance(rgb: number[]): number {
  // Scale to 0-1
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  // Convert to XYZ using D65 white point
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.3993 + g * 0.3685 + b * 0.1855;
  const z = r * 0.2101 + g * 0.1140 + b * 0.9500;
  // Calculate luminance (perceived brightness)
  return (0.2126 * x + 0.7152 * y + 0.0722 * z) / (1 - 0.05); // Adjusting for relative luminance
}

function contrastRatio(hex1: string, hex2: string): number {
  // Convert hex colors to RGB
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  // Calculate relative luminance for each color
  const lum1 = luminance(rgb1);
  const lum2 = luminance(rgb2);
  // Calculate contrast ratio
  const contrast = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  return contrast;
}

export function generateCssTheme(
  flavor: CatppuccinFlavor,
  colorMappings: Map<string, CatppuccinColor>,
  url: string,
  mappingsWithReasons?: ColorMapping[],
  defaultAccent: AccentColor = 'mauve'
): string {
  const palette = CATPPUCCIN_PALETTES[flavor];
  const pre = computeAccentSetFor(palette, defaultAccent);
  const date = new Date().toISOString().split('T')[0];

  let css = `/**
 * Catppuccin ${capitalize(flavor)} Theme
 * Generated from: ${url}
 * Date: ${date}
 * Generator: Catppuccin Theme Generator
 */

:root {
  /* Catppuccin ${capitalize(flavor)} Color Palette */
`;

  // Add all color variables
  for (const [colorName, colorValue] of Object.entries(palette)) {
    css += `  --ctp-${colorName}: ${colorValue.hex};\n`;
    css += `  --ctp-${colorName}-rgb: ${colorValue.rgb.r}, ${colorValue.rgb.g}, ${colorValue.rgb.b};\n`;
  }

  css += `\n  /* Accent Color Scheme Variables */\n`;
  css += `  /* Main accents (used for static colors) */\n`;
  css += `  --ctp-co-accent1: var(--ctp-${pre.coAccent1});\n`;
  css += `  --ctp-co-accent2: var(--ctp-${pre.coAccent2});\n`;
  css += `  /* Bi-accents (two nearest to ${defaultAccent}, used for smooth gradients) */\n`;
  css += `  --ctp-accent: var(--ctp-${defaultAccent});\n`;
  css += `  --ctp-bi-accent1: var(--ctp-${pre.biAccent1});\n`;
  css += `  --ctp-bi-accent2: var(--ctp-${pre.biAccent2});\n`;

  css += `\n  /* Color Mappings */\n`;
  css += `  /* These map the original website colors to Catppuccin colors */\n`;

  // Add mapped colors
  for (const [originalColor, catppuccinColor] of colorMappings.entries()) {
    const varName = generateVarName(originalColor);
    css += `  --${varName}: var(--ctp-${catppuccinColor}); /* Original: ${originalColor} */\n`;
  }

  css += `}\n\n`;

  // Add data attribute selector for easier theming
  css += `[data-theme="catppuccin-${flavor}"] {\n`;
  css += `  background-color: var(--ctp-base);\n`;
  css += `  color: var(--ctp-text);\n`;
  css += `}\n\n`;

  css += `/* Example Usage */\n`;
  css += `/*\n/* Catppuccin Theme with Bi-Accent Gradients - Smooth & Elegant */\nbody {\n  background-color: var(--ctp-base);\n  color: var(--ctp-text);\n}\n\n`;
  css += `/* Links with bi-accent gradient on hover */\n`;
  css += `a, .link {\n  color: var(--ctp-accent);\n  text-decoration-color: var(--ctp-accent);\n  text-decoration: underline;\n}\n\n`;
  
  // Calculate contrast for hover state
  const accentHex = palette[defaultAccent].hex;
  const bgHex = palette[pre.biAccent1].hex;
  const contrast = contrastRatio(accentHex, bgHex);
  
  // Apply contrast adjustments for hover state
  css += `a:hover, .link:hover {\n`;
  if (contrast < 4.5) {
    // For insufficient contrast, use a higher contrast text color
    css += `  color: #ffffff; /* White text for better contrast */\n`;
  } else {
    css += `  color: var(--ctp-accent);\n`;
  }
  css += `  background: linear-gradient(90deg, var(--ctp-accent) 0%, var(--ctp-bi-accent1) 50%, var(--ctp-bi-accent2) 100%);\n`;
  css += `}\n\n`;

  css += `/* BUTTON STYLES - Bi-accent gradient backgrounds */\n`;
  css += `.btn-primary {\n  background-color: var(--ctp-surface0);\n  color: var(--ctp-blue);\n}\n\n`;

  // Apply contrast adjustments for button hover state
  const btnTextHex = palette.blue.hex;
  const btnBgHex = palette.surface0.hex;
  const btnContrast = contrastRatio(btnTextHex, btnBgHex);
  
  css += `.btn-primary:hover {\n`;
  if (btnContrast < 4.5) {
    css += `  color: #ffffff; /* White text for better contrast */\n`;
  } else {
    css += `  color: var(--ctp-accent);\n`;
  }
  css += `  background: linear-gradient(135deg, var(--ctp-accent) 0%, var(--ctp-bi-accent1) 50%, var(--ctp-bi-accent2) 100%);\n`;
  css += `}\n\n`;

  css += `.btn-primary:active {\n  background: var(--ctp-blue);\n}\n\n`;
  css += `.btn-destructive {\n  background-color: var(--ctp-surface0);\n  color: var(--ctp-red);\n}\n\n`;

  // Apply contrast adjustments for destructive button hover state
  const dangerTextHex = palette.red.hex;
  const dangerBgHex = palette.surface0.hex;
  const dangerContrast = contrastRatio(dangerTextHex, dangerBgHex);
  
  css += `.btn-destructive:hover {\n`;
  if (dangerContrast < 4.5) {
    css += `  color: #ffffff; /* White text for better contrast */\n`;
  } else {
    css += `  color: var(--ctp-base);\n`;
  }
  css += `  background: linear-gradient(135deg, var(--ctp-red) 0%, var(--ctp-maroon) 50%, var(--ctp-peach) 100%);\n`;
  css += `}\n\n`;

  css += `/* Using RGB values for overlays */\n`;
  css += `.overlay {\n  background-color: rgba(var(--ctp-base-rgb), 0.8);\n}\n*/\n`;

  return css;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateVarName(color: string): string {
  // Convert color to variable name
  return color.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().replace(/^-+|-+$/g, '');
}