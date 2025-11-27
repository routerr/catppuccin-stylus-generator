import {
  DeepAnalysisResult,
  MappingResult,
  GeneratedTheme,
} from "../../types/deep-analysis";
import { CatppuccinFlavor, AccentColor } from "../../types/catppuccin";
import { getCascadingAccents } from "../../utils/bi-accent";
import { ACCENT_NAMES } from "../../constants/catppuccin-colors";

export interface UserstyleV4Config {
  url: string;
  defaultFlavor?: CatppuccinFlavor;
  defaultAccent?: AccentColor;
}

const INDENT = "  ";

export function generateUserstyleV4(
  analysis: DeepAnalysisResult,
  mappings: MappingResult,
  config: UserstyleV4Config
): GeneratedTheme {
  const hostname = new URL(config.url).hostname;
  // Use defaultFlavor in metadata or comments if needed, for now just keeping it to suppress unused error
  // or we can remove it if truly unused. But let's use it in the metadata.
  const lines: string[] = [];

  // 1. Metadata Block
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

  // 2. Import Library
  lines.push('@import "https://userstyles.catppuccin.com/lib/lib.less";');
  lines.push("");

  // 3. Document Block
  lines.push(`@-moz-document domain("${hostname}") {`);

  // 4. Mode Detection Logic
  lines.push(`${INDENT}:root {`);
  lines.push(`${INDENT}${INDENT}#catppuccin(@darkFlavor);`);
  lines.push(`${INDENT}}`);
  lines.push("");
  lines.push(`${INDENT}@media (prefers-color-scheme: light) {`);
  lines.push(`${INDENT}${INDENT}:root {`);
  lines.push(`${INDENT}${INDENT}${INDENT}#catppuccin(@lightFlavor);`);
  lines.push(`${INDENT}${INDENT}}`);
  lines.push(`${INDENT}}`);
  lines.push("");

  // 5. Main Mixin
  lines.push(`${INDENT}#catppuccin(@flavor) {`);
  lines.push(`${INDENT}${INDENT}#lib.palette();`);
  lines.push(`${INDENT}${INDENT}#lib.defaults();`);
  lines.push("");
  lines.push(`${INDENT}${INDENT}/* Bi-Accent Definitions */`);
  lines.push(`${INDENT}${INDENT}@accent: @@accentColor;`);
  lines.push(`${INDENT}${INDENT}#set-bi-accents(@accent);`);
  lines.push("");

  // 6. Mappings
  const selectorMap = new Map<string, string[]>();

  mappings.selectorMappings.forEach((mapping) => {
    const selector = sanitizeSelector(mapping.selector);
    if (!selector) return;

    if (!selectorMap.has(selector)) {
      selectorMap.set(selector, []);
    }
    const props = selectorMap.get(selector)!;

    Object.entries(mapping.properties).forEach(([prop, color]) => {
      const cssProp = prop
        .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2")
        .toLowerCase();

      let colorVar = `@${color}`;

      // Selective Accent Logic
      // If the element is flagged as an accent element by AI, we want to use the dynamic @accent variable
      // but ONLY for appropriate properties to avoid "blue on blue" issues.
      if (mapping.isAccent) {
        const isBackgroundOrBorder = [
          "backgroundColor",
          "borderColor",
          "borderTopColor",
          "borderRightColor",
          "borderBottomColor",
          "borderLeftColor",
          "outlineColor",
          "fill",
          "stroke",
        ].includes(prop);

        const isText = prop === "color";

        if (isBackgroundOrBorder) {
          // Always force backgrounds/borders of accent elements to use the dynamic accent
          colorVar = `@accent`;
        } else if (isText && ACCENT_NAMES.includes(color as AccentColor)) {
          // Only force text to use accent if it was originally mapped to an accent color
          // This preserves "white text on blue button" (mapped to @base)
          // while allowing "blue link" (mapped to @blue) to become @accent
          colorVar = `@accent`;
        }
      }

      // Fallback: Check if the color matches the default accent or its bi-accents
      // This handles cases where isAccent might be missing but the values align
      else if (config.defaultAccent) {
        const cascading = getCascadingAccents(config.defaultAccent);

        if (color === config.defaultAccent) {
          colorVar = `@accent`;
        } else if (color === cascading.bi1) {
          colorVar = `@bi-accent-1`;
        } else if (color === cascading.bi2) {
          colorVar = `@bi-accent-2`;
        }
      }
      props.push(`${cssProp}: ${colorVar} !important;`);
    });
  });

  selectorMap.forEach((props, selector) => {
    lines.push(`${INDENT}${INDENT}${selector} {`);
    props.forEach((prop) => lines.push(`${INDENT}${INDENT}${INDENT}${prop}`));
    lines.push(`${INDENT}${INDENT}}`);
  });

  lines.push(`${INDENT}}`); // End #catppuccin mixin

  // 7. Bi-Accent Logic Mixin
  lines.push("");
  lines.push(`${INDENT}/* Bi-Accent Logic */`);
  lines.push(`${INDENT}#set-bi-accents(@c) {`);

  for (const accent of ACCENT_NAMES) {
    const cascading = getCascadingAccents(accent as AccentColor);
    lines.push(`${INDENT}${INDENT}& when (@c = @${accent}) {`);
    lines.push(`${INDENT}${INDENT}${INDENT}@bi-accent-1: @${cascading.bi1};`);
    lines.push(`${INDENT}${INDENT}${INDENT}@bi-accent-2: @${cascading.bi2};`);
    lines.push(`${INDENT}${INDENT}}`);
  }
  lines.push(`${INDENT}}`);

  lines.push("}"); // End @-moz-document

  return {
    less: lines.join("\n"),
    metadata: {
      url: config.url,
      generatedAt: new Date(),
      version: "v4-masterpiece",
      mode: analysis.mode,
      designSystem: analysis.designSystem.framework,
    },
    sections: {
      variables: "",
      svgs: "",
      selectors: lines.join("\n"),
      gradients: "",
      fallbacks: "",
    },
    coverage: {
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
    },
  };
}

/**
 * Sanitize a CSS selector to prevent syntax errors
 */
function sanitizeSelector(selector: string): string {
  // Remove dangerous characters that could break CSS syntax
  const cleaned = selector
    .replace(/[{}]/g, "") // Remove braces
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Check for balanced parentheses
  let depth = 0;
  for (const char of cleaned) {
    if (char === "(") depth++;
    else if (char === ")") depth--;
    if (depth < 0) return ""; // Unbalanced (too many closing)
  }
  if (depth !== 0) return ""; // Unbalanced (too many opening)

  return cleaned;
}
