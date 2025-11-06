import type { CatppuccinFlavor, ColorMapping } from '../../types/catppuccin';
import type { ThemeOutput, GeneratedTheme, ThemePackage, CrawlerService, MappingOutput } from '../../types/theme';
import { generateStylusTheme } from './stylus';
import { generateLessTheme } from './less';
import { generateCssTheme } from './css';
import { generateUserStyle } from './userstyle';

/**
 * Filter out button and clickable background color mappings
 * to prevent overriding the original theme's button styles
 */
function filterButtonAndClickableBackgrounds(mappings: ColorMapping[]): ColorMapping[] {
  return mappings.filter(mapping => {
    const reason = mapping.reason.toLowerCase();

    // Keywords that indicate button backgrounds or clickable backgrounds
    const buttonKeywords = [
      'button',
      'btn',
      'cta',
      'clickable',
      'interactive background',
      'hover background',
      'active background',
      'pressed background',
    ];

    // Check if this is a button/clickable background mapping
    const isButtonOrClickable = buttonKeywords.some(keyword => reason.includes(keyword));

    // Also check if it's specifically about backgrounds (not text or borders)
    const isBackground = reason.includes('background') || reason.includes('bg');

    // Filter out if it's both a button/clickable AND a background
    // Keep it if it's button text, button border, etc.
    return !(isButtonOrClickable && isBackground);
  });
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
  url: string
): GeneratedTheme {
  // If caller provided MappingOutput, use RoleMap path and skip legacy filtering.
  if ((colorMappings as MappingOutput).roleMap) {
    const mappingOutput = colorMappings as MappingOutput;
    const output: ThemeOutput = {
      stylus: generateStylusTheme(flavor, mappingOutput, url),
      less: generateLessTheme(flavor, mappingOutput, url),
      css: generateCssTheme(flavor, mappingOutput, url),
    };
    return { flavor, output };
  }

  // Legacy path (ColorMapping[])
  const legacyMappings = colorMappings as ColorMapping[];

  // Filter out button and clickable backgrounds
  const filteredMappings = filterButtonAndClickableBackgrounds(legacyMappings);

  console.log(`Filtered ${legacyMappings.length - filteredMappings.length} button/clickable background mappings`);
  console.log(`Keeping ${filteredMappings.length} mappings for theme generation`);

  // Convert ColorMapping array to Map for generators
  const mappingMap = new Map(
    filteredMappings.map(m => [m.originalColor, m.catppuccinColor])
  );

  const output: ThemeOutput = {
    stylus: generateStylusTheme(flavor, mappingMap, url, filteredMappings),
    less: generateLessTheme(flavor, mappingMap, url, filteredMappings),
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
  flavors: CatppuccinFlavor[] = ['latte', 'frappe', 'macchiato', 'mocha']
): GeneratedTheme[] {
  return flavors.map(flavor => generateTheme(flavor, colorMappings, url));
}

export function createThemePackage(
  url: string,
  themes: GeneratedTheme[],
  accentColors: string[],
  crawlerUsed: CrawlerService,
  aiModelUsed: string
): ThemePackage {
  return {
    url,
    timestamp: new Date().toISOString(),
    themes,
    metadata: {
      accentColors,
      crawlerUsed,
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
  crawlerUsed: CrawlerService,
  aiModelUsed: string,
  cssAnalysis?: any
): ThemePackage {
  // If MappingOutput provided, generate userStyle from it directly
  let userStyle: string;
  if ((colorMappings as MappingOutput).roleMap) {
    userStyle = generateUserStyle(colorMappings as MappingOutput, url, undefined, cssAnalysis);
  } else {
    const legacy = colorMappings as ColorMapping[];
    // Filter out button and clickable backgrounds for UserStyle as well
    const filteredMappings = filterButtonAndClickableBackgrounds(legacy);
    console.log(`UserStyle: Filtered ${legacy.length - filteredMappings.length} button/clickable background mappings`);
    userStyle = generateUserStyle(filteredMappings, url, undefined, cssAnalysis);
  }

  return {
    url,
    timestamp: new Date().toISOString(),
    userStyle,
    metadata: {
      accentColors,
      crawlerUsed,
      aiModelUsed,
    },
  };
}

// Export generators for direct usage
export { generateStylusTheme, generateLessTheme, generateCssTheme };