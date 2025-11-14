/**
 * Deep Mapper Service
 * Maps analyzed website elements to Catppuccin colors using AI
 *
 * This is the intelligence layer that connects deep analysis → Catppuccin palette.
 */

import type {
  DeepAnalysisResult,
  MappingResult,
  VariableMapping,
  SVGColorMapping,
  SelectorMapping,
  CSSVariable,
  SVGInfo,
  SelectorGroup,
  SelectorInfo,
  ProcessedSVG,
  SelectorCategory,
} from '../../types/deep-analysis';
import type {
  CatppuccinFlavor,
  CatppuccinAccent,
  CatppuccinColor,
} from '../../types/catppuccin';
import type { AIProvider, CrawlerResult } from '../../types/theme';
import {
  PRECOMPUTED_ACCENTS,
  ACCENT_NAMES,
  nearestAccentByRGB,
  hexToRgb,
} from '../../utils/accent-schemes';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { processSVGForLESS } from '../../utils/deep-analysis/svg-analyzer';
import { analyzeColorsWithOpenRouter } from './openrouter';
import { analyzeColorsWithChutes } from './chutes';

const CATPPUCCIN_COLOR_TOKENS: CatppuccinColor[] = [
  'base',
  'mantle',
  'crust',
  'surface0',
  'surface1',
  'surface2',
  'overlay0',
  'overlay1',
  'overlay2',
  'subtext0',
  'subtext1',
  'text',
  'rosewater',
  'flamingo',
  'pink',
  'mauve',
  'red',
  'maroon',
  'peach',
  'yellow',
  'green',
  'teal',
  'sky',
  'sapphire',
  'blue',
  'lavender',
];

const CATPPUCCIN_COLOR_SET = new Set<CatppuccinColor>(CATPPUCCIN_COLOR_TOKENS);
const ACCENT_COLOR_SET = new Set<CatppuccinAccent>(ACCENT_NAMES);
const JSON_BLOCK_REGEX = /\{[\s\S]*\}/;
const DEFAULT_SELECTOR_LIMIT = 40;

const COLOR_PROPERTIES: Array<keyof SelectorMapping['properties']> = [
  'color',
  'backgroundColor',
  'borderColor',
  'fill',
  'stroke',
];

type VariablePurpose = 'background' | 'text' | 'accent' | 'border' | 'hover' | 'other';

type SelectorEntry = {
  info: SelectorInfo;
  category: SelectorCategory;
};

export interface DeepMapperConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  mainAccent: CatppuccinAccent;
  flavor: CatppuccinFlavor;
  enableVariableMapping: boolean;
  enableSVGMapping: boolean;
  enableSelectorMapping: boolean;
  useAIForVariables: boolean;
  useAIForSVGs: boolean;
  useAIForSelectors: boolean;
  maxSelectors?: number;
  debug?: boolean;
}

export async function mapWithDeepAnalysis(
  analysis: DeepAnalysisResult,
  config: DeepMapperConfig,
): Promise<MappingResult> {
  const selectorLimit = config.maxSelectors ?? DEFAULT_SELECTOR_LIMIT;

  const variableMappings = await mapCSSVariables(analysis, config);
  const svgMappings = await mapSVGColors(analysis, config);
  const processedSVGs = generateProcessedSVGs(analysis, svgMappings);
  const selectorMappings = await mapSelectors(analysis, config, selectorLimit);

  const stats = computeMappingStats(
    variableMappings,
    svgMappings,
    processedSVGs,
    selectorMappings,
    analysis,
    config,
  );

  return {
    variableMappings,
    svgMappings,
    selectorMappings,
    processedSVGs,
    stats,
  };
}

