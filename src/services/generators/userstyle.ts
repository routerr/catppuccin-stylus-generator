import type { ColorMapping, AccentColor, CatppuccinFlavor } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { PRECOMPUTED_ACCENTS, ACCENT_NAMES } from '../../utils/accent-schemes';
import { createAccentPlan, type AccentPlan } from '../../utils/accent-plan';

// Contrast calculation functions
function hexToRgb(hex: string): number[] {
  // Remove # if present
  const h = hex.replace(/#/, '');
  // Split the string into 2-digit pairs
  const rgb = h.match(/../g) || [];
  // Convert each pair into a number (0-255)
  return rgb.map((v) => parseInt(v, 16));
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
  aiRoleGuesses?: Array<{ className: string; role: string; confidence?: number }>;
  accentToggles?: {
    badgeCardTable?: boolean;
    alerts?: boolean;
  };
  fontSettings?: {
    normalFont?: string;
    monoFont?: string;
  };
  detectedMode?: 'dark' | 'light';
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
  const accentPlan = createAccentPlan((cssAnalysis as any)?.paletteProfile, flavor, defaultAccent);
  const useAltForButtons = accentPlan.buttonVariant;

  // Extract hover angles from AI mappings (more flexible and dynamic)
  const colorMappings = Array.isArray(mappings) ? mappings : [];
  const hoverAngles = {
    links: colorMappings.find(m => m.reason?.toLowerCase().includes('link') && m.hoverGradientAngle)?.hoverGradientAngle || accentPlan.hoverAngles.links,
    buttons: colorMappings.find(m => m.reason?.toLowerCase().includes('button') && m.hoverGradientAngle)?.hoverGradientAngle || accentPlan.hoverAngles.buttons,
    cards: colorMappings.find(m => (m.reason?.toLowerCase().includes('card') || m.reason?.toLowerCase().includes('panel')) && m.hoverGradientAngle)?.hoverGradientAngle || accentPlan.hoverAngles.cards,
    badges: colorMappings.find(m => (m.reason?.toLowerCase().includes('badge') || m.reason?.toLowerCase().includes('tag')) && m.hoverGradientAngle)?.hoverGradientAngle || accentPlan.hoverAngles.badges,
    general: accentPlan.hoverAngles.general,
  };

  // Build CSS variable block depending on input shape
  let cssVarMappings = '';
  if ((mappings as MappingOutput).roleMap) {
    const mappingOutput = mappings as MappingOutput;
    cssVarMappings = generateCSSFromMappingOutput(mappingOutput);
  } else {
    const legacy = mappings as ColorMapping[];
    cssVarMappings = generateCSSVariableMappings(legacy);
  }
  const preferredFlavorVar = cssAnalysis?.detectedMode === 'light' ? '@lightFlavor' : '@darkFlavor';

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
${generateFontImports(cssAnalysis?.fontSettings)}
  /* Baseline theme: always apply one flavor so the stylesheet never becomes a no-op */
  :root {
    #catppuccin(${preferredFlavorVar});
  }

  /* Explicit dark mode */
  :root[data-mode="dark"],
  :root[data-theme="dark"],
  html[data-theme="dark"],
  body[data-theme="dark"],
  [data-color-scheme="dark"],
  .dark,
  .dark-theme {
    #catppuccin(@darkFlavor);
  }

  /* Explicit light mode */
  :root[data-mode="light"],
  :root[data-theme="light"],
  html[data-theme="light"],
  body[data-theme="light"],
  [data-color-scheme="light"],
  .light,
  .light-theme {
    #catppuccin(@lightFlavor);
  }

  /* Auto/system modes follow OS preference */
  @media (prefers-color-scheme: dark) {
    :root[data-mode="auto"],
    :root[data-theme="auto"],
    :root[data-theme="system"],
    :root[data-color-scheme="auto"],
    body[data-mode="auto"],
    body[data-theme="auto"],
    body[data-theme="system"],
    body[data-color-scheme="auto"] {
      #catppuccin(@darkFlavor);
    }
  }
  @media (prefers-color-scheme: light) {
    :root[data-mode="auto"],
    :root[data-theme="auto"],
    :root[data-theme="system"],
    :root[data-color-scheme="auto"],
    body[data-mode="auto"],
    body[data-theme="auto"],
    body[data-theme="system"],
    body[data-color-scheme="auto"] {
      #catppuccin(@lightFlavor);
    }
  }

  #catppuccin(@flavor) {
    #lib.palette();
    #lib.defaults();

${cssVarMappings}
${buildUserstyleThemeBody({
      cssAnalysis,
      mappings,
      accentPlan,
      flavor,
      defaultAccent,
      hoverAngles,
      palette,
      useAltForButtons,
    })}
  }
}

#hslify(@color) {
  @raw: e(%("%s %s% %s%", hue(@color), saturation(@color), lightness(@color)));
}

