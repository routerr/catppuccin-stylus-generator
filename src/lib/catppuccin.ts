import type { AccentPalette, ThemeVariant } from './types'

export const CATPPUCCIN_VARIANTS: Record<ThemeVariant, Record<string, string>> = {
  latte: {
    base: '#eff1f5',
    mantle: '#e6e9ef',
    crust: '#dce0e8',
    text: '#4c4f69',
    subtext0: '#6c6f85',
    subtext1: '#5c5f77',
    overlay0: '#9ca0b0',
    overlay1: '#8c8fa1',
    surface0: '#ccd0da',
    surface1: '#bcc0cc',
    surface2: '#acb0be'
  },
  frappe: {
    base: '#303446',
    mantle: '#292c3c',
    crust: '#232634',
    text: '#c6d0f5',
    subtext0: '#a5adce',
    subtext1: '#b5bfe2',
    overlay0: '#737994',
    overlay1: '#838ba7',
    surface0: '#414559',
    surface1: '#51576d',
    surface2: '#626880'
  },
  macchiato: {
    base: '#24273a',
    mantle: '#1e2030',
    crust: '#181926',
    text: '#cad3f5',
    subtext0: '#a5adcb',
    subtext1: '#b8c0e0',
    overlay0: '#6e738d',
    overlay1: '#8087a2',
    surface0: '#363a4f',
    surface1: '#494d64',
    surface2: '#5b6078'
  },
  mocha: {
    base: '#1e1e2e',
    mantle: '#181825',
    crust: '#11111b',
    text: '#cdd6f4',
    subtext0: '#a6adc8',
    subtext1: '#bac2de',
    overlay0: '#6c7086',
    overlay1: '#7f849c',
    surface0: '#313244',
    surface1: '#45475a',
    surface2: '#585b70'
  }
}

export const DEFAULT_ACCENTS: AccentPalette[] = [
  {
    name: 'Classic',
    description: 'Catppuccin default accent hues for general purpose UI.',
    accents: {
      rosewater: '#f5e0dc',
      flamingo: '#f2cdcd',
      pink: '#f5c2e7',
      mauve: '#cba6f7',
      red: '#f38ba8',
      maroon: '#eba0ac',
      peach: '#fab387',
      yellow: '#f9e2af',
      green: '#a6e3a1',
      teal: '#94e2d5',
      sky: '#89dceb',
      sapphire: '#74c7ec',
      blue: '#89b4fa',
      lavender: '#b4befe'
    }
  },
  {
    name: 'Moonlight',
    description: 'Softer midnights emphasizing teal and lavender.',
    accents: {
      rosewater: '#f2d5cf',
      flamingo: '#eecece',
      pink: '#f4b8e4',
      mauve: '#ca9ee6',
      red: '#e78284',
      maroon: '#ea999c',
      peach: '#ef9f76',
      yellow: '#e5c890',
      green: '#a6d189',
      teal: '#81c8be',
      sky: '#99d1db',
      sapphire: '#85c1dc',
      blue: '#8caaee',
      lavender: '#babbf1'
    }
  },
  {
    name: 'Aurora',
    description: 'High-contrast palette optimized for readability.',
    accents: {
      rosewater: '#ffd7ba',
      flamingo: '#ffc9c9',
      pink: '#ffafcc',
      mauve: '#cfa0f9',
      red: '#ff6b6b',
      maroon: '#f06595',
      peach: '#ff922b',
      yellow: '#fcc419',
      green: '#51cf66',
      teal: '#38d9a9',
      sky: '#66d9e8',
      sapphire: '#15aabf',
      blue: '#4dabf7',
      lavender: '#9775fa'
    }
  }
]

export const getAccentPalette = (name: string): AccentPalette | undefined =>
  DEFAULT_ACCENTS.find((palette) => palette.name === name)
