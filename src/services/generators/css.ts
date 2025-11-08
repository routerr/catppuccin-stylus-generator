import type { CatppuccinFlavor, CatppuccinColor, ColorMapping, AccentColor } from '../../types/catppuccin';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { calculateTriadicAccents, calculateBiAccent } from '../../utils/color-analysis';

export function generateCssTheme(
  flavor: CatppuccinFlavor,
  colorMappings: Map<string, CatppuccinColor>,
  url: string,
  mappingsWithReasons?: ColorMapping[],
  defaultAccent: AccentColor = 'mauve'
): string {
  const palette = CATPPUCCIN_PALETTES[flavor];
  const triadicColors = calculateTriadicAccents(defaultAccent, palette);
  const biAccent = calculateBiAccent(defaultAccent, palette);
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
  css += `  --ctp-co-accent1: var(--ctp-${triadicColors.coAccent1});\n`;
  css += `  --ctp-co-accent2: var(--ctp-${triadicColors.coAccent2});\n`;
  css += `  /* Bi-accent (most similar to ${defaultAccent}, used for smooth gradients) */\n`;
  css += `  --ctp-bi-accent: var(--ctp-${biAccent});\n`;

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
  css += `a, .link {\n  color: var(--ctp-blue);\n  text-decoration-color: var(--ctp-blue);\n  text-decoration: underline;\n}\n\n`;
  css += `a:hover, .link:hover {\n  background: linear-gradient(90deg, var(--ctp-blue) 0%, var(--ctp-bi-accent) 100%);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n  background-clip: text;\n  transition: all 0.3s ease;\n}\n\n`;
  css += `/* BUTTON STYLES - Bi-accent gradient backgrounds */\n`;
  css += `.btn-primary {\n  background-color: var(--ctp-surface0);\n  color: var(--ctp-blue);\n  border: 1px solid var(--ctp-blue);\n}\n\n`;
  css += `.btn-primary:hover {\n  background: linear-gradient(135deg, var(--ctp-blue) 0%, var(--ctp-bi-accent) 100%);\n  color: var(--ctp-base);\n  border-color: var(--ctp-bi-accent);\n  transition: all 0.3s ease;\n}\n\n`;
  css += `.btn-primary:active {\n  background: var(--ctp-blue);\n  border-color: var(--ctp-blue);\n}\n\n`;
  css += `.btn-destructive {\n  background-color: var(--ctp-surface0);\n  color: var(--ctp-red);\n  border: 1px solid var(--ctp-red);\n}\n\n`;
  css += `.btn-destructive:hover {\n  background: linear-gradient(135deg, var(--ctp-red) 0%, var(--ctp-maroon) 100%);\n  color: var(--ctp-base);\n  transition: all 0.3s ease;\n}\n\n`;
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
