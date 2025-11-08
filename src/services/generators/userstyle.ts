import type { ColorMapping, AccentColor, CatppuccinFlavor } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { calculateTriadicAccents, calculateBiAccent, calculateBiAccents } from '../../utils/color-analysis';

export interface UserStyleMetadata {
  name: string;
  namespace: string;
  homepageURL: string;
  version: string;
  description: string;
  domain: string;
}

export interface CSSAnalysisData {
  grouped?: {
    buttons: Array<{ className: string; properties: any[] }>;
    links: Array<{ className: string; properties: any[] }>;
    backgrounds: Array<{ className: string; properties: any[] }>;
    text: Array<{ className: string; properties: any[] }>;
    borders: Array<{ className: string; properties: any[] }>;
  };
}

/**
 * generateUserStyle
 * Accepts legacy mappings: ColorMapping[]
 * OR MappingOutput (roleMap + derivedScales).
 * When MappingOutput is provided, emits two-level CSS custom properties:
 *  - --cp-<sanitized> : hex  (Level 1)
 *  - --<role-name> : var(--cp-...) (Level 2)
 */
export function generateUserStyle(
  mappings: ColorMapping[] | MappingOutput,
  websiteUrl: string,
  metadata?: Partial<UserStyleMetadata>,
  cssAnalysis?: CSSAnalysisData,
  flavor: CatppuccinFlavor = 'mocha',
  defaultAccent: AccentColor = 'mauve'
): string {
  // Extract domain from URL
  let domain = '';
  try {
    const url = new URL(websiteUrl);
    domain = url.hostname.replace('www.', '');
  } catch {
    domain = 'example.com';
  }

  // Generate safe name from domain
  const siteName = domain.split('.')[0];
  const safeName = siteName.charAt(0).toUpperCase() + siteName.slice(1);

  // Default metadata
  const meta: UserStyleMetadata = {
    name: metadata?.name || `${safeName} Catppuccin`,
    namespace: metadata?.namespace || `github.com/catppuccin/userstyles/styles/${siteName}`,
    homepageURL: metadata?.homepageURL || `https://github.com/catppuccin/userstyles/tree/main/styles/${siteName}`,
    version: metadata?.version || new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    description: metadata?.description || `Soothing pastel theme for ${safeName}`,
    domain: domain,
  };

  // Calculate accent colors for harmonious color scheme
  const palette = CATPPUCCIN_PALETTES[flavor];
  const triadicColors = calculateTriadicAccents(defaultAccent, palette);
  const biAccents = calculateBiAccents(defaultAccent, palette);

  // Flavor-based intensity tuning for subtle gradients and tints
  const intensity = (() => {
    // percentages for LESS fade(); decimals for Stylus handled elsewhere
    switch (flavor) {
      case 'latte':
        return { weak: 10, mid: 14, strong: 18, inputHover: 22 };
      case 'frappe':
        return { weak: 12, mid: 16, strong: 20, inputHover: 26 };
      case 'macchiato':
        return { weak: 12, mid: 16, strong: 20, inputHover: 28 };
      case 'mocha':
      default:
        return { weak: 12, mid: 16, strong: 20, inputHover: 28 };
    }
  })();

  // Build CSS variable block depending on input shape
  let cssVarMappings = '';
  if ((mappings as MappingOutput).roleMap) {
    const mappingOutput = mappings as MappingOutput;
    cssVarMappings = generateCSSFromMappingOutput(mappingOutput);
  } else {
    const legacy = mappings as ColorMapping[];
    cssVarMappings = generateCSSVariableMappings(legacy);
  }

  return `/* ==UserStyle==
@name ${meta.name}
@namespace ${meta.namespace}
@homepageURL ${meta.homepageURL}
@version ${meta.version}
@updateURL ${meta.homepageURL}/catppuccin.user.less
@supportURL https://github.com/catppuccin/userstyles/issues
@description ${meta.description}
@author Catppuccin
@license MIT

@preprocessor less
@var select lightFlavor "Light Flavor" ["latte:Latte*", "frappe:Frappé", "macchiato:Macchiato", "mocha:Mocha"]
@var select darkFlavor "Dark Flavor" ["latte:Latte", "frappe:Frappé", "macchiato:Macchiato", "mocha:Mocha*"]
@var select accentColor "Accent" ["rosewater:Rosewater", "flamingo:Flamingo", "pink:Pink", "mauve:Mauve*", "red:Red", "maroon:Maroon", "peach:Peach", "yellow:Yellow", "green:Green", "teal:Teal", "blue:Blue", "sapphire:Sapphire", "sky:Sky", "lavender:Lavender", "subtext0:Gray"]
==/UserStyle== */

@import "https://userstyles.catppuccin.com/lib/lib.less";

@-moz-document domain("${meta.domain}") {
  /* Apply dark flavor for dark mode */
  :root[data-mode="dark"],
  :root[data-theme="dark"],
  html[data-theme="dark"],
  body[data-theme="dark"] {
    #catppuccin(@darkFlavor);
  }

  /* Apply light flavor for light mode */
  :root[data-mode="light"],
  :root[data-theme="light"],
  html[data-theme="light"],
  body[data-theme="light"],
  :root {
    #catppuccin(@lightFlavor);
  }

  #catppuccin(@flavor) {
    #lib.palette();
    #lib.defaults();

${cssVarMappings}

    /* Accent Color Scheme Variables */
    /* Co-accents (triadic companions to the selected accent) */
    @co-accent1: @${triadicColors.coAccent1};
    @co-accent2: @${triadicColors.coAccent2};

    /* Bi-accents (two closest accents to the selected accent) */
    @bi-accent1: @${biAccents.biAccent1};
    @bi-accent2: @${biAccents.biAccent2};
    /* Back-compat alias */
    @bi-accent: @bi-accent1;  /* Similar to @accent for gradients */

    /* Intensity tuning (flavor-aware) */
    @tint-weak: ${intensity.weak}%;
    @tint-mid: ${intensity.mid}%;
    @tint-strong: ${intensity.strong}%;
    @tint-input-hover: ${intensity.inputHover}%;

    /* Derived at runtime based on the user's accent choice in UserStyle UI */
    /* The following mixin overrides the above when @accentColor changes */
    #derive-accents() when (@accentColor = "rosewater") { @accent: @rosewater; @bi-accent1: @flamingo; @bi-accent2: @pink; @co-accent1: @green; @co-accent2: @sapphire; }
    #derive-accents() when (@accentColor = "flamingo") { @accent: @flamingo; @bi-accent1: @rosewater; @bi-accent2: @pink; @co-accent1: @teal; @co-accent2: @blue; }
    #derive-accents() when (@accentColor = "pink") { @accent: @pink; @bi-accent1: @flamingo; @bi-accent2: @mauve; @co-accent1: @sky; @co-accent2: @green; }
    #derive-accents() when (@accentColor = "mauve") { @accent: @mauve; @bi-accent1: @pink; @bi-accent2: @lavender; @co-accent1: @yellow; @co-accent2: @sapphire; }
    #derive-accents() when (@accentColor = "red") { @accent: @red; @bi-accent1: @maroon; @bi-accent2: @peach; @co-accent1: @teal; @co-accent2: @blue; }
    #derive-accents() when (@accentColor = "maroon") { @accent: @maroon; @bi-accent1: @red; @bi-accent2: @peach; @co-accent1: @sky; @co-accent2: @green; }
    #derive-accents() when (@accentColor = "peach") { @accent: @peach; @bi-accent1: @maroon; @bi-accent2: @yellow; @co-accent1: @sapphire; @co-accent2: @blue; }
    #derive-accents() when (@accentColor = "yellow") { @accent: @yellow; @bi-accent1: @peach; @bi-accent2: @green; @co-accent1: @mauve; @co-accent2: @sapphire; }
    #derive-accents() when (@accentColor = "green") { @accent: @green; @bi-accent1: @yellow; @bi-accent2: @teal; @co-accent1: @pink; @co-accent2: @mauve; }
    #derive-accents() when (@accentColor = "teal") { @accent: @teal; @bi-accent1: @green; @bi-accent2: @sky; @co-accent1: @flamingo; @co-accent2: @mauve; }
    #derive-accents() when (@accentColor = "sky") { @accent: @sky; @bi-accent1: @teal; @bi-accent2: @sapphire; @co-accent1: @pink; @co-accent2: @peach; }
    #derive-accents() when (@accentColor = "sapphire") { @accent: @sapphire; @bi-accent1: @sky; @bi-accent2: @blue; @co-accent1: @mauve; @co-accent2: @peach; }
    #derive-accents() when (@accentColor = "blue") { @accent: @blue; @bi-accent1: @sapphire; @bi-accent2: @lavender; @co-accent1: @peach; @co-accent2: @maroon; }
    #derive-accents() when (@accentColor = "lavender") { @accent: @lavender; @bi-accent1: @blue; @bi-accent2: @mauve; @co-accent1: @peach; @co-accent2: @green; }
    #derive-accents();
    /* Deprecated alias below was removed to avoid undefined references */

    /* Custom styling rules */
    /* Add website-specific color overrides here */

    /* Background colors */
    body {
      background: @base;
      color: @text;
    }

    /* Links - text-only gradients using accent + bi/co-accents (no bg fill) */
    a,
    .link {
      color: @accent;
      /* Let co-accent guide the underline for harmony */
      text-decoration-color: @co-accent1;
      text-decoration-thickness: 1.5px;
      text-underline-offset: 2px;
      transition: color 0.2s ease, text-decoration-color 0.2s ease, background 0.25s ease;

      &:hover,
      &:focus-visible {
        /* Text-only gradient: accent → bi-accent → co-accent for a balanced hue flow */
        background: linear-gradient(90deg,
          fade(@accent, @tint-strong) 0%,
          fade(@bi-accent1, @tint-mid) 50%,
          fade(@co-accent1, @tint-mid) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        color: transparent;
        /* Underline shifts toward co-accent for extra harmony */
        text-decoration-color: @co-accent1;
        border-radius: 6px;
      }

      &:active,
      &.active,
      &[aria-current="page"] {
        background: linear-gradient(90deg,
          fade(@accent, @tint-strong) 0%,
          fade(@bi-accent1, @tint-strong) 45%,
          fade(@co-accent2, @tint-mid) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        color: transparent;
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
        text-decoration-color: @co-accent2;
      }

      &:visited {
        /* Slightly different underline to hint visited state without loud color changes */
        text-decoration-color: fade(@co-accent2, @tint-mid);
      }
    }

    /* Buttons - soft gradients using accent + bi-accents for harmony */
    button,
    input[type="button"],
    input[type="submit"] {
      background: @surface0;
      color: @accent;
      /* Keep original border styling from the site; avoid adding accent border */

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
        background: linear-gradient(135deg,
          fade(@bi-accent2, (@tint-strong + 2%)) 0%,
          fade(@bi-accent1, (@tint-strong + 2%)) 50%,
          fade(@accent, (@tint-strong + 2%)) 100%
        );
      }
    }

    /* Class-specific styling (from CSS analysis) */
    /* These rules will be added if directory analysis is used */
${generateClassSpecificRules(cssAnalysis)}

    /* Input fields */
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
      /* Keep site border styling; set a gentle default if none exists */
      border-color: @overlay0;
      caret-color: @accent;

      &::placeholder { color: @subtext0; opacity: .75; }
      &::-webkit-input-placeholder { color: @subtext0; opacity: .75; }
      &::-moz-placeholder { color: @subtext0; opacity: .75; }
      &:-ms-input-placeholder { color: @subtext0; opacity: .75; }

      &:hover {
        background-color: fade(@surface0, @tint-input-hover);
      }

      &:focus {
        /* Subtle focus indication without heavy overrides */
        border-color: @overlay1;
        outline: 2px solid fade(@accent, 35%);
        outline-offset: 2px;
        box-shadow: 0 0 0 2px fade(@accent, 20%);
        background-color: transparent;
      }
    }

    /* Code blocks */
    code,
    pre {
      background: @crust;
      color: @text;
      border: 1px solid @surface2;
      border-radius: 10px;
      padding: 0.75rem 1rem;
    }

    /* Syntax highlighting (Prism.js / highlight.js) */
    pre[class*="language-"],
    code[class*="language-"],
    .hljs {
      background: @crust;
      color: @text;
    }
    .token.comment,
    .hljs-comment,
    .hljs-quote { color: @overlay1; font-style: italic; }
    .token.keyword,
    .hljs-keyword,
    .hljs-selector-tag { color: @mauve; }
    .token.string,
    .hljs-string,
    .hljs-attr,
    .hljs-attribute { color: @green; }
    .token.function,
    .hljs-function,
    .hljs-title.function_ { color: @blue; }
    .token.number,
    .token.boolean,
    .hljs-number { color: @peach; }
    .token.operator,
    .hljs-operator { color: @sky; }
    .token.constant,
    .token.symbol,
    .hljs-literal { color: @yellow; }
    .token.class-name,
    .hljs-type,
    .hljs-built_in,
    .token.builtin { color: @sapphire; }
    .token.punctuation,
    .hljs-punctuation { color: @overlay2; }

    /* Text selection */
    ::selection {
      background: fade(@accent, 35%);
      color: @base;
    }
    ::-moz-selection {
      background: fade(@accent, 35%);
      color: @base;
    }

    /* Scrollbar (WebKit) */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    ::-webkit-scrollbar-track {
      background: @base;
    }
    ::-webkit-scrollbar-thumb {
      background: fade(@overlay2, 35%);
      border-radius: 8px;
      border: 2px solid @base;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: fade(@overlay2, 50%);
    }

    /* Global focus ring */
    :focus-visible {
      outline: 2px solid fade(@accent, 35%);
      outline-offset: 2px;
      box-shadow: 0 0 0 2px fade(@accent, 20%);
    }

    /* Form controls - checkboxes, radios, switches */
    input[type="checkbox"],
    input[type="radio"] {
      accent-color: @accent;
      background-color: transparent;
      border-color: @overlay0;
    }

    /* Role-based switches */
    [role="switch"] {
      accent-color: @accent;
    }

    /* Generic toggle/switch UI helpers (class-based for common libs) */
    .switch,
    .toggle {
      position: relative;
      display: inline-block;
      width: 42px;
      height: 24px;
      background: fade(@overlay2, 25%);
      border-radius: 999px;
      transition: background 0.2s ease, box-shadow 0.2s ease;
      box-shadow: inset 0 2px 4px fade(@overlay2, 12%);
    }
    .switch::after,
    .toggle::after {
      content: '';
      position: absolute;
      top: 3px; left: 3px;
      width: 18px; height: 18px;
      background: @surface2;
      border-radius: 999px;
      transition: transform 0.2s ease, background-color 0.2s ease;
      box-shadow: 0 1px 2px fade(@overlay2, 20%);
    }
    .switch[aria-checked="true"],
    .toggle.is-on,
    .toggle[aria-checked="true"],
    .toggle[aria-pressed="true"] {
      background: fade(@accent, 65%);
    }
    .switch[aria-checked="true"]::after,
    .toggle.is-on::after,
    .toggle[aria-checked="true"]::after,
    .toggle[aria-pressed="true"]::after {
      transform: translateX(18px);
      background: @base;
    }

    input:disabled,
    select:disabled,
    textarea:disabled,
    button:disabled,
    [aria-disabled="true"] {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Select dropdown options */
    select,
    option {
      background: @base;
      color: @text;
    }

    /* Horizontal rules */
    hr {
      border-color: @overlay1;
      opacity: 0.6;
    }

    /* Tables */
    table {
      background: @base;
      border: 1px solid @overlay1;
      border-collapse: separate;
      border-spacing: 0;
      box-shadow: 0 2px 8px fade(@overlay2, 15%);
    }
    thead {
      background: @surface0;
      color: @text;
    }
    th, td {
      border-bottom: 1px solid @overlay1;
      padding: 0.65rem 0.9rem;
    }
    tbody tr:nth-child(even) {
      background: fade(@surface0, 60%);
    }
    tbody tr:hover {
      background: fade(@accent, 8%);
    }

    /* Dense tables variant */
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

    /* Cards / panels / containers */
    .card,
    .panel,
    .box,
    .container,
    .paper,
    .well {
      background: fade(@surface0, 90%);
      border: 1px solid @surface2;
      border-radius: 12px;
      box-shadow: 0 8px 24px fade(@overlay2, 18%);
      backdrop-filter: blur(4px);
    }

    /* Tooltips & popovers */
    [role="tooltip"],
    .tooltip,
    .popover {
      background: @mantle;
      color: @text;
      border: 1px solid @overlay1;
      box-shadow: 0 6px 18px fade(@overlay2, 20%);
    }

    /* Dropdown menus */
    .menu,
    .dropdown-menu,
    [role="menu"] {
      background: @base;
      border: 1px solid @overlay1;
      box-shadow: 0 10px 24px fade(@overlay2, 18%);
    }
    .menu-item,
    [role="menuitem"],
    .dropdown-item {
      color: @text;
    }
    .menu-item:hover,
    [role="menuitem"]:hover,
    .dropdown-item:hover {
      background: fade(@accent, 10%);
      color: @text;
    }

    /* Modals & dialogs */
    .modal,
    .dialog,
    [role="dialog"],
    [aria-modal="true"] {
      background: @base;
      color: @text;
      border: 1px solid @overlay1;
      box-shadow: 0 20px 48px fade(@overlay2, 25%);
    }
    .modal-backdrop,
    .overlay,
    .backdrop {
      background: fade(@crust, 70%);
    }

    /* Alerts / banners */
    .alert,
    .banner,
    .notice {
      background: fade(@surface0, 90%);
      border: 1px solid @surface2;
      border-left: 4px solid @accent;
      color: @text;
    }
    .alert-success { border-left-color: @green; }
    .alert-warning { border-left-color: @yellow; }
    .alert-danger, .alert-error { border-left-color: @red; }
    .alert-info { border-left-color: @blue; }

    /* Badges / chips */
    .badge,
    .tag,
    .chip {
      background: fade(@accent, 20%);
      color: @accent;
      border: 1px solid fade(@accent, 35%);
      border-radius: 999px;
    }
  }
}

/* Helper function to convert colors to HSL format */
#hslify(@color) {
  @raw: e(%("%s %s% %s%", hue(@color), saturation(@color), lightness(@color)));
}
`;
}

