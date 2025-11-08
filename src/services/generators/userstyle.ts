import type { ColorMapping, AccentColor, CatppuccinFlavor } from '../../types/catppuccin';
import type { MappingOutput, RoleMap, DerivedScales } from '../../types/theme';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { calculateTriadicAccents, calculateBiAccent } from '../../utils/color-analysis';

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
  const biAccent = calculateBiAccent(defaultAccent, palette);

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
    /* Main accents (used for static colors before interactions) */
    @co-accent1: @${triadicColors.coAccent1};  /* First triadic companion */
    @co-accent2: @${triadicColors.coAccent2};  /* Second triadic companion */

    /* Bi-accent (used for smooth gradients with main accent) */
    /* Most similar color to @accent, creating elegant transitions */
    @bi-accent: @${biAccent};  /* Similar to ${defaultAccent} for gradients */

    /* Custom styling rules */
    /* Add website-specific color overrides here */

    /* Background colors */
    body {
      background: @base;
      color: @text;
    }

    /* Links - elegant gradient with bi-accent for smooth color transition */
    a {
      color: @accent;
      text-decoration-color: @accent;

      &:hover {
        background: linear-gradient(90deg, @accent 0%, @bi-accent 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        transition: all 0.3s ease;
      }
    }

    /* Buttons - smooth gradients using bi-accent for elegant appearance */
    button,
    input[type="button"],
    input[type="submit"] {
      background: @surface0;
      color: @accent;
      border: 1px solid @accent;

      &:hover {
        background: linear-gradient(135deg, @accent 0%, @bi-accent 100%);
        color: @base;
        border-color: @bi-accent;
        transition: all 0.3s ease;
      }

      &:active {
        background: @accent;
        border-color: @accent;
      }
    }

    /* Class-specific styling (from CSS analysis) */
    /* These rules will be added if directory analysis is used */
${generateClassSpecificRules(cssAnalysis)}

    /* Input fields */
    input,
    textarea,
    select {
      background: @surface0;
      color: @text;
      border-color: @overlay0;

      &:focus {
        border-color: @accent;
      }
    }

    /* Code blocks */
    code,
    pre {
      background: @crust;
      color: @text;
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
      lines.push(`      border: 1px solid @accent;`);
      lines.push(``);
      lines.push(`      &:hover {`);
      lines.push(`        background: linear-gradient(135deg, @accent 0%, @co-accent1 100%) !important;`);
      lines.push(`        color: @base !important;`);
      lines.push(`        border-color: @co-accent1 !important;`);
      lines.push(`        transition: all 0.3s ease !important;`);
      lines.push(`      }`);
      lines.push(``);
      lines.push(`      &:active {`);
      lines.push(`        background: linear-gradient(135deg, @co-accent1 0%, @co-accent2 100%) !important;`);
      lines.push(`        border-color: @co-accent2 !important;`);
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
      lines.push(`        background: linear-gradient(90deg, @accent 0%, @co-accent1 50%, @co-accent2 100%);`);
      lines.push(`        -webkit-background-clip: text;`);
      lines.push(`        -webkit-text-fill-color: transparent;`);
      lines.push(`        background-clip: text;`);
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
