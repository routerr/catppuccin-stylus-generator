import type { CatppuccinFlavor, CatppuccinColor, ColorMapping } from '../../types/catppuccin';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';

export function generateCssTheme(
  flavor: CatppuccinFlavor,
  colorMappings: Map<string, CatppuccinColor>,
  url: string,
  mappingsWithReasons?: ColorMapping[]
): string {
  const palette = CATPPUCCIN_PALETTES[flavor];
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
  css += `/*\n/* TEXT & LINK STYLES\n * Text never transparent!\n * Hover: solid background + gradient text (45deg angle)\n */\nbody {\n  background-color: var(--ctp-base);\n  color: var(--ctp-text);\n}\n\n`;
  css += `a, .link {\n  color: var(--ctp-text);\n  text-decoration: underline;\n}\n\n`;
  css += `a:hover, .link:hover {\n  background-color: var(--ctp-base);\n  background-image: linear-gradient(45deg, var(--ctp-blue), var(--ctp-sapphire));\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n  background-clip: text;\n}\n\n`;
  css += `.text-link {\n  color: var(--ctp-text);\n}\n\n`;
  css += `.text-link:hover {\n  background-color: var(--ctp-base);\n  background-image: linear-gradient(225deg, var(--ctp-mauve), var(--ctp-lavender));\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n  background-clip: text;\n}\n\n`;
  css += `/* BUTTON STYLES\n * Hover: gradient background (135deg angle, different from text)\n */\n`;
  css += `.btn-primary {\n  background-color: var(--ctp-blue);\n  color: var(--ctp-base);\n}\n\n`;
  css += `.btn-primary:hover {\n  background-image: linear-gradient(135deg, var(--ctp-blue), var(--ctp-sapphire));\n}\n\n`;
  css += `.btn-secondary {\n  background-color: var(--ctp-mauve);\n  color: var(--ctp-base);\n}\n\n`;
  css += `.btn-secondary:hover {\n  background-image: linear-gradient(135deg, var(--ctp-mauve), var(--ctp-pink));\n}\n\n`;
  css += `.btn-destructive {\n  background-color: var(--ctp-red);\n  color: var(--ctp-base);\n}\n\n`;
  css += `.btn-destructive:hover {\n  background-image: linear-gradient(135deg, var(--ctp-red), var(--ctp-maroon));\n}\n\n`;
  css += `/* Using RGB values for overlays (not for text!) */\n`;
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
