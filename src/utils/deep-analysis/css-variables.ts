/**
 * CSS Variable Extractor
 * Extracts and analyzes CSS custom properties from website content
 */

import type { CSSVariable } from '../../types/deep-analysis';

/**
 * Extract all CSS variables from HTML content and CSS stylesheets
 */
export function extractCSSVariables(
  html: string,
  css: string = ''
): CSSVariable[] {
  const variables = new Map<string, CSSVariable>();

  // Parse CSS for variable definitions
  const cssVars = extractFromCSS(css);
  cssVars.forEach(v => variables.set(v.name, v));

  // Parse inline styles for variable definitions
  const inlineVars = extractFromHTML(html);
  inlineVars.forEach(v => {
    if (!variables.has(v.name)) {
      variables.set(v.name, v);
    } else {
      // Merge usage information
      const existing = variables.get(v.name)!;
      existing.usage = [...new Set([...existing.usage, ...v.usage])];
      existing.frequency += v.frequency;
    }
  });

  // Find variable usage across all CSS
  findVariableUsage(variables, css + html);

  return Array.from(variables.values())
    .filter(v => v.name.startsWith('--')) // Only CSS custom properties
    .sort((a, b) => b.frequency - a.frequency); // Sort by usage
}

/**
 * Extract CSS variables from CSS stylesheets
 */
function extractFromCSS(css: string): CSSVariable[] {
  const variables: CSSVariable[] = [];

  // Match CSS rule blocks: selector { properties }
  const ruleBlockRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleBlockRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const properties = match[2];

    // Match CSS custom properties: --name: value;
    const varRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let varMatch;

    while ((varMatch = varRegex.exec(properties)) !== null) {
      const name = varMatch[1].trim();
      const value = varMatch[2].trim();

      variables.push({
        name,
        value,
        computedValue: resolveValue(value),
        scope: getScope(selector),
        selector,
        usage: [],
        frequency: 0,
      });
    }
  }

  return variables;
}

/**
 * Extract CSS variables from HTML inline styles and <style> tags
 */
function extractFromHTML(html: string): CSSVariable[] {
  const variables: CSSVariable[] = [];

  // Extract from <style> tags
  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;

  while ((match = styleTagRegex.exec(html)) !== null) {
    const cssContent = match[1];
    variables.push(...extractFromCSS(cssContent));
  }

  // Extract from inline style attributes
  const inlineStyleRegex = /style="([^"]*)"/gi;
  while ((match = inlineStyleRegex.exec(html)) !== null) {
    const styleContent = match[1];
    const varRegex = /(--[\w-]+)\s*:\s*([^;]+)/g;
    let varMatch;

    while ((varMatch = varRegex.exec(styleContent)) !== null) {
      const name = varMatch[1].trim();
      const value = varMatch[2].trim();

      variables.push({
        name,
        value,
        computedValue: resolveValue(value),
        scope: 'element',
        selector: '[style]',
        usage: [],
        frequency: 1,
      });
    }
  }

  return variables;
}

/**
 * Find where CSS variables are used (var() references)
 */
function findVariableUsage(
  variables: Map<string, CSSVariable>,
  content: string
) {
  // Match var() function calls: var(--name) or var(--name, fallback)
  const varUsageRegex = /var\(\s*(--[\w-]+)(?:\s*,\s*([^)]+))?\s*\)/g;
  const usageMap = new Map<string, Set<string>>();

  let match;
  while ((match = varUsageRegex.exec(content)) !== null) {
    const varName = match[1].trim();

    if (!usageMap.has(varName)) {
      usageMap.set(varName, new Set());
    }

    // Try to find the selector context (simplified)
    const before = content.substring(Math.max(0, match.index - 200), match.index);
    const selectorMatch = before.match(/([^\{;]+)\{[^\}]*$/);
    if (selectorMatch) {
      usageMap.get(varName)!.add(selectorMatch[1].trim());
    }
  }

  // Update variables with usage information
  usageMap.forEach((selectors, varName) => {
    const variable = variables.get(varName);
    if (variable) {
      variable.usage = Array.from(selectors);
      variable.frequency = selectors.size;
    }
  });
}

/**
 * Determine the scope of a CSS variable
 */
