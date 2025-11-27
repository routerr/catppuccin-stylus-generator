/**
 * UserStyle Generator V3 - Dynamic Multi-Flavor & Cascading Gradient System
 *
 * Features:
 * - Dynamic flavor/accent selection (no regeneration needed)
 * - Cascading bi-accent gradient system (3 levels)
 * - Higher page coverage with comprehensive gradient patterns
 * - Full support for all 4 flavors × 14 accents = 56 combinations
 */

import type {
  DeepAnalysisResult,
  MappingResult,
  GeneratedTheme,
  VariableMapping,
  SelectorMapping,
  SVGColorMapping,
  ProcessedSVG,
  DesignSystemType,
} from "../../types/deep-analysis";
import type {
  CatppuccinFlavor,
  CatppuccinColor,
  AccentColor,
} from "../../types/catppuccin";
import { PRECOMPUTED_ACCENTS } from "../../utils/accent-schemes";
import { generateSVGLESS } from "../../utils/deep-analysis/svg-analyzer";
import {
  CATPPUCCIN_PALETTES,
  FLAVORS,
  ACCENT_NAMES,
} from "../../constants/catppuccin-colors";

export interface UserstyleV3Config {
  url: string;
  defaultFlavor?: CatppuccinFlavor;
  defaultAccent?: AccentColor;
  version?: string;
  includeComments?: boolean;
  enableCascadingGradients?: boolean;
  gradientCoverage?: "minimal" | "standard" | "comprehensive";
}

const INDENT = "  ";
const SECTION_COMMENT =
  "/* -------------------------------------------------------------------------- */";

/**
 * Generate a dynamic multi-flavor UserStyle with cascading gradient support
 */
