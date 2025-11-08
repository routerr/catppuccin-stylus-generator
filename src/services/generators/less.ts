import type { CatppuccinFlavor, CatppuccinColor, ColorMapping, AccentColor } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { calculateTriadicAccents, calculateBiAccent } from '../../utils/color-analysis';

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
  mappingsWithReasons?: ColorMapping[],
  defaultAccent: AccentColor = 'mauve'
): string {
  const palette = CATPPUCCIN_PALETTINOTE(flaworCheck(flavor)) || CATPPUCCIN_PALETTES[flavor];
  const triadicColors = calculateTriadicAccents(defaultAccent, palette);
  const biAccent = calculateBiAccent(defaultAccent, palette);
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

  // Add accent color scheme variables
  less += `\n// Accent Color Scheme Variables\n`;
  less += `// Main accents (used for static colors before interactions)\n`;
  less += `@co-accent1: @${triadicColors.coAccent1};\n`;
  less += `@co-accent2: @${triadicColors.coAccent2};\n`;
  less += `// Bi-accent (most similar to ${defaultAccent}, used for smooth gradients)\n`;
  less += `@bi-accent: @${biAccent};\n`;

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
    less += `/* LINK & BUTTON STYLES
 * Catppuccin Theme with Bi-Accent Gradients - Smooth & Elegant
 */
a, .link {
  color: @text-primary;
  text-decoration-color: @text-primary;
  text-decoration: underline;

  &:hover {
    background: linear-gradient(90deg, @blue 0%, @bi-accent 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transition: all 0.3s ease;
  }
}

.text-link {
  color: @mauve;
  text-decoration-color: @mauve;

  &:hover {
    background: linear-gradient(90deg, @mauve 0%, @bi-accent 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transition: all 0.3s ease;
  }
}

.btn-primary {
  background: @surface_0;
  color: @primary-base;
  border: 1px solid @primary-base;

  &:hover {
    background: linear-gradient(135deg, @primary-base 0%, @bi-accent 100%);
    color: @base;
    border-color: @bi-accent;
    transition: all 0.3s ease;
  }

  &:active {
    background: @primary-base;
    border-color: @primary-base;
  }
}

.btn-secondary {
  background: @surface_0;
  color: @secondary-base;
  border: 1px solid @secondary-base;

  &:hover {
    background: linear-gradient(135deg, @secondary-base 0%, @bi-accent 100%);
    color: @base;
    border-color: @bi-accent;
    transition: all 0.3s ease;
  }
}

.btn-outline {
  background: transparent;
  border-color: @border-default;
  color: @text-primary;

  &:hover {
    background: @surface_0;
  }
}

.btn-subtle {
  background: transparent;
  color: @text-primary;

  &:hover {
    background-color: @surface_0;
  }
}

.btn-destructive {
  background: @surface_0;
  color: @danger-base;
  border: 1px solid @danger-base;

  &:hover {
    background: linear-gradient(135deg, @red 0%, @maroon 100%);
    color: @base;
    transition: all 0.3s ease;
  }
}

.btn-success {
  background: @surface_0;
  color: @success-base;
  border: 1px solid @success-base;

  &:hover {
    background: linear-gradient(135deg, @green 0%, @teal 100%);
    color: @base;
    transition: all 0.3s ease;
  }
}
*/
`;

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