async function mapCSSVariables(
  analysis: DeepAnalysisResult,
  config: DeepMapperConfig,
): Promise<VariableMapping[]> {
  const variables = analysis.cssVariables;
  if (!config.enableVariableMapping || variables.length === 0) {
    return [];
  }

  const fallback = createFallbackVariableMappings(
    variables,
    analysis.mode,
    config.mainAccent,
  );

  if (!config.useAIForVariables) {
    return fallback;
  }

  const prompt = buildCSSVariablePrompt(variables, analysis, config);

  try {
    const response = await callAIProvider(prompt, config, analysis);
    const parsed = parseCSSVariableMappings(
      response,
      variables,
      fallback,
      config,
      analysis.mode,
    );
    return parsed.length > 0 ? parsed : fallback;
  } catch (error) {
    console.warn('⚠️  CSS variable mapping failed, using fallback mappings.', error);
    return fallback;
  }
}

async function mapSVGColors(
  analysis: DeepAnalysisResult,
  config: DeepMapperConfig,
): Promise<Map<string, SVGColorMapping>> {
  const svgs = analysis.svgs;
  if (!config.enableSVGMapping || svgs.length === 0) {
    return new Map();
  }

  const fallback = createFallbackSVGMappings(svgs, config);

  if (!config.useAIForSVGs) {
    return fallback;
  }

  const usage = buildSVGColorUsage(svgs);
  const prompt = buildSVGColorPrompt(usage, analysis, config);

  try {
    const response = await callAIProvider(prompt, config, analysis);
    const parsed = parseSVGColorMappings(response, fallback, usage, config);
    return parsed.size > 0 ? parsed : fallback;
  } catch (error) {
    console.warn('⚠️  SVG color mapping failed, using fallback mappings.', error);
    return fallback;
  }
}