export function generateUserstyleV3(
  analysis: DeepAnalysisResult,
  mappings: MappingResult,
  config: UserstyleV3Config
): GeneratedTheme {
  const includeComments = config.includeComments ?? true;
  const version = config.version ?? "v3-dynamic";
  const hostname = safeHostname(config.url);
  const enableCascading = config.enableCascadingGradients ?? true;
  const gradientCoverage = config.gradientCoverage ?? "comprehensive";
  const defaultFlavor = config.defaultFlavor || "mocha";
  const mode = analysis.mode;
  const lines: string[] = [];

  // Build dynamic sections
  const sections = {
    accentSchemes: buildAccentSchemeLibrary(includeComments),
    variables: buildDynamicVariableSection(
      mappings.variableMappings,
      includeComments
    ),
    svgs: buildDynamicSvgSection(
      mappings.svgMappings,
      mappings.processedSVGs,
      includeComments
    ),
    selectors: buildDynamicSelectorSection(
      mappings.selectorMappings,
      includeComments,
      config
    ),
    gradients: buildCascadingGradientSection(
      mappings.selectorMappings,
      gradientCoverage,
      enableCascading,
      includeComments
    ),
    fallbacks: buildDynamicFallbackSection(gradientCoverage, includeComments),
  };

  // Main document
  lines.push("/* ==UserStyle==");
  lines.push(`@name ${hostname} Catppuccin`);
  lines.push(`@namespace github.com/catppuccin/userstyles/styles/${hostname}`);
  lines.push(
    `@homepageURL https://github.com/catppuccin/userstyles/tree/main/styles/${hostname}`
  );
  lines.push(`@version ${new Date().toISOString().split("T")[0]}`);
  lines.push(
    `@updateURL https://github.com/catppuccin/userstyles/raw/main/styles/${hostname}/catppuccin.user.less`
  );
  lines.push(
    `@supportURL https://github.com/catppuccin/userstyles/issues?q=is%3Aopen+is%3Aissue+label%3A${hostname}`
  );
  lines.push(`@description Soothing pastel theme for ${hostname}`);
  lines.push(`@author Catppuccin`);
  lines.push(`@license MIT`);
  lines.push("");
  lines.push(`@preprocessor less`);
  lines.push(
    `@var select lightFlavor "Light Flavor" ["latte:Latte*", "frappe:Frappé", "macchiato:Macchiato", "mocha:Mocha"]`
  );
  lines.push(
    `@var select darkFlavor "Dark Flavor" ["latte:Latte", "frappe:Frappé", "macchiato:Macchiato", "mocha:Mocha*"]`
  );
  lines.push(
    `@var select accentColor "Accent" ["rosewater:Rosewater", "flamingo:Flamingo", "pink:Pink", "mauve:Mauve*", "red:Red", "maroon:Maroon", "peach:Peach", "yellow:Yellow", "green:Green", "teal:Teal", "blue:Blue", "sapphire:Sapphire", "sky:Sky", "lavender:Lavender", "subtext0:Gray"]`
  );
  lines.push("==/UserStyle== */");
  lines.push("");
  lines.push('@import "https://userstyles.catppuccin.com/lib/lib.less";');
  lines.push("");

  lines.push(`@-moz-document domain("${hostname || "*"}") {`);
  lines.push("");

  // Flavor application mixin
  lines.push(`${INDENT}#apply-catppuccin(@flavorName, @accentName) {`);
  lines.push(`${INDENT}${INDENT}/* Load official Catppuccin palette */`);
  lines.push(`${INDENT}${INDENT}#catppuccin(@flavorName, @accentName);`);
  lines.push("");
  lines.push(`${INDENT}${INDENT}/* Load accent scheme */`);
  lines.push(`${INDENT}${INDENT}@flavor: @flavorName;`);
  lines.push(`${INDENT}${INDENT}#accent-scheme(@accentName, @flavorName);`);
  lines.push("");
  lines.push(
    `${INDENT}${INDENT}::selection { background-color: fade(@accent, 30%); }`
  );
  lines.push("");
  lines.push(indentBlock(sections.variables, 2));
  lines.push("");
  lines.push(indentBlock(sections.svgs, 2));
  lines.push("");
  lines.push(indentBlock(sections.selectors, 2));
  lines.push("");
  lines.push(indentBlock(sections.gradients, 2));
  lines.push("");
  lines.push(indentBlock(sections.fallbacks, 2));
  lines.push(`${INDENT}}`);
  lines.push("");

  // Catppuccin Mixin Definition
  lines.push(`${INDENT}#catppuccin(@flavorName, @accentName) {`);
  lines.push(`${INDENT}${INDENT}@palette: @catppuccin[@@flavorName];`);
  lines.push(`${INDENT}${INDENT}@rosewater: @palette[rosewater];`);
  lines.push(`${INDENT}${INDENT}@flamingo: @palette[flamingo];`);
  lines.push(`${INDENT}${INDENT}@pink: @palette[pink];`);
  lines.push(`${INDENT}${INDENT}@mauve: @palette[mauve];`);
  lines.push(`${INDENT}${INDENT}@red: @palette[red];`);
  lines.push(`${INDENT}${INDENT}@maroon: @palette[maroon];`);
  lines.push(`${INDENT}${INDENT}@peach: @palette[peach];`);
  lines.push(`${INDENT}${INDENT}@yellow: @palette[yellow];`);
  lines.push(`${INDENT}${INDENT}@green: @palette[green];`);
  lines.push(`${INDENT}${INDENT}@teal: @palette[teal];`);
  lines.push(`${INDENT}${INDENT}@sky: @palette[sky];`);
  lines.push(`${INDENT}${INDENT}@sapphire: @palette[sapphire];`);
  lines.push(`${INDENT}${INDENT}@blue: @palette[blue];`);
  lines.push(`${INDENT}${INDENT}@lavender: @palette[lavender];`);
  lines.push(`${INDENT}${INDENT}@text: @palette[text];`);
  lines.push(`${INDENT}${INDENT}@subtext1: @palette[subtext1];`);
  lines.push(`${INDENT}${INDENT}@subtext0: @palette[subtext0];`);
  lines.push(`${INDENT}${INDENT}@overlay2: @palette[overlay2];`);
  lines.push(`${INDENT}${INDENT}@overlay1: @palette[overlay1];`);
  lines.push(`${INDENT}${INDENT}@overlay0: @palette[overlay0];`);
  lines.push(`${INDENT}${INDENT}@surface2: @palette[surface2];`);
  lines.push(`${INDENT}${INDENT}@surface1: @palette[surface1];`);
  lines.push(`${INDENT}${INDENT}@surface0: @palette[surface0];`);
  lines.push(`${INDENT}${INDENT}@base: @palette[base];`);
  lines.push(`${INDENT}${INDENT}@mantle: @palette[mantle];`);
  lines.push(`${INDENT}${INDENT}@crust: @palette[crust];`);
  lines.push(`${INDENT}${INDENT}@accent: @@accentName;`);
  lines.push("");
  lines.push(
    `${INDENT}${INDENT}color-scheme: if(@flavorName = latte, light, dark);`
  );
  lines.push(`${INDENT}}`);
  lines.push("");

  // Accent Schemes
  lines.push(indentBlock(sections.accentSchemes, 1));
  lines.push("");

  // Apply theme based on detected color mode
  // Apply theme based on detected color mode
  const selectors = buildModeSelectors(mode, defaultFlavor);
  lines.push(`${INDENT}/* Apply theme based on detected color mode */`);
  lines.push(`${INDENT}${selectors.join(",\n" + INDENT)} {`);
  lines.push(
    `${INDENT}${INDENT}#apply-catppuccin(@${defaultFlavor}Flavor, @accentColor);`
  );
  lines.push(`${INDENT}}`);

  lines.push("}");

  const coverage = {
    variableCoverage:
      mappings.stats.totalVariables > 0
        ? Math.round(
            (mappings.stats.mappedVariables / mappings.stats.totalVariables) *
              100
          )
        : 0,
    svgCoverage:
      mappings.stats.totalSVGs > 0
        ? Math.round(
            (mappings.stats.processedSVGs / mappings.stats.totalSVGs) * 100
          )
        : 0,
    selectorCoverage:
      mappings.stats.totalSelectors > 0
        ? Math.round(
            (mappings.stats.mappedSelectors / mappings.stats.totalSelectors) *
              100
          )
        : 0,
  };

  return {
    less: lines.join("\n"),
    metadata: {
      url: config.url,
      generatedAt: new Date(),
      version,
      mode: analysis.mode,
      designSystem: analysis.designSystem.framework,
    },
    sections,
    coverage,
  };
}

/**
 * Note: Palette library is now imported from official Catppuccin lib
 * No need to redefine - we use @import "https://userstyles.catppuccin.com/lib/lib.less"
 */

/**
 * Build accent scheme library with cascading bi-accents
 */
