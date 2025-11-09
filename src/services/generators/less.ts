import type { CatppuccinFlavor, CatppuccinColor, ColorMapping, AccentColor } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { PRECOMPUTED_ACCENTS } from '../../utils/accent-schemes';

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
  const pre = PRECOMPUTED_ACCENTS[flavor][defaultAccent];
  const hoverAngle = Math.floor(Math.random() * 180); // 0-179deg
  // Approx 40/20/20 style distribution (summing to 100 across 3 segments)
  const hoverMain = 38 + Math.floor(Math.random() * 8); // 38-45%
  const hoverRemain = 100 - hoverMain; // 55-62%
  // split remainder across two parts, each <=45%
  let hoverB1 = Math.max(18, Math.floor(Math.random() * Math.max(18, hoverRemain - 18)));
  let hoverB2 = hoverRemain - hoverB1;
  if (hoverB1 > 45) { hoverB2 += (hoverB1 - 45); hoverB1 = 45; }
  if (hoverB2 > 45) { hoverB1 += (hoverB2 - 45); hoverB2 = 45; }
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
  less += `@co-accent1: @${pre.coAccent1};\n`;
  less += `@co-accent2: @${pre.coAccent2};\n`;
  less += `// Bi-accent (most similar to ${defaultAccent}, used for smooth gradients)\n`;
  // Accent family variables
  less += `@accent: @${defaultAccent};\n`;
  less += `@bi-accent1: @${pre.biAccent1};\n`;
  less += `@bi-accent2: @${pre.biAccent2};\n`;
  less += `@bi-accent: @bi-accent1;\n`;
  // Alt accent sets (from co-accents, with their own bi-accents)
  const co1Set = PRECOMPUTED_ACCENTS[flavor][pre.coAccent1];
  const co2Set = PRECOMPUTED_ACCENTS[flavor][pre.coAccent2];
  const useAltForSecondary = Math.random() < 0.5 ? 'alt1' : 'alt2';
  less += `@alt1-main: @${pre.coAccent1};\n`;
  less += `@alt1-bi1: @${co1Set.biAccent1};\n`;
  less += `@alt1-bi2: @${co1Set.biAccent2};\n`;
  less += `@alt2-main: @${pre.coAccent2};\n`;
  less += `@alt2-bi1: @${co2Set.biAccent1};\n`;
  less += `@alt2-bi2: @${co2Set.biAccent2};\n`;
  // Link hover gradient parameters (build-time random)
  less += `@hover-angle: ${hoverAngle}deg;\n`;
  less += `@hover-bi: @${Math.random() < 0.5 ? pre.biAccent1 : pre.biAccent2};\n`;
  const ALT = (useAltForSecondary === 'alt1')
    ? { main: '@alt1-main', bi1: '@alt1-bi1', bi2: '@alt1-bi2' }
    : { main: '@alt2-main', bi1: '@alt2-bi1', bi2: '@alt2-bi2' };
  less += `@ALT_MAIN: ${ALT.main};\n`;
  less += `@ALT_BI1: ${ALT.bi1};\n`;
  less += `@ALT_BI2: ${ALT.bi2};\n`;
  less += `@ALT_BI: ${Math.random() < 0.5 ? ALT.bi1 : ALT.bi2};\n`;

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
  color: @accent;
  text-decoration-color: @bi-accent1;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 2px;
  
  position: relative;

  &:hover,
  &:focus {
    /* Fallback: Brightened accent color for guaranteed visibility */
    color: @accent;
    filter: brightness(1.3) saturate(1.1);

    /* Modern browsers: Gradient text effect with proper support detection */
    @supports (background-clip: text) or (-webkit-background-clip: text) {
      filter: none;
      background-image: linear-gradient(@hover-angle, @accent 0%, @hover-bi 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }
  }

  &:active,
  &.active {
    color: @co-accent1;
  }
}