`;
}

function buildUserstyleThemeBody(params: {
  cssAnalysis?: CSSAnalysisData;
  mappings: ColorMapping[] | MappingOutput;
  accentPlan: AccentPlan;
  flavor: CatppuccinFlavor;
  defaultAccent: AccentColor;
  hoverAngles: {
    links: number;
    buttons: number;
    cards: number;
    badges: number;
    general: number;
  };
  palette: typeof CATPPUCCIN_PALETTES[CatppuccinFlavor];
  useAltForButtons: 'alt1' | 'alt2';
}): string {
  const {
    cssAnalysis,
    mappings,
    accentPlan,
    flavor,
    defaultAccent,
    hoverAngles,
    palette,
    useAltForButtons,
  } = params;

  const surfaces = [palette.base.hex, palette.surface0.hex, palette.surface1.hex, palette.surface2.hex];
  const defaultAccentHex = palette[defaultAccent].hex;
  const linkContrast = surfaces.reduce((m, s) => Math.min(m, contrastRatio(defaultAccentHex, s)), 99);
  const minTextContrast = surfaces.reduce((m, s) => Math.min(m, contrastRatio(palette.text.hex, s)), 99);
  const minBaseContrast = surfaces.reduce((m, s) => Math.min(m, contrastRatio(palette.base.hex, s)), 99);
  const linkFallback = minTextContrast >= minBaseContrast ? '@text' : '@base';
  const altMain = useAltForButtons === 'alt1'
    ? PRECOMPUTED_ACCENTS[flavor][defaultAccent].biAccent1
    : PRECOMPUTED_ACCENTS[flavor][defaultAccent].biAccent2;
  const buttonContrast = contrastRatio(palette[altMain].hex, palette.surface0.hex);

  return `
    /* Accent runtime variables */
    @hover-angle-links: ${hoverAngles.links}deg;
    @hover-angle-buttons: ${hoverAngles.buttons}deg;
    @hover-angle-cards: ${hoverAngles.cards}deg;
    @hover-angle-badges: ${hoverAngles.badges}deg;
    @hover-angle-general: ${hoverAngles.general}deg;
    @link-contrast: ${linkContrast};
    @link-fallback: ${linkFallback};
    @button-contrast: ${buttonContrast};

${buildRuntimeAccentDerivation(flavor, useAltForButtons, defaultAccent)}
    /* Preserve native gradient text */
    [class*="bg-clip-text"],
    [class*="text-transparent"],
    [class*="bg-gradient"],
    [class*="from-"],
    [class*="via-"],
    [class*="to-"],
    .bg-clip-text,
    .text-transparent,
    .text-clip {
      color: revert !important;
      background: revert !important;
      background-color: revert !important;
      background-image: revert !important;
      -webkit-background-clip: revert !important;
      background-clip: revert !important;
      -webkit-text-fill-color: revert !important;
      text-fill-color: revert !important;
    }

${generateFontCSS(cssAnalysis?.fontSettings)}

    body {
      background-color: @base !important;
      color: @text !important;
    }

    a,
    a:visited {
      color: @accent !important;
    }

    a:hover,
    a:focus-visible {
      color: @accent !important;
      text-decoration-color: fade(@accent, 65%);
    }

    button,
    [role="button"],
    input[type="button"],
    input[type="submit"] {
      accent-color: @accent;
    }

    input,
    textarea,
    select {
      color: @text;
      caret-color: @accent;
    }

    code,
    pre,
    .hljs {
      background: @crust;
      color: @text;
    }

    ::selection {
      background: fade(@accent, 30%);
      color: @base;
    }

