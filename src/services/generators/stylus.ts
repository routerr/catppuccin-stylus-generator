import type { CatppuccinFlavor, CatppuccinColor, ColorMapping, AccentColor } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { PRECOMPUTED_ACCENTS } from '../../utils/accent-schemes';

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
  const pre = PRECOMPUTED_ACCENTS[flavor][defaultAccent];
  const co1Set = PRECOMPUTED_ACCENTS[flavor][pre.coAccent1 as any];
  const co2Set = PRECOMPUTED_ACCENTS[flavor][pre.coAccent2 as any];
  const useAltForSecondary = Math.random() < 0.5 ? 'co1' : 'co2';
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
  stylus += `$co-accent1 = $${pre.coAccent1}\n`;
  stylus += `$co-accent2 = $${pre.coAccent2}\n`;
  stylus += `// Intensity tuning (decimals)\n`;
  stylus += `$tint_weak = ${intensity.weak}\n`;
  stylus += `$tint_mid = ${intensity.mid}\n`;
  stylus += `$tint_strong = ${intensity.strong}\n`;
  stylus += `$tint_input_hover = ${intensity.inputHover}\n`;
  stylus += `// Bi-accents (two nearest to ${defaultAccent}, used for smooth gradients)\n`;
  stylus += `$bi-accent1 = $${pre.biAccent1}\n`;
  stylus += `$bi-accent2 = $${pre.biAccent2}\n`;
  stylus += `$bi-accent = $bi-accent1\n`;

  // Decide hover accents for links at generation time (build-time random)
  // Build-time random angle and percentage stops for gradient text on link hover
  const hoverAngle = Math.floor(Math.random() * 180); // 0-179deg
  // Approx 40/20/20 style distribution
  const hoverMain = 38 + Math.floor(Math.random() * 8); // 38-45%
  const hoverRemain = 100 - hoverMain; // 55-62%
  let hoverB1 = Math.max(18, Math.floor(Math.random() * Math.max(18, hoverRemain - 18)));
  let hoverB2 = hoverRemain - hoverB1;
  if (hoverB1 > 45) { hoverB2 += (hoverB1 - 45); hoverB1 = 45; }
  if (hoverB2 > 45) { hoverB1 += (hoverB2 - 45); hoverB2 = 45; }

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
    stylus += `a, a.link\n  color $${defaultAccent}\n  text-decoration-color $bi-accent1\n  text-decoration underline\n  text-decoration-thickness 1.5px\n  text-underline-offset 2px\n  position relative\n  &:hover, &:focus\n    /* Fallback: Brightened accent color for guaranteed visibility */\n    color $${defaultAccent}\n    filter brightness(1.3) saturate(1.1)\n    /* Modern browsers: Gradient text effect with proper support detection */\n    @supports (background-clip: text) or (-webkit-background-clip: text)\n      filter none\n      background linear-gradient(${hoverAngle}deg, $${defaultAccent} 0%, $bi-accent1 100%)\n      -webkit-background-clip text\n      background-clip text\n      -webkit-text-fill-color transparent\n      color transparent\n  &:active, &.active\n    color $co-accent1\n    text-decoration-color $co-accent2\n\n`;
    stylus += `.text-link\n  color $${defaultAccent}\n  text-decoration-color $bi-accent1\n  text-decoration underline\n  text-decoration-thickness 1.5px\n  text-underline-offset 2px\n  position relative\n  &:hover, &:focus\n    /* Fallback: Simple color change for browsers without gradient text support */\n    color $${hoverBi}\n    /* Modern browsers: Gradient text effect with proper support detection */\n    @supports (background-clip: text) or (-webkit-background-clip: text)\n      background linear-gradient(${hoverAngle}deg, $${defaultAccent} 0%, $${hoverBi} 100%)\n      -webkit-background-clip text\n      background-clip text\n      -webkit-text-fill-color transparent\n      color transparent\n  &:active, &.active\n    color $co-accent1\n    text-decoration-color $co-accent2\n\n`;

    stylus += `.btn-primary\n  background $surface_0\n  color $${defaultAccent}\n  border-color fade($${defaultAccent}, 0.25)\n  &:hover\n    background $surface_0\n    background-image linear-gradient(135deg, $${defaultAccent} 0%, $bi-accent1 50%, $bi-accent2 100%)\n    border-color $bi-accent1\n    box-shadow 0 4px 12px fade($${defaultAccent}, 0.25), 0 0 0 1px fade($bi-accent1, 0.35)\n  &:active\n    background $surface_0\n    background-image linear-gradient(135deg, $bi-accent2 0%, $${defaultAccent} 50%, $bi-accent1 100%)\n    border-color $${defaultAccent}\n  &:focus-visible\n    /* Co-accent focus ring for harmonious accessibility */\n    outline 2px solid $co-accent1\n    outline-offset 2px\n    box-shadow 0 0 0 4px fade($co-accent2, 0.25)\n\n`;
    stylus += `.btn-secondary\n  background $surface_0\n  color ${useAltForSecondary === 'co1' ? `$${pre.coAccent1}` : `$${pre.coAccent2}`}\n  border-color fade(${useAltForSecondary === 'co1' ? `$${pre.coAccent1}` : `$${pre.coAccent2}`}, 0.25)\n  &:hover\n    background $surface_0\n    background-image linear-gradient(135deg, ${useAltForSecondary === 'co1' ? `$${pre.coAccent1}` : `$${pre.coAccent2}`} 0%, ${useAltForSecondary === 'co1' ? `$${pre.coAccent1}` : `$${pre.coAccent2}`} ${hoverMain}%, ${useAltForSecondary === 'co1' ? `$${co1Set.biAccent1}` : `$${co2Set.biAccent1}`} ${hoverMain}%, ${useAltForSecondary === 'co1' ? `$${co1Set.biAccent1}` : `$${co2Set.biAccent1}`} ${hoverMain + hoverB1}%, ${useAltForSecondary === 'co1' ? `$${co1Set.biAccent2}` : `$${co2Set.biAccent2}`} ${hoverMain + hoverB1}%, ${useAltForSecondary === 'co1' ? `$${co1Set.biAccent2}` : `$${co2Set.biAccent2}`} 100%)\n    border-color ${useAltForSecondary === 'co1' ? `$${co1Set.biAccent1}` : `$${co2Set.biAccent1}`}\n\n`;
    stylus += `.btn-outline\n  background $surface_0\n  border 1px solid $overlay0\n  color $text\n  &:hover\n    background $surface_0\n\n`;
    stylus += `.btn-subtle\n  background $surface_0\n  color $text\n  &:hover\n    background $surface_0\n\n`;
    stylus += `.btn-destructive\n  background $surface_0\n  color $red\n  border-color fade($red, 0.25)\n  &:hover\n    background $surface_0\n    background-image linear-gradient(135deg, $red 0%, $maroon 50%, $peach 100%)\n\n`;

    // Inputs - subtle surface backgrounds for text fields
    stylus += `/* INPUTS - Subtle backgrounds + focus */\n`;
    stylus += `input, textarea, select, input[type="text"], input[type="search"], input[type="email"], input[type="password"], input[type="url"], input[type="tel"], input[type="number"]\n  background-color fade($surface0, $tint_weak)\n  color $text\n  border-color $overlay0\n  caret-color $mauve\n  &::placeholder\n    color $subtext0\n    opacity .75\n  &:hover\n    border-color $overlay0\n    box-shadow none\n    background-color fade($surface0, $tint_weak)\n  &:focus\n    border-color $overlay1\n    outline 2px solid rgba($mauve, .35)\n    outline-offset 2px\n    box-shadow 0 0 0 2px rgba($mauve, .2)\n    background-color fade($surface0, $tint_input_hover)\n\n`;

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

  // Ensure inputs use subtle surface backgrounds in legacy as well
  stylus += `\n/* INPUTS - Subtle backgrounds + focus */\n`;
  stylus += `input, textarea, select, input[type="text"], input[type="search"], input[type="email"], input[type="password"], input[type="url"], input[type="tel"], input[type="number"]\n  background-color fade($surface0, $tint_weak)\n  color $text\n  border-color $overlay0\n  caret-color $mauve\n  &::placeholder\n    color $subtext0\n    opacity .75\n  &:hover\n    border-color $overlay0\n    box-shadow none\n    background-color fade($surface0, $tint_weak)\n  &:focus\n    border-color $overlay1\n    outline 2px solid rgba($mauve, .35)\n    outline-offset 2px\n    box-shadow 0 0 0 2px rgba($mauve, .2)\n    background-color fade($surface0, $tint_input_hover)\n`;

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
  stylus += `input[type="checkbox"], input[type="radio"]\n  accent-color $mauve\n  background $surface_0\n  border-color $overlay0\n`;
  stylus += `[role="switch"]\n  accent-color $mauve\n`;

  stylus += `\n/* Disabled states */\n`;
  stylus += `input:disabled, select:disabled, textarea:disabled, button:disabled, [aria-disabled="true"]\n  opacity .6\n  cursor not-allowed\n`;

  stylus += `\n/* Select dropdown options */\n`;
  stylus += `select, option\n  background $base\n  color $text\n`;

  stylus += `\n/* Horizontal rules */\n`;
  stylus += `hr\n  border-color $overlay1\n  opacity .6\n`;

  stylus += `\n/* Tables (base) - color only, no layout changes */\n`;
  stylus += `table\n  background $base\n`;
  stylus += `thead\n  background $surface0\n  color $text\n`;
  // Do not set padding, border width, spacing, or collapse to avoid affecting layout
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

  // Tables - Dense variant removed to prevent spacing changes

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
