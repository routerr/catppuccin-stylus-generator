/**
 * Design System Detector
 * Detects and analyzes design systems and CSS frameworks
 */

import type { DesignSystem, DesignSystemType, CSSVariable } from '../../types/deep-analysis';

/**
 * Detect the design system used by the website
 */
export function detectDesignSystem(
  html: string,
  css: string,
  variables: CSSVariable[]
): DesignSystem {
  const detectors = [
    detectMaterialDesign,
    detectBootstrap,
    detectTailwind,
    detectAntDesign,
    detectChakraUI,
  ];

  // Run all detectors and pick the one with highest confidence
  const results = detectors.map(detector => detector(html, css, variables));
  const bestMatch = results.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  );

  // If confidence is too low, mark as custom or unknown
  if (bestMatch.confidence < 0.3) {
    return detectCustomSystem(html, css, variables);
  }

  return bestMatch;
}

/**
 * Detect Material Design (MDC)
 */
function detectMaterialDesign(
  html: string,
  css: string,
  variables: CSSVariable[]
): DesignSystem {
  let confidence = 0;
  const indicators: string[] = [];

  // Check for MDC class names
  if (html.match(/class="[^"]*mdc-/)) {
    confidence += 0.3;
    indicators.push('MDC class names found');
  }

  // Check for Material variables
  const mdcVarPrefixes = ['--mdc-', '--mat-', '--md-'];
  const mdcVars = variables.filter(v =>
    mdcVarPrefixes.some(prefix => v.name.startsWith(prefix))
  );

  if (mdcVars.length > 5) {
    confidence += 0.4;
    indicators.push(`${mdcVars.length} Material variables found`);
  }

  // Check for Material typography classes
  if (css.match(/\.mdc-typography|\.mat-typography/)) {
    confidence += 0.2;
    indicators.push('Material typography found');
  }

  // Check for Material colors
  if (css.match(/--mdc-theme-primary|--mdc-theme-secondary/)) {
    confidence += 0.1;
    indicators.push('Material theme colors found');
  }

  return {
    framework: 'material',
    confidence: Math.min(confidence, 1),
    variablePrefix: mdcVarPrefixes,
    colorTokens: extractColorTokens(mdcVars),
    componentPatterns: extractMaterialPatterns(html),
    themeToggle: detectMaterialThemeToggle(html, css),
  };
}

/**
 * Detect Bootstrap
 */
function detectBootstrap(
  html: string,
  css: string,
  variables: CSSVariable[]
): DesignSystem {
  let confidence = 0;

  // Check for Bootstrap class names
  if (html.match(/class="[^"]*(btn-|col-|row|container)/)) {
    confidence += 0.3;
  }

  // Check for Bootstrap variables
  const bsVarPrefixes = ['--bs-'];
  const bsVars = variables.filter(v => v.name.startsWith('--bs-'));

  if (bsVars.length > 5) {
    confidence += 0.4;
  }

  // Check for Bootstrap grid
  if (css.match(/\.container|\.row|\.col-/)) {
    confidence += 0.2;
  }

  // Check for Bootstrap utilities
  if (html.match(/class="[^"]*(text-|bg-|border-)/)) {
    confidence += 0.1;
  }

  return {
    framework: 'bootstrap',
    confidence: Math.min(confidence, 1),
    variablePrefix: bsVarPrefixes,
    colorTokens: extractColorTokens(bsVars),
    componentPatterns: extractBootstrapPatterns(html),
    themeToggle: detectBootstrapThemeToggle(html, css),
  };
}

/**
 * Detect Tailwind CSS
 */
function detectTailwind(
  html: string,
  css: string,
  variables: CSSVariable[]
): DesignSystem {
  let confidence = 0;

  // Check for Tailwind utility classes (very distinctive pattern)
  const tailwindPattern = /class="[^"]*(flex|grid|p-\d+|m-\d+|text-\w+|bg-\w+)/;
  if (html.match(tailwindPattern)) {
    confidence += 0.4;
  }

  // Check for Tailwind color utilities
  if (html.match(/class="[^"]*(bg-red-|text-blue-|border-green-)/)) {
    confidence += 0.3;
  }

  // Check for Tailwind responsive classes
  if (html.match(/class="[^"]*(sm:|md:|lg:|xl:)/)) {
    confidence += 0.2;
  }

  // Tailwind uses minimal CSS variables
  const twVars = variables.filter(v => v.name.startsWith('--tw-'));
  if (twVars.length > 0) {
    confidence += 0.1;
  }

  return {
    framework: 'tailwind',
    confidence: Math.min(confidence, 1),
    variablePrefix: ['--tw-'],
    colorTokens: extractColorTokens(twVars),
    componentPatterns: extractTailwindPatterns(html),
    themeToggle: detectTailwindThemeToggle(html, css),
  };
}