${generateClassSpecificRules(cssAnalysis, mappings, accentPlan)}
`;
}

function buildRuntimeAccentDerivation(
  flavor: CatppuccinFlavor,
  useAltForButtons: 'alt1' | 'alt2',
  defaultAccent: AccentColor
): string {
  let out = '';

  for (const name of ACCENT_NAMES) {
    const mainSet = PRECOMPUTED_ACCENTS[flavor][name];
    const bi1Set = PRECOMPUTED_ACCENTS[flavor][mainSet.biAccent1];
    const bi2Set = PRECOMPUTED_ACCENTS[flavor][mainSet.biAccent2];
    const palette = CATPPUCCIN_PALETTES[flavor];

    out += `    #derive-accents() when (@accentColor = ${name}) {\n`;
    out += `      @accent: @${name};\n`;
    out += `      @bi-accent1: @${mainSet.biAccent1};\n`;
    out += `      @bi-accent2: @${mainSet.biAccent2};\n`;
    out += `      @bi-accent: @${mainSet.biAccent1};\n`;
    out += `      @alt1-main: @${mainSet.biAccent1};\n`;
    out += `      @alt1-bi1: @${bi1Set.biAccent1};\n`;
    out += `      @alt1-bi2: @${bi1Set.biAccent2};\n`;
    out += `      @alt2-main: @${mainSet.biAccent2};\n`;
    out += `      @alt2-bi1: @${bi2Set.biAccent1};\n`;
    out += `      @alt2-bi2: @${bi2Set.biAccent2};\n`;
    out += `      @ALT_MAIN: @alt${useAltForButtons === 'alt1' ? '1' : '2'}-main;\n`;
    out += `      @ALT_BI: @alt${useAltForButtons === 'alt1' ? '1' : '2'}-bi1;\n`;

    const surfaces = [palette.base.hex, palette.surface0.hex, palette.surface1.hex, palette.surface2.hex];
    const minLink = surfaces.reduce((m, s) => Math.min(m, contrastRatio(palette[name].hex, s)), 99);
    out += `      @link-contrast: ${minLink};\n`;
    const altChoice = useAltForButtons === 'alt1' ? mainSet.biAccent1 : mainSet.biAccent2;
    out += `      @button-contrast: ${contrastRatio(palette[altChoice].hex, palette.surface0.hex)};\n`;
    out += `    }\n`;
  }

  // "Gray" option in UI was previously unhandled.
  out += `    #derive-accents() when (@accentColor = subtext0) {\n`;
  out += `      @accent: @subtext0;\n`;
  out += `      @bi-accent1: @sapphire;\n`;
  out += `      @bi-accent2: @blue;\n`;
  out += `      @bi-accent: @sapphire;\n`;
  out += `      @alt1-main: @sapphire;\n`;
  out += `      @alt1-bi1: @sky;\n`;
  out += `      @alt1-bi2: @blue;\n`;
  out += `      @alt2-main: @blue;\n`;
  out += `      @alt2-bi1: @sapphire;\n`;
  out += `      @alt2-bi2: @lavender;\n`;
  out += `      @ALT_MAIN: @alt${useAltForButtons === 'alt1' ? '1' : '2'}-main;\n`;
  out += `      @ALT_BI: @alt${useAltForButtons === 'alt1' ? '1' : '2'}-bi1;\n`;
  const neutralPalette = CATPPUCCIN_PALETTES[flavor];
  const neutralSurfaces = [
    neutralPalette.base.hex,
    neutralPalette.surface0.hex,
    neutralPalette.surface1.hex,
    neutralPalette.surface2.hex,
  ];
  out += `      @link-contrast: ${neutralSurfaces.reduce((m, s) => Math.min(m, contrastRatio(neutralPalette.subtext0.hex, s)), 99)};\n`;
  const neutralAlt = useAltForButtons === 'alt1' ? neutralPalette.sapphire.hex : neutralPalette.blue.hex;
  out += `      @button-contrast: ${contrastRatio(neutralAlt, neutralPalette.surface0.hex)};\n`;
  out += `    }\n`;

  // Default branch for unexpected values.
  const fallbackSet = PRECOMPUTED_ACCENTS[flavor][defaultAccent];
  const fallbackBi1 = PRECOMPUTED_ACCENTS[flavor][fallbackSet.biAccent1];
  const fallbackBi2 = PRECOMPUTED_ACCENTS[flavor][fallbackSet.biAccent2];
  out += `    #derive-accents() {\n`;
  out += `      @accent: @${defaultAccent};\n`;
  out += `      @bi-accent1: @${fallbackSet.biAccent1};\n`;
  out += `      @bi-accent2: @${fallbackSet.biAccent2};\n`;
  out += `      @bi-accent: @${fallbackSet.biAccent1};\n`;
  out += `      @alt1-main: @${fallbackSet.biAccent1};\n`;
  out += `      @alt1-bi1: @${fallbackBi1.biAccent1};\n`;
  out += `      @alt1-bi2: @${fallbackBi1.biAccent2};\n`;
  out += `      @alt2-main: @${fallbackSet.biAccent2};\n`;
  out += `      @alt2-bi1: @${fallbackBi2.biAccent1};\n`;
  out += `      @alt2-bi2: @${fallbackBi2.biAccent2};\n`;
  out += `      @ALT_MAIN: @alt${useAltForButtons === 'alt1' ? '1' : '2'}-main;\n`;
  out += `      @ALT_BI: @alt${useAltForButtons === 'alt1' ? '1' : '2'}-bi1;\n`;
  out += `    }\n`;
  out += `    #derive-accents();\n`;

  return out;
}

/**
 * Parse font string to array of font families
 * Handles both JSON arrays and single font family strings
 */
function parseFontFamilies(fontStr?: string): string[] {
  if (!fontStr) return [];
  // Try to parse as JSON array first
  try {
    const parsed = JSON.parse(fontStr);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Not JSON, treat as single font family
  }
  return fontStr ? [fontStr] : [];
}

/**
 * Build CSS font-family string from array of font families
 * Deduplicates and properly formats the fallback chain
 */
function buildCSSFontFamily(families: string[]): string {
  if (families.length === 0) return '';
  
  const fontParts: string[] = [];
  const seenFonts = new Set<string>();
  
  families.forEach((family) => {
    // Split by comma and add each part (handles "Font Name", fallback already in family)
    family.split(',').forEach((part) => {
      const trimmed = part.trim();
      if (trimmed && !seenFonts.has(trimmed.toLowerCase())) {
        seenFonts.add(trimmed.toLowerCase());
        fontParts.push(trimmed);
      }
    });
  });
  
  return fontParts.join(', ');
}

/**
 * Generate CSS rules for custom font families
 * Includes Google Fonts import and font-family declarations
 */
