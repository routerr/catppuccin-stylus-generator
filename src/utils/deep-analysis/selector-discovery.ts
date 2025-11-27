/**
 * Selector Discovery Engine
 * Discovers and categorizes CSS selectors from website content
 */

import type {
  SelectorInfo,
  SelectorGroup,
  SelectorCategory,
} from "../../types/deep-analysis";

/**
 * Discover and categorize selectors from CSS
 */
export function discoverSelectors(
  css: string,
  html: string = ""
): SelectorGroup[] {
  const selectors = extractSelectorsFromCSS(css);
  const enrichedSelectors = enrichWithDOMInfo(selectors, html);
  const categorizedSelectors = categorizeSelectors(enrichedSelectors);

  return groupByCategory(categorizedSelectors);
}

/**
 * Extract selectors from CSS content
 */
function extractSelectorsFromCSS(css: string): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];
  const selectorMap = new Map<string, SelectorInfo>();

  // Match CSS rule blocks: selector { properties }
  const ruleBlockRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleBlockRegex.exec(css)) !== null) {
    const selectorText = match[1].trim();
    const properties = match[2];

    // Split compound selectors (e.g., ".a, .b, .c" -> [".a", ".b", ".c"])
    const individualSelectors = selectorText
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    individualSelectors.forEach((selector) => {
      // Skip pseudo-elements and media queries for now
      if (selector.startsWith("@") || selector.includes("::")) {
        return;
      }

      const styles = extractStyles(properties);
      const specificity = calculateSpecificity(selector);

      const existing = selectorMap.get(selector);
      if (existing) {
        // Merge styles
        Object.assign(existing.currentStyles, styles);
        existing.frequency++;
      } else {
        selectorMap.set(selector, {
          selector,
          category: "other", // Will be categorized later
          specificity,
          frequency: 1,
          currentStyles: styles,
          isInteractive: hasInteractiveStyles(properties),
          hasVisibleBackground: hasVisibleBackgroundStyle(styles),
          hasBorder: hasBorderStyle(styles),
          isTextOnly: isTextOnlySelector(styles),
        });
      }
    });
  }

  return Array.from(selectorMap.values());
}

/**
 * Extract color-related styles from properties
 */
