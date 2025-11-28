import type { CatppuccinFlavor, ColorMapping, AccentColor } from '../../types/catppuccin';
import type { ThemeOutput, GeneratedTheme, ThemePackage, FetcherService, MappingOutput } from '../../types/theme';
import { generateStylusTheme } from './stylus';
import { generateLessTheme } from './less';
import { generateCssTheme } from './css';
import { generateUserStyle } from './userstyle';
import { hexToRgb, nearestAccentByRGB } from '../../utils/accent-schemes';
import { CATPPUCCIN_PALETTES } from '../../constants/catppuccin-colors';
import { convertProfileToMapping, type PaletteProfile } from '../palette-profile';
import type { CatppuccinColor } from '../../types/catppuccin';

function nearestPaletteColorName(hex: string, flavor: CatppuccinFlavor): CatppuccinColor {
  const palette = CATPPUCCIN_PALETTES[flavor];
  const target = hexToRgb(hex);
  let best: { name: CatppuccinColor; dist: number } | null = null;
  for (const [name, color] of Object.entries(palette)) {
    const val = color?.rgb;
    if (!val) continue;
    const dr = target.r - val.r;
    const dg = target.g - val.g;
    const db = target.b - val.b;
    const dist = dr * dr + dg * dg + db * db;
    if (!best || dist < best.dist) {
      best = { name: name as CatppuccinColor, dist };
    }
  }
  return best?.name ?? 'mauve';
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
  const paletteProfile = cssAnalysis?.paletteProfile as PaletteProfile | undefined;
  let resolvedMappings: ColorMapping[] | MappingOutput = colorMappings;
  if (paletteProfile && !(resolvedMappings as MappingOutput).roleMap) {
    resolvedMappings = convertProfileToMapping(paletteProfile, flavor);
  }

  // If caller provided MappingOutput, use RoleMap path and skip legacy filtering.
  if ((resolvedMappings as MappingOutput).roleMap) {
    const mappingOutput = resolvedMappings as MappingOutput;
    const cssColorMap = new Map<string, CatppuccinColor>();
    Object.entries(mappingOutput.roleMap || {}).forEach(([role, color]) => {
      if (color?.hex) {
        cssColorMap.set(role, nearestPaletteColorName(color.hex, flavor));
      }
    });
    Object.entries(mappingOutput.derivedScales || {}).forEach(([role, color]) => {
      if (color?.hex && !cssColorMap.has(role)) {
        cssColorMap.set(role, nearestPaletteColorName(color.hex, flavor));
      }
    });
    const output: ThemeOutput = {
      stylus: generateStylusTheme(flavor, mappingOutput, url, undefined, 'mauve', cssAnalysis),
      less: generateLessTheme(flavor, mappingOutput, url, undefined, 'mauve', cssAnalysis),
      css: generateCssTheme(flavor, cssColorMap, url),
    };
    return { flavor, output };
  }

  // Legacy path (ColorMapping[])
  const legacyMappings = resolvedMappings as ColorMapping[];

  // Convert ColorMapping array to Map for generators
  const mappingMap = new Map(
    legacyMappings.map(m => [m.originalColor, m.catppuccinColor])
  );

  const output: ThemeOutput = {
    stylus: generateStylusTheme(flavor, mappingMap, url, legacyMappings, 'mauve', cssAnalysis),
    less: generateLessTheme(flavor, mappingMap, url, legacyMappings, 'mauve', cssAnalysis),
    css: generateCssTheme(flavor, mappingMap, url, legacyMappings),
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
  const primaryAccent = accentColors.length > 0 ? accentColors[0] : CATPPUCCIN_PALETTES.mocha.mauve.hex; // default to palette mauve
  const defaultAccent = nearestAccentByRGB(hexToRgb(primaryAccent), CATPPUCCIN_PALETTES.mocha);
  const paletteProfile = cssAnalysis?.paletteProfile as PaletteProfile | undefined;

  if (paletteProfile) {
    const mappingFromProfile = convertProfileToMapping(paletteProfile, 'mocha');
    userStyle = generateUserStyle(mappingFromProfile, url, undefined, cssAnalysis, 'mocha', defaultAccent);
  } else if ((colorMappings as MappingOutput).roleMap) {
    userStyle = generateUserStyle(colorMappings as MappingOutput, url, undefined, cssAnalysis, 'mocha', defaultAccent);
  } else {
    const legacy = colorMappings as ColorMapping[];
    userStyle = generateUserStyle(legacy, url, undefined, cssAnalysis, 'mocha', defaultAccent);
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
export { generateUserstyleV2, type UserstyleV2Config } from './userstyle-v2';