function generateProcessedSVGs(
  analysis: DeepAnalysisResult,
  svgMappings: Map<string, SVGColorMapping>,
): ProcessedSVG[] {
  if (analysis.svgs.length === 0 || svgMappings.size === 0) {
    return [];
  }

  const colorMap = new Map<string, string>();
  svgMappings.forEach(mapping => {
    colorMap.set(mapping.originalColor, mapping.catppuccinColor);
  });

  const seen = new Set<string>();
  const results: ProcessedSVG[] = [];

  analysis.svgs.forEach(svg => {
    const hasMappedColor = svg.colors.some(color => colorMap.has(color.value));
    if (!hasMappedColor) {
      return;
    }

    try {
      const processed = processSVGForLESS(svg, colorMap);
      const key = `${processed.selector}|${processed.svg}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      results.push(processed);
    } catch (error) {
      console.warn('⚠️  Failed to process SVG for LESS output.', error);
    }
  });

  return results;
}

async function mapSelectors(
  analysis: DeepAnalysisResult,
  config: DeepMapperConfig,
  selectorLimit: number,
): Promise<SelectorMapping[]> {
  if (!config.enableSelectorMapping || analysis.selectorGroups.length === 0) {
    return [];
  }

  const entries = collectSelectorEntries(analysis.selectorGroups)
    .slice(0, selectorLimit);

  if (entries.length === 0) {
    return [];
  }

  const fallback = createFallbackSelectorMappings(entries, analysis, config);

  if (!config.useAIForSelectors) {
    return fallback;
  }

  const prompt = buildSelectorPrompt(entries, analysis, config);

  try {
    const response = await callAIProvider(prompt, config, analysis);
    const parsed = parseSelectorMappings(response, entries, fallback, config);
    return parsed.length > 0 ? parsed : fallback;
  } catch (error) {
    console.warn('⚠️  Selector mapping failed, using fallback mappings.', error);
    return fallback;
  }
}

function buildCSSVariablePrompt(
  variables: CSSVariable[],
  analysis: DeepAnalysisResult,
  config: DeepMapperConfig,
): string {
  const grouped = groupVariablesByPurpose(variables);
  const totalVariables = variables.length;

  let prompt = `You are a CSS theming expert. Map each CSS custom property to a Catppuccin ${config.flavor} color.
`;

  prompt += `\nWebsite: ${analysis.url}`;
  prompt += `\nDetected design system: ${analysis.designSystem.framework} (${Math.round(analysis.designSystem.confidence * 100)}% confidence)`;
  prompt += `\nDetected mode: ${analysis.mode}`;
  prompt += `\nTotal variables: ${totalVariables}`;

  prompt += `\n\nCATPPUCCIN COLORS:`;
  prompt += `\n- Base & surfaces: base, mantle, crust, surface0, surface1, surface2`;
  prompt += `\n- Text: text, subtext0, subtext1`;
  prompt += `\n- Overlays & borders: overlay0, overlay1, overlay2`;
  prompt += `\n- Accents: ${ACCENT_NAMES.join(', ')}`;
  prompt += `\n- MAIN ACCENT (70-80% usage): ${config.mainAccent}`;

  prompt += `\n\nVariables grouped by purpose (top entries shown):`;

  grouped.forEach((groupVars, purpose) => {
    if (groupVars.length === 0) {
      return;
    }
    prompt += `\n\n${purpose.toUpperCase()} (${groupVars.length} vars)`;
    groupVars
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
      .forEach((variable, index) => {
        const value = variable.computedValue || variable.value;
        prompt += `\n${index + 1}. ${variable.name} = ${value} (scope: ${variable.selector}, usage: ${variable.frequency})`;
      });
    if (groupVars.length > 10) {
      prompt += `\n... ${groupVars.length - 10} more`; 
    }
  });

  prompt += `\n\nOUTPUT FORMAT (JSON only, no markdown):`;
  prompt += `\n{`;
  prompt += `\n  "mappings": [`;
  prompt += `\n    {"variable": "--primary", "catppuccinColor": "${config.mainAccent}", "reason": "Primary interactive accent", "priority": "critical", "accent": true}`;
  prompt += `\n  ]`;
  prompt += `\n}`;
  prompt += `\n- priority must be one of critical, high, medium, low`;
  prompt += `\n- accent should be true when using Catppuccin accent colors`;
  prompt += `\nReturn ONLY JSON.`;

  return prompt;
}

function buildSVGColorPrompt(
  usage: Map<string, { selectors: string[]; count: number }>,
  analysis: DeepAnalysisResult,
  config: DeepMapperConfig,
): string {
  let prompt = `You are mapping SVG icon colors to the Catppuccin ${config.flavor} palette.
`;
  prompt += `\nMAIN ACCENT: ${config.mainAccent}`;
  prompt += `\nList of SVG colors (most common first):`;

  Array.from(usage.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([color, info], index) => {
      prompt += `\n${index + 1}. ${color} → selectors: ${info.selectors.slice(0, 3).join(', ')}${info.selectors.length > 3 ? '…' : ''}`;
    });

  prompt += `\n\nOUTPUT FORMAT (JSON only):`;
  prompt += `\n{`;
  prompt += `\n  "mappings": [`;
  prompt += `\n    {"originalColor": "#1a73e8", "catppuccinColor": "${config.mainAccent}", "reason": "Header search icon", "svgPurpose": ".header__search"}`;
  prompt += `\n  ]`;
  prompt += `\n}`;
  prompt += `\n- catppuccinColor must be a Catppuccin accent name.`;
  prompt += `\n- svgPurpose should describe where the color appears.`;
  prompt += `\nReturn ONLY JSON.`;

  return prompt;
}

function buildSelectorPrompt(
  entries: SelectorEntry[],
  analysis: DeepAnalysisResult,
  config: DeepMapperConfig,
): string {
  const accentSet = PRECOMPUTED_ACCENTS[config.flavor][config.mainAccent];

  let prompt = `You are mapping CSS selectors to Catppuccin ${config.flavor} colors while keeping layout identical.
`;
  prompt += `\nMAIN ACCENT: ${config.mainAccent} (use for ~70% of interactive states)`;
  prompt += `\nAnalogous accents: ${accentSet.biAccent1}, ${accentSet.biAccent2}`;
  prompt += `\nAlways preserve gradient text elements with bg-clip-text/text-transparent classes.`;

  prompt += `\n\nEach selector entry includes its current colors and metadata. Provide Catppuccin mappings focusing ONLY on color-related properties.`;

  entries.forEach((entry, index) => {
    const info = entry.info;
    prompt += `\n${index + 1}. Selector: ${info.selector}`;
    prompt += `\n   Category: ${entry.category}`;
    prompt += `\n   Specificity: ${info.specificity}, Frequency: ${info.frequency}`;
    prompt += `\n   Flags: interactive=${info.isInteractive}, background=${info.hasVisibleBackground}, border=${info.hasBorder}, textOnly=${info.isTextOnly}`;
    prompt += `\n   Current colors: ${JSON.stringify(info.currentStyles)}`;
  });

  prompt += `\n\nOUTPUT FORMAT (JSON only):`;
  prompt += `\n{`;
  prompt += `\n  "mappings": [`;
  prompt += `\n    {`;
  prompt += `\n      "selector": ".btn-primary",`;
  prompt += `\n      "properties": {"backgroundColor": "${config.mainAccent}", "color": "text"},`;
  prompt += `\n      "hoverGradient": {"angle": 135, "mainColor": "${config.mainAccent}", "biAccent": "${accentSet.biAccent1}", "opacity": 0.12},`;
  prompt += `\n      "important": false,`;
  prompt += `\n      "reason": "Primary CTA buttons should use the main accent with readable text"`;
  prompt += `\n    }`;
  prompt += `\n  ]`;
  prompt += `\n}`;
  prompt += `\nReturn ONLY JSON.`;

  return prompt;
}

function parseCSSVariableMappings(
  response: string,
  variables: CSSVariable[],
  fallback: VariableMapping[],
  config: DeepMapperConfig,
  mode: 'dark' | 'light',
): VariableMapping[] {
  const fallbackByName = new Map(fallback.map(mapping => [mapping.original, mapping]));
  const variableByName = new Map(variables.map(variable => [variable.name, variable]));
  const used = new Set<string>();
  const results: VariableMapping[] = [];

  const parsed = safeJsonParse(response);
  if (parsed && Array.isArray(parsed.mappings)) {
    parsed.mappings.forEach((entry: any) => {
      const name = typeof entry.variable === 'string' ? entry.variable.trim() : undefined;
      const colorName = normalizeCatppuccinColor(entry.catppuccinColor ?? entry.catppuccin);
      if (!name || !colorName) {
        return;
      }

      const base = fallbackByName.get(name) ?? createFallbackMappingForVariable(
        variableByName.get(name),
        { mainAccent: config.mainAccent, mode },
      );
      if (!base) {
        return;
      }

      const reason = ensureReason(entry.reason ?? entry.reasoning, base.reason);
      const priority = normalizePriority(entry.priority) ?? base.priority;
      const isAccent = typeof entry.accent === 'boolean'
        ? entry.accent
        : isAccentColor(colorName);

      results.push({
        original: name,
        catppuccin: colorName,
        reason,
        priority,
        isAccent,
      });
      used.add(name);
    });
  } else if (parsed && parsed.mappings && typeof parsed.mappings === 'object') {
    Object.entries(parsed.mappings as Record<string, string>).forEach(([name, value]) => {
      const normalizedName = name.trim();
      const colorName = normalizeCatppuccinColor(value);
      if (!colorName) {
        return;
      }
      const base = fallbackByName.get(normalizedName) ?? createFallbackMappingForVariable(
        variableByName.get(normalizedName),
        { mainAccent: config.mainAccent, mode },
      );
      if (!base) {
        return;
      }
      results.push({
        original: normalizedName,
        catppuccin: colorName,
        reason: base.reason,
        priority: base.priority,
        isAccent: isAccentColor(colorName),
      });
      used.add(normalizedName);
    });
  }

  fallbackByName.forEach((mapping, name) => {
    if (!used.has(name)) {
      results.push(mapping);
    }
  });

  return results;
}

function parseSVGColorMappings(
  response: string,
  fallback: Map<string, SVGColorMapping>,
  usage: Map<string, { selectors: string[]; count: number }>,
  config: DeepMapperConfig,
): Map<string, SVGColorMapping> {
  const result = new Map<string, SVGColorMapping>();
  const parsed = safeJsonParse(response);

  if (parsed && Array.isArray(parsed.mappings)) {
    parsed.mappings.forEach((entry: any) => {
      const originalColor = typeof entry.originalColor === 'string'
        ? entry.originalColor.trim()
        : undefined;
      const catColor = normalizeAccentColor(entry.catppuccinColor ?? entry.color ?? entry.catppuccinColorName);
      if (!originalColor || !catColor) {
        return;
      }
      const purpose = typeof entry.svgPurpose === 'string'
        ? entry.svgPurpose.trim()
        : usage.get(originalColor)?.selectors[0] ?? 'svg';
      const reason = ensureReason(entry.reason ?? entry.reasoning, `Mapped ${originalColor} to ${catColor}`);
      result.set(originalColor, {
        originalColor,
        catppuccinColor: catColor,
        svgPurpose: purpose,
        reason,
      });
    });
  } else if (parsed && parsed.mappings && typeof parsed.mappings === 'object') {
    Object.entries(parsed.mappings as Record<string, string>).forEach(([originalColor, catColorValue]) => {
      const colorName = normalizeAccentColor(catColorValue);
      if (!colorName) {
        return;
      }
      const purpose = usage.get(originalColor)?.selectors[0] ?? 'svg';
      result.set(originalColor, {
        originalColor,
        catppuccinColor: colorName,
        svgPurpose: purpose,
        reason: `Mapped ${originalColor} to ${colorName}`,
      });
    });
  }

  fallback.forEach((mapping, color) => {
    if (!result.has(color)) {
      result.set(color, mapping);
    }
  });

  return result;
}

function parseSelectorMappings(
  response: string,
  entries: SelectorEntry[],
  fallback: SelectorMapping[],
  config: DeepMapperConfig,
): SelectorMapping[] {
  const fallbackBySelector = new Map(fallback.map(mapping => [mapping.selector, mapping]));
  const entryBySelector = new Map(entries.map(entry => [entry.info.selector, entry]));
  const used = new Set<string>();
  const results: SelectorMapping[] = [];

  const parsed = safeJsonParse(response);
  if (parsed && Array.isArray(parsed.mappings)) {
    parsed.mappings.forEach((entry: any) => {
      const selector = typeof entry.selector === 'string'
        ? entry.selector.trim()
        : undefined;
      if (!selector) {
        return;
      }

      const base = fallbackBySelector.get(selector)
        ?? (entryBySelector.has(selector)
          ? createFallbackSelectorMapping(entryBySelector.get(selector)!, config)
          : undefined);

      if (!base) {
        return;
      }

      const mapping: SelectorMapping = {
        selector,
        properties: { ...base.properties },
        reason: ensureReason(entry.reason ?? entry.reasoning, base.reason),
        hoverGradient: base.hoverGradient,
        specificity: base.specificity,
        important: Boolean(entry.important ?? base.important),
      };

      const propertiesSource = entry.properties && typeof entry.properties === 'object'
        ? entry.properties
        : entry.colors && typeof entry.colors === 'object'
          ? entry.colors
          : entry;

      COLOR_PROPERTIES.forEach(property => {
        const value = propertiesSource[property];
        const normalized = normalizeCatppuccinColor(value);
        if (normalized) {
          mapping.properties[property] = normalized;
        }
      });

      if (entry.hoverGradient && typeof entry.hoverGradient === 'object') {
        const angle = typeof entry.hoverGradient.angle === 'number'
          ? entry.hoverGradient.angle
          : Number(entry.hoverGradient.angle);
        const mainColor = normalizeAccentColor(entry.hoverGradient.mainColor);
        const biAccent = normalizeAccentColor(entry.hoverGradient.biAccent ?? entry.hoverGradient.biColor);
        const opacity = typeof entry.hoverGradient.opacity === 'number'
          ? entry.hoverGradient.opacity
          : Number(entry.hoverGradient.opacity ?? 0.12);
        if (!Number.isNaN(angle) && mainColor && biAccent) {
          mapping.hoverGradient = {
            angle,
            mainColor,
            biAccent,
            opacity: Number.isNaN(opacity) ? 0.12 : opacity,
          };
        }
      }

      results.push(mapping);
      used.add(selector);
    });
  }

  fallbackBySelector.forEach((mapping, selector) => {
    if (!used.has(selector)) {
      results.push(mapping);
    }
  });

  return results;
}

function createFallbackVariableMappings(
  variables: CSSVariable[],
  mode: 'dark' | 'light',
  mainAccent: CatppuccinAccent,
): VariableMapping[] {
  return variables
    .map(variable => createFallbackMappingForVariable(variable, { mainAccent, mode }))
    .filter((mapping): mapping is VariableMapping => Boolean(mapping));
}

function createFallbackMappingForVariable(
  variable: CSSVariable | undefined,
  config: { mainAccent: CatppuccinAccent; mode: 'dark' | 'light' },
): VariableMapping | undefined {
  if (!variable) {
    return undefined;
  }

  const purpose = inferVariablePurpose(variable.name);
  const color = inferDefaultColorForPurpose(purpose, variable, config.mainAccent, config.mode);
  return {
    original: variable.name,
    catppuccin: color,
    reason: `Fallback mapping (${purpose})`,
    priority: inferPriority(variable),
    isAccent: isAccentColor(color),
  };
}

function createFallbackSVGMappings(
  svgs: SVGInfo[],
  config: DeepMapperConfig,
): Map<string, SVGColorMapping> {
  const mapping = new Map<string, SVGColorMapping>();
  svgs.forEach(svg => {
    svg.colors.forEach(color => {
      const original = color.value;
      if (mapping.has(original)) {
        return;
      }
      mapping.set(original, {
        originalColor: original,
        catppuccinColor: inferAccentForColor(original, config),
        svgPurpose: svg.selector,
        reason: `Fallback SVG mapping for ${svg.selector}`,
      });
    });
  });
  return mapping;
}

function createFallbackSelectorMappings(
  entries: SelectorEntry[],
  analysis: DeepAnalysisResult,
  config: DeepMapperConfig,
): SelectorMapping[] {
  return entries.map(entry => createFallbackSelectorMapping(entry, config, analysis.mode));
}

function createFallbackSelectorMapping(
  entry: SelectorEntry,
  config: DeepMapperConfig,
  mode: 'dark' | 'light' = 'dark',
): SelectorMapping {
  const properties = inferDefaultPropertiesForSelector(entry, config, mode);
  return {
    selector: entry.info.selector,
    properties,
    reason: `Fallback mapping for ${entry.info.selector} (${entry.category})`,
    hoverGradient: inferFallbackGradient(entry, config),
    specificity: entry.info.specificity,
    important: false,
  };
}

function inferDefaultPropertiesForSelector(
  entry: SelectorEntry,
  config: DeepMapperConfig,
  mode: 'dark' | 'light',
): SelectorMapping['properties'] {
  const props: SelectorMapping['properties'] = {};
  const { info, category } = entry;

  const surfaceColor: CatppuccinColor = mode === 'dark' ? 'surface0' : 'surface2';
  const borderColor: CatppuccinColor = 'overlay0';
  const textColor: CatppuccinColor = category === 'text' ? 'text' : 'subtext0';

  if (info.currentStyles.color) {
    props.color = textColor;
  }

  if (info.hasVisibleBackground || info.currentStyles.backgroundColor) {
    if (info.isInteractive || category === 'button' || category === 'badge') {
      props.backgroundColor = config.mainAccent;
    } else if (category === 'card' || category === 'modal') {
      props.backgroundColor = surfaceColor;
    }
  }

  if (info.hasBorder || info.currentStyles.borderColor) {
    props.borderColor = info.isInteractive ? config.mainAccent : borderColor;
  }

  if (info.currentStyles.fill) {
    props.fill = config.mainAccent;
  }

  if (info.currentStyles.stroke) {
    props.stroke = config.mainAccent;
  }

  return props;
}

function inferFallbackGradient(
  entry: SelectorEntry,
  config: DeepMapperConfig,
): SelectorMapping['hoverGradient'] {
  if (!entry.info.isInteractive) {
    return undefined;
  }
  const accentSet = PRECOMPUTED_ACCENTS[config.flavor][config.mainAccent];
  return {
    angle: 135,
    mainColor: config.mainAccent,
    biAccent: accentSet.biAccent1,
    opacity: entry.info.hasVisibleBackground ? 0.18 : 0.12,
  };
}

function collectSelectorEntries(groups: SelectorGroup[]): SelectorEntry[] {
  const entries: SelectorEntry[] = [];
  groups.forEach(group => {
    group.selectors.forEach(selector => {
      const hasColorProperty = COLOR_PROPERTIES.some(prop => selector.currentStyles[prop]);
      if (hasColorProperty) {
        entries.push({
          info: selector,
          category: group.category,
        });
      }
    });
  });
  return entries;
}

function groupVariablesByPurpose(variables: CSSVariable[]): Map<VariablePurpose, CSSVariable[]> {
  const grouped = new Map<VariablePurpose, CSSVariable[]>();
  variables.forEach(variable => {
    const purpose = inferVariablePurpose(variable.name);
    if (!grouped.has(purpose)) {
      grouped.set(purpose, []);
    }
    grouped.get(purpose)!.push(variable);
  });
  return grouped;
}

function inferVariablePurpose(name: string): VariablePurpose {
  const normalized = name.toLowerCase();
  if (normalized.includes('bg') || normalized.includes('background') || normalized.includes('surface') || normalized.includes('base')) {
    return 'background';
  }
  if (normalized.includes('text') || normalized.includes('font') || normalized.includes('fg')) {
    return 'text';
  }
  if (normalized.includes('accent') || normalized.includes('primary') || normalized.includes('link') || normalized.includes('button')) {
    return 'accent';
  }
  if (normalized.includes('border') || normalized.includes('outline') || normalized.includes('divider')) {
    return 'border';
  }
  if (normalized.includes('hover') || normalized.includes('focus') || normalized.includes('active')) {
    return 'hover';
  }
  return 'other';
}

function inferDefaultColorForPurpose(
  purpose: VariablePurpose,
  variable: CSSVariable,
  mainAccent: CatppuccinAccent,
  mode: 'dark' | 'light',
): CatppuccinColor {
  switch (purpose) {
    case 'background':
      if (variable.frequency > 5) {
        return 'base';
      }
      return mode === 'dark' ? 'surface0' : 'surface2';
    case 'text':
      return variable.frequency > 5 ? 'text' : 'subtext0';
    case 'accent':
      return mainAccent;
    case 'border':
      return 'overlay0';
    case 'hover':
      return mainAccent;
    default:
      return mainAccent;
  }
}

function inferPriority(variable: CSSVariable): VariableMapping['priority'] {
  if (variable.scope === 'root' && variable.frequency > 10) {
    return 'critical';
  }
  if (variable.scope === 'root') {
    return 'high';
  }
  if (variable.frequency > 5) {
    return 'medium';
  }
  return 'low';
}

function inferAccentForColor(
  value: string,
  config: DeepMapperConfig,
): CatppuccinAccent {
  const normalized = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3,8}$/.test(normalized)) {
    try {
      const palette = CATPPUCCIN_PALETTES[config.flavor];
      return nearestAccentByRGB(hexToRgb(normalized), palette);
    } catch (error) {
      return config.mainAccent;
    }
  }
  return config.mainAccent;
}

function buildSVGColorUsage(svgs: SVGInfo[]): Map<string, { selectors: string[]; count: number }> {
  const usage = new Map<string, { selectors: string[]; count: number }>();
  svgs.forEach(svg => {
    svg.colors.forEach(color => {
      const entry = usage.get(color.value) ?? { selectors: [], count: 0 };
      entry.count += 1;
      if (!entry.selectors.includes(svg.selector)) {
        entry.selectors.push(svg.selector);
      }
      usage.set(color.value, entry);
    });
  });
  return usage;
}

function normalizeCatppuccinColor(value: unknown): CatppuccinColor | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return CATPPUCCIN_COLOR_SET.has(normalized as CatppuccinColor)
    ? (normalized as CatppuccinColor)
    : undefined;
}

function normalizeAccentColor(value: unknown): CatppuccinAccent | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return ACCENT_COLOR_SET.has(normalized as CatppuccinAccent)
    ? (normalized as CatppuccinAccent)
    : undefined;
}

function isAccentColor(color: CatppuccinColor): color is CatppuccinAccent {
  return ACCENT_COLOR_SET.has(color as CatppuccinAccent);
}

function normalizePriority(value: unknown): VariableMapping['priority'] | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'critical':
    case 'high':
    case 'medium':
    case 'low':
      return normalized;
    default:
      return undefined;
  }
}

function ensureReason(candidate: unknown, fallback: string): string {
  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim();
  }
  return fallback;
}

function safeJsonParse(value: string): any | null {
  if (!value) {
    return null;
  }
  const match = value.match(JSON_BLOCK_REGEX);
  const json = match ? match[0] : value.trim();
  try {
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

async function callAIProvider(
  prompt: string,
  config: DeepMapperConfig,
  analysis: DeepAnalysisResult,
): Promise<string> {
  const { provider, apiKey, model } = config;

  const crawl: CrawlerResult = {
    url: analysis.url,
    title: analysis.title,
    content: analysis.content,
    html: analysis.html,
  };

  switch (provider) {
    case 'openrouter': {
      if (!apiKey || !model) {
        throw new Error('OpenRouter requires apiKey and model for deep analysis prompts');
      }
      const response = await analyzeColorsWithOpenRouter(
        crawl,
        config.mainAccent,
        apiKey,
        model,
        prompt,
      );
      if (typeof response !== 'string') {
        throw new Error('Unexpected OpenRouter response for custom prompt');
      }
      return response;
    }
    case 'chutes': {
      if (!apiKey || !model) {
        throw new Error('Chutes requires apiKey and model for deep analysis prompts');
      }
      const response = await analyzeColorsWithChutes(
        crawl,
        config.mainAccent,
        apiKey,
        model,
        prompt,
      );
      if (typeof response !== 'string') {
        throw new Error('Unexpected Chutes response for custom prompt');
      }
      return response;
    }
    case 'ollama':
      console.warn(
        `[DeepMapper] Ollama provider was selected for custom deep analysis prompt, but this operation is not supported. Falling back to default mappings. Prompt: "${prompt}"`
      );
      throw new Error('Custom deep analysis prompts are not yet supported for Ollama. See warning log for details.');
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

function computeMappingStats(
  variableMappings: VariableMapping[],
  svgMappings: Map<string, SVGColorMapping>,
  processedSVGs: ProcessedSVG[],
  selectorMappings: SelectorMapping[],
  analysis: DeepAnalysisResult,
  config: DeepMapperConfig,
): MappingResult['stats'] {
  const accentSet = PRECOMPUTED_ACCENTS[config.flavor][config.mainAccent];
  const accentUsage = {
    mainAccent: 0,
    biAccent1: 0,
    biAccent2: 0,
  };

  const incrementAccent = (color?: CatppuccinColor | CatppuccinAccent) => {
    if (!color) {
      return;
    }
    if (color === config.mainAccent) {
      accentUsage.mainAccent += 1;
    } else if (color === accentSet.biAccent1) {
      accentUsage.biAccent1 += 1;
    } else if (color === accentSet.biAccent2) {
      accentUsage.biAccent2 += 1;
    }
  };

  variableMappings.forEach(mapping => incrementAccent(mapping.catppuccin));
  svgMappings.forEach(mapping => incrementAccent(mapping.catppuccinColor));
  selectorMappings.forEach(mapping => {
    COLOR_PROPERTIES.forEach(property => incrementAccent(mapping.properties[property]));
    if (mapping.hoverGradient) {
      incrementAccent(mapping.hoverGradient.mainColor);
      incrementAccent(mapping.hoverGradient.biAccent);
    }
  });

  return {
    totalVariables: analysis.cssVariables.length,
    mappedVariables: variableMappings.length,
    totalSVGs: analysis.svgs.length,
    processedSVGs: processedSVGs.length,
    totalSelectors: analysis.selectorGroups.reduce((sum, group) => sum + group.selectors.length, 0),
    mappedSelectors: selectorMappings.length,
    accentUsage,
  };
}
