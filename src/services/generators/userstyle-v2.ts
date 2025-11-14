import type {
  DeepAnalysisResult,
  MappingResult,
  GeneratedTheme,
  VariableMapping,
  SelectorMapping,
  SVGColorMapping,
  ProcessedSVG,
} from '../../types/deep-analysis';
import type {
  CatppuccinFlavor,
  CatppuccinAccent,
  CatppuccinColor,
} from '../../types/catppuccin';
import { PRECOMPUTED_ACCENTS } from '../../utils/accent-schemes';
import { generateSVGLESS } from '../../utils/deep-analysis/svg-analyzer';

export interface UserstyleV2Config {
  url: string;
  flavor: CatppuccinFlavor;
  mainAccent: CatppuccinAccent;
  version?: string;
  includeComments?: boolean;
}

const INDENT = '  ';
const SECTION_COMMENT = '/* -------------------------------------------------------------------------- */';

export function generateUserstyleV2(
  analysis: DeepAnalysisResult,
  mappings: MappingResult,
  config: UserstyleV2Config,
): GeneratedTheme {
  const includeComments = config.includeComments ?? true;
  const version = config.version ?? 'v2';
  const hostname = safeHostname(config.url);
  const accentSet = PRECOMPUTED_ACCENTS[config.flavor][config.mainAccent];

  const sections = {
    variables: buildVariableSection(mappings.variableMappings, includeComments),
    svgs: buildSvgSection(mappings.svgMappings, mappings.processedSVGs, includeComments),
    selectors: buildSelectorSection(mappings.selectorMappings, includeComments),
    gradients: buildGradientSection(mappings.selectorMappings, includeComments),
    fallbacks: buildFallbackSection(config.mainAccent, accentSet, includeComments),
  };

  const less = buildUserstyleDocument(hostname, analysis.mode, sections, includeComments);
  const coverage = computeCoverage(mappings.stats);

  return {
    less,
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

function buildUserstyleDocument(
  hostname: string,
  mode: DeepAnalysisResult['mode'],
  sections: Record<'variables' | 'svgs' | 'selectors' | 'gradients' | 'fallbacks', string>,
  includeComments: boolean,
): string {
  const lines: string[] = [];
  if (includeComments) {
    lines.push('/*');
    lines.push(' * Catppuccin Masterpiece Theme');
    lines.push(` * Generated for ${hostname || 'unknown host'}`);
    lines.push(' * Automatically produced by the deep analysis pipeline.');
    lines.push(' * Layout preservation guaranteed – colors only.');
    lines.push(' */');
    lines.push('');
  }

  lines.push(`@-moz-document domain("${hostname || '*'}") {`);
  lines.push(`${INDENT}#catppuccin(@flavor) {`);

  const sectionOrder: Array<[keyof typeof sections, string]> = [
    ['variables', 'SECTION 1: CSS VARIABLES (highest priority)'],
    ['svgs', 'SECTION 2: SVG REPLACEMENTS'],
    ['selectors', 'SECTION 3: SITE-SPECIFIC SELECTORS'],
    ['gradients', 'SECTION 4: HOVER & GRADIENT ENHANCEMENTS'],
    ['fallbacks', 'SECTION 5: FALLBACK GUARDS'],
  ];

  sectionOrder.forEach(([key, title]) => {
    const content = sections[key];
    if (!content.trim()) {
      return;
    }
    if (includeComments) {
      lines.push(`${INDENT}${SECTION_COMMENT}`);
      lines.push(`${INDENT}/* ${title} */`);
      lines.push(`${INDENT}${SECTION_COMMENT}`);
    }
    lines.push(indentBlock(content, 2));
    lines.push('');
  });

  if (includeComments) {
    lines.push(`${INDENT}/* Auto-detected color mode: ${mode} */`);
  }

  lines.push(`${INDENT}}`);
  lines.push('');

  const flavorSelectors = buildFlavorInvocationSelectors(mode);
  lines.push(`${INDENT}${flavorSelectors.join(`,\n${INDENT}`)} {`);
  lines.push(`${INDENT}${INDENT}#catppuccin(@flavor);`);
  lines.push(`${INDENT}}`);
  lines.push('}');

  return lines.join('\n');
}

function buildVariableSection(mappings: VariableMapping[], includeComments: boolean): string {
  if (mappings.length === 0) {
    return includeComments ? '/* No CSS variables detected for direct mapping */' : '';
  }

  const lines: string[] = [];
  if (includeComments) {
    lines.push('/* Apply Catppuccin colors to existing CSS custom properties */');
  }

  const variableLines: string[] = [];
  mappings.forEach(mapping => {
    const colorToken = toToken(mapping.catppuccin);
    const comment = includeComments ? ` // ${mapping.reason}` : '';
    variableLines.push(`${INDENT}${mapping.original}: ${colorToken} !important;${comment}`);
  });

  if (variableLines.length > 0) {
    lines.push(':root {');
    lines.push(...variableLines);
    lines.push('}');
  }

  return lines.join('\n');
}

function buildSvgSection(
  svgMappings: Map<string, SVGColorMapping>,
  processedSVGs: ProcessedSVG[],
  includeComments: boolean,
): string {
  if (processedSVGs.length === 0) {
    return includeComments ? '/* No SVG colors detected – skipping icon replacement */' : '';
  }

  const lines: string[] = [];

  if (includeComments) {
    lines.push('/* Re-color inline SVG assets using Catppuccin accents */');
    svgMappings.forEach(mapping => {
      lines.push(`/* ${mapping.svgPurpose}: ${mapping.originalColor} → ${toToken(mapping.catppuccinColor)} (${mapping.reason}) */`);
    });
  }

  processedSVGs.forEach(processed => {
    const block = generateSVGLESS(processed).trim();
    if (!block) {
      return;
    }
    lines.push(block);
    lines.push('');
  });

  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

function buildSelectorSection(mappings: SelectorMapping[], includeComments: boolean): string {
  if (mappings.length === 0) {
    return includeComments ? '/* No selector-level mappings generated */' : '';
  }

  const lines: string[] = [];
  mappings.forEach(mapping => {
    if (includeComments) {
      lines.push(`/* ${mapping.reason} */`);
    }
    lines.push(`${mapping.selector} {`);
    COLOR_PROPERTIES.forEach(property => {
      const color = mapping.properties[property];
      if (!color) {
        return;
      }
      const token = toToken(color);
      const important = mapping.important ? ' !important' : '';
      lines.push(`${INDENT}${kebabCase(property)}: ${token}${important};`);
    });
    lines.push('}');
    lines.push('');
  });

  return lines.join('\n');
}

function buildGradientSection(mappings: SelectorMapping[], includeComments: boolean): string {
  const gradientRules = mappings.filter(mapping => mapping.hoverGradient);
  if (gradientRules.length === 0) {
    return includeComments ? '/* No hover gradients generated */' : '';
  }

  const lines: string[] = [];
  gradientRules.forEach(mapping => {
    const gradient = mapping.hoverGradient!;
    if (includeComments) {
      lines.push(`/* Hover gradient for ${mapping.selector} */`);
    }
    lines.push(`${mapping.selector}:hover {`);
    const mainToken = toToken(gradient.mainColor);
    const accentToken = toToken(gradient.biAccent);
    lines.push(`${INDENT}background: linear-gradient(${Math.round(gradient.angle)}deg, ${mainToken}, ${accentToken});`);
    lines.push(`${INDENT}color: @text;`);
    lines.push('}');
    lines.push('');
  });

  return lines.join('\n');
}

function buildFallbackSection(
  mainAccent: CatppuccinAccent,
  accentSet: { biAccent1: CatppuccinAccent; biAccent2: CatppuccinAccent },
  includeComments: boolean,
): string {
  const lines: string[] = [];
  if (includeComments) {
    lines.push('/* Guard gradient text and provide generic color fallbacks */');
  }

  const revertDeclarations = [
    'color: revert !important;',
    'background: revert !important;',
    'background-color: revert !important;',
    'background-image: revert !important;',
    '-webkit-background-clip: revert !important;',
    'background-clip: revert !important;',
    '-webkit-text-fill-color: revert !important;',
    'text-fill-color: revert !important;',
  ];

  const pushRevertBlock = (selectors: string[], comment?: string) => {
    lines.push(`${selectors.join(',\n')} {`);
    if (includeComments && comment) {
      lines.push(`${INDENT}${comment}`);
    }
    revertDeclarations.forEach(declaration => {
      lines.push(`${INDENT}${declaration}`);
    });
    lines.push('}');
    lines.push('');
  };

  pushRevertBlock(
    [
      '[class*="bg-clip-text"]',
      '[class*="text-transparent"]',
      '[class*="bg-gradient"]',
      '[class*="from-"]',
      '[class*="via-"]',
      '[class*="to-"]',
      '.bg-clip-text',
      '.text-transparent',
      '.text-clip',
    ],
    '/* Preserve original gradient text colors */',
  );

  pushRevertBlock(
    [
      '*[class*="bg-clip-text"]',
      '*[class*="text-transparent"]',
      '*[class*="bg-gradient"]',
      '*[class*="from-"]',
      '*[class*="via-"]',
      '*[class*="to-"]',
      'h1 [class*="bg-clip-text"]',
      'h1 [class*="text-transparent"]',
      'h1 [class*="bg-gradient"]',
      'h2 [class*="bg-clip-text"]',
      'h2 [class*="text-transparent"]',
      'h2 [class*="bg-gradient"]',
      'h3 [class*="bg-clip-text"]',
      'h3 [class*="text-transparent"]',
      'h3 [class*="bg-gradient"]',
      'h4 [class*="bg-clip-text"]',
      'h4 [class*="text-transparent"]',
      'h4 [class*="bg-gradient"]',
      'h5 [class*="bg-clip-text"]',
      'h5 [class*="text-transparent"]',
      'h5 [class*="bg-gradient"]',
      'h6 [class*="bg-clip-text"]',
      'h6 [class*="text-transparent"]',
      'h6 [class*="bg-gradient"]',
    ],
    '/* Guard gradient descendants from theme overrides */',
  );

  const headingSelectors = [
    'h1:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
    'h2:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
    'h3:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
    'h4:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
    'h5:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
    'h6:not([class*="bg-clip-text"]):not([class*="bg-gradient"]):not(:has([class*="bg-clip-text"]))',
  ];
  lines.push(`${headingSelectors.join(',\n')} {`);
  if (includeComments) {
    lines.push(`${INDENT}/* Allow headings to use theme text colors when no gradient children exist */`);
  }
  lines.push(`${INDENT}color: @text;`);
  lines.push('}');
  lines.push('');

  lines.push(`a:not([class*="bg-clip-text"]):not([class*="text-transparent"]) {`);
  lines.push(`${INDENT}color: ${toToken(mainAccent)};`);
  lines.push('}');
  lines.push('');

  lines.push('button, [role="button"] {');
  lines.push(`${INDENT}color: @text;`);
  lines.push(`${INDENT}background-color: ${toToken(mainAccent)};`);
  lines.push('}');
  lines.push('');

  lines.push('input:focus, textarea:focus, select:focus {');
  lines.push(`${INDENT}outline-color: ${toToken(accentSet.biAccent1)};`);
  lines.push('}');
  lines.push('');

  lines.push('.badge, .tag, [class*="badge"], [class*="tag"] {');
  lines.push(`${INDENT}background-color: ${toToken(accentSet.biAccent2)};`);
  lines.push(`${INDENT}color: @text;`);
  lines.push('}');

  return lines.join('\n');
}

function computeCoverage(stats: MappingResult['stats']) {
  const variableCoverage = stats.totalVariables === 0
    ? 0
    : Math.round((stats.mappedVariables / stats.totalVariables) * 100);
  const svgCoverage = stats.totalSVGs === 0
    ? 0
    : Math.round((stats.processedSVGs / stats.totalSVGs) * 100);
  const selectorCoverage = stats.totalSelectors === 0
    ? 0
    : Math.round((stats.mappedSelectors / stats.totalSelectors) * 100);

  return {
    variableCoverage,
    svgCoverage,
    selectorCoverage,
  };
}

function buildFlavorInvocationSelectors(mode: DeepAnalysisResult['mode']): string[] {
  const baseSelectors = [
    ':root',
    'html',
    'body',
  ];

  const modeSelectors = mode === 'dark'
    ? [
        ':root[data-mode="dark"]',
        ':root[data-theme="dark"]',
        'html[data-theme="dark"]',
        'body[data-theme="dark"]',
      ]
    : [
        ':root[data-mode="light"]',
        ':root[data-theme="light"]',
        'html[data-theme="light"]',
        'body[data-theme="light"]',
      ];

  return [...modeSelectors, ...baseSelectors];
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return url;
  }
}

function indentBlock(block: string, depth: number): string {
  const prefix = INDENT.repeat(depth);
  return block
    .split('\n')
    .map(line => (line.length > 0 ? `${prefix}${line}` : ''))
    .join('\n');
}

function toToken(color: CatppuccinColor | CatppuccinAccent): string {
  return `@${color}`;
}

function kebabCase(value: string): string {
  return value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

const COLOR_PROPERTIES: Array<keyof SelectorMapping['properties']> = [
  'color',
  'backgroundColor',
  'borderColor',
  'fill',
  'stroke',
];