function getScope(selector: string): 'root' | 'element' | 'class' {
  const normalized = selector.toLowerCase().trim();

  if (normalized === ':root' || normalized === 'html') {
    return 'root';
  }

  if (normalized.startsWith('.') || normalized.includes('[class')) {
    return 'class';
  }

  return 'element';
}

/**
 * Resolve CSS value (handle var() references, calculations, etc.)
 */
function resolveValue(value: string): string {
  // Remove var() references for simplicity
  // In a real implementation, we'd recursively resolve variables
  const cleaned = value.replace(/var\([^)]+\)/g, '').trim();

  // Handle common CSS functions
  if (cleaned.startsWith('rgb(') || cleaned.startsWith('rgba(')) {
    return normalizeRGBColor(cleaned);
  }

  if (cleaned.startsWith('#')) {
    return normalizeHexColor(cleaned);
  }

  return cleaned;
}

/**
 * Normalize RGB/RGBA colors to hex
 */
function normalizeRGBColor(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return rgb;

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Normalize hex colors to 6-digit format
 */
function normalizeHexColor(hex: string): string {
  // Remove # if present
  const cleaned = hex.replace('#', '');

  // Expand 3-digit hex to 6-digit
  if (cleaned.length === 3) {
    return `#${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`;
  }

  // Return 6-digit hex
  if (cleaned.length === 6) {
    return `#${cleaned}`;
  }

  return hex;
}

/**
 * Group CSS variables by prefix/category
 */
export function groupCSSVariables(
  variables: CSSVariable[]
): Map<string, CSSVariable[]> {
  const groups = new Map<string, CSSVariable[]>();

  variables.forEach(variable => {
    // Extract prefix (e.g., "--theme-" from "--theme-col-txt-title")
    const prefixMatch = variable.name.match(/^(--[\w-]+?-)/);
    const prefix = prefixMatch ? prefixMatch[1] : '--other-';

    if (!groups.has(prefix)) {
      groups.set(prefix, []);
    }
    groups.get(prefix)!.push(variable);
  });

  return groups;
}

/**
 * Filter CSS variables by color values only
 */
export function filterColorVariables(
  variables: CSSVariable[]
): CSSVariable[] {
  return variables.filter(v => isColorValue(v.computedValue || v.value));
}

/**
 * Check if a value is a color
 */
function isColorValue(value: string): boolean {
  const cleaned = value.trim().toLowerCase();

  // Hex colors
  if (cleaned.startsWith('#')) return true;

  // RGB/RGBA
  if (cleaned.startsWith('rgb(') || cleaned.startsWith('rgba(')) return true;

  // HSL/HSLA
  if (cleaned.startsWith('hsl(') || cleaned.startsWith('hsla(')) return true;

  // Named colors (subset)
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
    'gray', 'grey', 'cyan', 'magenta', 'pink', 'brown', 'transparent',
  ];

  return namedColors.some(color => cleaned === color);
}

/**
 * Detect dark/light mode variables
 */
export function detectModeVariables(
  variables: CSSVariable[]
): { dark: CSSVariable[]; light: CSSVariable[]; neutral: CSSVariable[] } {
  const dark: CSSVariable[] = [];
  const light: CSSVariable[] = [];
  const neutral: CSSVariable[] = [];

  variables.forEach(v => {
    const selector = v.selector.toLowerCase();

    if (selector.includes('dark') || selector.includes('[data-theme="dark"]')) {
      dark.push(v);
    } else if (selector.includes('light') || selector.includes('[data-theme="light"]')) {
      light.push(v);
    } else {
      neutral.push(v);
    }
  });

  return { dark, light, neutral };
}

/**
 * Get CSS variable statistics
 */
export function getVariableStats(variables: CSSVariable[]) {
  const total = variables.length;
  const colorVars = filterColorVariables(variables);
  const groups = groupCSSVariables(variables);
  const modeVars = detectModeVariables(variables);

  const scopes = {
    root: variables.filter(v => v.scope === 'root').length,
    class: variables.filter(v => v.scope === 'class').length,
    element: variables.filter(v => v.scope === 'element').length,
  };

  return {
    total,
    colorVariables: colorVars.length,
    groups: groups.size,
    prefixes: Array.from(groups.keys()),
    scopes,
    darkMode: modeVars.dark.length,
    lightMode: modeVars.light.length,
    neutral: modeVars.neutral.length,
    mostUsed: variables
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
      .map(v => ({ name: v.name, usage: v.frequency })),
  };
}
