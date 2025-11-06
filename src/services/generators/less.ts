import type { CatppuccinFlavor, CatppuccinColor } from '../../types/catppuccin';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';

export function generateLessTheme(
  flavor: CatppuccinFlavor,
  colorMappings: Map<string, CatppuccinColor>,
  url: string
): string {
  const palette = CATPPUCCIN_PALETTES[flavor];
  const date = new Date().toISOString().split('T')[0];

  let less = `/**
 * Catppuccin ${capitalize(flavor)} Theme
 * Generated from: ${url}
 * Date: ${date}
 * Generator: Catppuccin Theme Generator
 */

// Catppuccin ${capitalize(flavor)} Color Palette
`;

  // Add all color variables
  for (const [colorName, colorValue] of Object.entries(palette)) {
    less += `@${colorName}: ${colorValue.hex};\n`;
  }

  less += `\n// Color Mappings\n`;
  less += `// These map the original website colors to Catppuccin colors\n\n`;

  // Add mapped colors
  for (const [originalColor, catppuccinColor] of colorMappings.entries()) {
    const varName = generateVarName(originalColor);
    less += `@${varName}: @${catppuccinColor}; // Original: ${originalColor}\n`;
  }

  less += `\n// Example Usage\n`;
  less += `/*\nbody {\n  background-color: @base;\n  color: @text;\n}\n\n`;
  less += `a {\n  color: @blue;\n  &:hover {\n    color: @sky;\n  }\n}\n*/\n`;

  return less;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateVarName(color: string): string {
  // Convert color to variable name
  return color.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}
