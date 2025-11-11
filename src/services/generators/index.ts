import type { CatppuccinFlavor, ColorMapping, AccentColor } from '../../types/catppuccin';
import type { ThemeOutput, GeneratedTheme, ThemePackage, FetcherService, MappingOutput } from '../../types/theme';
import { generateStylusTheme } from './stylus';
import { generateLessTheme } from './less';
import { generateCssTheme } from './css';
import { generateUserStyle } from './userstyle';
import { hexToRgb, nearestAccentByRGB } from '../../utils/accent-schemes';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
 

/**
 * Filter out button and clickable background color mappings
 * to prevent overriding the original theme's button styles
 */
// Previously filtered out button/clickable background mappings.
// To better reflect AI results, we now keep all mappings and let the generators
// handle contrast/readability and hover specifics.
function filterButtonAndClickableBackgrounds(mappings: ColorMapping[]): ColorMapping[] {
  return mappings;
}

/**
 * generateTheme
 * Supports legacy callers that pass ColorMapping[] and the new MappingOutput.
 * If MappingOutput is provided, the generators receive it directly and will
 * prefer RoleMap/DerivedScales to produce two-level variables.
 */
export function generateTheme(
  flavor: CatppuccinFlavor,
  colorMappings: ColorMapping[] | MappingOutput,
  url: string,
  cssAnalysis?: any
): GeneratedTheme {
  // If caller provided MappingOutput, use RoleMap path and skip legacy filtering.
  if ((colorMappings as MappingOutput).roleMap) {
    const mappingOutput = colorMappings as MappingOutput;
    const output: ThemeOutput = {
      stylus: generateStylusTheme(flavor, mappingOutput, url, undefined, 'mauve', cssAnalysis),
      less: generateLessTheme(flavor, mappingOutput, url, undefined, 'mauve', cssAnalysis),
      css: generateCssTheme(
        flavor,
        new Map(
          Object.entries(mappingOutput.roleMap || {})
            .map(([key, value]) => [key, key as import('../../types/catppuccin').CatppuccinColor])
        ),
        url
      ),
    };
    return { flavor, output };
  }

  // Legacy path (ColorMapping[])
  const legacyMappings = colorMappings as ColorMapping[];

  // Keep all mappings; generators will ensure readability/contrast.
  const filteredMappings = filterButtonAndClickableBackgrounds(legacyMappings);

  // Convert ColorMapping array to Map for generators
  const mappingMap = new Map(
    filteredMappings.map(m => [m.originalColor, m.catppuccinColor])
  );

  const output: ThemeOutput = {
    stylus: generateStylusTheme(flavor, mappingMap, url, filteredMappings, 'mauve', cssAnalysis),
    less: generateLessTheme(flavor, mappingMap, url, filteredMappings, 'mauve', cssAnalysis),
    css: generateCssTheme(flavor, mappingMap, url, filteredMappings),
  };

  return {
    flavor,
    output,
  };
}

export function generateAllThemes(
  colorMappings: ColorMapping[] | MappingOutput,
  url: string,
  flavors: CatppuccinFlavor[] = ['latte', 'frappe', 'macchiato', 'mocha'],
  cssAnalysis?: any
): GeneratedTheme[] {
  return flavors.map(flavor => generateTheme(flavor, colorMappings, url, cssAnalysis));
}

export function createThemePackage(
  url: string,
  themes: GeneratedTheme[],
  accentColors: string[],
  fetcherUsed: FetcherService,
  aiModelUsed: string
): ThemePackage {
  return {
    url,
    timestamp: new Date().toISOString(),
    themes,
    metadata: {
      accentColors,
      crawlerUsed: fetcherUsed,
      aiModelUsed,
    },
  };
}

/**
 * createUserStylePackage
 * Accepts legacy ColorMapping[] or MappingOutput. When MappingOutput is provided
 * the UserStyle generator will emit two-level CSS custom properties.
 */
export function createUserStylePackage(
  url: string,
  colorMappings: ColorMapping[] | MappingOutput,
  accentColors: string[],
  fetcherUsed: FetcherService,
  aiModelUsed: string,
  cssAnalysis?: any
): ThemePackage {
  // If MappingOutput provided, generate userStyle from it directly
  let userStyle: string;
  const primaryAccent = accentColors.length > 0 ? accentColors[0] : '#cba6f7'; // default to mauve hex
  const defaultAccent = nearestAccentByRGB(hexToRgb(primaryAccent), CATPPUCCIN_PALETTES.mocha);

  if ((colorMappings as MappingOutput).roleMap) {
    userStyle = generateUserStyle(colorMappings as MappingOutput, url, undefined, cssAnalysis, 'mocha', defaultAccent);
  } else {
    const legacy = colorMappings as ColorMapping[];
    const filteredMappings = filterButtonAndClickableBackgrounds(legacy);
    userStyle = generateUserStyle(filteredMappings, url, undefined, cssAnalysis, 'mocha', defaultAccent);
  }

  return {
    url,
    timestamp: new Date().toISOString(),
    userStyle,
    metadata: {
      accentColors,
      crawlerUsed: fetcherUsed,
      aiModelUsed,
    },
  };
}

/** Async variant to support LLM authoring opt-in */
export async function createUserStylePackageAsync(
  url: string,
  colorMappings: ColorMapping[] | MappingOutput,
  accentColors: string[],
  fetcherUsed: FetcherService,
  aiModelUsed: string,
  cssAnalysis?: any
): Promise<ThemePackage> {
  // Fallback to deterministic path
  const fallback = createUserStylePackage(
    url,
    colorMappings,
    accentColors,
    fetcherUsed,
    aiModelUsed,
    cssAnalysis
  );
  return Promise.resolve(fallback);
}

// Export generators for direct usage
export { generateStylusTheme, generateLessTheme, generateCssTheme };
