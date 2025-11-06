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
  css += `/*\nbody {\n  background-color: var(--ctp-base);\n  color: var(--ctp-text);\n}\n\n`;
  css += `a {\n  color: var(--ctp-blue);\n}\n\n`;
  css += `a:hover {\n  color: var(--ctp-sky);\n}\n\n`;
  css += `/* Using RGB values for transparency */\n`;
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