/** Generate CSS custom properties from legacy ColorMapping[] (keeps previous behaviour) */
function generateCSSVariableMappings(mappings: ColorMapping[]): string {
  const lines: string[] = [];

  // Analyze mappings to understand what each original color was used for
  const backgroundColors: string[] = [];
  const textColors: string[] = [];
  const accentColors: string[] = [];
  const borderColors: string[] = [];
  const surfaceColors: string[] = [];

  mappings.forEach(mapping => {
    const reason = mapping.reason.toLowerCase();
    const catColor = mapping.catppuccinColor;

    if (reason.includes('background') || reason.includes('bg')) {
      backgroundColors.push(catColor);
    } else if (reason.includes('text') || reason.includes('font')) {
      textColors.push(catColor);
    } else if (reason.includes('accent') || reason.includes('button') || reason.includes('link') || reason.includes('primary')) {
      accentColors.push(catColor);
    } else if (reason.includes('border') || reason.includes('outline')) {
      borderColors.push(catColor);
    } else if (reason.includes('surface') || reason.includes('card') || reason.includes('panel')) {
      surfaceColors.push(catColor);
    }
  });

  // Get primary colors for each category
  const primaryBg = backgroundColors[0] || 'base';
  const primaryText = textColors[0] || 'text';
  const primaryAccent = accentColors[0] || 'accent';

  lines.push('    /* Accent colors */');
  lines.push('    --accent-brand: #hslify(@accent)[];');
  lines.push('    --accent-main: #hslify(@accent)[];');
  lines.push('    --accent-primary: #hslify(@accent)[];');
  lines.push('    --color-accent: #hslify(@accent)[];');
  lines.push('');

  lines.push('    /* Background colors */');
  lines.push(`    --bg-base: #hslify(@${primaryBg})[];`);
  lines.push('    --bg-primary: #hslify(@base)[];');
  lines.push('    --bg-secondary: #hslify(@mantle)[];');
  lines.push('    --bg-tertiary: #hslify(@crust)[];');
  lines.push('    --background: #hslify(@base)[];');
  lines.push('    --background-secondary: #hslify(@mantle)[];');
  lines.push('');

  lines.push('    /* Surface colors */');
  lines.push('    --surface-0: #hslify(@surface0)[];');
  lines.push('    --surface-1: #hslify(@surface1)[];');
  lines.push('    --surface-2: #hslify(@surface2)[];');
  lines.push('');

  lines.push('    /* Text colors */');
  lines.push(`    --text-base: #hslify(@${primaryText})[];`);
  lines.push('    --text-primary: #hslify(@text)[];');
  lines.push('    --text-secondary: #hslify(@subtext0)[];');
  lines.push('    --text-tertiary: #hslify(@subtext1)[];');
  lines.push('    --text-muted: #hslify(@overlay2)[];');
  lines.push('');

  lines.push('    /* Border colors */');
  lines.push('    --border-primary: #hslify(@overlay0)[];');
  lines.push('    --border-secondary: #hslify(@overlay1)[];');
  lines.push('    --border-tertiary: #hslify(@overlay2)[];');
  lines.push('');

  lines.push('    /* Status colors */');
  lines.push('    --color-success: #hslify(@green)[];');
  lines.push('    --color-warning: #hslify(@yellow)[];');
  lines.push('    --color-danger: #hslify(@red)[];');
  lines.push('    --color-info: #hslify(@blue)[];');

  return lines.join('\n');
}

