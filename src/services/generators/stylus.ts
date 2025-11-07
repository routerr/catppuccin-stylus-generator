import type { CatppuccinFlavor, CatppuccinColor, ColorMapping } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';

/**
 * generateStylusTheme
 * Supports legacy input (Map + optional mappingsWithReasons) OR MappingOutput.
 * Emits two-level variables when MappingOutput is provided:
 * - Level 1: $cp_* color bindings
 * - Level 2: $role-name variables referencing level 1
 */
export function generateStylusTheme(
  flavor: CatppuccinFlavor,
  colorMappings: Map<string, CatppuccinColor> | MappingOutput,
  url: string,
  mappingsWithReasons?: ColorMapping[]
): string {
  const palette = CATPPUCCIN_PALETTES[flavor];
  const date = new Date().toISOString().split('T')[0];

  let stylus = `/**
 * ============================================
 * Catppuccin ${capitalize(flavor)} Theme
 * ============================================
 *
 * Generated from: ${url}
 * Date: ${date}
 * Generator: Catppuccin Theme Generator
 *
 * This theme uses the Catppuccin ${capitalize(flavor)} color palette
 * to create a beautiful, consistent look for your website.
 */
 
/* ============================================
 * BASE COLOR PALETTE
 * ============================================
 * These are all the Catppuccin ${capitalize(flavor)} colors
 */

`;

  // Add base palette variables for reference
  const baseColors = ['base', 'mantle', 'crust'];
  const surfaceColors = ['surface0', 'surface1', 'surface2'];
  const overlayColors = ['overlay0', 'overlay1', 'overlay2'];
  const textColors = ['subtext0', 'subtext1', 'text'];
  const accentColors = ['rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon',
                        'peach', 'yellow', 'green', 'teal', 'sky', 'sapphire',
                        'blue', 'lavender'];

  stylus += `// Palette reference\n`;
  [...baseColors, ...surfaceColors, ...overlayColors, ...textColors, ...accentColors].forEach(colorName => {
    const c = palette[colorName as CatppuccinColor];
    if (c) stylus += `$${colorName} = ${c.hex}\n`;
  });

  // If MappingOutput, emit two-level system
  if ((colorMappings as MappingOutput)?.roleMap) {
    const mappingOutput = colorMappings as MappingOutput;
    const roleMap: RoleMap = mappingOutput.roleMap || {};
    const derived: DerivedScales = mappingOutput.derivedScales || {};

    stylus += `\n// ==========================\n// Level 1: cp_* color bindings\n// ==========================\n`;
    const seen = new Map<string, string>(); // hex -> cpName

    function cpNameForKey(key: string) {
      return `cp_${sanitizeKey(key)}`;
    }

    for (const [role, cv] of Object.entries(roleMap)) {
      if (!cv) continue;
      const hex = cv.hex;
      if (!seen.has(hex)) {
        const cp = cpNameForKey(role);
        seen.set(hex, cp);
        stylus += `$${cp} = ${hex} // from role ${role}\n`;
      }
    }

    for (const [dkey, cv] of Object.entries(derived)) {
      if (!cv) continue;
      const hex = cv.hex;
      if (!seen.has(hex)) {
        const cp = cpNameForKey(dkey);
        seen.set(hex, cp);
        stylus += `$${cp} = ${hex} // derived ${dkey}\n`;
      }
    }

    stylus += `\n// ==========================\n// Level 2: role variables\n// ==========================\n`;
    for (const [role, cv] of Object.entries(roleMap)) {
      if (!cv) continue;
      const cp = seen.get(cv.hex) || cpNameForKey(role);
      const roleVar = roleToVar(role);
      stylus += `$${roleVar} = $${cp}\n`;
    }
    for (const [dkey, cv] of Object.entries(derived)) {
      if (!cv) continue;
      const cp = seen.get(cv.hex) || cpNameForKey(dkey);
      const roleVar = roleToVar(dkey);
      stylus += `$${roleVar} = $${cp}\n`;
    }

    // Usage examples prefer role variables
    stylus += `\n/* =========================\n * TEXT & LINK STYLES\n * Text always solid (never transparent!)\n * Hover: gradient background at 45deg angle + solid text color\n * =========================*/\n`;
    stylus += `a, .link\n  color $text-primary\n  text-decoration underline\n  &:hover\n    background linear-gradient(45deg, $blue, $sapphire)\n    color $text\n\n`;
    stylus += `.text-link\n  color $text-primary\n  &:hover\n    background linear-gradient(225deg, $mauve, $lavender)\n    color $text\n\n`;

    stylus += `/* =========================\n * BUTTON STYLES\n * Text always solid (never transparent!)\n * Hover: gradient background at 135deg angle (different from links)\n * =========================*/\n`;
    stylus += `.btn-primary\n  background-color $primary-base\n  color $primary-text\n  &:hover\n    background-image linear-gradient(135deg, $blue, $sapphire)\n\n`;
    stylus += `.btn-secondary\n  background-color $secondary-base\n  color $secondary-text\n  &:hover\n    background-image linear-gradient(135deg, $mauve, $pink)\n\n`;
    stylus += `.btn-outline\n  background-color transparent\n  border 1px solid $border-default\n  color $text-primary\n  &:hover\n    background-image linear-gradient(135deg, $surface_0, $surface_1)\n\n`;
    stylus += `.btn-subtle\n  background-color transparent\n  color $text-primary\n  &:hover\n    background-color $surface_0\n\n`;
    stylus += `.btn-destructive\n  background-color $danger-base\n  color $danger-text\n  &:hover\n    background-image linear-gradient(135deg, $red, $maroon)\n\n`;

  } else {
    // Legacy: fallback to mapping map / reasons
    if (mappingsWithReasons && mappingsWithReasons.length > 0) {
      const grouped = groupMappingsByPurpose(mappingsWithReasons);
      for (const [category, mappings] of Object.entries(grouped)) {
        stylus += `// ${category}\n`;
        mappings.forEach(mapping => {
          const varName = generateVarName(mapping.originalColor);
          stylus += `$${varName} = $${mapping.catppuccinColor} // ${mapping.reason}\n`;
        });
        stylus += `\n`;
      }
    } else {
      const map = colorMappings as Map<string, CatppuccinColor>;
      for (const [originalColor, catppuccinColor] of map.entries()) {
        const varName = generateVarName(originalColor);
        stylus += `$${varName} = $${catppuccinColor} // Original: ${originalColor}\n`;
      }
    }
  }

  return stylus;
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

function groupMappingsByPurpose(mappings: ColorMapping[]): Record<string, ColorMapping[]> {
  const groups: Record<string, ColorMapping[]> = {
    'Backgrounds': [],
    'Text': [],
    'Buttons': [],
    'Interactive Elements': [],
    'Borders & Dividers': [],
    'Cards & Surfaces': [],
    'Status Indicators': [],
    'Other': []
  };

  mappings.forEach(mapping => {
    const reason = mapping.reason.toLowerCase();

    if (reason.includes('background') || reason.includes('page bg')) {
      groups['Backgrounds'].push(mapping);
    } else if (reason.includes('text') || reason.includes('heading') || reason.includes('body')) {
      groups['Text'].push(mapping);
    } else if (reason.includes('button')) {
      groups['Buttons'].push(mapping);
    } else if (reason.includes('link') || reason.includes('hover') || reason.includes('active') || reason.includes('focus')) {
      groups['Interactive Elements'].push(mapping);
    } else if (reason.includes('border') || reason.includes('divider')) {
      groups['Borders & Dividers'].push(mapping);
    } else if (reason.includes('card') || reason.includes('panel') || reason.includes('surface')) {
      groups['Cards & Surfaces'].push(mapping);
    } else if (reason.includes('success') || reason.includes('error') || reason.includes('warning') || reason.includes('danger') || reason.includes('info')) {
      groups['Status Indicators'].push(mapping);
    } else {
      groups['Other'].push(mapping);
    }
  });

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, mappings]) => mappings.length > 0)
  );
}
