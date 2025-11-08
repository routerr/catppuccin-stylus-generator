import type { CatppuccinFlavor, CatppuccinColor, ColorMapping, AccentColor } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { calculateTriadicAccents, calculateBiAccent, calculateBiAccents } from '../../utils/color-analysis';

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
  const biAccents = calculateBiAccents(defaultAccent, palette);
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
  // Accent family variables
  less += `@accent: @${defaultAccent};\n`;
  less += `@bi-accent1: @${biAccents.biAccent1};\n`;
  less += `@bi-accent2: @${biAccents.biAccent2};\n`;
  less += `@bi-accent: @bi-accent1;\n`;

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
  text-decoration-color: @accent;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 2px;
  transition: color 0.2s ease, text-decoration-color 0.2s ease, background 0.25s ease;

  &:hover,
  &:focus {
    /* Gradient text effect */
    background: linear-gradient(90deg,
      fade(@accent, @tint-strong),
      fade(@bi-accent1, @tint-strong),
      fade(@bi-accent2, @tint-strong)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
    text-decoration-color: @bi-accent1;
    border-radius: 6px;
  }
}

.text-link {
  color: @accent;
  text-decoration-color: @accent;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 2px;
  transition: color 0.2s ease, text-decoration-color 0.2s ease, background 0.25s ease;

  &:hover,
  &:focus {
    /* Gradient text effect */
    background: linear-gradient(90deg,
      fade(@accent, @tint-strong),
      fade(@bi-accent1, @tint-strong),
      fade(@bi-accent2, @tint-strong)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
    text-decoration-color: @bi-accent1;
    border-radius: 6px;
  }
}

.btn-primary {
  background: @surface_0;
  color: @primary-base;
  // Keep original borders; avoid accent border override

  &:hover {
    background: linear-gradient(135deg,
      fade(@accent, @tint-strong) 0%,
      fade(@bi-accent1, @tint-strong) 50%,
      fade(@bi-accent2, @tint-strong) 100%
    );
    color: @accent;
    transition: background 0.25s ease, color 0.2s ease;
  }

  &:active {
    background: fade(@primary-base, 26%);
  }
}

.btn-secondary {
  background: @surface_0;
  color: @secondary-base;
  // Keep original borders

  &:hover {
    background: linear-gradient(135deg,
      fade(@accent, @tint-strong) 0%,
      fade(@bi-accent1, @tint-strong) 50%,
      fade(@bi-accent2, @tint-strong) 100%
    );
    color: @accent;
    transition: background 0.25s ease, color 0.2s ease;
  }
}

.btn-outline {
  background: transparent;
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
  // Keep original borders

  &:hover {
    background: linear-gradient(135deg,
      fade(@accent, @tint-strong) 0%,
      fade(@bi-accent1, @tint-strong) 50%,
      fade(@bi-accent2, @tint-strong) 100%
    );
    color: @accent;
    transition: background 0.25s ease, color 0.2s ease;
  }
}

.btn-success {
  background: @surface_0;
  color: @success-base;
  // Keep original borders

  &:hover {
    background: linear-gradient(135deg,
      fade(@accent, @tint-strong) 0%,
      fade(@bi-accent1, @tint-strong) 50%,
      fade(@bi-accent2, @tint-strong) 100%
    );
    color: @accent;
    transition: background 0.25s ease, color 0.2s ease;
  }
}
*/

// INPUTS - Transparent backgrounds for text fields
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
  background-color: transparent !important;
  color: @text;
  border-color: @overlay0;
  caret-color: @co-accent1;
  
  &:hover {
    background-color: fade(@surface0, 28%);
  }

  &::placeholder { color: @subtext0; opacity: .75; }
  &::-webkit-input-placeholder { color: @subtext0; opacity: .75; }
  &::-moz-placeholder { color: @subtext0; opacity: .75; }
  &:-ms-input-placeholder { color: @subtext0; opacity: .75; }

  &:focus {
    border-color: @overlay1;
    outline: 2px solid fade(@co-accent1, 35%);
    outline-offset: 2px;
    box-shadow: 0 0 0 2px fade(@co-accent1, 20%);
    background-color: transparent;
  }
}