/** Generate CSS custom properties from MappingOutput (two-level system) */
function generateCSSFromMappingOutput(mappingOutput: MappingOutput): string {
  const lines: string[] = [];
  const roleMap: RoleMap = mappingOutput.roleMap || {};
  const derived: DerivedScales = mappingOutput.derivedScales || {};

  lines.push('    /* Level 1: cp_ binding */');
  const seen = new Map<string, string>(); // hex -> cpName
  function cpNameForKey(k: string) { return `cp-${sanitizeKey(k)}`; }

  for (const [role, cv] of Object.entries(roleMap)) {
    if (!cv) continue;
    const hex = cv.hex;
    if (!seen.has(hex)) {
      const cp = cpNameForKey(role);
      seen.set(hex, cp);
      lines.push(`    --${cp}: ${hex}; /* from ${role} */`);
    }
  }
  for (const [dk, cv] of Object.entries(derived)) {
    if (!cv) continue;
    const hex = cv.hex;
    if (!seen.has(hex)) {
      const cp = cpNameForKey(dk);
      seen.set(hex, cp);
      lines.push(`    --${cp}: ${hex}; /* derived ${dk} */`);
    }
  }

  lines.push('');
  lines.push('    /* Level 2: role variables */');
  for (const [role, cv] of Object.entries(roleMap)) {
    if (!cv) continue;
    const cp = seen.get(cv.hex) || cpNameForKey(role);
    const roleVar = roleToCssVar(role);
    lines.push(`    --${roleVar}: var(--${cp});`);
  }
  for (const [dk, cv] of Object.entries(derived)) {
    if (!cv) continue;
    const cp = seen.get(cv.hex) || cpNameForKey(dk);
    const roleVar = roleToCssVar(dk);
    lines.push(`    --${roleVar}: var(--${cp});`);
  }

  // Provide button usage mapping comment
  lines.push('');
  lines.push('    /* Button role mappings:');
  lines.push('       .btn-primary => --primary-base / --primary-text');
  lines.push('       .btn-secondary => --secondary-base / --secondary-text');
  lines.push('       .btn-outline => transparent / --border-default / --text-primary');
  lines.push('       .btn-subtle => transparent / --text-primary (hover: --surface-0)');
  lines.push('       .btn-destructive => --danger-base / --danger-text');
  lines.push('    */');

  return lines.join('\n');
}

function sanitizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function roleToCssVar(role: string): string {
  return role.replace(/\./g, '-');
}

/**
 * Generate class-specific CSS rules from CSS analysis data
 */
function generateClassSpecificRules(cssAnalysis?: CSSAnalysisData): string {
  if (!cssAnalysis || !cssAnalysis.grouped) {
    return '    /* No class-specific analysis available */';
  }

  const lines: string[] = [];
  const grouped = cssAnalysis.grouped;

  // Button classes
  if (grouped.buttons && grouped.buttons.length > 0) {
    lines.push('');
    lines.push('    /* Button classes with triadic gradient backgrounds */');
    grouped.buttons.slice(0, 20).forEach(btn => {
      lines.push(`    .${btn.className} {`);
      lines.push(`      background: @surface0;`);
      lines.push(`      color: @accent;`);
      lines.push(``);
      lines.push(`      &:hover {`);
      lines.push(`        background: linear-gradient(135deg, @accent 0%, @co-accent1 100%) !important;`);
      lines.push(`        color: @base !important;`);
      lines.push(`        transition: all 0.3s ease !important;`);
      lines.push(`      }`);
      lines.push(``);
      lines.push(`      &:active {`);
      lines.push(`        background: linear-gradient(135deg, @co-accent1 0%, @co-accent2 100%) !important;`);
      lines.push(`      }`);
      lines.push(`    }`);
    });
  }

  // Link classes
  if (grouped.links && grouped.links.length > 0) {
    lines.push('');
    lines.push('    /* Link classes with triadic gradient text */');
    grouped.links.slice(0, 20).forEach(link => {
      lines.push(`    .${link.className} {`);
      lines.push(`      color: @accent;`);
      lines.push(`      text-decoration-color: @co-accent1;`);
      lines.push(``);
      lines.push(`      &:hover {`);
  lines.push(`        color: linear-gradient(90deg, @accent 0%, @co-accent1 50%, @co-accent2 100%);`);
  lines.push(`        background: none;`);
      lines.push(`        text-decoration-color: @co-accent2;`);
      lines.push(`        transition: all 0.3s ease;`);
      lines.push(`      }`);
      lines.push(`    }`);
    });
  }

  // Background classes
  if (grouped.backgrounds && grouped.backgrounds.length > 0) {
    lines.push('');
    lines.push('    /* Background classes */');
    grouped.backgrounds.slice(0, 15).forEach(bg => {
      lines.push(`    .${bg.className} {`);
      lines.push(`      background: @surface0 !important;`);
      lines.push(`    }`);
    });
  }

  // Text classes
  if (grouped.text && grouped.text.length > 0) {
    lines.push('');
    lines.push('    /* Text classes */');
    grouped.text.slice(0, 15).forEach(txt => {
      lines.push(`    .${txt.className} {`);
      lines.push(`      color: @text !important;`);
      lines.push(`    }`);
    });
  }

  // Border classes
  if (grouped.borders && grouped.borders.length > 0) {
    lines.push('');
    lines.push('    /* Border classes */');
    grouped.borders.slice(0, 15).forEach(border => {
      lines.push(`    .${border.className} {`);
      lines.push(`      border-color: @overlay0 !important;`);
      lines.push(`    }`);
    });
  }

  return lines.join('\n');
}