/**
 * Detect Ant Design
 */
function detectAntDesign(
  html: string,
  css: string,
  variables: CSSVariable[]
): DesignSystem {
  let confidence = 0;

  // Check for Ant Design class names
  if (html.match(/class="[^"]*ant-/)) {
    confidence += 0.4;
  }

  // Check for Ant Design variables
  const antVars = variables.filter(v => v.name.startsWith('--ant-'));
  if (antVars.length > 5) {
    confidence += 0.4;
  }

  // Check for Ant Design components
  if (css.match(/\.ant-btn|\.ant-card|\.ant-table/)) {
    confidence += 0.2;
  }

  return {
    framework: 'antd',
    confidence: Math.min(confidence, 1),
    variablePrefix: ['--ant-'],
    colorTokens: extractColorTokens(antVars),
    componentPatterns: extractAntPatterns(html),
    themeToggle: detectAntThemeToggle(html, css),
  };
}

/**
 * Detect Chakra UI
 */
function detectChakraUI(
  html: string,
  css: string,
  variables: CSSVariable[]
): DesignSystem {
  let confidence = 0;

  // Check for Chakra class names
  if (html.match(/class="[^"]*chakra-/)) {
    confidence += 0.4;
  }

  // Check for Chakra variables
  const chakraVars = variables.filter(v =>
    v.name.startsWith('--chakra-')
  );

  if (chakraVars.length > 5) {
    confidence += 0.4;
  }

  // Check for Chakra design tokens
  if (css.match(/var\(--chakra-colors|var\(--chakra-space/)) {
    confidence += 0.2;
  }

  return {
    framework: 'chakra',
    confidence: Math.min(confidence, 1),
    variablePrefix: ['--chakra-'],
    colorTokens: extractColorTokens(chakraVars),
    componentPatterns: extractChakraPatterns(html),
    themeToggle: detectChakraThemeToggle(html, css),
  };
}

/**
 * Detect custom design system
 */
function detectCustomSystem(
  html: string,
  css: string,
  variables: CSSVariable[]
): DesignSystem {
  // Detect the most common variable prefix
  const prefixMap = new Map<string, number>();

  variables.forEach(v => {
    const match = v.name.match(/^(--[\w-]+?-)/);
    if (match) {
      const prefix = match[1];
      prefixMap.set(prefix, (prefixMap.get(prefix) || 0) + 1);
    }
  });

  const sortedPrefixes = Array.from(prefixMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([prefix]) => prefix);

  return {
    framework: sortedPrefixes.length > 0 ? 'custom' : 'unknown',
    confidence: sortedPrefixes.length > 0 ? 0.5 : 0,
    variablePrefix: sortedPrefixes.slice(0, 3),
    colorTokens: extractColorTokens(variables),
    componentPatterns: [],
    themeToggle: detectGenericThemeToggle(html, css),
  };
}

/**
 * Extract color tokens from variables
 */
function extractColorTokens(variables: CSSVariable[]): Map<string, string> {
  const tokens = new Map<string, string>();

  variables.forEach(v => {
    // Only include color values
    if (isColorValue(v.value) || isColorValue(v.computedValue)) {
      tokens.set(v.name, v.computedValue || v.value);
    }
  });

  return tokens;
}

/**
 * Check if a value is likely a color
 */
function isColorValue(value: string): boolean {
  if (!value) return false;

  const cleaned = value.trim().toLowerCase();

  return (
    cleaned.startsWith('#') ||
    cleaned.startsWith('rgb') ||
    cleaned.startsWith('hsl') ||
    ['black', 'white', 'red', 'green', 'blue', 'yellow', 'transparent'].some(
      color => cleaned === color
    )
  );
}

/**
 * Extract Material Design component patterns
 */
function extractMaterialPatterns(html: string): string[] {
  const patterns = new Set<string>();
  const mdcRegex = /class="[^"]*\b(mdc-[\w-]+)/g;
  let match;

  while ((match = mdcRegex.exec(html)) !== null) {
    patterns.add(match[1]);
  }

  return Array.from(patterns);
}

/**
 * Extract Bootstrap component patterns
 */
function extractBootstrapPatterns(html: string): string[] {
  const patterns = new Set<string>();
  const bsRegex = /class="[^"]*\b(btn-|col-|card-|nav-|navbar-|alert-|badge-)[\w-]+/g;
  let match;

  while ((match = bsRegex.exec(html)) !== null) {
    patterns.add(match[1]);
  }

  return Array.from(patterns);
}