.text-link {
  color: @accent;
  text-decoration-color: @bi-accent1;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 2px;
  
  position: relative;

  &:hover,
  &:focus {
    /* Fallback: Brightened accent color for guaranteed visibility */
    color: @accent;
    filter: brightness(1.3) saturate(1.1);

    /* Modern browsers: Gradient text effect with proper support detection */
    @supports (background-clip: text) or (-webkit-background-clip: text) {
      filter: none;
      background-image: linear-gradient(@hover-angle, @accent 0%, @hover-bi 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }
  }

  &:active,
  &.active {
    color: @co-accent1;
  }
}

.btn-primary {
  background: @surface0;
  color: @accent;

  &:hover {
    /* Solid background with gradient background */
    background: @surface0;
    background-image: linear-gradient(135deg,
      @accent 0%,
      @bi-accent1 50%,
      @bi-accent2 100%
    );
    filter: brightness(1.1);
  }

  &:active {
    /* Solid background with reversed gradient */
    background: @surface0;
    background-image: linear-gradient(135deg,
      @bi-accent2 0%,
      @accent 50%,
      @bi-accent1 100%
    );
  }
}

.btn-secondary {
  background: @surface0;
  color: @accent;

  &:hover {
    background: @surface0;
    background-image: linear-gradient(135deg, @ALT_MAIN 0%, @ALT_BI 100%);
  }
}

.btn-outline {
  background: @surface0;
  color: @text;

  &:hover {
    background: @surface0;
  }
}

.btn-subtle {
  background: @surface0;
  color: @text;

  &:hover {
    background: @surface0;
  }
}

.btn-destructive {
  background: @surface0;
  color: @red;

  &:hover {
    background: @surface0;
    background-image: linear-gradient(135deg,
      @red 0%,
      @maroon 50%,
      @peach 100%
    );

  }
}

.btn-success {
  background: @surface0;
  color: @green;

  &:hover {
    background: @surface0;
    background-image: linear-gradient(135deg,
      @green 0%,
      @teal 50%,
      @sky 100%
    );

  }
}
*/

// INPUTS - Subtle backgrounds for text fields
input,
textarea,
select,
input[type="text"],
input[type="search"],
input[type="email"],
input[type="password"],
input[type="url"],
input[type="tel"],
input[type="number"] {
  background-color: fade(@surface0, 12%) !important;
  color: @text;
  caret-color: @co-accent1;

  &:hover {
    /* Neutralize hover: keep default border/background */
    background-color: fade(@surface0, 12%) !important;
  }

  &::placeholder { color: @subtext0; opacity: .75; }
  &::-webkit-input-placeholder { color: @subtext0; opacity: .75; }
  &::-moz-placeholder { color: @subtext0; opacity: .75; }
  &:-ms-input-placeholder { color: @subtext0; opacity: .75; }

  &:focus {
    /* Co-accent focus background with bi-accent gradient */
    background: linear-gradient(135deg,
      fade(@accent, 8%) 0%,
      fade(@bi-accent1, 12%) 100%
    ) !important;
    caret-color: @bi-accent1;
  }
}

// Text selection
::selection {
  background: fade(@accent, 35%);
  color: @base;
}
::-moz-selection {
  background: fade(@accent, 35%);
  color: @base;
}

// Scrollbar (WebKit)
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: @base; }
::-webkit-scrollbar-thumb {
  background: fade(@overlay2, 35%);
  border-radius: 8px;
}
::-webkit-scrollbar-thumb:hover { background: fade(@overlay2, 50%); }

// Checkboxes / radios / switches
input[type="checkbox"], input[type="radio"] {
  accent-color: @accent;
  background: @surface0;
}
[role="switch"] { accent-color: @accent; }

// Disabled states
input:disabled,
select:disabled,
textarea:disabled,
button:disabled,
[aria-disabled="true"] {
  opacity: .6;
  cursor: not-allowed;
}

// Select dropdown options
select, option { background: @base; color: @text; }

// Horizontal rules
hr { opacity: .6; }

// Tables (base)
table {
  background: @base; // color only
}
thead { background: @surface0; color: @text; }
// Avoid setting th/td padding or borders to preserve layout
tbody tr:nth-child(even) { background: fade(@surface0, 60%); }
tbody tr:hover {
  /* Solid background for table row hover */
  background: fade(@surface0, 80%);

}

// Tables - Dense variant removed to avoid spacing changes

// Cards / panels / containers
.card, .panel, .box, .container, .paper, .well {
  background: fade(@surface0, 90%);
}

// Tooltips & popovers
[role="tooltip"], .tooltip, .popover {
  background: @mantle;
  color: @text;
}

// Dropdown menus
.menu, .dropdown-menu, [role="menu"] {
  background: @base;
}
.menu-item, [role="menuitem"], .dropdown-item {
  color: @text;
  
}
.menu-item:hover, [role="menuitem"]:hover, .dropdown-item:hover {
  /* Solid background with accent text */
  background: @surface0;
  color: @bi-accent1;
}

// Modals & dialogs
.modal, .dialog, [role="dialog"], [aria-modal="true"] {
  background: @base;
  color: @text;
}
.modal-backdrop, .overlay, .backdrop { background: fade(@crust, 70%); }

// Alerts / banners
.alert, .banner, .notice {
  background: fade(@surface0, 90%);
  color: @text;
}

// Badges / chips
.badge, .tag, .chip {
  background: fade(@accent, 20%);
  color: @accent;
}
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
