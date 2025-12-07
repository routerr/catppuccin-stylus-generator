/**
 * Theme Generator V4 - Simplified generator using SiteSignature system.
 *
 * This generator produces LESS code for Stylus UserCSS format,
 * using the new SiteSignature and MappingResult from the analysis engine.
 */

import type {
  SiteSignature,
  MappingResult,
  ColorMapping,
  GenerationConfig,
  GeneratedThemeOutput,
} from "../../types/analysis";
import type { AccentColor, CatppuccinFlavor } from "../../types/catppuccin";
import { FLAVORS, ACCENT_COLORS } from "../../constants/catppuccin-colors";

// ============================================================================
// USERSTYLE HEADER
// ============================================================================

/**
 * Build UserCSS metadata header.
 */
function buildHeader(
  domain: string,
  defaultFlavor: CatppuccinFlavor = "mocha",
  defaultAccent: AccentColor = "blue"
): string {
  const now = new Date().toISOString().split("T")[0];

  // Build flavor options with * on the default
  const flavorOptions = FLAVORS.map((f) => {
    const isDefault = f.name === defaultFlavor;
    return `"${f.name}:${f.displayName}${isDefault ? "*" : ""}"`;
  }).join(", ");

  // Build accent options with * on the default
  const accentOptions = ACCENT_COLORS.map((a) => {
    const isDefault = a.name === defaultAccent;
    return `"${a.name}:${a.displayName}${isDefault ? "*" : ""}"`;
  }).join(", ");

  return `/* ==UserStyle==
@name Catppuccin for ${domain}
@namespace github.com/catppuccin/userstyles/styles/${domain.replace(/\./g, "-")}
@homepageURL https://github.com/catppuccin/userstyles
@version 1.0.0
@description Soothing pastel theme for ${domain} (generated ${now})
@author Catppuccin Stylus Generator
@license MIT

@preprocessor less
@var select lightFlavor "Light Flavor" [${flavorOptions}]
@var select darkFlavor "Dark Flavor" [${flavorOptions}]
@var select accentColor "Accent" [${accentOptions}]
==/UserStyle== */
`;
}

// ============================================================================
// CATPPUCCIN PALETTE LIBRARY
// ============================================================================

/**
 * Build the official lib.less import.
 */
function buildPaletteLibrary(): string {
  return `@import "https://userstyles.catppuccin.com/lib/lib.less";
`;
}

// ============================================================================
// CSS GENERATION FROM MAPPINGS
// ============================================================================

/**
 * Build CSS variable rules from color mappings (inside #catppuccin mixin).
 */
function buildMappingRules(
  mappings: ColorMapping[],
  _signature: SiteSignature
): string {
  const lines: string[] = [];
  lines.push("    // Color mappings from analysis");

  // Group mappings by role
  const roleToToken = new Map<string, string>();
  for (const mapping of mappings) {
    roleToToken.set(mapping.role, mapping.catppuccinToken);
  }

  // Generate CSS variable style rules based on semantic roles
  if (roleToToken.has("background.primary")) {
    lines.push(`    --bg-primary: @${roleToToken.get("background.primary")};`);
  }
  if (roleToToken.has("background.secondary")) {
    lines.push(
      `    --bg-secondary: @${roleToToken.get("background.secondary")};`
    );
  }
  if (roleToToken.has("text.primary")) {
    lines.push(`    --text-primary: @${roleToToken.get("text.primary")};`);
  }
  if (roleToToken.has("accent.brand")) {
    lines.push(`    --accent-brand: @${roleToToken.get("accent.brand")};`);
  }

  return lines.join("\n");
}

/**
 * Build role-based fallback rules (inside #catppuccin mixin).
 *
 * Implements 4 design principles:
 * 1. Preserve transparent backgrounds
 * 2. Accent-colored text with bi-accent gradient hover
 * 3. Skip background edits for elements without borders/distinct backgrounds
 * 4. 60/20/20 accent distribution (primary, biAccent1, biAccent2)
 */