// Text selection
::selection {
  background: fade(@co-accent1, 35%);
  color: @base;
}
::-moz-selection {
  background: fade(@co-accent1, 35%);
  color: @base;
}

// Scrollbar (WebKit)
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: @base; }
::-webkit-scrollbar-thumb {
  background: fade(@overlay2, 35%);
  border-radius: 8px;
  border: 2px solid @base;
}
::-webkit-scrollbar-thumb:hover { background: fade(@overlay2, 50%); }

// Global focus ring
:focus-visible {
  outline: 2px solid fade(@co-accent1, 35%);
  outline-offset: 2px;
  box-shadow: 0 0 0 2px fade(@co-accent1, 20%);
}

// Checkboxes / radios / switches
input[type="checkbox"], input[type="radio"] {
  accent-color: @co-accent1;
  background: transparent;
  border-color: @overlay0;
}
[role="switch"] { accent-color: @co-accent1; }

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
hr { border-color: @overlay1; opacity: .6; }

// Tables (base)
table {
  background: @base;
  border: 1px solid @overlay1;
  border-collapse: separate;
  border-spacing: 0;
  box-shadow: 0 2px 8px fade(@overlay2, 15%);
}
thead { background: @surface0; color: @text; }
th, td { border-bottom: 1px solid @overlay1; padding: .65rem .9rem; }
tbody tr:nth-child(even) { background: fade(@surface0, 60%); }
tbody tr:hover { background: fade(@co-accent1, 8%); }

// Tables - Dense variant
.table--dense,
.table.dense,
table.table-dense {
  font-size: 0.95em;
}
.table--dense th, .table--dense td,
.table.dense th, .table.dense td,
table.table-dense th, table.table-dense td {
  padding: 0.35rem 0.6rem;
}

// Cards / panels / containers
.card, .panel, .box, .container, .paper, .well {
  background: fade(@surface0, 90%);
  border: 1px solid @surface2;
  border-radius: 12px;
  box-shadow: 0 8px 24px fade(@overlay2, 18%);
  backdrop-filter: blur(4px);
}

// Tooltips & popovers
[role="tooltip"], .tooltip, .popover {
  background: @mantle;
  color: @text;
  border: 1px solid @overlay1;
  box-shadow: 0 6px 18px fade(@overlay2, 20%);
}

// Dropdown menus
.menu, .dropdown-menu, [role="menu"] {
  background: @base;
  border: 1px solid @overlay1;
  box-shadow: 0 10px 24px fade(@overlay2, 18%);
}
.menu-item, [role="menuitem"], .dropdown-item { color: @text; }
.menu-item:hover, [role="menuitem"]:hover, .dropdown-item:hover {
  background: fade(@co-accent1, 10%);
  color: @text;
}

// Modals & dialogs
.modal, .dialog, [role="dialog"], [aria-modal="true"] {
  background: @base;
  color: @text;
  border: 1px solid @overlay1;
  box-shadow: 0 20px 48px fade(@overlay2, 25%);
}
.modal-backdrop, .overlay, .backdrop { background: fade(@crust, 70%); }

// Alerts / banners
.alert, .banner, .notice {
  background: fade(@surface0, 90%);
  border: 1px solid @surface2;
  border-left: 4px solid @co-accent1;
  color: @text;
}
.alert-success { border-left-color: @green; }
.alert-warning { border-left-color: @yellow; }
.alert-danger, .alert-error { border-left-color: @red; }
.alert-info { border-left-color: @blue; }

// Badges / chips
.badge, .tag, .chip {
  background: fade(@co-accent1, 20%);
  color: @co-accent1;
  border: 1px solid fade(@co-accent1, 35%);
  border-radius: 999px;
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
