import type { ColorMapping } from '../../types/catppuccin';

export interface UserStyleMetadata {
  name: string;
  namespace: string;
  homepageURL: string;
  version: string;
  description: string;
  domain: string;
}

export function generateUserStyle(
  mappings: ColorMapping[],
  websiteUrl: string,
  metadata?: Partial<UserStyleMetadata>
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

  // Group mappings by purpose
  const colorMap = new Map<string, string>();
  mappings.forEach(m => {
    colorMap.set(m.originalColor, m.catppuccinColor);
  });

  // Generate CSS variable mappings
  const cssVarMappings = generateCSSVariableMappings(mappings);

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

    /* Custom styling rules */
    /* Add website-specific color overrides here */

    /* Background colors */
    body {
      background: @base;
      color: @text;
    }

    /* Links */
    a {
      color: @accent;
      &:hover {
        color: lighten(@accent, 10%);
      }
    }

    /* Buttons */
    button,
    input[type="button"],
    input[type="submit"] {
      background: @accent;
      color: @base;
      border-color: @accent;

      &:hover {
        background: lighten(@accent, 10%);
      }
    }

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