function extractStyles(properties: string): SelectorInfo["currentStyles"] {
  const styles: SelectorInfo["currentStyles"] = {};

  // Extract color
  const colorMatch = properties.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
  if (colorMatch) {
    styles.color = colorMatch[1].trim();
  }

  // Extract background-color
  const bgMatch = properties.match(
    /(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i
  );
  if (bgMatch) {
    const value = bgMatch[1].trim();
    // Only capture if it's a solid color (not gradient or image)
    if (!value.includes("gradient") && !value.includes("url(")) {
      styles.backgroundColor = value;
    }
  }

  // Extract border-color
  const borderMatch = properties.match(
    /(?:^|;)\s*border(?:-color)?\s*:\s*([^;]+)/i
  );
  if (borderMatch) {
    styles.borderColor = borderMatch[1].trim();
  }

  // Extract fill (for SVG)
  const fillMatch = properties.match(/(?:^|;)\s*fill\s*:\s*([^;]+)/i);
  if (fillMatch) {
    styles.fill = fillMatch[1].trim();
  }

  // Extract stroke (for SVG)
  const strokeMatch = properties.match(/(?:^|;)\s*stroke\s*:\s*([^;]+)/i);
  if (strokeMatch) {
    styles.stroke = strokeMatch[1].trim();
  }

  return styles;
}

/**
 * Check if properties include interactive states
 */
function hasInteractiveStyles(properties: string): boolean {
  return (
    properties.includes(":hover") ||
    properties.includes(":focus") ||
    properties.includes(":active") ||
    properties.includes("cursor: pointer")
  );
}

/**
 * Check if styles include visible background
 */
function hasVisibleBackgroundStyle(
  styles: SelectorInfo["currentStyles"]
): boolean {
  if (!styles.backgroundColor) return false;

  const bg = styles.backgroundColor.toLowerCase();
  return bg !== "transparent" && bg !== "none" && bg !== "inherit";
}

/**
 * Check if styles include border
 */
function hasBorderStyle(styles: SelectorInfo["currentStyles"]): boolean {
  return !!styles.borderColor && styles.borderColor !== "transparent";
}

/**
 * Check if selector is text-only (no background, no border)
 */
function isTextOnlySelector(styles: SelectorInfo["currentStyles"]): boolean {
  return (
    !!styles.color &&
    !hasVisibleBackgroundStyle(styles) &&
    !hasBorderStyle(styles)
  );
}

/**
 * Calculate CSS specificity (simplified)
 * Returns a number where higher = more specific
 */
function calculateSpecificity(selector: string): number {
  let specificity = 0;

  // Count IDs (#)
  const ids = (selector.match(/#/g) || []).length;
  specificity += ids * 100;

  // Count classes (.), attributes ([]), and pseudo-classes (:)
  const classes = (selector.match(/\.|(\[)|:/g) || []).length;
  specificity += classes * 10;

  // Count elements
  const elements = selector.split(/[\s>+~]/).filter((s) => {
    const trimmed = s.trim();
    return trimmed && !trimmed.startsWith(".") && !trimmed.startsWith("#");
  }).length;
  specificity += elements;

  return specificity;
}

/**
 * Enrich selectors with DOM information
 */
function enrichWithDOMInfo(
  selectors: SelectorInfo[],
  html: string
): SelectorInfo[] {
  // Count how often each selector appears in the HTML
  return selectors.map((selector) => {
    const count = countSelectorOccurrences(selector.selector, html);
    return {
      ...selector,
      frequency: Math.max(selector.frequency, count),
    };
  });
}

/**
 * Count occurrences of a selector in HTML (simplified)
 */
function countSelectorOccurrences(selector: string, html: string): number {
  // Simple class-based matching
  if (selector.startsWith(".")) {
    const className = selector.substring(1).split(/[.:#\s\[>+~]/)[0];
    const regex = new RegExp(`class="[^"]*\\b${className}\\b`, "g");
    const matches = html.match(regex);
    return matches ? matches.length : 0;
  }

  // Simple ID-based matching
  if (selector.startsWith("#")) {
    const id = selector.substring(1).split(/[.:#\s\[>+~]/)[0];
    const regex = new RegExp(`id="${id}"`, "g");
    const matches = html.match(regex);
    return matches ? matches.length : 0;
  }

  // Element-based matching (less reliable)
  const element = selector.split(/[.:#\s\[>+~]/)[0];
  if (element && element.match(/^[a-z]+$/i)) {
    const regex = new RegExp(`<${element}\\b`, "gi");
    const matches = html.match(regex);
    return matches ? matches.length : 0;
  }

  return 1; // Default
}

/**
 * Categorize selectors by purpose
 */
function categorizeSelectors(selectors: SelectorInfo[]): SelectorInfo[] {
  return selectors.map((selector) => ({
    ...selector,
    category: detectCategory(selector.selector),
  }));
}

/**
 * Detect selector category from selector text
 */
function detectCategory(selector: string): SelectorCategory {
  const lower = selector.toLowerCase();

  // Button detection
  if (
    lower.includes("button") ||
    lower.includes("btn") ||
    lower.match(/\b(submit|reset|primary|secondary|cta)\b/)
  ) {
    return "button";
  }

  // Link detection
  if (lower === "a" || lower.includes("link") || lower.includes("anchor")) {
    return "link";
  }

  // Card detection
  if (
    lower.includes("card") ||
    lower.includes("panel") ||
    lower.includes("box") ||
    lower.includes("tile")
  ) {
    return "card";
  }

  // Sidebar detection
  if (
    lower.includes("sidebar") ||
    lower.includes("aside") ||
    lower.includes("drawer") ||
    lower.includes("sidenav")
  ) {
    return "sidebar";
  }

  // Header detection
  if (
    lower.includes("header") ||
    lower.includes("masthead") ||
    lower.includes("topbar")
  ) {
    return "header";
  }

  // Footer detection
  if (lower.includes("footer") || lower.includes("bottombar")) {
    return "footer";
  }

  // Navigation detection
  if (
    lower.includes("nav") ||
    lower.includes("menu") ||
    lower.includes("breadcrumb") ||
    lower.includes("pagination")
  ) {
    return "navigation";
  }

  // Input detection
  if (
    lower.includes("input") ||
    lower.includes("textarea") ||
    lower.includes("select") ||
    lower.includes("field") ||
    lower.includes("form")
  ) {
    return "input";
  }

  // Modal detection
  if (
    lower.includes("modal") ||
    lower.includes("dialog") ||
    lower.includes("popup") ||
    lower.includes("overlay") ||
    lower.includes("lightbox")
  ) {
    return "modal";
  }

  // Alert/Notification detection
  if (
    lower.includes("alert") ||
    lower.includes("toast") ||
    lower.includes("notification") ||
    lower.includes("message") ||
    lower.includes("banner")
  ) {
    return "alert";
  }

  // Badge detection
  if (
    lower.includes("badge") ||
    lower.includes("tag") ||
    lower.includes("chip") ||
    lower.includes("label") ||
    lower.includes("pill")
  ) {
    return "badge";
  }

  // Tab detection
  if (lower.includes("tab") || lower.includes("pill-group")) {
    return "tab";
  }

  // Switch/Toggle detection
  if (
    lower.includes("switch") ||
    lower.includes("toggle") ||
    lower.includes("checkbox") ||
    lower.includes("radio")
  ) {
    return "switch";
  }

  // Dropdown detection
  if (
    lower.includes("dropdown") ||
    lower.includes("select") ||
    lower.includes("popover")
  ) {
    return "dropdown";
  }

  // Code detection
  if (
    lower.includes("code") ||
    lower.includes("pre") ||
    lower.includes("syntax") ||
    lower.includes("highlight")
  ) {
    return "code";
  }

  // Table detection
  if (
    lower.includes("table") ||
    lower.includes("grid") ||
    lower.includes("row") ||
    lower.includes("cell")
  ) {
    return "table";
  }

  // Background detection (based on styles)
  if (
    lower.includes("background") ||
    lower.includes("bg-") ||
    lower.includes("container") ||
    lower.includes("wrapper")
  ) {
    return "background";
  }

  // Border detection
  if (
    lower.includes("border") ||
    lower.includes("divider") ||
    lower.includes("separator")
  ) {
    return "border";
  }

  // Icon detection
  if (
    lower.includes("icon") ||
    lower.includes("ico") ||
    lower.includes("svg") ||
    lower.includes("glyph")
  ) {
    return "icon";
  }

  // Text detection (headings, paragraphs)
  if (lower.match(/^(h[1-6]|p|span|div|text|title|heading|desc)/)) {
    return "text";
  }

  return "other";
}

/**
 * Group selectors by category
 */
function groupByCategory(selectors: SelectorInfo[]): SelectorGroup[] {
  const groups = new Map<SelectorCategory, SelectorInfo[]>();

  selectors.forEach((selector) => {
    if (!groups.has(selector.category)) {
      groups.set(selector.category, []);
    }
    groups.get(selector.category)!.push(selector);
  });

  return Array.from(groups.entries()).map(([category, selectors]) => ({
    category,
    selectors: selectors.sort((a, b) => b.frequency - a.frequency),
    totalCount: selectors.length,
  }));
}

/**
 * Filter selectors by minimum frequency
 */
export function filterByFrequency(
  groups: SelectorGroup[],
  minFrequency: number = 1
): SelectorGroup[] {
  return groups
    .map((group) => ({
      ...group,
      selectors: group.selectors.filter((s) => s.frequency >= minFrequency),
      totalCount: group.selectors.filter((s) => s.frequency >= minFrequency)
        .length,
    }))
    .filter((group) => group.totalCount > 0);
}

/**
 * Get top N selectors from each category
 */
export function getTopSelectorsPerCategory(
  groups: SelectorGroup[],
  topN: number = 10
): SelectorGroup[] {
  return groups.map((group) => ({
    ...group,
    selectors: group.selectors.slice(0, topN),
    totalCount: Math.min(group.totalCount, topN),
  }));
}

/**
 * Filter selectors that have color properties
 */
export function filterColorSelectors(groups: SelectorGroup[]): SelectorGroup[] {
  return groups
    .map((group) => ({
      ...group,
      selectors: group.selectors.filter(
        (s) =>
          s.currentStyles.color ||
          s.currentStyles.backgroundColor ||
          s.currentStyles.borderColor ||
          s.currentStyles.fill ||
          s.currentStyles.stroke
      ),
    }))
    .filter((group) => group.selectors.length > 0);
}

/**
 * Get selector statistics
 */
export function getSelectorStats(groups: SelectorGroup[]) {
  const totalSelectors = groups.reduce((sum, g) => sum + g.totalCount, 0);
  const totalUnique = groups.reduce((sum, g) => sum + g.selectors.length, 0);

  const byCategory = groups.map((g) => ({
    category: g.category,
    count: g.totalCount,
    topSelector: g.selectors[0]?.selector || "none",
  }));

  const interactive = groups.reduce(
    (sum, g) => sum + g.selectors.filter((s) => s.isInteractive).length,
    0
  );

  const withBackground = groups.reduce(
    (sum, g) => sum + g.selectors.filter((s) => s.hasVisibleBackground).length,
    0
  );

  const textOnly = groups.reduce(
    (sum, g) => sum + g.selectors.filter((s) => s.isTextOnly).length,
    0
  );

  return {
    total: totalSelectors,
    unique: totalUnique,
    byCategory,
    interactive,
    withBackground,
    textOnly,
    avgSpecificity:
      totalUnique > 0
        ? groups.reduce(
            (sum, g) =>
              sum + g.selectors.reduce((s, sel) => s + sel.specificity, 0),
            0
          ) / totalUnique
        : 0,
  };
}

/**
 * Find site-specific selector patterns (e.g., BEM, CSS Modules)
 */
export function findSelectorPatterns(groups: SelectorGroup[]): string[] {
  const patterns = new Set<string>();

  groups.forEach((group) => {
    group.selectors.forEach((selector) => {
      const sel = selector.selector;

      // BEM pattern (block__element--modifier)
      if (sel.match(/[a-z]+-[a-z]+__[a-z]+/i)) {
        patterns.add("BEM");
      }

      // CSS Modules (hash-based)
      if (sel.match(/[a-z]+_[a-z]+__[a-zA-Z0-9]{5,}/)) {
        patterns.add("CSS Modules");
      }

      // Styled Components (sc- prefix)
      if (sel.includes("sc-")) {
        patterns.add("Styled Components");
      }

      // Emotion (css- prefix)
      if (sel.includes("css-")) {
        patterns.add("Emotion");
      }

      // Tailwind-like utilities
      if (sel.match(/\b(flex|grid|p-\d+|m-\d+|text-|bg-)/)) {
        patterns.add("Utility-first");
      }
    });
  });

  return Array.from(patterns);
}

/**
 * Merge similar selectors (for deduplication)
 */
export function mergeSimilarSelectors(
  groups: SelectorGroup[],
  similarityThreshold: number = 0.8
): SelectorGroup[] {
  return groups.map((group) => {
    const merged: SelectorInfo[] = [];
    const seen = new Set<string>();

    group.selectors.forEach((selector) => {
      if (seen.has(selector.selector)) return;

      // Find similar selectors
      const similar = group.selectors.filter(
        (s) =>
          !seen.has(s.selector) &&
          isSimilarSelector(selector.selector, s.selector, similarityThreshold)
      );

      // Merge them
      if (similar.length > 1) {
        const combinedSelector = similar.map((s) => s.selector).join(", ");
        merged.push({
          ...selector,
          selector: combinedSelector,
          frequency: similar.reduce((sum, s) => sum + s.frequency, 0),
        });

        similar.forEach((s) => seen.add(s.selector));
      } else {
        merged.push(selector);
        seen.add(selector.selector);
      }
    });

    return {
      ...group,
      selectors: merged,
      totalCount: merged.length,
    };
  });
}

/**
 * Check if two selectors are similar
 */
function isSimilarSelector(
  sel1: string,
  sel2: string,
  threshold: number
): boolean {
  // Simple similarity: count matching parts
  const parts1 = sel1.split(/[.:#\s\[>+~]/);
  const parts2 = sel2.split(/[.:#\s\[>+~]/);

  const common = parts1.filter((p) => parts2.includes(p)).length;
  const total = Math.max(parts1.length, parts2.length);

  return total > 0 ? common / total >= threshold : false;
}
