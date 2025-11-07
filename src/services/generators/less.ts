import type { CatppuccinFlavor, CatppuccinColor, ColorMapping } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';

/**
 * generateLessTheme
 * Accepts legacy input (Map<string, CatppuccinColor> + optional mappingsWithReasons)
 * OR the new MappingOutput from role-mapper.
 *
 * Behavior:
 * - When given MappingOutput, emits two-level variables:
 *   - Level 1: cp_* variables that bind role/derived keys to hex values
 *   - Level 2: role variables (dash-style) that reference cp_* vars
 * - When given legacy inputs, preserves previous behavior for backward compatibility.
 */
export function generateLessTheme(
  flavor: CatppuccinFlavor,
  colorMappings: Map<string, CatppuccinColor> | MappingOutput,
  url: string,
  mappingsWithReasons?: ColorMapping[]
): string {
  const palette = CATPPUCCIN_PALETTINOTE(flaworCheck(flavor)) || CATPPUCCIN_PALETTES[flavor];
  const date = new Date().toISOString().split('T')[0];

  // Header
  let less = `/**
 * Catppuccin ${capitalize(flavor)} Theme
 * Generated from: ${url}
 * Date: ${date}
 * Generator: Catppuccin Theme Generator
 */
 
// Catppuccin ${capitalize(flavor)} Color Palette
`;

  // Emit full palette as hex vars (helpful reference)
  for (const [colorName, colorValue] of Object.entries(palette)) {
    less += `@${colorName}: ${colorValue.hex};\n`;
  }

  // If MappingOutput provided, prefer roleMap/derivedScales path
  if ((colorMappings as MappingOutput)?.roleMap) {
    const mappingOutput = colorMappings as MappingOutput;
    const roleMap: RoleMap = mappingOutput.roleMap || {};
    const derived: DerivedScales = mappingOutput.derivedScales || {};

    less += `\n// ==========================\n// Level 1: Token / Color Bindings\n// ==========================\n`;
    // Level 1: create cp_<sanitized> variables for each unique color in roleMap + derived
    const seen = new Map<string, string>(); // hex -> cpName

    function cpNameForKey(key: string) {
      return `cp_${sanitizeKey(key)}`;
    }

    // RoleMap entries
    for (const [role, colorVal] of Object.entries(roleMap)) {
      if (!colorVal) continue;
      const hex = colorVal.hex;
      if (!seen.has(hex)) {
        const cp = cpNameForKey(role);
        seen.set(hex, cp);
        less += `@${cp}: ${hex}; // from role ${role}\n`;
      }
    }

    // Derived scales
    for (const [derivedKey, colorVal] of Object.entries(derived)) {
      if (!colorVal) continue;
      const hex = colorVal.hex;
      if (!seen.has(hex)) {
        const cp = cpNameForKey(derivedKey);
        seen.set(hex, cp);
        less += `@${cp}: ${hex}; // derived ${derivedKey}\n`;
      }
    }

    // Level 2: role assignments
    less += `\n// ==========================\n// Level 2: Role Assignments\n// ==========================\n`;
    for (const [role, colorVal] of Object.entries(roleMap)) {
      if (!colorVal) continue;
      const hex = colorVal.hex;
      const cp = seen.get(hex) || cpNameForKey(role);
      const roleVar = roleToVar(role);
      less += `@${roleVar}: @${cp};\n`;
    }

    // Derived role variables
    for (const [derivedKey, colorVal] of Object.entries(derived)) {
      if (!colorVal) continue;
      const hex = colorVal.hex;
      const cp = seen.get(hex) || cpNameForKey(derivedKey);
      const roleVar = roleToVar(derivedKey);
      less += `@${roleVar}: @${cp};\n`;
    }

    // Usage examples using role variables (buttons, inputs)
    less += `\n// ==========================\n// Usage examples (roles)\n// ==========================\n`;
    less += `/* TEXT & LINK STYLES
 * Text always solid (never transparent!)
 * Hover: gradient background at 45deg angle + solid text color
 */\na, .link {\n  color: @text-primary;\n  text-decoration: underline;\n  \n  &:hover {\n    background: linear-gradient(45deg, @blue, @sapphire);\n    color: @text;\n  }\n}\n\n.text-link {\n  color: @text-primary;\n  \n  &:hover {\n    background: linear-gradient(225deg, @mauve, @lavender);\n    color: @text;\n  }\n}\n\n/* BUTTON STYLES
 * Text always solid (never transparent!)
 * Hover: gradient background at 135deg angle (different from links)\n */\n.btn-primary {\n  background: @primary-base;\n  color: @primary-text;\n  \n  &:hover {\n    background: linear-gradient(135deg, @blue, @sapphire);\n  }\n}\n\n.btn-secondary {\n  background: @secondary-base;\n  color: @secondary-text;\n  \n  &:hover {\n    background: linear-gradient(135deg, @mauve, @pink);\n  }\n}\n\n.btn-outline {\n  background: transparent;\n  border-color: @border-default;\n  color: @text-primary;\n  \n  &:hover {\n    background: linear-gradient(135deg, @surface_0, @surface_1);\n  }\n}\n\n.btn-subtle {\n  background: transparent;\n  color: @text-primary;\n  \n  &:hover {\n    background-color: @surface_0;\n  }\n}\n\n.btn-destructive {\n  background: @danger-base;\n  color: @danger-text;\n  \n  &:hover {\n    background: linear-gradient(135deg, @red, @maroon);\n  }\n}\n\n.btn-success {\n  background: @success-base;\n  color: @success-text;\n  \n  &:hover {\n    background: linear-gradient(135deg, @green, @teal);\n  }\n}\n*/\n`;

  } else {
    // Legacy behavior (preserve)
    less += `\n// Color Mappings\n// These map the original website colors to Catppuccin colors\n\n`;

    // Add mapped colors (legacy map)
    const map = colorMappings as Map<string, CatppuccinColor>;
    for (const [originalColor, catppuccinColor] of map.entries()) {
      const varName = generateVarName(originalColor);
      less += `@${varName}: @${catppuccinColor}; // Original: ${originalColor}\n`;
    }

    less += `\n// Example Usage\n/*\nbody {\n  background-color: @base;\n  color: @text;\n}\n*/\n`;
  }

  return less;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateVarName(color: string): string {
  // Convert color to variable name
  return color.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

function sanitizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function roleToVar(role: string): string {
  return role.replace(/\./g, '-');
}

function CATPPUCCIN_PALETTINOTE(_: any) {
  // placeholder to satisfy build-time typing in environments that may have different palette shapes
  return CATPPUCCIN_PALETTES;
}

function flaworCheck(_: any) {
  return _;
}
