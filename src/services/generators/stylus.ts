import type { CatppuccinFlavor, CatppuccinColor, ColorMapping, AccentColor } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { calculateTriadicAccents, calculateBiAccent, calculateBiAccents } from '../../utils/color-analysis';

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
  mappingsWithReasons?: ColorMapping[],
  defaultAccent: AccentColor = 'mauve'
): string {
  const palette = CATPPUCCIN_PALETTES[flavor];
  const triadicColors = calculateTriadicAccents(defaultAccent, palette);
  const biAccents = calculateBiAccents(defaultAccent, palette);
  const date = new Date().toISOString().split('T')[0];
  // Flavor-based intensity tuning (decimals for Stylus fade())
  const intensity = (() => {
    switch (flavor) {
      case 'latte':
        return { weak: 0.10, mid: 0.14, strong: 0.18, inputHover: 0.22 };
      case 'frappe':
        return { weak: 0.12, mid: 0.16, strong: 0.20, inputHover: 0.26 };
      case 'macchiato':
        return { weak: 0.12, mid: 0.16, strong: 0.20, inputHover: 0.28 };
      case 'mocha':
      default:
        return { weak: 0.12, mid: 0.16, strong: 0.20, inputHover: 0.28 };
    }
  })();

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

  // Add accent color scheme variables
  stylus += `\n// Accent Color Scheme Variables\n`;
  stylus += `// Main accents (used for static colors before interactions)\n`;
  stylus += `$co-accent1 = $${triadicColors.coAccent1}\n`;
  stylus += `$co-accent2 = $${triadicColors.coAccent2}\n`;
  stylus += `// Intensity tuning (decimals)\n`;
  stylus += `$tint_weak = ${intensity.weak}\n`;
  stylus += `$tint_mid = ${intensity.mid}\n`;
  stylus += `$tint_strong = ${intensity.strong}\n`;
  stylus += `$tint_input_hover = ${intensity.inputHover}\n`;
  stylus += `// Bi-accents (two nearest to ${defaultAccent}, used for smooth gradients)\n`;
  stylus += `$bi-accent1 = $${biAccents.biAccent1}\n`;
  stylus += `$bi-accent2 = $${biAccents.biAccent2}\n`;
  stylus += `$bi-accent = $bi-accent1\n`;

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
    stylus += `\n/* =========================\n * LINK & BUTTON STYLES\n * Catppuccin Theme with Bi-Accent Gradients - Smooth & Elegant\n * =========================*/\n`;
    stylus += `a, .link\n  color $${defaultAccent}\n  text-decoration-color $${defaultAccent}\n  text-decoration underline\n  text-decoration-thickness 1.5px\n  text-underline-offset 2px\n  transition color .2s ease, text-decoration-color .2s ease, background .25s ease\n  &:hover, &:focus\n    /* Gradient text effect */\n    background linear-gradient(90deg, fade($${defaultAccent}, $tint_strong), fade($bi-accent1, $tint_strong), fade($bi-accent2, $tint_strong))\n    -webkit-background-clip text\n    -webkit-text-fill-color transparent\n    background-clip text\n    color transparent\n    text-decoration-color $bi-accent1\n    border-radius 6px\n\n`;
    stylus += `.text-link\n  color $${defaultAccent}\n  text-decoration-color $${defaultAccent}\n  text-decoration underline\n  text-decoration-thickness 1.5px\n  text-underline-offset 2px\n  transition color .2s ease, text-decoration-color .2s ease, background .25s ease\n  &:hover, &:focus\n    /* Gradient text effect */\n    background linear-gradient(90deg, fade($${defaultAccent}, $tint_strong), fade($bi-accent1, $tint_strong), fade($bi-accent2, $tint_strong))\n    -webkit-background-clip text\n    -webkit-text-fill-color transparent\n    background-clip text\n    color transparent\n    text-decoration-color $bi-accent1\n    border-radius 6px\n\n`;

    stylus += `.btn-primary\n  background-color $surface_0\n  color $${defaultAccent}\n  border 1px solid $${defaultAccent}\n  &:hover\n    background linear-gradient(135deg, fade($${defaultAccent}, $tint_strong) 0%, fade($bi-accent1, $tint_strong) 50%, fade($bi-accent2, $tint_strong) 100%)\n    color $${defaultAccent}\n    transition background .25s ease, color .2s ease\n  &:active\n    background linear-gradient(135deg, fade($bi-accent2, $tint_strong + .02) 0%, fade($bi-accent1, $tint_strong + .02) 50%, fade($${defaultAccent}, $tint_strong + .02) 100%)\n    border-color $${defaultAccent}\n\n`;
    stylus += `.btn-secondary\n  background-color $surface_0\n  color $${defaultAccent}\n  border 1px solid $${defaultAccent}\n  &:hover\n    background linear-gradient(135deg, fade($${defaultAccent}, $tint_strong) 0%, fade($bi-accent1, $tint_strong) 50%, fade($bi-accent2, $tint_strong) 100%)\n    color $${defaultAccent}\n    transition background .25s ease, color .2s ease\n\n`;
    stylus += `.btn-outline\n  background-color transparent\n  border 1px solid $border-default\n  color $text-primary\n  &:hover\n    background-color $surface_0\n\n`;
    stylus += `.btn-subtle\n  background-color transparent\n  color $text-primary\n  &:hover\n    background-color $surface_0\n\n`;
    stylus += `.btn-destructive\n  background-color $surface_0\n  color $${defaultAccent}\n  border 1px solid $${defaultAccent}\n  &:hover\n    background linear-gradient(135deg, fade($${defaultAccent}, $tint_strong) 0%, fade($bi-accent1, $tint_strong) 50%, fade($bi-accent2, $tint_strong) 100%)\n    color $${defaultAccent}\n    transition background .25s ease, color .2s ease\n\n`;

    // Inputs - transparent backgrounds for text fields
    stylus += `/* INPUTS - Transparent backgrounds + subtle focus */\n`;
    stylus += `input, textarea, select, input[type="text"], input[type="search"], input[type="email"], input[type="password"], input[type="url"], input[type="tel"], input[type="number"]\n  background-color transparent\n  color $text\n  border-color $overlay0\n  caret-color $mauve\n  &::placeholder\n    color $subtext0\n    opacity .75\n  &:hover\n    background-color fade($surface0, $tint_input_hover)\n  &:focus\n    border-color $overlay1\n    outline 2px solid rgba($mauve, .35)\n    outline-offset 2px\n    box-shadow 0 0 0 2px rgba($mauve, .2)\n    background-color transparent\n\n`;

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

  // Ensure inputs are transparent in legacy as well
  stylus += `\n/* INPUTS - Transparent backgrounds + subtle focus */\n`;
  stylus += `input, textarea, select, input[type="text"], input[type="search"], input[type="email"], input[type="password"], input[type="url"], input[type="tel"], input[type="number"]\n  background-color transparent\n  color $text\n  border-color $overlay0\n  caret-color $mauve\n  &::placeholder\n    color $subtext0\n    opacity .75\n  &:hover\n    background-color fade($surface0, $tint_input_hover)\n  &:focus\n    border-color $overlay1\n    outline 2px solid rgba($mauve, .35)\n    outline-offset 2px\n    box-shadow 0 0 0 2px rgba($mauve, .2)\n    background-color transparent\n`;

  // Global polish: selection, scrollbar, focus, components
  stylus += `\n/* Text selection */\n`;
  stylus += `::selection\n  background fade($mauve, .35)\n  color $base\n`;
  stylus += `::-moz-selection\n  background fade($mauve, .35)\n  color $base\n`;

  stylus += `\n/* Scrollbar (WebKit) */\n`;
  stylus += `::-webkit-scrollbar\n  width 10px\n  height 10px\n`;
  stylus += `::-webkit-scrollbar-track\n  background $base\n`;
  stylus += `::-webkit-scrollbar-thumb\n  background fade($overlay2, .35)\n  border-radius 8px\n  border 2px solid $base\n`;
  stylus += `::-webkit-scrollbar-thumb:hover\n  background fade($overlay2, .5)\n`;

  stylus += `\n/* Global focus ring */\n`;
  stylus += `:focus-visible\n  outline 2px solid rgba($mauve, .35)\n  outline-offset 2px\n  box-shadow 0 0 0 2px rgba($mauve, .2)\n`;

  stylus += `\n/* Checkboxes / radios / switches */\n`;
  stylus += `input[type="checkbox"], input[type="radio"]\n  accent-color $mauve\n  background transparent\n  border-color $overlay0\n`;
  stylus += `[role="switch"]\n  accent-color $mauve\n`;

  stylus += `\n/* Disabled states */\n`;
  stylus += `input:disabled, select:disabled, textarea:disabled, button:disabled, [aria-disabled="true"]\n  opacity .6\n  cursor not-allowed\n`;

  stylus += `\n/* Select dropdown options */\n`;
  stylus += `select, option\n  background $base\n  color $text\n`;

  stylus += `\n/* Horizontal rules */\n`;
  stylus += `hr\n  border-color $overlay1\n  opacity .6\n`;

  stylus += `\n/* Tables (base) */\n`;
  stylus += `table\n  background $base\n  border 1px solid $overlay1\n  border-collapse separate\n  border-spacing 0\n  box-shadow 0 2px 8px rgba($overlay2, .15)\n`;
  stylus += `thead\n  background $surface0\n  color $text\n`;
  stylus += `th, td\n  border-bottom 1px solid $overlay1\n  padding .65rem .9rem\n`;
  stylus += `tbody tr:nth-child(even)\n  background fade($surface0, .6)\n`;
  stylus += `tbody tr:hover\n  background fade($mauve, .08)\n`;

  stylus += `\n/* Cards / panels / containers */\n`;
  stylus += `.card, .panel, .box, .container, .paper, .well\n  background fade($surface0, .9)\n  border 1px solid $surface2\n  border-radius 12px\n  box-shadow 0 8px 24px rgba($overlay2, .18)\n  backdrop-filter blur(4px)\n`;

  stylus += `\n/* Tooltips & popovers */\n`;
  stylus += `[role="tooltip"], .tooltip, .popover\n  background $mantle\n  color $text\n  border 1px solid $overlay1\n  box-shadow 0 6px 18px rgba($overlay2, .2)\n`;

  stylus += `\n/* Dropdown menus */\n`;
  stylus += `.menu, .dropdown-menu, [role="menu"]\n  background $base\n  border 1px solid $overlay1\n  box-shadow 0 10px 24px rgba($overlay2, .18)\n`;
  stylus += `.menu-item, [role="menuitem"], .dropdown-item\n  color $text\n`;
  stylus += `.menu-item:hover, [role="menuitem"]:hover, .dropdown-item:hover\n  background fade($mauve, .1)\n  color $text\n`;

  stylus += `\n/* Modals & dialogs */\n`;
  stylus += `.modal, .dialog, [role="dialog"], [aria-modal="true"]\n  background $base\n  color $text\n  border 1px solid $overlay1\n  box-shadow 0 20px 48px rgba($overlay2, .25)\n`;
  stylus += `.modal-backdrop, .overlay, .backdrop\n  background rgba($crust, .7)\n`;

  stylus += `\n/* Alerts / banners */\n`;
  stylus += `.alert, .banner, .notice\n  background fade($surface0, .9)\n  border 1px solid $surface2\n  border-left 4px solid $mauve\n  color $text\n`;
  stylus += `.alert-success\n  border-left-color $green\n`;
  stylus += `.alert-warning\n  border-left-color $yellow\n`;
  stylus += `.alert-danger, .alert-error\n  border-left-color $red\n`;
  stylus += `.alert-info\n  border-left-color $blue\n`;

  stylus += `\n/* Badges / chips */\n`;
  stylus += `.badge, .tag, .chip\n  background fade($mauve, .2)\n  color $mauve\n  border 1px solid rgba($mauve, .35)\n  border-radius 999px\n`;

  // Tables - Dense variant
  stylus += `\n// Tables - Dense variant\n`;
  stylus += `.table--dense, .table.dense, table.table-dense\n  font-size .95em\n`;
  stylus += `.table--dense th, .table--dense td, .table.dense th, .table.dense td, table.table-dense th, table.table-dense td\n  padding .35rem .6rem\n`;

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
