import type { ColorMapping, AccentColor, CatppuccinFlavor } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { PRECOMPUTED_ACCENTS, ACCENT_NAMES } from '../../utils/accent-schemes';

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
  const useAltForButtons = Math.random() < 0.5 ? 'alt1' : 'alt2';
  const useAltBi = 'bi1'; // deterministic: pair main-accent with bi-accent1
  const hoverAngle = Math.floor(Math.random() * 180); // subtle randomness retained
  const hoverBiPick = 'bi-accent1'; // deterministic: gradient pairs with bi-accent1

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

    /* Helper function to convert colors to HSL format */
    #hslify(@color) {
      @raw: e(%("%s %s% %s%", hue(@color), saturation(@color), lightness(@color)));
    }

${cssVarMappings}

    /* ═══════════════════════════════════════════════════════════
       CATPPUCCIN ACCENT SYSTEM (Analogous Harmony)
       ═══════════════════════════════════════════════════════════

       This theme uses an analogous color harmony system:

       @accent (main-accent):
         - The primary accent color selected by the user
         - Used for primary interactive elements (buttons, links)

       @bi-accent1, @bi-accent2 (±72° hue, analogous harmony):
         - Two colors that work as BOTH:
           1. Main-colors for different elements (alongside @accent)
           2. Gradient companions for any main-color
         - Create harmonious color transitions
         - Example: linear-gradient(@accent, @bi-accent1)

       MAIN-COLORS FOR ELEMENTS:
         The three analogous colors used as primary colors for elements:
         - @accent: Primary elements (main CTAs, primary buttons)
         - @bi-accent1: Secondary elements (secondary buttons, badges)
         - @bi-accent2: Tertiary elements (tags, chips, highlights)

       CASCADING SYSTEM:
         When bi-accents are used as main-colors (alt1/alt2),
         they get their OWN bi-accents for gradients:

         Primary: @accent → gradients with @bi-accent1/@bi-accent2
         Secondary: @alt1-main (bi-accent1) → gradients with @alt1-bi1/@alt1-bi2
         Tertiary: @alt2-main (bi-accent2) → gradients with @alt2-bi1/@alt2-bi2

       ═══════════════════════════════════════════════════════════ */

    /* Link hover gradient parameters (build-time random) */
    @hover-angle: ${hoverAngle}deg;
    @hover-bi: @${hoverBiPick};

    /* Intensity tuning (flavor-aware) */
    @tint-weak: ${intensity.weak}%;
    @tint-mid: ${intensity.mid}%;
    @tint-strong: ${intensity.strong}%;
    @tint-input-hover: ${intensity.inputHover}%;

    /* Contrast-based color adjustments for WCAG compliance */
    /* Default/min contrast for links computed across common surfaces */
    @link-contrast: ${(() => {
      const surfaces = [palette.base.hex, palette.surface0.hex, palette.surface1.hex, palette.surface2.hex];
      const acc = palette[defaultAccent].hex;
      let m = 99;
      for (const s of surfaces) m = Math.min(m, contrastRatio(acc, s));
      return m;
    })()};
    /* Fallback link color (prefer text over base) */
    @link-fallback: ${(() => {
      const surfaces = [palette.base.hex, palette.surface0.hex, palette.surface1.hex, palette.surface2.hex];
      const t = palette.text.hex; const b = palette.base.hex;
      const minT = surfaces.reduce((m, s) => Math.min(m, contrastRatio(t, s)), 99);
      const minB = surfaces.reduce((m, s) => Math.min(m, contrastRatio(b, s)), 99);
      return minT >= minB ? '@text' : '@base';
    })()};
    /* Button contrast (ALT main text against surface0) */
    @button-contrast: ${(() => {
      const altMain = useAltForButtons === 'alt1' ? PRECOMPUTED_ACCENTS[flavor][defaultAccent].biAccent1 : PRECOMPUTED_ACCENTS[flavor][defaultAccent].biAccent2;
      return contrastRatio(palette[altMain].hex, palette.surface0.hex);
    })()};
    @destructive-button-contrast: ${contrastRatio(palette.red.hex, palette.surface0.hex)};

    /* ═══════════════════════════════════════════════════════════
       RUNTIME ACCENT DERIVATION
       ═══════════════════════════════════════════════════════════

       When user changes @accentColor in UserStyle UI, this mixin
       automatically updates ALL derived accents including the
       full cascading hierarchy (bi-accents for each main-color).

       ═══════════════════════════════════════════════════════════ */