function generateFontCSS(fontSettings?: { normalFont?: string; monoFont?: string }): string {
  if (!fontSettings) return '    /* No custom fonts configured */';
  
  const normalFamilies = parseFontFamilies(fontSettings.normalFont);
  const monoFamilies = parseFontFamilies(fontSettings.monoFont);
  
  // If no fonts selected, return empty
  if (normalFamilies.length === 0 && monoFamilies.length === 0) {
    return '    /* No custom fonts configured */';
  }
  
  const lines: string[] = [];
  lines.push('    /* ═══════════════════════════════════════════════════════════════════');
  lines.push('       CUSTOM FONT SETTINGS');
  lines.push('       ═══════════════════════════════════════════════════════════════════ */');
  
  // Add normal text font rules
  if (normalFamilies.length > 0) {
    const normalCSSFamily = buildCSSFontFamily(normalFamilies);
    lines.push('');
    lines.push('    /* Normal text font family */');
    lines.push('    body,');
    lines.push('    p,');
    lines.push('    span,');
    lines.push('    div,');
    lines.push('    li,');
    lines.push('    td,');
    lines.push('    th,');
    lines.push('    label,');
    lines.push('    input:not([type="text"]):not([type="password"]):not([type="email"]):not([type="search"]):not([type="url"]):not([type="tel"]):not([type="number"]),');
    lines.push('    button,');
    lines.push('    select,');
    lines.push('    h1, h2, h3, h4, h5, h6 {');
    lines.push(`      font-family: ${normalCSSFamily} !important;`);
    lines.push('    }');
  }
  
  // Add monospace font rules
  if (monoFamilies.length > 0) {
    const monoCSSFamily = buildCSSFontFamily(monoFamilies);
    lines.push('');
    lines.push('    /* Monospace / code font family */');
    lines.push('    code,');
    lines.push('    pre,');
    lines.push('    kbd,');
    lines.push('    samp,');
    lines.push('    tt,');
    lines.push('    .monospace,');
    lines.push('    [class*="code"],');
    lines.push('    [class*="mono"],');
    lines.push('    [class*="terminal"],');
    lines.push('    [class*="console"],');
    lines.push('    input[type="text"],');
    lines.push('    input[type="password"],');
    lines.push('    input[type="email"],');
    lines.push('    input[type="search"],');
    lines.push('    input[type="url"],');
    lines.push('    input[type="tel"],');
    lines.push('    input[type="number"],');
    lines.push('    textarea,');
    lines.push('    pre[class*="language-"],');
    lines.push('    code[class*="language-"],');
    lines.push('    .hljs,');
    lines.push('    .token,');
    lines.push('    .CodeMirror,');
    lines.push('    .cm-editor,');
    lines.push('    .monaco-editor,');
    lines.push('    .ace_editor {');
    lines.push(`      font-family: ${monoCSSFamily} !important;`);
    lines.push('    }');
  }
  
  return lines.join('\n');
}

/**
 * Generate @import statements for Google Fonts
 * Handles multi-font arrays and deduplicates imports
 */