/**
 * Extract Tailwind utility patterns
 */
function extractTailwindPatterns(html: string): string[] {
  const patterns = new Set<string>();
  const twRegex = /class="([^"]*)"/g;
  let match;

  while ((match = twRegex.exec(html)) !== null) {
    const classes = match[1].split(/\s+/);
    classes.forEach(cls => {
      if (cls.match(/^(bg-|text-|border-|p-|m-|flex|grid)/)) {
        patterns.add(cls);
      }
    });
  }

  return Array.from(patterns).slice(0, 50); // Limit to 50
}

/**
 * Extract Ant Design patterns
 */
function extractAntPatterns(html: string): string[] {
  const patterns = new Set<string>();
  const antRegex = /class="[^"]*\b(ant-[\w-]+)/g;
  let match;

  while ((match = antRegex.exec(html)) !== null) {
    patterns.add(match[1]);
  }

  return Array.from(patterns);
}

/**
 * Extract Chakra UI patterns
 */
function extractChakraPatterns(html: string): string[] {
  const patterns = new Set<string>();
  const chakraRegex = /class="[^"]*\b(chakra-[\w-]+)/g;
  let match;

  while ((match = chakraRegex.exec(html)) !== null) {
    patterns.add(match[1]);
  }

  return Array.from(patterns);
}

/**
 * Detect Material Design theme toggle
 */
function detectMaterialThemeToggle(html: string, css: string) {
  if (css.match(/\.mdc-theme--dark|data-mdc-theme="dark"/)) {
    return {
      darkClass: '.mdc-theme--dark',
      attribute: 'data-mdc-theme',
      values: ['dark', 'light'],
    };
  }
  return undefined;
}

/**
 * Detect Bootstrap theme toggle
 */
function detectBootstrapThemeToggle(html: string, css: string) {
  if (html.match(/data-bs-theme="dark"|data-bs-theme="light"/)) {
    return {
      attribute: 'data-bs-theme',
      values: ['dark', 'light'],
    };
  }
  return undefined;
}

/**
 * Detect Tailwind theme toggle
 */
function detectTailwindThemeToggle(html: string, css: string) {
  if (html.match(/class="[^"]*\bdark\b/) || css.match(/\.dark\s/)) {
    return {
      darkClass: '.dark',
    };
  }
  return undefined;
}

/**
 * Detect Ant Design theme toggle
 */
function detectAntThemeToggle(html: string, css: string) {
  if (css.match(/data-theme="dark"|\.ant-theme-dark/)) {
    return {
      darkClass: '.ant-theme-dark',
      attribute: 'data-theme',
      values: ['dark', 'light'],
    };
  }
  return undefined;
}

/**
 * Detect Chakra UI theme toggle
 */
function detectChakraThemeToggle(html: string, css: string) {
  if (html.match(/data-theme="dark"|class="[^"]*chakra-ui-dark/)) {
    return {
      darkClass: '.chakra-ui-dark',
      attribute: 'data-theme',
      values: ['dark', 'light'],
    };
  }
  return undefined;
}

/**
 * Detect generic theme toggle patterns
 */
function detectGenericThemeToggle(html: string, css: string) {
  // Common patterns
  const patterns = [
    { darkClass: '.dark', lightClass: '.light' },
    { darkClass: '.dark-theme', lightClass: '.light-theme' },
    { darkClass: '.dark-mode', lightClass: '.light-mode' },
    { attribute: 'data-theme', values: ['dark', 'light'] as [string, string] },
    { attribute: 'data-color-scheme', values: ['dark', 'light'] as [string, string] },
  ];

  for (const pattern of patterns) {
    if (pattern.darkClass && css.includes(pattern.darkClass)) {
      return pattern;
    }
    if (pattern.attribute && html.includes(pattern.attribute)) {
      return pattern;
    }
  }

  return undefined;
}

/**
 * Get design system statistics
 */
export function getDesignSystemStats(system: DesignSystem) {
  return {
    framework: system.framework,
    confidence: Math.round(system.confidence * 100),
    prefixCount: system.variablePrefix.length,
    prefixes: system.variablePrefix,
    colorTokenCount: system.colorTokens.size,
    patternCount: system.componentPatterns.length,
    hasThemeToggle: !!system.themeToggle,
    themeToggleMethod: system.themeToggle?.darkClass
      ? 'class'
      : system.themeToggle?.attribute
        ? 'attribute'
        : 'none',
  };
}