function buildAccentSchemeLibrary(includeComments: boolean): string {
  const lines: string[] = [];

  if (includeComments) {
    lines.push("/*");
    lines.push(" * Accent Scheme Library - Cascading Bi-Accent System");
    lines.push(" * ");
    lines.push(" * Three-level gradient system:");
    lines.push(" * Level 1: main-accent → bi-accent1, bi-accent2");
    lines.push(" * Level 2: bi-accent1 → bi-accent1's bi-accents");
    lines.push(" * Level 3: bi-accent2 → bi-accent2's bi-accents");
    lines.push(" * ");
    lines.push(" * Usage: #accent-scheme(@mainAccent, @flavor)");
    lines.push(" */");
    lines.push("");
  }

  lines.push(
    "#accent-scheme(@mainAccent, @flavor) when (@mainAccent = blue) and (@flavor = mocha) {"
  );

  // For each flavor, generate accent scheme mixins
  for (const flavorData of FLAVORS) {
    const flavor = flavorData.name as CatppuccinFlavor;

    for (const mainAccent of ACCENT_NAMES) {
      const accentSet = PRECOMPUTED_ACCENTS[flavor][mainAccent];
      const bi1Set = PRECOMPUTED_ACCENTS[flavor][accentSet.biAccent1];
      const bi2Set = PRECOMPUTED_ACCENTS[flavor][accentSet.biAccent2];

      lines.push("}");
      lines.push("");
      lines.push(
        `#accent-scheme(@mainAccent, @flavor) when (@mainAccent = ${mainAccent}) and (@flavor = ${flavor}) {`
      );

      if (includeComments) {
        lines.push(`${INDENT}/* Main accent: ${mainAccent} */`);
      }
      lines.push(`${INDENT}@accent: @${mainAccent};`);
      lines.push(`${INDENT}@bi-accent-1: @${accentSet.biAccent1};`);
      lines.push(`${INDENT}@bi-accent-2: @${accentSet.biAccent2};`);
      lines.push("");

      if (includeComments) {
        lines.push(
          `${INDENT}/* Cascading: bi-accent-1 (${accentSet.biAccent1}) → its bi-accents */`
        );
      }
      lines.push(`${INDENT}@bi1-sub-1: @${bi1Set.biAccent1};`);
      lines.push(`${INDENT}@bi1-sub-2: @${bi1Set.biAccent2};`);
      lines.push("");

      if (includeComments) {
        lines.push(
          `${INDENT}/* Cascading: bi-accent-2 (${accentSet.biAccent2}) → its bi-accents */`
        );
      }
      lines.push(`${INDENT}@bi2-sub-1: @${bi2Set.biAccent1};`);
      lines.push(`${INDENT}@bi2-sub-2: @${bi2Set.biAccent2};`);
    }
  }

  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

/**
 * Build dynamic variable section that works with any flavor/accent
 */
function buildDynamicVariableSection(
  mappings: VariableMapping[],
  includeComments: boolean
): string {
  if (mappings.length === 0) {
    return includeComments
      ? "/* No CSS variables detected for direct mapping */"
      : "";
  }

  const lines: string[] = [];

  if (includeComments) {
    lines.push(
      "/* Apply Catppuccin colors to existing CSS custom properties */"
    );
    lines.push(
      "/* Variables dynamically resolve based on active flavor/accent */"
    );
  }

  lines.push("& {");

  for (const mapping of mappings) {
    const colorToken = toDynamicToken(
      mapping.catppuccin as CatppuccinColor,
      mapping.isAccent,
      // We don't have config here easily, but variables usually map directly.
      // Let's update the function signature to make config optional or pass it down.
      // For now, let's just pass undefined as variables are usually explicit.
      undefined
    );
    const comment = includeComments ? ` /* ${mapping.reason} */` : "";
    lines.push(
      `${INDENT}${mapping.original}: ${colorToken} !important;${comment}`
    );
  }

  lines.push("}");

  return lines.join("\n");
}

/**
 * Build dynamic SVG section
 */
function buildDynamicSvgSection(
  svgMappings: Map<string, SVGColorMapping>,
  processedSVGs: ProcessedSVG[],
  includeComments: boolean
): string {
  if (processedSVGs.length === 0) {
    return includeComments
      ? "/* No SVG colors detected – skipping icon replacement */"
      : "";
  }

  const lines: string[] = [];

  if (includeComments) {
    lines.push("/* Re-color inline SVG assets using Catppuccin accents */");
    lines.push(
      "/* SVG colors resolve dynamically based on active flavor/accent */"
    );
    svgMappings.forEach((mapping) => {
      lines.push(
        `/* ${mapping.svgPurpose}: ${mapping.originalColor} → @${mapping.catppuccinColor} (${mapping.reason}) */`
      );
    });
  }

  for (const processed of processedSVGs) {
    try {
      const block = generateSVGLESS(processed).trim();
      if (!block || !hasMatchedBraces(block)) {
        continue;
      }
      lines.push(block);
      lines.push("");
    } catch (error) {
      console.warn(
        `⚠️  Failed to generate LESS for SVG: ${processed.selector}`,
        error
      );
    }
  }

  if (lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

/**
 * Build dynamic selector section
 */
function buildDynamicSelectorSection(
  mappings: SelectorMapping[],
  includeComments: boolean,
  config?: UserstyleV3Config
): string {
  if (mappings.length === 0) {
    return includeComments ? "/* No selector-level mappings generated */" : "";
  }

  const lines: string[] = [];

  for (const mapping of mappings) {
    const selector = sanitizeSelector(mapping.selector);
    if (!selector) {
      continue;
    }

    if (includeComments) {
      lines.push(`/* ${mapping.reason} */`);
    }

    lines.push(`${selector} {`);

    const COLOR_PROPERTIES: Array<keyof SelectorMapping["properties"]> = [
      "color",
      "backgroundColor",
      "borderColor",
      "fill",
      "stroke",
    ];

    for (const property of COLOR_PROPERTIES) {
      const color = mapping.properties[property];
      if (!color) continue;

      // Dynamic accent matching
      // We pass false for isAccent to rely on value matching against the config.
      // This prevents semantic colors (like green for success) from being forced to @accent
      // just because they happen to be in the accent palette.
      let token = toDynamicToken(color as CatppuccinColor, false, config);

      // If this property uses the main accent, force it to use @accent variable
      // This ensures it responds to the user's selection in the UserStyle settings
      if (isAccentColor(color as CatppuccinColor)) {
        // We need to be careful here. V3 uses a complex accent scheme.
        // toDynamicToken already handles some of this, but let's verify.
      }

      const important = " !important";
      lines.push(`${INDENT}${kebabCase(property)}: ${token}${important};`);
    }

    lines.push("}");
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Build cascading gradient section with 3-level bi-accent system
 */
function buildCascadingGradientSection(
  mappings: SelectorMapping[],
  coverage: "minimal" | "standard" | "comprehensive",
  enableCascading: boolean,
  includeComments: boolean
): string {
  const lines: string[] = [];

  if (includeComments) {
    lines.push("/*");
    lines.push(" * Cascading Gradient System");
    lines.push(" * ");
    lines.push(" * Level 1: Elements using main-accent");
    lines.push(" *   → Gradients: main-accent + bi-accent-1 or bi-accent-2");
    lines.push(" * ");
    lines.push(" * Level 2: Elements using bi-accent-1 (from main-accent)");
    lines.push(" *   → Gradients: bi-accent-1 + bi1-sub-1 or bi1-sub-2");
    lines.push(" * ");
    lines.push(" * Level 3: Elements using bi-accent-2 (from main-accent)");
    lines.push(" *   → Gradients: bi-accent-2 + bi2-sub-1 or bi2-sub-2");
    lines.push(" */");
    lines.push("");
  }

  // Level 1: Main accent gradients (from AI mappings)
  const level1Gradients = mappings.filter((m) => m.hoverGradient);

  if (level1Gradients.length > 0) {
    if (includeComments) {
      lines.push("/* Level 1: Main-accent gradients (70-80% of elements) */");
    }

    for (const mapping of level1Gradients) {
      const selector = sanitizeSelector(mapping.selector);
      if (!selector) continue;

      const gradient = mapping.hoverGradient!;

      if (includeComments) {
        lines.push(`/* Hover gradient for ${selector} */`);
      }

      lines.push(`${selector}:hover,`);
      lines.push(`${selector}:focus-visible {`);
      lines.push(
        `${INDENT}background: linear-gradient(${Math.round(
          gradient.angle
        )}deg, @accent, fade(@bi-accent-1, 12%));`
      );
      lines.push(`${INDENT}color: @text;`);
      lines.push(`${INDENT}transition: all 0.3s ease;`);
      lines.push("}");
      lines.push("");
    }
  }

  // Add comprehensive gradient coverage if requested
  if (coverage === "standard" || coverage === "comprehensive") {
    lines.push(
      ...buildStandardGradientCoverage(enableCascading, includeComments)
    );
  }

  if (coverage === "comprehensive") {
    lines.push(
      ...buildComprehensiveGradientCoverage(enableCascading, includeComments)
    );
  }

  return lines.join("\n");
}

/**
 * Build standard gradient coverage for common elements
 */
function buildStandardGradientCoverage(
  enableCascading: boolean,
  includeComments: boolean
): string[] {
  const lines: string[] = [];

  if (includeComments) {
    lines.push(
      "/* Standard gradient coverage for common interactive elements */"
    );
    lines.push("");
  }

  // Primary buttons (main-accent)
  lines.push('button:not([class*="gradient"]):not([class*="bg-clip"]):hover,');
  lines.push('[role="button"]:not([class*="gradient"]):hover,');
  lines.push('.btn:not([class*="gradient"]):hover,');
  lines.push('.button:not([class*="gradient"]):hover {');
  lines.push(
    `${INDENT}background: linear-gradient(135deg, @accent, fade(@bi-accent-1, 12%));`
  );
  lines.push(`${INDENT}transition: all 0.3s ease;`);
  lines.push("}");
  lines.push("");

  // Links (main-accent)
  lines.push('a:not([class*="gradient"]):not([class*="bg-clip"]):hover {');
  lines.push(
    `${INDENT}background: linear-gradient(45deg, @accent, fade(@bi-accent-2, 10%));`
  );
  lines.push(`${INDENT}background-clip: text;`);
  lines.push(`${INDENT}-webkit-background-clip: text;`);
  lines.push(`${INDENT}-webkit-text-fill-color: transparent;`);
  lines.push(`${INDENT}transition: all 0.3s ease;`);
  lines.push("}");
  lines.push("");

  if (enableCascading) {
    if (includeComments) {
      lines.push(
        "/* Level 2: Cascading gradients for variety elements (bi-accent-1 as main) */"
      );
      lines.push("");
    }

    // Badges with bi-accent-1 as main color
    lines.push('.badge:not([class*="gradient"]):hover,');
    lines.push('.tag:not([class*="gradient"]):hover,');
    lines.push('[class*="badge"]:not([class*="gradient"]):hover {');
    lines.push(
      `${INDENT}background: linear-gradient(90deg, @bi-accent-1, fade(@bi1-sub-1, 12%));`
    );
    lines.push(`${INDENT}transition: all 0.3s ease;`);
    lines.push("}");
    lines.push("");

    if (includeComments) {
      lines.push(
        "/* Level 3: Cascading gradients for secondary elements (bi-accent-2 as main) */"
      );
      lines.push("");
    }

    // Chips with bi-accent-2 as main color
    lines.push('.chip:not([class*="gradient"]):hover,');
    lines.push('.pill:not([class*="gradient"]):hover,');
    lines.push('[class*="chip"]:not([class*="gradient"]):hover {');
    lines.push(
      `${INDENT}background: linear-gradient(90deg, @bi-accent-2, fade(@bi2-sub-1, 12%));`
    );
    lines.push(`${INDENT}transition: all 0.3s ease;`);
    lines.push("}");
    lines.push("");
  }

  return lines;
}

/**
 * Build comprehensive gradient coverage for maximum page coverage
 */
function buildComprehensiveGradientCoverage(
  enableCascading: boolean,
  includeComments: boolean
): string[] {
  const lines: string[] = [];

  if (includeComments) {
    lines.push(
      "/* Comprehensive gradient coverage for maximum visual impact */"
    );
    lines.push("");
  }

  // Cards and panels
  lines.push('.card:not([class*="gradient"]):hover,');
  lines.push('.panel:not([class*="gradient"]):hover,');
  lines.push('[class*="card"]:not([class*="gradient"]):hover {');
  lines.push(
    `${INDENT}background: linear-gradient(180deg, @surface0, fade(@accent, 5%));`
  );
  lines.push(`${INDENT}border-color: @accent;`);
  lines.push(`${INDENT}transition: all 0.3s ease;`);
  lines.push("}");
  lines.push("");

  // Navigation items
  lines.push('nav a:not([class*="gradient"]):hover,');
  lines.push('.nav-item:not([class*="gradient"]):hover,');
  lines.push('[role="navigation"] a:not([class*="gradient"]):hover {');
  lines.push(
    `${INDENT}background: linear-gradient(90deg, transparent, fade(@accent, 8%));`
  );
  lines.push(`${INDENT}color: @accent;`);
  lines.push(`${INDENT}transition: all 0.3s ease;`);
  lines.push("}");
  lines.push("");

  // Input focus states
  lines.push('input:focus:not([class*="gradient"]),');
  lines.push('textarea:focus:not([class*="gradient"]),');
  lines.push('select:focus:not([class*="gradient"]) {');
  lines.push(`${INDENT}outline: 2px solid @accent;`);
  lines.push(`${INDENT}box-shadow: 0 0 0 4px fade(@bi-accent-1, 15%);`);
  lines.push(`${INDENT}transition: all 0.3s ease;`);
  lines.push("}");
  lines.push("");

  if (enableCascading) {
    // Tabs with cascading gradients
    lines.push('.tab:not([class*="gradient"]):hover,');
    lines.push('[role="tab"]:not([class*="gradient"]):hover {');
    lines.push(
      `${INDENT}background: linear-gradient(180deg, fade(@bi-accent-1, 8%), transparent);`
    );
    lines.push(`${INDENT}border-bottom-color: @bi-accent-1;`);
    lines.push(`${INDENT}transition: all 0.3s ease;`);
    lines.push("}");
    lines.push("");

    // List items with variety
    lines.push('li:not([class*="gradient"]):hover,');
    lines.push('.list-item:not([class*="gradient"]):hover {');
    lines.push(
      `${INDENT}background: linear-gradient(90deg, transparent, fade(@bi-accent-2, 5%));`
    );
    lines.push(`${INDENT}transition: all 0.3s ease;`);
    lines.push("}");
    lines.push("");

    // Dropdown items
    lines.push('.dropdown-item:not([class*="gradient"]):hover,');
    lines.push('[role="menuitem"]:not([class*="gradient"]):hover {');
    lines.push(
      `${INDENT}background: linear-gradient(90deg, fade(@bi2-sub-1, 10%), @surface1);`
    );
    lines.push(`${INDENT}color: @text;`);
    lines.push(`${INDENT}transition: all 0.3s ease;`);
    lines.push("}");
    lines.push("");
  }

  // Active/selected states
  lines.push('.active:not([class*="gradient"]),');
  lines.push('.selected:not([class*="gradient"]),');
  lines.push('[aria-selected="true"]:not([class*="gradient"]) {');
  lines.push(
    `${INDENT}background: linear-gradient(135deg, @accent, fade(@bi-accent-1, 15%));`
  );
  lines.push(`${INDENT}color: @crust;`);
  lines.push("}");
  lines.push("");

  return lines;
}

/**
 * Build dynamic fallback section
 */
function buildDynamicFallbackSection(
  coverage: "minimal" | "standard" | "comprehensive",
  includeComments: boolean
): string {
  const lines: string[] = [];

  if (includeComments) {
    lines.push("/* Guard gradient text and provide generic color fallbacks */");
    lines.push(
      "/* Fallbacks work dynamically with all flavor/accent combinations */"
    );
  }

  // Gradient preservation (same as v2)
  const revertDeclarations = [
    "color: revert !important;",
    "background: revert !important;",
    "background-color: revert !important;",
    "background-image: revert !important;",
    "-webkit-background-clip: revert !important;",
    "background-clip: revert !important;",
    "-webkit-text-fill-color: revert !important;",
    "text-fill-color: revert !important;",
  ];

  const pushRevertBlock = (selectors: string[], comment?: string) => {
    lines.push(`${selectors.join(",\n")} {`);
    if (includeComments && comment) {
      lines.push(`${INDENT}${comment}`);
    }
    revertDeclarations.forEach((declaration) => {
      lines.push(`${INDENT}${declaration}`);
    });
    lines.push("}");
    lines.push("");
  };

  pushRevertBlock(
    [
      '[class*="bg-clip-text"]',
      '[class*="text-transparent"]',
      '[class*="bg-gradient"]',
      '[class*="from-"]',
      '[class*="via-"]',
      '[class*="to-"]',
      ".bg-clip-text",
      ".text-transparent",
      ".text-clip",
    ],
    "/* Preserve original gradient text colors */"
  );

  pushRevertBlock(
    [
      '*[class*="bg-clip-text"]',
      '*[class*="text-transparent"]',
      '*[class*="bg-gradient"]',
      'h1 [class*="bg-clip-text"]',
      'h2 [class*="bg-clip-text"]',
      'h3 [class*="bg-clip-text"]',
      'h4 [class*="bg-clip-text"]',
      'h5 [class*="bg-clip-text"]',
      'h6 [class*="bg-clip-text"]',
    ],
    "/* Guard gradient descendants */"
  );

  // Generic fallbacks with dynamic tokens
  const headingSelectors = [
    'h1:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
    'h2:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
    'h3:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
    'h4:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
    'h5:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
    'h6:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
  ];

  lines.push(`${headingSelectors.join(",\n")} {`);
  lines.push(`${INDENT}color: @text;`);
  lines.push("}");
  lines.push("");

  lines.push(
    'a:not([class*="bg-clip-text"]):not([class*="text-transparent"]) {'
  );
  lines.push(`${INDENT}color: @accent;`);
  lines.push("}");
  lines.push("");

  if (coverage !== "minimal") {
    lines.push('button, [role="button"] {');
    lines.push(`${INDENT}color: @text;`);
    lines.push(`${INDENT}background-color: @accent;`);
    lines.push("}");
    lines.push("");

    lines.push("input:focus, textarea:focus, select:focus {");
    lines.push(`${INDENT}outline-color: @bi-accent-1;`);
    lines.push("}");
    lines.push("");
  }

  if (coverage === "comprehensive") {
    lines.push('.badge, .tag, [class*="badge"], [class*="tag"] {');
    lines.push(`${INDENT}background-color: @bi-accent-2;`);
    lines.push(`${INDENT}color: @text;`);
    lines.push("}");
    lines.push("");

    lines.push("code, pre, .code {");
    lines.push(`${INDENT}background-color: @surface0;`);
    lines.push(`${INDENT}color: @text;`);
    lines.push(`${INDENT}border: 1px solid @surface2;`);
    lines.push("}");
    lines.push("");

    lines.push("blockquote {");
    lines.push(`${INDENT}border-left: 4px solid @accent;`);
    lines.push(`${INDENT}background-color: @surface0;`);
    lines.push("}");
  }

  return lines.join("\n");
}

/**
 * Build UserStyle metadata header with Stylus UI controls
 */
function buildUserstyleMetadata(
  hostname: string,
  defaultFlavor: CatppuccinFlavor,
  defaultAccent: AccentColor
): string {
  const lines: string[] = [];

  const siteName = hostname
    .replace(/^www\./, "")
    .replace(/\./g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const defaultLight = defaultFlavor;
  const defaultDark = defaultFlavor === "latte" ? "mocha" : defaultFlavor;

  lines.push("/* ==UserStyle==");
  lines.push(`@name ${siteName} Catppuccin`);
  lines.push(
    `@namespace github.com/catppuccin/userstyles/styles/${hostname.replace(
      /\./g,
      "-"
    )}`
  );
  lines.push(
    `@homepageURL https://github.com/catppuccin/userstyles/tree/main/styles/${hostname.replace(
      /\./g,
      "-"
    )}`
  );
  lines.push(
    `@version ${new Date().toISOString().split("T")[0].replace(/-/g, ".")}`
  );
  lines.push(`@description Soothing pastel theme for ${siteName}`);
  lines.push("@author Catppuccin");
  lines.push("@license MIT");
  lines.push("");
  lines.push("@preprocessor less");
  lines.push(
    `@var select lightFlavor "Light Flavor" ["latte:Latte${
      defaultLight === "latte" ? "*" : ""
    }", "frappe:Frappé${
      defaultLight === "frappe" ? "*" : ""
    }", "macchiato:Macchiato${
      defaultLight === "macchiato" ? "*" : ""
    }", "mocha:Mocha${defaultLight === "mocha" ? "*" : ""}"]`
  );
  lines.push(
    `@var select darkFlavor "Dark Flavor" ["latte:Latte", "frappe:Frappé${
      defaultDark === "frappe" ? "*" : ""
    }", "macchiato:Macchiato${
      defaultDark === "macchiato" ? "*" : ""
    }", "mocha:Mocha${defaultDark === "mocha" ? "*" : ""}"]`
  );

  // Build accent selector with default marker
  const accentOptions = ACCENT_NAMES.map((accent) => {
    const displayName = accent.charAt(0).toUpperCase() + accent.slice(1);
    const isDefault = accent === defaultAccent ? "*" : "";
    return `"${accent}:${displayName}${isDefault}"`;
  }).join(", ");

  lines.push(`@var select accentColor "Accent" [${accentOptions}]`);
  lines.push("==/UserStyle== */");
  lines.push("");

  return lines.join("\n");
}

/**
 * Build the complete dynamic UserStyle document
 */
function buildDynamicUserstyleDocument(
  hostname: string,
  mode: DeepAnalysisResult["mode"],
  sections: Record<string, string>,
  defaultFlavor: CatppuccinFlavor,
  defaultAccent: AccentColor,
  includeComments: boolean
): string {
  const lines: string[] = [];

  // Add UserStyle metadata header
  lines.push(buildUserstyleMetadata(hostname, defaultFlavor, defaultAccent));

  // Define Catppuccin palette map locally for stability and to avoid library version issues
  lines.push(`@catppuccin: {
  @latte: {
    rosewater: #dc8a78; flamingo: #dd7878; pink: #ea76cb; mauve: #8839ef;
    red: #d20f39; maroon: #e64553; peach: #fe640b; yellow: #df8e1d;
    green: #40a02b; teal: #179299; sky: #04a5e5; sapphire: #209fb5;
    blue: #1e66f5; lavender: #7287fd;
    text: #4c4f69; subtext1: #5c5f77; subtext0: #6c6f85;
    overlay2: #7c7f93; overlay1: #8c8fa1; overlay0: #9ca0b0;
    surface2: #acb0be; surface1: #bcc0cc; surface0: #ccd0da;
    base: #eff1f5; mantle: #e6e9ef; crust: #dce0e8;
  };
  @frappe: {
    rosewater: #f2d5cf; flamingo: #eebebe; pink: #f4b8e4; mauve: #ca9ee6;
    red: #e78284; maroon: #ea999c; peach: #ef9f76; yellow: #e5c890;
    green: #a6d189; teal: #81c8be; sky: #99d1db; sapphire: #85c1dc;
    blue: #8caaee; lavender: #babbf1;
    text: #c6d0f5; subtext1: #b5bfe2; subtext0: #a5adce;
    overlay2: #949cbb; overlay1: #838ba7; overlay0: #737994;
    surface2: #626880; surface1: #51576d; surface0: #414559;
    base: #303446; mantle: #292c3c; crust: #232634;
  };
  @macchiato: {
    rosewater: #f4dbd6; flamingo: #f0c6c6; pink: #f5bde6; mauve: #c6a0f6;
    red: #ed8796; maroon: #ee99a0; peach: #f5a97f; yellow: #eed49f;
    green: #a6da95; teal: #8bd5ca; sky: #91d7e3; sapphire: #7dc4e4;
    blue: #8aadf4; lavender: #b7bdf8;
    text: #cad3f5; subtext1: #b8c0e0; subtext0: #a5adcb;
    overlay2: #939ab7; overlay1: #8087a2; overlay0: #6e738d;
    surface2: #5b6078; surface1: #494d64; surface0: #363a4f;
    base: #24273a; mantle: #1e2030; crust: #181926;
  };
  @mocha: {
    rosewater: #f5e0dc; flamingo: #f2cdcd; pink: #f5c2e7; mauve: #cba6f7;
    red: #f38ba8; maroon: #eba0ac; peach: #fab387; yellow: #f9e2af;
    green: #a6e3a1; teal: #94e2d5; sky: #89dceb; sapphire: #74c7ec;
    blue: #89b4fa; lavender: #b4befe;
    text: #cdd6f4; subtext1: #bac2de; subtext0: #a6adc8;
    overlay2: #9399b2; overlay1: #7f849c; overlay0: #6c7086;
    surface2: #585b70; surface1: #45475a; surface0: #313244;
    base: #1e1e2e; mantle: #181825; crust: #11111b;
  };
};`);
  lines.push("");

  // Define local mixin to extract colors
  lines.push(`${INDENT}#catppuccin(@flavorName, @accentName) {`);
  lines.push(`${INDENT}${INDENT}@palette: @catppuccin[@@flavorName];`);
  lines.push(`${INDENT}${INDENT}@rosewater: @palette[rosewater];`);
  lines.push(`${INDENT}${INDENT}@flamingo: @palette[flamingo];`);
  lines.push(`${INDENT}${INDENT}@pink: @palette[pink];`);
  lines.push(`${INDENT}${INDENT}@mauve: @palette[mauve];`);
  lines.push(`${INDENT}${INDENT}@red: @palette[red];`);
  lines.push(`${INDENT}${INDENT}@maroon: @palette[maroon];`);
  lines.push(`${INDENT}${INDENT}@peach: @palette[peach];`);
  lines.push(`${INDENT}${INDENT}@yellow: @palette[yellow];`);
  lines.push(`${INDENT}${INDENT}@green: @palette[green];`);
  lines.push(`${INDENT}${INDENT}@teal: @palette[teal];`);
  lines.push(`${INDENT}${INDENT}@sky: @palette[sky];`);
  lines.push(`${INDENT}${INDENT}@sapphire: @palette[sapphire];`);
  lines.push(`${INDENT}${INDENT}@blue: @palette[blue];`);
  lines.push(`${INDENT}${INDENT}@lavender: @palette[lavender];`);
  lines.push(`${INDENT}${INDENT}@text: @palette[text];`);
  lines.push(`${INDENT}${INDENT}@subtext1: @palette[subtext1];`);
  lines.push(`${INDENT}${INDENT}@subtext0: @palette[subtext0];`);
  lines.push(`${INDENT}${INDENT}@overlay2: @palette[overlay2];`);
  lines.push(`${INDENT}${INDENT}@overlay1: @palette[overlay1];`);
  lines.push(`${INDENT}${INDENT}@overlay0: @palette[overlay0];`);
  lines.push(`${INDENT}${INDENT}@surface2: @palette[surface2];`);
  lines.push(`${INDENT}${INDENT}@surface1: @palette[surface1];`);
  lines.push(`${INDENT}${INDENT}@surface0: @palette[surface0];`);
  lines.push(`${INDENT}${INDENT}@base: @palette[base];`);
  lines.push(`${INDENT}${INDENT}@mantle: @palette[mantle];`);
  lines.push(`${INDENT}${INDENT}@crust: @palette[crust];`);
  lines.push(`${INDENT}${INDENT}@accent: @@accentName;`);
  lines.push("");
  lines.push(
    `${INDENT}${INDENT}color-scheme: if(@flavorName = latte, light, dark);`
  );
  lines.push(`${INDENT}}`);
  lines.push("");

  // Flavor application mixin
  lines.push(`${INDENT}#apply-catppuccin(@flavorName, @accentName) {`);
  lines.push(`${INDENT}${INDENT}/* Load official Catppuccin palette */`);
  lines.push(`${INDENT}${INDENT}#catppuccin(@flavorName, @accentName);`);
  lines.push("");
  lines.push(`${INDENT}${INDENT}/* Load accent scheme */`);
  lines.push(`${INDENT}${INDENT}@flavor: @flavorName;`); // For accent-scheme
  lines.push(`${INDENT}${INDENT}#accent-scheme(@accentName, @flavorName);`);
  lines.push("");
  lines.push(
    `${INDENT}${INDENT}::selection { background-color: fade(@accent, 30%); }`
  );
  lines.push("");

  // Apply theme sections inside the mixin so they have access to variables
  const sectionOrder: Array<[string, string]> = [
    ["variables", "SECTION 1: CSS VARIABLES (highest priority)"],
    ["svgs", "SECTION 2: SVG REPLACEMENTS"],
    ["selectors", "SECTION 3: SITE-SPECIFIC SELECTORS"],
    ["gradients", "SECTION 4: CASCADING GRADIENT SYSTEM"],
    ["fallbacks", "SECTION 5: FALLBACK GUARDS"],
  ];

  sectionOrder.forEach(([key, title]) => {
    const content = sections[key as keyof typeof sections];
    if (!content || !content.trim()) {
      return;
    }

    if (includeComments) {
      lines.push(`${INDENT}${INDENT}${SECTION_COMMENT}`);
      lines.push(`${INDENT}${INDENT}/* ${title} */`);
      lines.push(`${INDENT}${INDENT}${SECTION_COMMENT}`);
    }

    lines.push(indentBlock(content, 2));
    lines.push("");
  });

  lines.push(`${INDENT}}`);
  lines.push("");

  // Accent scheme library
  lines.push(sections.accentSchemes);
  lines.push("");

  // Main document
  lines.push(`@-moz-document domain("${hostname || "*"}") {`);
  lines.push("");

  // Mode selectors
  const modeSelectors = buildModeSelectors(mode, defaultFlavor);
  if (modeSelectors.length > 0) {
    if (includeComments) {
      lines.push(`${INDENT}/* Apply theme based on detected color mode */`);
    }

    modeSelectors.forEach((selector, index) => {
      const suffix = index === modeSelectors.length - 1 ? " {" : ",";
      lines.push(`${INDENT}${selector}${suffix}`);
    });

    const flavorVar = mode === "light" ? "@lightFlavor" : "@darkFlavor";
    lines.push(
      `${INDENT}${INDENT}#apply-catppuccin(${flavorVar}, @accentColor);`
    );
    lines.push(`${INDENT}}`);
  }

  lines.push("}");

  return lines.join("\n");
}

// ============================================================================
// Helper Functions
// ============================================================================

function computeCoverage(stats: MappingResult["stats"]) {
  const variableCoverage =
    stats.totalVariables === 0
      ? 0
      : Math.round((stats.mappedVariables / stats.totalVariables) * 100);
  const svgCoverage =
    stats.totalSVGs === 0
      ? 0
      : Math.round((stats.processedSVGs / stats.totalSVGs) * 100);
  const selectorCoverage =
    stats.totalSelectors === 0
      ? 0
      : Math.round((stats.mappedSelectors / stats.totalSelectors) * 100);

  return {
    variableCoverage,
    svgCoverage,
    selectorCoverage,
  };
}

function safeHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === "file:") {
      return urlObj.pathname.split("/").pop() || url;
    }
    return urlObj.hostname;
  } catch {
    return url;
  }
}

function buildModeSelectors(
  mode: DeepAnalysisResult["mode"],
  defaultFlavor: CatppuccinFlavor
): string[] {
  const selectors = [
    `:root[data-mode="${mode}"]`,
    `:root[data-theme="${mode}"]`,
    `html[data-theme="${mode}"]`,
    `body[data-theme="${mode}"]`,
  ];

  if (mode === "light") {
    selectors.push(":root");
  }

  return Array.from(new Set(selectors));
}

function indentBlock(block: string, depth: number): string {
  const prefix = INDENT.repeat(depth);
  return block
    .split("\n")
    .map((line) => (line.length > 0 ? `${prefix}${line}` : ""))
    .join("\n");
}

function toDynamicToken(
  color: CatppuccinColor | AccentColor,
  isAccent: boolean,
  config?: UserstyleV3Config
): string {
  if (isAccent) {
    return "@accent"; // Use dynamic accent variable
  }

  // Check if the color matches the default accent or its bi-accents
  if (config?.defaultAccent) {
    const cascading =
      PRECOMPUTED_ACCENTS[config.defaultFlavor || "mocha"][
        config.defaultAccent
      ];

    if (color === config.defaultAccent) {
      return "@accent";
    } else if (color === cascading.biAccent1) {
      return "@bi-accent-1";
    } else if (color === cascading.biAccent2) {
      return "@bi-accent-2";
    }
  }

  return `@${color}`;
}

function isAccentColor(color: string): boolean {
  return ACCENT_NAMES.includes(color as AccentColor);
}

function kebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function hasMatchedBraces(text: string): boolean {
  let depth = 0;
  for (const char of text) {
    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth < 0) {
        return false;
      }
    }
  }
  return depth === 0;
}

function sanitizeSelector(selector: string): string {
  const cleaned = selector.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();

  // Check for balanced parentheses
  let depth = 0;
  for (const char of cleaned) {
    if (char === "(") depth++;
    else if (char === ")") depth--;
    if (depth < 0) return ""; // Unbalanced (too many closing)
  }
  if (depth !== 0) return ""; // Unbalanced (too many opening)

  if (cleaned === "html" || cleaned === ":root") {
    return "&";
  }

  return cleaned;
}
