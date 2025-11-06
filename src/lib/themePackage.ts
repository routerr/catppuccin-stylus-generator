import { CATPPUCCIN_VARIANTS } from './catppuccin'
import type { AccentPalette, StylusThemePackage, ThemeVariant } from './types'

const makeLess = (
  variant: ThemeVariant,
  accentPalette: AccentPalette,
  customLess: string
) => `// Catppuccin ${variant} base colors
@cat-${variant}-base: ${CATPPUCCIN_VARIANTS[variant].base};
@cat-${variant}-mantle: ${CATPPUCCIN_VARIANTS[variant].mantle};
@cat-${variant}-crust: ${CATPPUCCIN_VARIANTS[variant].crust};
@cat-${variant}-text: ${CATPPUCCIN_VARIANTS[variant].text};

${Object.entries(accentPalette.accents)
  .map(([name, value]) => `@cat-${name}: ${value};`)
  .join('\n')}

${customLess}
`

export const buildStylusThemePackage = (
  themeId: string,
  description: string,
  lessByVariant: Record<ThemeVariant, string>,
  accentPalette: AccentPalette
): StylusThemePackage => {
  const normalizedId = themeId.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  return {
    name: `Catppuccin ${themeId}`,
    id: normalizedId,
    description,
    tags: ['catppuccin', 'less', 'stylus', 'theme-generator'],
    versions: Object.fromEntries(
      Object.entries(lessByVariant).map(([variant, customLess]) => [
        variant,
        {
          less: makeLess(variant as ThemeVariant, accentPalette, customLess),
          accentPalette: accentPalette.accents
        }
      ])
    ) as StylusThemePackage['versions']
  }
}
