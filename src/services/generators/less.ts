import type { CatppuccinFlavor, CatppuccinColor, ColorMapping, AccentColor } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { computeAccentSetFor } from '../../utils/accent-schemes';

// Contrast calculation functions
function hexToRgb(hex: string): number[] {
  // Remove # if present
  const h = hex.replace(/#/, '');
  // Split the string into 2-digit pairs
  const rgb = h.match(/../g) || [];
  // Convert each pair into a number and divide by 255
  return rgb.map((v) => parseInt(v, 16) / 255);
}

function luminance(rgb: number[]): number {
  // Scale to 0-1
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  // Convert to XYZ using D65 white point
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.3993 + g * 0.3685 + b * 0.1855;
  const z = r * 0.2101 + g * 0.1140 + b * 0.9500;
  // Calculate luminance (perceived brightness)
  return (0.2126 * x + 0.7152 * y + 0.0722 * z) / (1 - 0.05); // Adjusting for relative luminance
}

function contrastRatio(hex1: string, hex2: string): number {
  // Convert hex colors to RGB
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  // Calculate relative luminance for each color
  const lum1 = luminance(rgb1);
  const lum2 = luminance(rgb2);
  // Calculate contrast ratio
  const contrast = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  return contrast;
}

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
  const pre = computeAccentSetFor(palette, defaultAccent);
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
  less += `\n// Accent Color Scheme Variables (Analogous Harmony)\n`;
  less += `// Main-colors: three analogous colors at ±72° for visual hierarchy\n`;
  // Accent family variables
  less += `@accent: @${defaultAccent};\n`;
  less += `@bi-accent1: @${pre.biAccent1};\n`;
  less += `@bi-accent2: @${pre.biAccent2};\n`;
  less += `@bi-accent: @bi-accent1;\n`;
  // Alt accent sets (bi-accents as main-colors with their own bi-accents)
  const bi1Set = computeAccentSetFor(palette, pre.biAccent1);
  const bi2Set = computeAccentSetFor(palette, pre.biAccent2);
  const useAltForSecondary = Math.random() < 0.5 ? 'alt1' : 'alt2';
  less += `@alt1-main: @${pre.biAccent1};\n`;
  less += `@alt1-bi1: @${bi1Set.biAccent1};\n`;
  less += `@alt1-bi2: @${bi1Set.biAccent2};\n`;
  less += `@alt2-main: @${pre.biAccent2};\n`;
  less += `@alt2-bi1: @${bi2Set.biAccent1};\n`;
  less += `@alt2-bi2: @${bi2Set.biAccent2};\n`;
  // Link hover gradient parameters (build-time random)
  less += `@hover-angle: ${hoverAngle}deg;\n`;
  less += `@hover-bi: @${pre.biAccent1};\n`;
  const ALT = (useAltForSecondary === 'alt1')
    ? { main: '@alt1-main', bi1: '@alt1-bi1', bi2: '@alt1-bi2' }
    : { main: '@alt2-main', bi1: '@alt2-bi1', bi2: '@alt2-bi2' };
  less += `@ALT_MAIN: ${ALT.main};\n`;
  less += `@ALT_BI1: ${ALT.bi1};\n`;
  less += `@ALT_BI2: ${ALT.bi2};\n`;
  less += `@ALT_BI: ${ALT.bi1};\n`;

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
  /* Default state: Apply Catppuccin text color */
  color: @ALT_MAIN;
  position: relative;

  &:hover,
  &:focus {
    // Calculate contrast ratio for hover state
    @accentHex: @accent;
    @bgHex: @bi-accent1;
    
    // Check if contrast is below WCAG AA (4.5:1) for normal text
    & when (contrast(@accentHex, @bgHex) < 4.5) {
      // Prefer readable solid text
      color: @text;
    }
    & when not (contrast(@accentHex, @bgHex) < 4.5) {
      // Keep the accent color if contrast is sufficient
      color: @accent;
    }
    
    /* Modern browsers: Gradient text effect with proper support detection */
    @supports (background-clip: text) or (-webkit-background-clip: text) {
      background-image: linear-gradient(@hover-angle, @accent 0%, @hover-bi 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }
  }

  &:active,
  &.active {
    /* Active state: slightly brighter accent */
    color: @accent;
    filter: brightness(1.1);
  }
}

.text-link {
  /* Default state: Apply Catppuccin text color */
  color: @accent;

  &:hover,
  &:focus {
    // Calculate contrast ratio for hover state
    @accentHex: @accent;
    @bgHex: @bi-accent1;
    
    // Check if contrast is below WCAG AA (4.5:1) for normal text
    & when (contrast(@accentHex, @bgHex) < 4.5) {
      // Prefer readable solid text
      color: @text;
    }
    & when not (contrast(@accentHex, @bgHex) < 4.5) {
      // Keep the accent color if contrast is sufficient
      color: @accent;
    }
    
    /* Modern browsers: Gradient text effect with proper support detection */
    @supports (background-clip: text) or (-webkit-background-clip: text) {
      background-image: linear-gradient(@hover-angle, @accent 0%, @hover-bi 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }
  }

  &:active,
  &.active {
    /* Active state: slightly brighter */
    color: @accent;
    // remove brightness filters for predictability
  }
}

/* Button styles - Catppuccin text colors with preserved or mapped backgrounds */
.btn-primary {
  /* Default: Catppuccin text color, preserve/map background */
  color: @accent;

  &:hover {
    /* Apply gradient background on hover ONLY */
    background-image: linear-gradient(135deg,
      @accent 0%,
      @bi-accent1 50%,
      @bi-accent2 100%
    );
    /* Prefer ALT_MAIN; fallback to readable text */
    & when (contrast(@ALT_MAIN, @surface0) < 4.5) {
      color: @text;
    }
    & when not (contrast(@ALT_MAIN, @surface0) < 4.5) {
      color: @ALT_MAIN;
    }
  }

  &:active {
    /* Apply reversed gradient on active */
    background-image: linear-gradient(135deg,
      @bi-accent2 0%,
      @accent 50%,
      @bi-accent1 100%
    );
    & when (contrast(@ALT_MAIN, @surface0) < 4.5) {
      color: @text;
    }
    & when not (contrast(@ALT_MAIN, @surface0) < 4.5) {
      color: @ALT_MAIN;
    }
  }
}

.btn-secondary {
  /* Default: Catppuccin text color */
  color: @ALT_MAIN;

  &:hover {
    background-image: linear-gradient(135deg, @ALT_MAIN 0%, @ALT_BI 100%);
    & when (contrast(@ALT_MAIN, @surface0) < 4.5) {
      color: @text;
    }
    & when not (contrast(@ALT_MAIN, @surface0) < 4.5) {
      color: @ALT_MAIN;
    }
  }
}

.btn-outline {
  /* Default: Catppuccin text color, preserve border */
  color: @ALT_MAIN;

  &:hover {
    /* Keep original background on hover for outline buttons */
  }
}

.btn-subtle {
  /* Default: Catppuccin text color, preserve background */
  color: @accent;

  &:hover {
    /* Treat as text link - apply subtle gradient */
    background-image: linear-gradient(45deg, @accent 0%, @bi-accent1 100%);
    /* CRITICAL: Text must contrast with gradient */
    color: @text;
  }
}

.btn-destructive {
  /* Default: Catppuccin red text color */
  color: @red;

  &:hover {
    /* Apply gradient background on hover ONLY */
    background-image: linear-gradient(135deg,
      @red 0%,
      @maroon 50%,
      @peach 100%
    );
    /* CRITICAL: Text must contrast with gradient */
    color: @text;
  }
}

.btn-success {
  /* Default: Catppuccin green text color */
  color: @green;

  &:hover {
    /* Apply gradient background on hover ONLY */
    background-image: linear-gradient(135deg,
      @green 0%,
      @teal 50%,
      @sky 100%
    );
    /* CRITICAL: Text must contrast with gradient */
    color: @text;
  }
}
*/`;

less += `
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
  caret-color: @alt1-main;

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
  color: @text;
}
::-moz-selection {
  background: fade(@accent, 35%);
  color: @text;
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
    less += '\n// Color Mappings\n// These map the original website colors to Catppuccin colors\n\n';

    // Add mapped colors (legacy map)
    const map = colorMappings as Map<string, CatppuccinColor>;
    for (const [originalColor, catppuccinColor] of map.entries()) {
      const varName = generateVarName(originalColor);
      less += '@' + varName + ': @' + catppuccinColor + '; // Original: ' + originalColor + '\n';
    }

    less += '\n// Example Usage\n/*\nbody {\n  background-color: @base;\n  color: @text;\n}\n*/\n';
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
