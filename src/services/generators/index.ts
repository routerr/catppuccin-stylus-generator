import type { CatppuccinFlavor, ColorMapping } from '../../types/catppuccin';
import type { ThemeOutput, GeneratedTheme, ThemePackage, CrawlerService } from '../../types/theme';
import { generateStylusTheme } from './stylus';
import { generateLessTheme } from './less';
import { generateCssTheme } from './css';
import { generateUserStyle } from './userstyle';

export function generateTheme(
  flavor: CatppuccinFlavor,
  colorMappings: ColorMapping[],
  url: string
): GeneratedTheme {
  // Convert ColorMapping array to Map for generators
  const mappingMap = new Map(
    colorMappings.map(m => [m.originalColor, m.catppuccinColor])
  );

  const output: ThemeOutput = {
    stylus: generateStylusTheme(flavor, mappingMap, url),
    less: generateLessTheme(flavor, mappingMap, url),
    css: generateCssTheme(flavor, mappingMap, url),
  };

  return {
    flavor,
    output,
  };
}

export function generateAllThemes(
  colorMappings: ColorMapping[],
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

// New function to create UserStyle package
export function createUserStylePackage(
  url: string,
  colorMappings: ColorMapping[],
  accentColors: string[],
  crawlerUsed: CrawlerService,
  aiModelUsed: string
): ThemePackage {
  const userStyle = generateUserStyle(colorMappings, url);

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

export { generateStylusTheme, generateLessTheme, generateCssTheme };