function generateFontImports(fontSettings?: { normalFont?: string; monoFont?: string }): string {
  if (!fontSettings) return '';
  
  const normalFamilies = parseFontFamilies(fontSettings.normalFont);
  const monoFamilies = parseFontFamilies(fontSettings.monoFont);
  const allFamilies = [...normalFamilies, ...monoFamilies];
  
  if (allFamilies.length === 0) return '';
  
  // Map of known font families to their Google Fonts URLs
  // This covers the most common fonts - full mapping is in constants/fonts.ts
  const googleFontsMap: Record<string, string> = {
    // Sans-serif
    '"Inter", sans-serif': 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap',
    '"Roboto", sans-serif': 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap',
    '"Open Sans", sans-serif': 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap',
    '"Lato", sans-serif': 'https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap',
    '"Montserrat", sans-serif': 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"Poppins", sans-serif': 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"Nunito", sans-serif': 'https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"Andika", sans-serif': 'https://fonts.googleapis.com/css2?family=Andika:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    '"Noto Sans SC", sans-serif': 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100;200;300;400;500;600;700;800;900&display=swap',
    '"Noto Sans TC", sans-serif': 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100;200;300;400;500;600;700;800;900&display=swap',
    '"Noto Sans JP", sans-serif': 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100;200;300;400;500;600;700;800;900&display=swap',
    '"Noto Sans KR", sans-serif': 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;200;300;400;500;600;700;800;900&display=swap',
    '"LXGW WenKai", sans-serif': 'https://fonts.googleapis.com/css2?family=LXGW+WenKai&display=swap',
    '"LXGW WenKai TC", sans-serif': 'https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC&display=swap',
    '"Atkinson Hyperlegible", sans-serif': 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    '"Raleway", sans-serif': 'https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"Work Sans", sans-serif': 'https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"Source Sans 3", sans-serif': 'https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"Ubuntu", sans-serif': 'https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap',
    '"Rubik", sans-serif': 'https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"Quicksand", sans-serif': 'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap',
    '"Mulish", sans-serif': 'https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"DM Sans", sans-serif': 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"IBM Plex Sans", sans-serif': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
    // Serif
    '"Merriweather", serif': 'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=swap',
    '"Playfair Display", serif': 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"Lora", serif': 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap',
    '"Source Serif 4", serif': 'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"Noto Serif", serif': 'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"Noto Serif SC", serif': 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@200;300;400;500;600;700;800;900&display=swap',
    '"Noto Serif TC", serif': 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@200;300;400;500;600;700;800;900&display=swap',
    '"Noto Serif JP", serif': 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@200;300;400;500;600;700;800;900&display=swap',
    '"IBM Plex Serif", serif': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
    // Monospace
    '"Fira Code", monospace': 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap',
    '"JetBrains Mono", monospace': 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap',
    '"Source Code Pro", monospace': 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    '"Roboto Mono", monospace': 'https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
    '"Ubuntu Mono", monospace': 'https://fonts.googleapis.com/css2?family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    '"IBM Plex Mono", monospace': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
    '"Space Mono", monospace': 'https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    '"Inconsolata", monospace': 'https://fonts.googleapis.com/css2?family=Inconsolata:wght@200;300;400;500;600;700;800;900&display=swap',
    '"DM Mono", monospace': 'https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap',
    '"Noto Sans Mono", monospace': 'https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100;200;300;400;500;600;700;800;900&display=swap',
    '"Geist Mono", monospace': 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100;200;300;400;500;600;700;800;900&display=swap',
    '"Anonymous Pro", monospace': 'https://fonts.googleapis.com/css2?family=Anonymous+Pro:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    '"Cousine", monospace': 'https://fonts.googleapis.com/css2?family=Cousine:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    '"Red Hat Mono", monospace': 'https://fonts.googleapis.com/css2?family=Red+Hat+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap',
    '"Martian Mono", monospace': 'https://fonts.googleapis.com/css2?family=Martian+Mono:wght@100;200;300;400;500;600;700;800&display=swap',
  };
  
  const imports: string[] = [];
  const addedUrls = new Set<string>();
  let hasNerdFonts = false;
  let hasSpecialFonts = false;
  
  // Collect Google Fonts imports for all selected fonts
  allFamilies.forEach((family) => {
    const url = googleFontsMap[family];
    if (url && !addedUrls.has(url)) {
      imports.push(`@import url("${url}");`);
      addedUrls.add(url);
    }
    
    // Check for Nerd Fonts
    if (family.includes('Nerd Font')) {
      hasNerdFonts = true;
    }
    
    // Check for special fonts (Iansui, jf open 粉圓)
    if (
      family.includes('Iansui') || 
      family.includes('芫荽') || 
      family.includes('jf-openhuninn') || 
      family.includes('粉圓')
    ) {
      hasSpecialFonts = true;
    }
  });
  
  // Add helpful comments for non-Google fonts
  if (hasNerdFonts) {
    imports.push('/* Note: Nerd Fonts must be installed locally. Download from https://www.nerdfonts.com/ */');
  }
  
  if (hasSpecialFonts) {
    imports.push('/* Note: Iansui and jf open 粉圓 fonts must be installed locally or loaded via CDN */');
  }
  
  // Add indentation since these are inside @-moz-document block
  return imports.length > 0 ? '\n  ' + imports.join('\n  ') + '\n' : '';
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

  mappings.forEach((mapping) => {
    // Defensive check for undefined/null reason
    if (!mapping.reason) {
      return;
    }

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
function generateClassSpecificRules(
  cssAnalysis?: CSSAnalysisData,
  mappings?: ColorMapping[] | MappingOutput,
  accentPlan?: AccentPlan
): string {
  const mappingRoleGuesses = Array.isArray(mappings) ? buildMappingRoleGuesses(mappings) : [];
  const grouped = resolveGroupedAnalysis(cssAnalysis, mappingRoleGuesses);
  if (!grouped) {
    return '    /* No class-specific analysis available */';
  }

  const lines: string[] = [];
  const colorCycle = accentPlan?.classColorCycle || ['@accent', '@bi-accent1', '@bi-accent2'];
  const roleGuessMap = buildRoleGuessMap([...(cssAnalysis?.aiRoleGuesses || []), ...mappingRoleGuesses]);
  const seenSelectors = new Set<string>();

  const hintColorFromClass = (className?: string) => {
    if (!className) return undefined;
    const lower = normalizeClassName(className).toLowerCase();
    // Navigation / secondary UI
    if (/(nav|menu|tab|secondary|subnav|sidebar|pill-nav)/.test(lower)) return '@bi-accent1';
    // Badges / tags / chips
    if (/(badge|tag|chip|pill|label)/.test(lower)) return '@bi-accent2';
    // Status semantics
    if (/(success|ok|check)/.test(lower)) return '@green';
    if (/(warn|warning|caution)/.test(lower)) return '@yellow';
    if (/(danger|error|alert|critical)/.test(lower)) return '@red';
    if (/(info|notice)/.test(lower)) return '@sapphire';
    return undefined;
  };

  const seedOffset = accentPlan?.seed ? accentPlan.seed % colorCycle.length : 0;

  const pickColorForRole = (roles?: string[], fallbackIdx?: number) => {
    if (roles && roles.length > 0) {
      const set = new Set(roles.map((r) => r.toLowerCase()));
      if (set.has('primary') || set.has('cta') || set.has('accent')) return '@accent';
      if (set.has('secondary') || set.has('nav') || set.has('link')) return '@bi-accent1';
      if (set.has('badge') || set.has('tag') || set.has('tertiary')) return '@bi-accent2';
      if (set.has('danger') || set.has('error') || set.has('alert')) return '@red';
      if (set.has('warning')) return '@yellow';
      if (set.has('success')) return '@green';
      if (set.has('info')) return '@sapphire';
    }
    if (typeof fallbackIdx === 'number') {
      return colorCycle[Math.abs(fallbackIdx) % colorCycle.length];
    }
    return '@accent';
  };

  const getColor = (idx: number, className?: string) => {
    const normalized = normalizeClassName(className || '');
    if (normalized) {
      const roleColor = pickColorForRole(roleGuessMap[normalized], idx);
      if (roleColor) return roleColor;
      const hintColor = hintColorFromClass(normalized);
      if (hintColor) return hintColor;
    }
    return colorCycle[(Math.abs(idx) + seedOffset) % colorCycle.length];
  };

  const selectClass = (name: string): string | null => {
    const selector = toClassSelector(name);
    if (!selector || seenSelectors.has(selector)) return null;
    seenSelectors.add(selector);
    return selector;
  };

  // Helper to check if a mapping indicates text-only/invisible background
  const isTextOnlyMapping = (className: string): boolean => {
    if (!mappings || !Array.isArray(mappings)) return false;
    const normalized = normalizeClassName(className).toLowerCase();
    return mappings.some((m: ColorMapping) => {
      const mappingSelectors = Array.isArray((m as any).selectors)
        ? ((m as any).selectors as string[]).map((v) => normalizeClassName(v).toLowerCase())
        : [];
      const matchesSelector = mappingSelectors.includes(normalized);
      const matchesReason = m.reason?.toLowerCase().includes(normalized);
      return Boolean((matchesSelector || matchesReason) && m.isTextOnly);
    });
  };

  // Helper to get appropriate angle variable for a class
  const getHoverAngleVar = (elementType: 'button' | 'link' | 'card' | 'badge'): string => {
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
    lines.push('    /* Site-specific button selectors */');
    grouped.buttons.slice(0, 100).forEach((btn, index) => {
      const selector = selectClass(btn.className);
      if (!selector) return;
      const isTextOnly = isTextOnlyMapping(btn.className);
      const angleVar = getHoverAngleVar('button');
      const colorVar = getColor(index, btn.className);
      const gradientInfo = getGradientForColor(colorVar);
      const gradientCompanion = gradientInfo.hover;
      const activeCompanion = gradientInfo.active;

      lines.push(`    ${selector} {`);
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
        lines.push(`        background-image: linear-gradient(${angleVar}, ${activeCompanion} 0%, ${colorVar} 50%, ${activeCompanion} 100%) !important;`);
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
    lines.push('    /* Site-specific link selectors */');
    grouped.links.slice(0, 100).forEach((link, linkIndex) => {
      const cls = selectClass(link.className);
      if (!cls) return;
      const normalized = normalizeClassName(link.className);
      const angleVar = getHoverAngleVar('link');
      const linkColor = getColor(linkIndex + 1, normalized);
      const linkGradient = getGradientForColor(linkColor);

      // anchor with class, and anchor inside element with class
      lines.push(`    a${cls}, ${cls} a {`);
      lines.push('      color: ' + linkColor + ' !important;');
      lines.push('    }');
      lines.push(`    a${cls}:hover, ${cls} a:hover {`);
      lines.push('      @supports ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {');
      lines.push(`        background: linear-gradient(${angleVar}, ${linkColor} 0%, ${linkGradient.hover} 100%) !important;`);
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
      lines.push('      @supports not ((-webkit-background-clip: text) and (-webkit-text-fill-color: transparent)) {');
      lines.push('        & when (@link-contrast < 4.5) {');
      lines.push('          color: @link-fallback !important;');
      lines.push('        }');
      lines.push('        & when not (@link-contrast < 4.5) {');
      lines.push('          color: ' + linkColor + ' !important;');
      lines.push('        }');
      lines.push('      }');
      lines.push('    }');
      lines.push(`    a${cls}:active, ${cls} a:active, a${cls}.active, ${cls} a.active {`);
      lines.push('      color: ' + linkGradient.active + ';');
      lines.push('    }');
    });
  }

  // Background classes
  if (grouped.backgrounds && grouped.backgrounds.length > 0) {
    lines.push('');
    lines.push('    /* Site-specific background selectors */');
    grouped.backgrounds.slice(0, 100).forEach((bg, bgIndex) => {
      const selector = selectClass(bg.className);
      if (!selector) return;
      const bgColor = getColor(bgIndex + 2);
      lines.push(`    ${selector} {`);
      lines.push('      background: fade(' + bgColor + ', 35%) !important;');
      lines.push('    }');
    });
  }

  // Text classes
  if (grouped.text && grouped.text.length > 0) {
    lines.push('');
    lines.push('    /* Site-specific text selectors */');
    grouped.text.slice(0, 100).forEach((txt, textIndex) => {
      const selector = selectClass(txt.className);
      if (!selector) return;
      const textColor = getColor(textIndex + 3, txt.className);
      lines.push(`    ${selector} {`);
      lines.push('      color: ' + textColor + ' !important;');
      lines.push('    }');
    });
  }

  // Border classes – allow color-only overrides to reflect AI findings
  if (grouped.borders && grouped.borders.length > 0) {
    lines.push('');
    lines.push('    /* Site-specific border selectors */');
    grouped.borders.slice(0, 100).forEach(br => {
      const selector = selectClass(br.className);
      if (!selector) return;
      lines.push(`    ${selector} {`);
      lines.push('      border-color: @overlay1 !important;');
      lines.push('    }');
      lines.push(`    ${selector}:hover {`);
      lines.push('      border-color: @alt1-main !important;');
      lines.push('    }');
    });
  }

  const badgeToggle = cssAnalysis?.accentToggles?.badgeCardTable ?? true;
  const hasExplicitGroups =
    (grouped.buttons?.length || 0) +
    (grouped.links?.length || 0) +
    (grouped.backgrounds?.length || 0) +
    (grouped.text?.length || 0) +
    (grouped.borders?.length || 0) > 0;

  if (badgeToggle && !hasExplicitGroups) {
    // Accent plan coverage for common badge/card/table elements even without explicit grouping
    lines.push('');
    lines.push('    /* Accent plan for badges, cards, and tables (deterministic rotation) */');
    const badgeColor = getColor(0);
    const badgeGradient = getGradientForColor(badgeColor);
    lines.push('    .badge, .tag, .chip, .pill {');
    lines.push('      color: ' + badgeColor + ' !important;');
    lines.push('      background: fade(' + badgeColor + ', 18%) !important;');
    lines.push('      border-color: fade(' + badgeColor + ', 35%) !important;');
    lines.push('    }');
    lines.push('    .badge:hover, .tag:hover, .chip:hover, .pill:hover {');
    lines.push(`      background-image: linear-gradient(@hover-angle-badges, fade(${badgeColor}, 25%), fade(${badgeGradient.hover}, 25%)) !important;`);
    lines.push('      color: @text !important;');
    lines.push('    }');

    const cardColor = getColor(1);
    lines.push('    .card, .panel, .container, .box, .paper, .table, table {');
    lines.push('      border-color: @overlay1 !important;');
    lines.push('      background: fade(@surface0, 92%) !important;');
    lines.push('    }');
    lines.push('    .card:hover, .panel:hover, .container:hover, .box:hover, .paper:hover {');
    lines.push(`      background-image: linear-gradient(@hover-angle-cards, fade(${cardColor}, 8%), fade(${cardColor}, 3%)) !important;`);
    lines.push('    }');

    const tableAccent = getColor(2);
    lines.push('    table thead {');
    lines.push('      background: fade(' + tableAccent + ', 14%) !important;');
    lines.push('      color: @text !important;');
    lines.push('    }');
    lines.push('    table tbody tr:hover {');
    lines.push(`      background-image: linear-gradient(@hover-angle-general, fade(${tableAccent}, 10%), fade(${tableAccent}, 6%)) !important;`);
    lines.push('    }');
  }

  const alertsToggle = cssAnalysis?.accentToggles?.alerts ?? true;
  if (alertsToggle && !hasExplicitGroups) {
    lines.push('');
    lines.push('    /* Alerts / notifications accent coverage */');
    const alertColor = getColor(3);
    const alertGradient = getGradientForColor(alertColor);
    lines.push('    .alert, .notification, .toast, .banner, .notice {');
    lines.push('      background: fade(' + alertColor + ', 20%) !important;');
    lines.push('      color: @text !important;');
      lines.push('      border-color: fade(' + alertColor + ', 35%) !important;');
    lines.push('    }');
    lines.push('    .alert:hover, .notification:hover, .toast:hover, .banner:hover, .notice:hover {');
    lines.push(`      background-image: linear-gradient(@hover-angle-general, fade(${alertColor}, 24%), fade(${alertGradient.hover}, 24%)) !important;`);
    lines.push('    }');
  }

  return lines.join('\n');
}

function getGradientForColor(colorVar: string): { hover: string; active: string } {
  switch (colorVar) {
    case '@bi-accent1':
      return { hover: '@alt1-bi1', active: '@alt1-bi1' };
    case '@bi-accent2':
      return { hover: '@alt2-bi1', active: '@alt2-bi1' };
    default:
      return { hover: '@bi-accent1', active: '@bi-accent1' };
  }
}

function buildRoleGuessMap(guesses?: Array<{ className: string; role: string; confidence?: number }>) {
  const map: Record<string, string[]> = {};
  (guesses || []).forEach((g) => {
    const name = normalizeClassName(g.className || '');
    if (!name) return;
    if (!map[name]) map[name] = [];
    const role = (g.role || '').toLowerCase();
    if (!role) return;
    if (!map[name].includes(role)) {
      map[name].push(role);
    }
  });
  return map;
}

function buildMappingRoleGuesses(mappings: ColorMapping[]): Array<{ className: string; role: string; confidence?: number }> {
  const guesses: Array<{ className: string; role: string; confidence?: number }> = [];
  const seen = new Set<string>();

  mappings.forEach((mapping) => {
    const role = inferRoleFromMapping(mapping);
    const selectors = Array.isArray((mapping as any).selectors) ? ((mapping as any).selectors as string[]) : [];
    selectors.forEach((selector) => {
      extractClassNamesFromSelector(selector).forEach((className) => {
        const key = `${className}|${role}`;
        if (seen.has(key)) return;
        seen.add(key);
        guesses.push({ className, role, confidence: 0.75 });
      });
    });
  });

  return guesses;
}

function inferRoleFromMapping(mapping: ColorMapping): string {
  const raw = [
    mapping.reason,
    (mapping as any).context,
    (mapping as any).to,
    mapping.catppuccinColor,
    Array.isArray((mapping as any).cssProperties) ? ((mapping as any).cssProperties as string[]).join(' ') : '',
    Array.isArray((mapping as any).selectors) ? ((mapping as any).selectors as string[]).join(' ') : '',
  ].join(' ').toLowerCase();

  if (/(danger|error|alert|destructive|critical)/.test(raw)) return 'danger';
  if (/(warn|warning|caution)/.test(raw)) return 'warning';
  if (/(success|ok|positive)/.test(raw)) return 'success';
  if (/(info|notice|help|hint)/.test(raw)) return 'info';
  if (/(badge|tag|chip|pill|label)/.test(raw)) return 'badge';
  if (/(card|panel|surface)/.test(raw)) return 'panel';
  if (/(background|canvas|container)/.test(raw)) return 'background';
  if (/(nav|menu|breadcrumb|tabbar|sidebar)/.test(raw)) return 'nav';
  if (/(link|anchor|href)/.test(raw)) return 'link';
  if (/(button|btn|cta|submit|action|primary)/.test(raw)) return 'primary';
  return 'text';
}

function resolveGroupedAnalysis(
  cssAnalysis?: CSSAnalysisData,
  extraGuesses: Array<{ className: string; role: string; confidence?: number }> = []
): CSSAnalysisData['grouped'] | undefined {
  const sourceGrouped = cssAnalysis?.grouped;

  const groups = {
    buttons: [] as Array<{ className: string; properties: any[] }>,
    links: [] as Array<{ className: string; properties: any[] }>,
    backgrounds: [] as Array<{ className: string; properties: any[] }>,
    text: [] as Array<{ className: string; properties: any[] }>,
    borders: [] as Array<{ className: string; properties: any[] }>,
  };
  const addedByGroup = {
    buttons: new Set<string>(),
    links: new Set<string>(),
    backgrounds: new Set<string>(),
    text: new Set<string>(),
    borders: new Set<string>(),
  };

  const add = (target: keyof typeof groups, className: string) => {
    const normalized = normalizeClassName(className);
    if (!normalized || addedByGroup[target].has(normalized)) return;
    groups[target].push({ className: normalized, properties: [] });
    addedByGroup[target].add(normalized);
  };

  if (sourceGrouped) {
    sourceGrouped.buttons.forEach((entry) => add('buttons', entry.className));
    sourceGrouped.links.forEach((entry) => add('links', entry.className));
    sourceGrouped.backgrounds.forEach((entry) => add('backgrounds', entry.className));
    sourceGrouped.text.forEach((entry) => add('text', entry.className));
    sourceGrouped.borders.forEach((entry) => add('borders', entry.className));
  }

  const allGuesses = [...(cssAnalysis?.aiRoleGuesses || []), ...extraGuesses];
  allGuesses.forEach((guess) => {
    const role = (guess.role || '').toLowerCase();
    if (['primary', 'secondary', 'tertiary', 'cta'].includes(role)) {
      add('buttons', guess.className);
    } else if (['link', 'nav'].includes(role)) {
      add('links', guess.className);
    } else if (['background', 'card', 'panel', 'badge', 'tag'].includes(role)) {
      add('backgrounds', guess.className);
    } else if (['danger', 'warning', 'success', 'info'].includes(role)) {
      add('borders', guess.className);
    } else {
      add('text', guess.className);
    }
  });

  const total =
    groups.buttons.length +
    groups.links.length +
    groups.backgrounds.length +
    groups.text.length +
    groups.borders.length;

  return total > 0 ? groups : undefined;
}

function normalizeClassName(value: string): string {
  const input = value.trim();
  if (!input) return '';

  const classes = extractClassNamesFromSelector(input);
  if (classes.length > 0) {
    return classes[0];
  }

  const first = input.split(/\s+/)[0];
  return first.replace(/^[.#]/, '').replace(/\\/g, '');
}

function extractClassNamesFromSelector(selector: string): string[] {
  const source = selector.trim();
  if (!source) return [];

  const classes: string[] = [];
  const classRegex = /\.((?:\\.|[^\s>+~#.,:[\]()])+)/g;
  let match: RegExpExecArray | null = null;
  while ((match = classRegex.exec(source)) !== null) {
    const candidate = match[1].replace(/\\/g, '');
    if (!candidate) continue;
    classes.push(candidate);
  }

  if (classes.length > 0) return classes;
  if (/^[a-zA-Z0-9_-]+$/.test(source)) return [source];
  return [];
}

function escapeCssIdentifier(value: string): string {
  const cssEscape = (globalThis as any)?.CSS?.escape;
  if (typeof cssEscape === 'function') {
    return cssEscape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

function toClassSelector(className: string): string | null {
  const normalized = normalizeClassName(className);
  if (!normalized) return null;
  if (normalized.length > 120) return null;
  return `.${escapeCssIdentifier(normalized)}`;
}