function buildFallbackRules(biAccents: [AccentColor, AccentColor]): string {
  const [biAccent1, biAccent2] = biAccents;

  return `
    // =========================================================================
    // Base styling (Principle 1 & 3: Only style elements with visible backgrounds)
    // =========================================================================
    
    // Root background - only for main container elements
    html, body {
      background-color: @base;
      color: @text;
    }

    // =========================================================================
    // Accent Text with Gradient Hover (Principle 2)
    // Main accent for links and primary interactive text
    // =========================================================================
    
    // Primary accent (60%) - Links and primary text
    a, a:link, a:visited {
      color: @accent;
    }
    
    // Bi-accent gradient on hover for accent-colored elements
    a:hover, a:focus {
      background: linear-gradient(135deg, @accent 0%, @${biAccent1} 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      text-decoration: none;
    }

    // =========================================================================
    // 60/20/20 Accent Distribution (Principle 4)
    // - Primary accent (60%): links, primary buttons, focus states
    // - Secondary bi-accent (20%): secondary buttons, badges, labels
    // - Tertiary bi-accent (20%): hover states, card accents, borders
    // =========================================================================
    
    // Primary accent (60%) - Primary buttons and interactive elements
    button.primary, .btn-primary, [data-primary], .cta {
      background-color: @accent;
      color: @crust;
      border-color: @accent;
    }
    button.primary:hover, .btn-primary:hover {
      background: linear-gradient(135deg, @accent 0%, @${biAccent1} 100%);
    }

    // Secondary accent (20%) - Secondary buttons, badges, labels
    button.secondary, .btn-secondary, .badge, .tag, .label, .chip {
      background-color: @${biAccent1};
      color: @crust;
      border-color: @${biAccent1};
    }
    button.secondary:hover, .btn-secondary:hover, .badge:hover, .tag:hover {
      background: linear-gradient(135deg, @${biAccent1} 0%, @accent 100%);
    }

    // Tertiary accent (20%) - Highlights, card accents, active tabs
    .highlight, .active, .selected, [aria-selected="true"] {
      border-color: @${biAccent2};
      box-shadow: inset 0 0 0 1px @${biAccent2};
    }
    .card:hover, .panel:hover, .tile:hover {
      border-color: @${biAccent2};
    }

    // =========================================================================
    // Default button styling (Principle 3: preserve non-styled elements)
    // Only style buttons that have visible backgrounds/borders
    // =========================================================================
    
    button, .btn, [role="button"] {
      background-color: @surface0;
      color: @text;
      border-color: @surface1;
    }
    button:hover, .btn:hover, [role="button"]:hover {
      background-color: @surface1;
      border-color: @${biAccent2};
    }

    // =========================================================================
    // Input styling with accent focus
    // =========================================================================
    
    input, textarea, select {
      background-color: @surface0;
      color: @text;
      border-color: @surface1;
    }
    input:focus, textarea:focus, select:focus {
      border-color: @accent;
      outline-color: @accent;
      box-shadow: 0 0 0 2px fade(@accent, 25%);
    }

    // =========================================================================
    // Surface elements (Principle 3: only if has border/distinct background)
    // =========================================================================
    
    // Cards and panels - only style if they have borders
    .card, .panel, .box, .tile, [class*="card"], [class*="panel"] {
      background-color: @surface0;
      border-color: @surface1;
    }

    // Modals and overlays
    .modal, .dialog, .popup, [role="dialog"] {
      background-color: @mantle;
      border-color: @surface0;
    }

    // =========================================================================
    // Semantic colors (always apply)
    // =========================================================================
    
    .error, .danger, [class*="error"], [class*="danger"] { color: @red; }
    .warning, [class*="warning"] { color: @yellow; }
    .success, [class*="success"] { color: @green; }
    .info, [class*="info"] { color: @blue; }

    // =========================================================================
    // Navigation with accent distribution
    // =========================================================================
    
    nav a, .nav-link, .menu-item {
      color: @subtext0;
    }
    nav a:hover, .nav-link:hover, .menu-item:hover {
      color: @accent;
    }
    nav a.active, .nav-link.active, .menu-item.active {
      color: @accent;
      border-bottom-color: @${biAccent1};
    }

    // =========================================================================
    // Code blocks
    // =========================================================================
    
    code, pre, .code, .syntax {
      background-color: @mantle;
      color: @text;
      border-color: @surface0;
    }

    // =========================================================================
    // Tables
    // =========================================================================
    
    table, .table {
      border-color: @surface1;
    }
    th {
      background-color: @surface0;
      color: @text;
      border-color: @surface1;
    }
    tr:hover {
      background-color: fade(@${biAccent2}, 10%);
    }
`;
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

/**
 * Generate a complete theme from SiteSignature and MappingResult.
 */
export function generateTheme(
  signature: SiteSignature,
  mappings: MappingResult,
  config?: Partial<GenerationConfig>
): GeneratedThemeOutput {
  const domain = config?.domain || signature.domain;
  const defaultFlavor: CatppuccinFlavor =
    signature.colorProfile.luminanceMode === "light" ? "latte" : "mocha";
  const defaultAccent = mappings.chosenAccent;

  const variableRules = buildMappingRules(mappings.mappings, signature);
  const fallbackRules = buildFallbackRules(mappings.biAccents);

  // Generate in official catppuccin userstyles format
  const lessCode = `${buildHeader(domain, defaultFlavor, defaultAccent)}
${buildPaletteLibrary()}
@-moz-document domain("${domain}") {
  :root {
    #catppuccin(@darkFlavor);
  }

  @media (prefers-color-scheme: light) {
    :root {
      #catppuccin(@lightFlavor);
    }
  }

  #catppuccin(@flavor) {
    #lib.palette();

${variableRules}
${fallbackRules}
  }
}
`;

  return {
    lessCode,
    stats: {
      rulesGenerated: mappings.mappings.length + 5, // mappings + fallbacks
      colorsReplaced: mappings.mappings.length,
      selectorsTargeted: [...signature.selectorMap.values()].reduce(
        (sum, s) => sum + s.length,
        0
      ),
    },
  };
}

/**
 * Generate theme with default config.
 */
export function generateDefaultTheme(
  signature: SiteSignature,
  mappings: MappingResult
): GeneratedThemeOutput {
  return generateTheme(signature, mappings, {
    domain: signature.domain,
    includeFlavors: true,
    includeAccents: true,
    enableGradients: true,
    coverageLevel: "standard",
  });
}