${(() => {
      let out = '';
      ACCENT_NAMES.forEach((name) => {
        const mainSet = PRECOMPUTED_ACCENTS[flavor][name];
        const bi1Set = PRECOMPUTED_ACCENTS[flavor][mainSet.biAccent1];
        const bi2Set = PRECOMPUTED_ACCENTS[flavor][mainSet.biAccent2];

        out += `    #derive-accents() when (@accentColor = ${name}) {\n`;
        out += `      @accent: @${name};\n`;
        out += `      /* Bi-accents for main accent (analogous harmony at ±72°) */\n`;
        out += `      @bi-accent1: @${mainSet.biAccent1};\n`;
        out += `      @bi-accent2: @${mainSet.biAccent2};\n`;
        out += `      @bi-accent: @${mainSet.biAccent1};\n`;
        out += `      /* Cascading: alt1 (bi-accent1 as main with its bi-accents) */\n`;
        out += `      @alt1-main: @${mainSet.biAccent1};\n`;
        out += `      @alt1-bi1: @${bi1Set.biAccent1};\n`;
        out += `      @alt1-bi2: @${bi1Set.biAccent2};\n`;
        out += `      /* Cascading: alt2 (bi-accent2 as main with its bi-accents) */\n`;
        out += `      @alt2-main: @${mainSet.biAccent2};\n`;
        out += `      @alt2-bi1: @${bi2Set.biAccent1};\n`;
        out += `      @alt2-bi2: @${bi2Set.biAccent2};\n`;
        out += `      /* Button accent (uses one of the bi-accent sets) */\n`;
        out += `      @ALT_MAIN: @alt${useAltForButtons === 'alt1' ? '1' : '2'}-main;\n`;
        out += `      @ALT_BI: @alt${useAltForButtons === 'alt1' ? '1' : '2'}-bi1;\n`;

        // Recompute per-accent link contrast across common surfaces
        const accentHex = CATPPUCCIN_PALETTES[flavor][name].hex;
        const surfaces = [
          CATPPUCCIN_PALETTES[flavor].base.hex,
          CATPPUCCIN_PALETTES[flavor].surface0.hex,
          CATPPUCCIN_PALETTES[flavor].surface1.hex,
          CATPPUCCIN_PALETTES[flavor].surface2.hex,
        ];
        const minLink = surfaces.reduce((m, s) => Math.min(m, contrastRatio(accentHex, s)), 99);
        out += `      @link-contrast: ${minLink};\n`;
        // Button contrast for chosen ALT main (deterministic bi-accent pairing)
        const altChoice: AccentColor = (useAltForButtons === 'alt1' ? mainSet.biAccent1 : mainSet.biAccent2) as AccentColor;
        const altHex = CATPPUCCIN_PALETTES[flavor][altChoice].hex;
        const btnC = contrastRatio(altHex, CATPPUCCIN_PALETTES[flavor].surface0.hex);
        out += `      @button-contrast: ${btnC};\n`;
        out += `    }\n`;
      });
      out += '    #derive-accents();\n';
      return out;
    })()}
    /* Deprecated alias below was removed to avoid undefined references */

    /* Custom styling rules */
    /* Add website-specific color overrides here */

    /* Background colors */
    body {
      background: @base;
      color: @text;
    }

    /* Links - prefer solid text; enable gradient text only when supported */
    a,
    a.link {
      /* Default state: Apply Catppuccin text color */
      color: @accent;

      position: relative;

      &:hover,
      &:focus-visible {
        /* Remove underline on hover for clean look */
        text-decoration: none;
        /* Contrast-aware text color adjustment */
        & when (@link-contrast < 4.5) {
          color: @link-fallback;
        }
        & when not (@link-contrast < 4.5) {
          color: @accent;
        }

        /* Modern browsers: Gradient text effect with proper support detection */
        @supports (background-clip: text) or (-webkit-background-clip: text) {
          background: linear-gradient(@hover-angle,
            @accent 0%,
            @hover-bi 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
      }

      &:active,
      &.active,
      &[aria-current="page"] {
        /* Active state: keep accent without filters for predictability */
        color: @accent;
      }

      &:visited {
        /* Visited links: slightly muted */
        color: fade(@accent, 85%);
      }
    }

    /* Buttons - gradients on backgrounds; solid readable text */
    button,
    input[type="button"],
    input[type="submit"] {
      /* Default state: Use ALT main color for emphasis */
      color: @ALT_MAIN;

      &:hover {
        /* Apply gradient background on hover ONLY */
        background-image: linear-gradient(135deg, @ALT_MAIN 0%, @ALT_BI 100%);
        /* Prefer ALT_MAIN; fallback to @text if contrast fails */
        & when (@button-contrast < 4.5) { color: @text; }
        & when not (@button-contrast < 4.5) { color: @ALT_MAIN; }
      }

      &:active {
        /* Apply reversed gradient on active state */
        background-image: linear-gradient(135deg, @ALT_BI 0%, @ALT_MAIN 100%);
        & when (@button-contrast < 4.5) { color: @text; }
        & when not (@button-contrast < 4.5) { color: @ALT_MAIN; }
      }
    }

    /* Class-specific styling (from CSS analysis) */
    /* These rules will be added if directory analysis is used */
${generateClassSpecificRules(cssAnalysis)}

    /* Input fields - consistent focus states (no hover effect) */
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
      caret-color: @accent;

      &::placeholder { color: @subtext0; opacity: .75; }
      &::-webkit-input-placeholder { color: @subtext0; opacity: .75; }
      &::-moz-placeholder { color: @subtext0; opacity: .75; }
      &:-ms-input-placeholder { color: @subtext0; opacity: .75; }

      &:hover {
        /* Neutralize hover visuals */
        background: fade(@surface0, 12%) !important;
      }

      &:focus {
        /* Co-accent focus background with bi-accent gradient */
        background: linear-gradient(135deg,
          fade(@accent, 8%) 0%,
          fade(@bi-accent1, 12%) 100%
        ) !important;
        caret-color: @bi-accent1;
      }
    }

    /* Code blocks */
    code,
    pre {
      background: @crust;
      color: @text;
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

    /* Form controls - checkboxes, radios, switches */
    input[type="checkbox"],
    input[type="radio"] {
      accent-color: @accent;
      background-color: @surface0;
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
    }
    .switch::after,
    .toggle::after {
      content: '';
      position: absolute;
      top: 3px; left: 3px;
      width: 18px; height: 18px;
      background: @surface2;
      border-radius: 999px;
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
      opacity: 0.6;
    }

    /* Tables - color only, no layout changes */
    table {
      background: @base;
    }
    thead {
      background: @surface0;
      color: @text;
    }
    /* Avoid setting th/td padding or borders to preserve layout */
    tbody tr:nth-child(even) {
      background: fade(@surface0, 60%);
    }
    tbody tr:hover {
      /* Solid background with gradient text */
      background: fade(@surface0, 80%);
      
    }

    /* Dense tables variant removed to avoid spacing changes */

    /* Cards / panels / containers */
    .card,
    .panel,
    .box,
    .container,
    .paper,
    .well {
      background: fade(@surface0, 90%);
    }

    /* Tooltips & popovers */
    [role="tooltip"],
    .tooltip,
    .popover {
      background: @mantle;
      color: @text;
    }

    /* Dropdown menus */
    .menu,
    .dropdown-menu,
    [role="menu"] {
      background: @base;
    }
    .menu-item,
    [role="menuitem"],
    .dropdown-item {
      color: @text;
      
    }
    .menu-item:hover,
    [role="menuitem"]:hover,
    .dropdown-item:hover {
      /* Solid background with accent text */
      background: @surface0;
      color: @bi-accent1;
    }

    /* Modals & dialogs */
    .modal,
    .dialog,
    [role="dialog"],
    [aria-modal="true"] {
      background: @base;
      color: @text;
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
      color: @text;
    }

    /* Badges / chips */
    .badge,
    .tag,
    .chip {
      background: fade(@accent, 20%);
      color: @accent;
    }
  }
}

