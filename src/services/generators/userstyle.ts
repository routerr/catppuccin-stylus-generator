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
  const hoverBiPick = 'bi-accent1'; // deterministic: gradient pairs with bi-accent1

  // Extract hover angles from AI mappings (more flexible and dynamic)
  const colorMappings = Array.isArray(mappings) ? mappings : [];
  const hoverAngles = {
    links: colorMappings.find(m => m.reason?.toLowerCase().includes('link') && m.hoverGradientAngle)?.hoverGradientAngle || Math.floor(Math.random() * 360),
    buttons: colorMappings.find(m => m.reason?.toLowerCase().includes('button') && m.hoverGradientAngle)?.hoverGradientAngle || Math.floor(Math.random() * 360),
    cards: colorMappings.find(m => (m.reason?.toLowerCase().includes('card') || m.reason?.toLowerCase().includes('panel')) && m.hoverGradientAngle)?.hoverGradientAngle || Math.floor(Math.random() * 360),
    badges: colorMappings.find(m => (m.reason?.toLowerCase().includes('badge') || m.reason?.toLowerCase().includes('tag')) && m.hoverGradientAngle)?.hoverGradientAngle || Math.floor(Math.random() * 360),
    general: Math.floor(Math.random() * 360), // Fallback for unclassified elements
  };

  // Determine if elements should use text gradients vs background gradients
  const textOnlyElements = {
    links: colorMappings.some(m => m.reason?.toLowerCase().includes('link') && m.isTextOnly) || true, // Links are text-only by default
    buttons: colorMappings.some(m => m.reason?.toLowerCase().includes('button') && m.isTextOnly) || false,
    headings: true, // Headings are always text-only
  };

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

    /* Hover gradient parameters (AI-generated or dynamic) */
    @hover-angle-links: ${hoverAngles.links}deg;
    @hover-angle-buttons: ${hoverAngles.buttons}deg;
    @hover-angle-cards: ${hoverAngles.cards}deg;
    @hover-angle-badges: ${hoverAngles.badges}deg;
    @hover-angle-general: ${hoverAngles.general}deg;
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

    /* ═══════════════════════════════════════════════════════════════════
       CRITICAL: PRESERVE ORIGINAL GRADIENT TEXT - DO NOT MODIFY
       ═══════════════════════════════════════════════════════════════════
       Elements with gradient text (like Tailwind gradient text) must keep
       their original colors for visual impact and branding.

       This section MUST come early to establish highest priority.
       ═══════════════════════════════════════════════════════════════════ */

    /* Explicitly preserve gradient text - HIGHEST PRIORITY */
    /* Force original colors by preventing any theme color application */
    [class*="bg-clip-text"],
    [class*="text-transparent"],
    [class*="bg-gradient"],
    [class*="from-"],
    [class*="via-"],
    [class*="to-"],
    .bg-clip-text,
    .text-transparent,
    .text-clip {
      /* Prevent theme colors from being applied */
      color: revert !important;
      background: revert !important;
      background-color: revert !important;
      background-image: revert !important;
      -webkit-background-clip: revert !important;
      background-clip: revert !important;
      -webkit-text-fill-color: revert !important;
      text-fill-color: revert !important;
    }

    /* Protect ALL elements with gradient classes - extra safety layer */
    *[class*="bg-clip-text"],
    *[class*="text-transparent"],
    *[class*="bg-gradient"],
    *[class*="from-"],
    *[class*="via-"],
    *[class*="to-"],
    span[class*="bg-clip-text"],
    span[class*="text-transparent"],
    span[class*="bg-gradient"],
    div[class*="bg-clip-text"],
    div[class*="text-transparent"],
    div[class*="bg-gradient"],
    h1 [class*="bg-clip-text"],
    h2 [class*="bg-clip-text"],
    h3 [class*="bg-clip-text"],
    h4 [class*="bg-clip-text"],
    h5 [class*="bg-clip-text"],
    h6 [class*="bg-clip-text"] {
      /* Force preservation of ALL gradient properties */
      color: revert !important;
      background: revert !important;
      background-color: revert !important;
      background-image: revert !important;
      -webkit-background-clip: revert !important;
      background-clip: revert !important;
      -webkit-text-fill-color: revert !important;
      text-fill-color: revert !important;
    }

    /* Background colors - use theme base colors */
    body:not([class*="bg-clip-text"]):not([class*="bg-gradient"]) {
      background-color: @base;
      color: @text;
    }

    /* SVG elements - preserve transparency and use currentColor for fills */
    /* SVGs should inherit color from parent text, not have forced backgrounds */
    svg {
      /* SVGs typically don't have backgrounds, preserve this */
      background: none;
      background-color: transparent;
    }

    /* Links - apply gradient to text (invisible background) */
    /* Exclude gradient text elements */
    a:not([class*="bg-clip-text"]):not([class*="text-transparent"]):not([class*="bg-gradient"]),
    a.link:not([class*="bg-clip-text"]):not([class*="text-transparent"]),
    a[class]:not([class*="bg-clip-text"]):not([class*="text-transparent"]),
    a[class][href]:not([class*="bg-clip-text"]):not([class*="text-transparent"]) {
      /* Default state: Apply Catppuccin text color */
      color: @accent !important;

      position: relative;

      &:hover,
      &:focus-visible {
        /* Remove underline on hover for clean look */
        text-decoration: none;

        /* Apply gradient to text using background-clip (text-only elements) */
        /* Gradient: main-accent with bi-accent1 companion (analogous harmony) */
        @supports ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {
          background: linear-gradient(@hover-angle-links, @accent 0%, @bi-accent1 12%, @accent 100%) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;

          /* Ensure nested text elements inherit gradient properly */
          & *:not(svg):not(svg *) {
            background: inherit !important;
            -webkit-background-clip: inherit !important;
            background-clip: inherit !important;
            -webkit-text-fill-color: inherit !important;
          }

          /* Keep SVG icons visible by using color instead of text-fill-color */
          & svg {
            color: @accent !important;
            -webkit-text-fill-color: currentColor !important;
          }
        }

        /* Fallback for non-supporting browsers */
        @supports not ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {
          /* Contrast-aware text color adjustment */
          & when (@link-contrast < 4.5) {
            color: @link-fallback !important;
          }
          & when not (@link-contrast < 4.5) {
            color: @accent !important;
          }
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

    /* Buttons - apply gradients based on background visibility */
    /* CRITICAL: 70-80% use main-accent, 20-30% use bi-accents for variety */
    button,
    input[type="button"],
    input[type="submit"] {
      /* Default state: Use main-accent (70-80% rule) */
      color: @accent;

      &:hover {
        /* Apply gradient to background: main-accent with its bi-accent companion */
        background-image: linear-gradient(@hover-angle-buttons, @accent 0%, @bi-accent1 8%, @accent 100%);
        /* Text remains accent for readability */
        color: @accent;
      }

      &:active {
        /* Apply stronger gradient on active state */
        background-image: linear-gradient(@hover-angle-buttons, @bi-accent1 0%, @accent 50%, @bi-accent1 100%);
        color: @accent;
      }
    }

    /* Secondary buttons - use bi-accent1 for variety (20-30% rule) */
    button.secondary,
    button[class*="secondary"],
    button[class*="outline"],
    .btn-secondary,
    .button-secondary {
      color: @bi-accent1;

      &:hover {
        background-image: linear-gradient(@hover-angle-buttons, @bi-accent1 0%, @alt1-bi1 8%, @bi-accent1 100%);
        color: @bi-accent1;
      }
    }

    /* Tertiary buttons - use bi-accent2 for variety (20-30% rule) */
    button.tertiary,
    button[class*="tertiary"],
    button[class*="ghost"],
    .btn-tertiary,
    .button-tertiary {
      color: @bi-accent2;

      &:hover {
        background-image: linear-gradient(@hover-angle-buttons, @bi-accent2 0%, @alt2-bi1 8%, @bi-accent2 100%);
        color: @bi-accent2;
      }
    }

    /* Buttons with invisible backgrounds (text-only) - apply gradient to text */
    button.text-button,
    button[class*="text"],
    button[class*="link"],
    .text-button,
    .link-button {
      /* Only change color, preserve original background */
      color: @accent;

      &:hover {
        /* Apply gradient to text using background-clip */
        @supports ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {
          background: linear-gradient(@hover-angle-buttons, @accent 0%, @hover-bi 100%) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;

          /* Ensure nested text elements inherit gradient properly */
          & *:not(svg):not(svg *) {
            background: inherit !important;
            -webkit-background-clip: inherit !important;
            background-clip: inherit !important;
            -webkit-text-fill-color: inherit !important;
          }

          /* Keep SVG icons visible */
          & svg {
            color: @accent !important;
            -webkit-text-fill-color: currentColor !important;
          }
        }

        /* Fallback for non-supporting browsers */
        @supports not ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {
          color: @hover-bi !important;
        }
      }
    }

    /* Headings and emphasis - use theme text colors */
    /* CRITICAL: Do NOT apply color to headings with gradient children */
    h1:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"])),
    h2:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"])),
    h3:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"])),
    h4:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"])),
    h5:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"])),
    h6:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"])) {
      color: @text;
    }

    /* Ensure gradient text spans/children are never styled */
    h1 > [class*="bg-clip-text"],
    h1 > [class*="text-transparent"],
    h1 > [class*="bg-gradient"],
    h2 > [class*="bg-clip-text"],
    h2 > [class*="text-transparent"],
    h2 > [class*="bg-gradient"],
    h3 > [class*="bg-clip-text"],
    h3 > [class*="text-transparent"],
    h3 > [class*="bg-gradient"],
    h4 > [class*="bg-clip-text"],
    h4 > [class*="text-transparent"],
    h4 > [class*="bg-gradient"],
    h5 > [class*="bg-clip-text"],
    h5 > [class*="text-transparent"],
    h5 > [class*="bg-gradient"],
    h6 > [class*="bg-clip-text"],
    h6 > [class*="text-transparent"],
    h6 > [class*="bg-gradient"] {
      /* Never apply any theme colors to these */
    }

    strong:not([class*="bg-clip-text"]):not([class*="text-transparent"]),
    b:not([class*="bg-clip-text"]):not([class*="text-transparent"]) {
      color: @text;
    }

    /* Class-specific styling (from CSS analysis) */
    /* These rules will be added if directory analysis is used */
${generateClassSpecificRules(cssAnalysis, mappings)}

    /* Inputs – only change colors, preserve original styling */
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
      /* Only modify colors, preserve original background/border styles */
      color: @text;
      caret-color: @accent;

      &::placeholder { color: @subtext0; opacity: .75; }
      &::-webkit-input-placeholder { color: @subtext0; opacity: .75; }
      &::-moz-placeholder { color: @subtext0; opacity: .75; }
      &:-ms-input-placeholder { color: @subtext0; opacity: .75; }

      &:hover {
        /* Subtle border color change on hover (only if border exists) */
        border-color: @overlay1;
      }

      &:focus {
        /* Accent border on focus (only if border exists) */
        border-color: @accent;
        outline-color: @accent;
        caret-color: @accent;
      }
    }

    /* Autofill – override browser default yellow/blue backgrounds with theme colors */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active,
    textarea:-webkit-autofill,
    textarea:-webkit-autofill:hover,
    textarea:-webkit-autofill:focus,
    select:-webkit-autofill,
    select:-webkit-autofill:hover,
    select:-webkit-autofill:focus {
      /* Use subtle surface color instead of browser's yellow */
      -webkit-box-shadow: 0 0 0 1000px @surface0 inset !important;
      -webkit-text-fill-color: @text !important;
      transition: background-color 5000s ease-in-out 0s;
      caret-color: @accent;
    }

    /* Material Design / Angular components - only change colors */
    /* Form fields and inputs - preserve original styling */
    .mat-form-field,
    .mat-mdc-form-field,
    .mat-input-element,
    .mat-mdc-input-element,
    .mdc-text-field,
    .mdc-text-field__input,
    .ant-input,
    .form-control {
      color: @text;
    }

    /* Focus indicators and outlines */
    .mat-focus-indicator,
    .mat-mdc-focus-indicator {
      &:focus {
        outline-color: @accent;
      }
    }

    /* Contenteditable elements (modern chat/input interfaces) */
    /* Only change colors, preserve original layout and styling */
    [contenteditable],
    [contenteditable="true"],
    [role="textbox"],
    .contenteditable {
      color: @text;

      &:focus {
        border-color: @accent;
        outline-color: @accent;
      }
    }

    /* Copyable code/text areas - only change colors */
    .copy-code,
    .code-toolbar,
    .copy-button,
    button[class*="copy"],
    textarea.copyable,
    .clipboard,
    .copy-to-clipboard,
    .copy-snippet {
      color: @text;
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

    /* Text selection – general */
    ::selection {
      background: fade(@accent, 35%);
      color: @base;
    }
    ::-moz-selection {
      background: fade(@accent, 35%);
      color: @base;
    }

    /* Text selection inside inputs – keep transparent to blend with input background */
    input::selection,
    textarea::selection,
    select::selection {
      background: fade(@accent, 20%) !important;
      color: @text !important;
    }
    input::-moz-selection,
    textarea::-moz-selection,
    select::-moz-selection {
      background: fade(@accent, 20%) !important;
      color: @text !important;
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
    /* IMPORTANT: Only change colors, preserve original sizing and layout */
    .switch,
    .toggle {
      /* Only modify background color, preserve original size/position */
      background-color: fade(@overlay2, 25%);
    }
    .switch::after,
    .toggle::after {
      /* Only modify background color of toggle knob */
      background-color: @surface2;
    }
    .switch[aria-checked="true"],
    .toggle.is-on,
    .toggle[aria-checked="true"],
    .toggle[aria-pressed="true"] {
      /* Only change background when active */
      background-color: fade(@accent, 65%);
    }
    .switch[aria-checked="true"]::after,
    .toggle.is-on::after,
    .toggle[aria-checked="true"]::after,
    .toggle[aria-pressed="true"]::after {
      /* Only change knob color when active, preserve transform from original */
      background-color: @base;
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
      /* Subtle gradient background for interactive feel */
      background: fade(@surface0, 80%);
      background-image: linear-gradient(@hover-angle-general, fade(@surface0, 75%), fade(@surface1, 85%));
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

    /* Badges / chips - VARIETY (20-30% rule) */
    /* Primary badges - main-accent (70%) */
    .badge,
    .tag,
    .chip,
    .badge-primary,
    .tag-primary {
      background: fade(@accent, 20%);
      color: @accent;

      &:hover {
        /* Gradient: main-accent with bi-accent companion */
        background-image: linear-gradient(@hover-angle-badges, fade(@accent, 25%), fade(@bi-accent1, 25%));
        color: @text;
      }
    }

    /* Secondary badges - bi-accent1 (15%) */
    .badge-secondary,
    .tag-secondary,
    .chip-secondary,
    .badge:nth-child(3n+2),
    .tag:nth-child(3n+2) {
      background: fade(@bi-accent1, 20%);
      color: @bi-accent1;

      &:hover {
        /* Gradient: bi-accent1 with its own bi-accent companion */
        background-image: linear-gradient(@hover-angle-badges, fade(@bi-accent1, 25%), fade(@alt1-bi1, 25%));
        color: @text;
      }
    }

    /* Tertiary badges - bi-accent2 (15%) */
    .badge-tertiary,
    .tag-tertiary,
    .chip-tertiary,
    .badge:nth-child(3n+3),
    .tag:nth-child(3n+3) {
      background: fade(@bi-accent2, 20%);
      color: @bi-accent2;

      &:hover {
        /* Gradient: bi-accent2 with its own bi-accent companion */
        background-image: linear-gradient(@hover-angle-badges, fade(@bi-accent2, 25%), fade(@alt2-bi1, 25%));
        color: @text;
      }
    }

    /* Cards - add subtle hover gradients */
    .card,
    .panel,
    [class*="card"] {
      &:hover {
        /* Subtle gradient background for elevated feel */
        background-image: linear-gradient(@hover-angle-cards, fade(@surface0, 70%), fade(@surface1, 70%));
      }
    }

    /* Interactive badges/tags with clickable actions */
    .badge-interactive,
    .tag-clickable,
    .chip-button,
    button.badge,
    button.tag,
    button.chip,
    a.badge,
    a.tag,
    a.chip {
      cursor: pointer;

      &:hover {
        /* Gradient to text for clickable badges */
        @supports ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {
          background: linear-gradient(@hover-angle-badges, @accent, @bi-accent1) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;

          /* Ensure nested text elements inherit gradient properly */
          & *:not(svg):not(svg *) {
            background: inherit !important;
            -webkit-background-clip: inherit !important;
            background-clip: inherit !important;
            -webkit-text-fill-color: inherit !important;
          }

          /* Keep SVG icons visible */
          & svg {
            color: @accent !important;
            -webkit-text-fill-color: currentColor !important;
          }
        }
        @supports not ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {
          color: @bi-accent1;
        }
      }
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
function generateClassSpecificRules(cssAnalysis?: CSSAnalysisData, mappings?: ColorMapping[] | MappingOutput): string {
  if (!cssAnalysis || !cssAnalysis.grouped) {
    return '    /* No class-specific analysis available */';
  }

  const lines: string[] = [];
  const grouped = cssAnalysis.grouped;

  // Helper to check if a mapping indicates text-only/invisible background
  const isTextOnlyMapping = (className: string): boolean => {
    if (!mappings || !Array.isArray(mappings)) return false;
    // Check if any mapping mentions this class and has isTextOnly=true
    return mappings.some((m: ColorMapping) =>
      m.reason?.toLowerCase().includes(className.toLowerCase()) && m.isTextOnly
    );
  };

  // Helper to get appropriate angle variable for a class
  const getHoverAngleVar = (className: string, elementType: 'button' | 'link' | 'card' | 'badge'): string => {
    // Return the appropriate LESS variable based on element type
    switch (elementType) {
      case 'button':
        return '@hover-angle-buttons';
      case 'link':
        return '@hover-angle-links';
      case 'card':
        return '@hover-angle-cards';
      case 'badge':
        return '@hover-angle-badges';
      default:
        return '@hover-angle-general';
    }
  };

  // Button classes
  if (grouped.buttons && grouped.buttons.length > 0) {
    lines.push('');
    lines.push('    /* Button classes with proper accent distribution (70-30 rule) */');
    grouped.buttons.slice(0, 100).forEach((btn, index) => {
      const isTextOnly = isTextOnlyMapping(btn.className);
      const angleVar = getHoverAngleVar(btn.className, 'button');

      // Distribute colors: 70% main-accent, 15% bi-accent1, 15% bi-accent2
      const colorVar = index % 10 < 7 ? '@accent' : (index % 10 < 9 ? '@bi-accent1' : '@bi-accent2');
      const gradientCompanion = index % 10 < 7 ? '@bi-accent1' : (index % 10 < 9 ? '@alt1-bi1' : '@alt2-bi1');

      lines.push('    .' + btn.className + ' {');
      lines.push('      /* Default state: ' + (index % 10 < 7 ? 'main-accent' : 'bi-accent for variety') + ' (70-30 rule) */');
      lines.push('      color: ' + colorVar + ';');

      if (isTextOnly) {
        lines.push('      background: transparent !important;');
      }

      lines.push('');
      lines.push('      &:hover {');

      if (isTextOnly) {
        // Text-only button: apply gradient to text
        lines.push('        /* Apply gradient to text with proper bi-accent companion */');
        lines.push('        @supports ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {');
        lines.push(`          background: linear-gradient(${angleVar}, ${colorVar} 0%, ${gradientCompanion} 12%, ${colorVar} 100%) !important;`);
        lines.push('          -webkit-background-clip: text !important;');
        lines.push('          background-clip: text !important;');
        lines.push('          -webkit-text-fill-color: transparent !important;');
        lines.push('          /* Ensure nested text elements inherit gradient properly */');
        lines.push('          & *:not(svg):not(svg *) {');
        lines.push('            background: inherit !important;');
        lines.push('            -webkit-background-clip: inherit !important;');
        lines.push('            background-clip: inherit !important;');
        lines.push('            -webkit-text-fill-color: inherit !important;');
        lines.push('          }');
        lines.push('          /* Keep SVG icons visible */');
        lines.push('          & svg {');
        lines.push('            color: ' + colorVar + ' !important;');
        lines.push('            -webkit-text-fill-color: currentColor !important;');
        lines.push('          }');
        lines.push('        }');
        lines.push('        @supports not ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {');
        lines.push('          color: ' + colorVar + ' !important;');
        lines.push('        }');
      } else {
        // Visible background button: apply gradient to background
        lines.push('        /* Apply gradient to background with proper bi-accent companion */');
        lines.push(`        background-image: linear-gradient(${angleVar}, ${colorVar} 0%, ${gradientCompanion} 8%, ${colorVar} 100%) !important;`);
        lines.push('        color: ' + colorVar + ' !important;');
      }

      lines.push('      }');
      lines.push('');
      lines.push('      &:active {');

      if (!isTextOnly) {
        lines.push('        /* Stronger gradient for active state with bi-accent companion */');
        lines.push(`        background-image: linear-gradient(${angleVar}, ${gradientCompanion} 0%, ${colorVar} 50%, ${gradientCompanion} 100%) !important;`);
        lines.push('        color: ' + colorVar + ' !important;');
      } else {
        lines.push('        color: ' + colorVar + ' !important;');
      }

      lines.push('      }');
      lines.push('    }');
    });
  }

  // Link classes (anchor-scoped – apply broadly to improve coverage)
  if (grouped.links && grouped.links.length > 0) {
    lines.push('');
    lines.push('    /* Link classes – gradient text on hover (invisible background elements) */');
    grouped.links.slice(0, 100).forEach((link) => {
      const cls = link.className.trim();
      if (!cls) return;
      const angleVar = getHoverAngleVar(cls, 'link');

      // anchor with class, and anchor inside element with class
      lines.push('    a.' + cls + ', .' + cls + ' a {');
      lines.push('      /* Default state: Catppuccin accent color */');
      lines.push('      color: @accent !important;');
      lines.push('    }');
      lines.push('    a.' + cls + ':hover, .' + cls + ' a:hover {');
      lines.push('      /* Apply gradient to text (text-only elements) */');
      lines.push('      @supports ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {');
      lines.push(`        background: linear-gradient(${angleVar}, @accent 0%, @hover-bi 100%) !important;`);
      lines.push('        -webkit-background-clip: text !important;');
      lines.push('        background-clip: text !important;');
      lines.push('        -webkit-text-fill-color: transparent !important;');
      lines.push('        /* Ensure nested text elements inherit gradient properly */');
      lines.push('        & *:not(svg):not(svg *) {');
      lines.push('          background: inherit !important;');
      lines.push('          -webkit-background-clip: inherit !important;');
      lines.push('          background-clip: inherit !important;');
      lines.push('          -webkit-text-fill-color: inherit !important;');
      lines.push('        }');
      lines.push('        /* Keep SVG icons visible */');
      lines.push('        & svg {');
      lines.push('          color: @accent !important;');
      lines.push('          -webkit-text-fill-color: currentColor !important;');
      lines.push('        }');
      lines.push('      }');
      lines.push('      /* Fallback for non-supporting browsers */');
      lines.push('      @supports not ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {');
      lines.push('        & when (@link-contrast < 4.5) {');
      lines.push('          color: @link-fallback !important;');
      lines.push('        }');
      lines.push('        & when not (@link-contrast < 4.5) {');
      lines.push('          color: @accent !important;');
      lines.push('        }');
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
    grouped.backgrounds.slice(0, 100).forEach(bg => {
      lines.push('    .' + bg.className + ' {');
      lines.push('      background: @surface0 !important;');
      lines.push('    }');
    });
  }

  // Text classes
  if (grouped.text && grouped.text.length > 0) {
    lines.push('');
    lines.push('    /* Text classes */');
    grouped.text.slice(0, 100).forEach(txt => {
      lines.push('    .' + txt.className + ' {');
      lines.push('      color: @text !important;');
      lines.push('    }');
    });
  }

  // Border classes – allow color-only overrides to reflect AI findings
  if (grouped.borders && grouped.borders.length > 0) {
    lines.push('');
    lines.push('    /* Border classes – color-only, no width/radius changes */');
    grouped.borders.slice(0, 100).forEach(br => {
      lines.push('    .' + br.className + ' {');
      lines.push('      border-color: @overlay1 !important;');
      lines.push('    }');
      // Subtle hover accent
      lines.push('    .' + br.className + ':hover {');
      lines.push('      border-color: @alt1-main !important;');
      lines.push('    }');
    });
  }

  return lines.join('\n');
}