`;
}


// (Moved into generated LESS string within #catppuccin block)

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

  // Helper to format a value for our #hslify mixin. Accepts palette names or hex.
  const hslify = (val: string) => {
    if (!val) return '#hslify(@base)[]';
    // If it's a hex literal, call mixin with the literal (no @)
    if (val.startsWith('#')) return '#hslify(' + val + ')[]';
    // Otherwise, map to known Catppuccin tokens; fall back to @base on unknown
    const safe = val.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
    const allowed = new Set([
      'base','mantle','crust',
      'surface0','surface1','surface2',
      'overlay0','overlay1','overlay2',
      'subtext0','subtext1','text',
      'rosewater','flamingo','pink','mauve','red','maroon','peach','yellow','green','teal','sky','sapphire','blue','lavender',
      // occasionally mappings use generic terms
      'accent','background'
    ]);
    const name = allowed.has(safe)
      ? (safe === 'background' ? 'base' : safe)
      : 'base';
    return '#hslify(@' + name + ')[]';
  };

  lines.push('    /* Accent colors */');
  lines.push('    --accent-brand: ' + hslify('accent') + ';');
  lines.push('    --accent-main: ' + hslify('accent') + ';');
  lines.push('    --accent-primary: ' + hslify('accent') + ';');
  lines.push('    --color-accent: ' + hslify('accent') + ';');
  lines.push('');

  lines.push('    /* Background colors */');
  lines.push('    --bg-base: ' + hslify(primaryBg) + ';');
  lines.push('    --bg-primary: ' + hslify('base') + ';');
  lines.push('    --bg-secondary: ' + hslify('mantle') + ';');
  lines.push('    --bg-tertiary: ' + hslify('crust') + ';');
  lines.push('    --background: ' + hslify('base') + ';');
  lines.push('    --background-secondary: ' + hslify('mantle') + ';');
  lines.push('');

  lines.push('    /* Surface colors */');
  lines.push('    --surface-0: ' + hslify('surface0') + ';');
  lines.push('    --surface-1: ' + hslify('surface1') + ';');
  lines.push('    --surface-2: ' + hslify('surface2') + ';');
  lines.push('');

  lines.push('    /* Text colors */');
  lines.push('    --text-base: ' + hslify(primaryText) + ';');
  lines.push('    --text-primary: ' + hslify('text') + ';');
  lines.push('    --text-secondary: ' + hslify('subtext0') + ';');
  lines.push('    --text-tertiary: ' + hslify('subtext1') + ';');
  lines.push('    --text-muted: ' + hslify('overlay2') + ';');
  lines.push('');

  lines.push('    /* Border colors - removed to preserve original borders */');
  lines.push('');

  lines.push('    /* Status colors */');
  lines.push('    --color-success: ' + hslify('green') + ';');
  lines.push('    --color-warning: ' + hslify('yellow') + ';');
  lines.push('    --color-danger: ' + hslify('red') + ';');
  lines.push('    --color-info: ' + hslify('blue') + ';');

  return lines.join('\n');
}

/** Generate CSS custom properties from MappingOutput (two-level system) */
function generateCSSFromMappingOutput(mappingOutput: MappingOutput): string {
  const lines: string[] = [];
  const roleMap: RoleMap = mappingOutput.roleMap || {};
  const derived: DerivedScales = mappingOutput.derivedScales || {};

  lines.push('    /* Level 1: cp_ binding */');
  const seen = new Map<string, string>(); // hex -> cpName
  function cpNameForKey(k: string) { return 'cp-' + sanitizeKey(k); }

  for (const [role, cv] of Object.entries(roleMap)) {
    if (!cv) continue;
    const hex = cv.hex;
    if (!seen.has(hex)) {
      const cp = cpNameForKey(role);
      seen.set(hex, cp);
      lines.push('    --' + cp + ': ' + hex + '; /* from ' + role + ' */');
    }
  }
  for (const [dk, cv] of Object.entries(derived)) {
    if (!cv) continue;
    const hex = cv.hex;
    if (!seen.has(hex)) {
      const cp = cpNameForKey(dk);
      seen.set(hex, cp);
      lines.push('    --' + cp + ': ' + hex + '; /* derived ' + dk + ' */');
    }
  }

  lines.push('');
  lines.push('    /* Level 2: role variables */');
  for (const [role, cv] of Object.entries(roleMap)) {
    if (!cv) continue;
    const cp = seen.get(cv.hex) || cpNameForKey(role);
    const roleVar = roleToCssVar(role);
    lines.push('    --' + roleVar + ': var(--' + cp + ');');
  }
  for (const [dk, cv] of Object.entries(derived)) {
    if (!cv) continue;
    const cp = seen.get(cv.hex) || cpNameForKey(dk);
    const roleVar = roleToCssVar(dk);
    lines.push('    --' + roleVar + ': var(--' + cp + ');');
  }

  // Provide button usage mapping comment
  lines.push('');
  lines.push('    /* Button role mappings:');
  lines.push('       .btn-primary => --primary-base / --primary-text');
  lines.push('       .btn-secondary => --secondary-base / --secondary-text');
  lines.push('       .btn-outline => --surface-0 / --border-default / --text-primary');
  lines.push('       .btn-subtle => --surface-0 / --text-primary (hover: --surface-0)');
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
    lines.push('    /* Button classes with bi-accent gradients and readable text */');
    grouped.buttons.slice(0, 20).forEach(btn => {
      lines.push('    .' + btn.className + ' {');
      lines.push('      /* Default state: emphasize ALT main on text */');
      lines.push('      color: @ALT_MAIN;');
      lines.push('');
      lines.push('      &:hover {');
      lines.push('        /* Solid background with gradient background */');
      lines.push('        background: @surface0 !important;');
      lines.push('        background-image: linear-gradient(135deg, @ALT_MAIN 0%, @ALT_BI 100%) !important;');
      lines.push('        /* Prefer ALT_MAIN; fallback to @text if contrast fails */');
      lines.push('        & when (@button-contrast < 4.5) { color: @text !important; }');
      lines.push('        & when not (@button-contrast < 4.5) { color: @ALT_MAIN !important; }');
      lines.push('      }');
      lines.push('');
      lines.push('      &:active {');
      lines.push('        /* Solid background with reversed gradient */');
      lines.push('        background: @surface0 !important;');
      lines.push('        background-image: linear-gradient(135deg, @ALT_BI 0%, @ALT_MAIN 100%) !important;');
      lines.push('        & when (@button-contrast < 4.5) { color: @text !important; }');
      lines.push('        & when not (@button-contrast < 4.5) { color: @ALT_MAIN !important; }');
      lines.push('      }');
      lines.push('    }');
    });
  }

  // Link classes (anchor-scoped to avoid affecting containers)
  if (grouped.links && grouped.links.length > 0) {
    lines.push('');
    lines.push('    /* Link classes – solid text by default; gradient text only when supported */');
    const containerRe = /^(prose|container|panel|card|box|paper|content|wrapper|section|row|col|grid|flex|list|menu|nav|tabs|tab|toolbar|header|footer|main|button|btn)$/i;
    grouped.links.slice(0, 20).forEach((link) => {
      const cls = link.className.trim();
      if (!cls || containerRe.test(cls)) return;
      // anchor with class, and anchor inside element with class
      lines.push('    a.' + cls + ', .' + cls + ' a {');
      lines.push('      /* Default state: Catppuccin accent color */');
      lines.push('      color: @accent;');
      lines.push('    }');
      lines.push('    a.' + cls + ':hover, .' + cls + ' a:hover {');
      lines.push('      /* Contrast-aware text color adjustment */');
      lines.push('      & when (@link-contrast < 4.5) {');
      lines.push('        color: @link-fallback;');
      lines.push('      }');
      lines.push('      & when not (@link-contrast < 4.5) {');
      lines.push('        color: @accent;');
      lines.push('      }');
      lines.push('      /* Modern browsers: Gradient text effect with proper support detection */');
      lines.push('      @supports (background-clip: text) or (-webkit-background-clip: text) {');
      lines.push('        background: linear-gradient(@hover-angle, @accent 0%, @hover-bi 100%);');
      lines.push('        -webkit-background-clip: text;');
      lines.push('        background-clip: text;');
      lines.push('        -webkit-text-fill-color: transparent;');
      lines.push('        color: transparent;');
      lines.push('      }');
      lines.push('    }');
      lines.push('    a.' + cls + ':active, .' + cls + ' a:active, a.' + cls + '.active, .' + cls + ' a.active {');
      lines.push('      color: @alt1-main;');
      lines.push('    }');
    });
  }

  // Background classes
  if (grouped.backgrounds && grouped.backgrounds.length > 0) {
    lines.push('');
    lines.push('    /* Background classes */');
    grouped.backgrounds.slice(0, 15).forEach(bg => {
      lines.push('    .' + bg.className + ' {');
      lines.push('      background: @surface0 !important;');
      lines.push('    }');
    });
  }

  // Text classes
  if (grouped.text && grouped.text.length > 0) {
    lines.push('');
    lines.push('    /* Text classes */');
    grouped.text.slice(0, 15).forEach(txt => {
      lines.push('    .' + txt.className + ' {');
      lines.push('      color: @text !important;');
      lines.push('    }');
    });
  }

  // Border classes - removed to preserve original borders

  return lines.join('\n');
}
