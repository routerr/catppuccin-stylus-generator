/**
 * Font family constants for the theme generator
 * 
 * This file contains curated font lists from:
 * - Google Fonts (https://fonts.google.com/)
 * - Nerd Fonts (https://www.nerdfonts.com/font-downloads)
 * - Special fonts: Andika, Iansui, jf open 粉圓
 */

export interface FontOption {
  /** Display name for the font */
  name: string;
  /** CSS font-family value (with fallbacks) */
  family: string;
  /** Optional Google Fonts import URL */
  googleFontsUrl?: string;
  /** Optional external font source URL (for non-Google fonts) */
  externalUrl?: string;
  /** Font category for filtering */
  category: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting';
  /** Whether this is a Nerd Font variant */
  isNerdFont?: boolean;
}

// Special "no change" option - keeps original website font
export const NO_FONT_CHANGE: FontOption = {
  name: '(Keep original)',
  family: '',
  category: 'sans-serif',
};

// ============================================================================
// SPECIAL FONTS (Requested by user)
// ============================================================================

export const SPECIAL_FONTS: FontOption[] = [
  {
    name: 'Andika',
    family: '"Andika", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Andika:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Iansui (芫荽)',
    family: '"Iansui", "芫荽", sans-serif',
    externalUrl: 'https://cdn.jsdelivr.net/gh/ArnePilworker/iansui@1.000/webfont/Iansui-Regular.woff2',
    category: 'sans-serif',
  },
  {
    name: 'jf open 粉圓 2.1',
    family: '"jf-openhuninn-2.1", "jf open 粉圓 2.1", "粉圓體", sans-serif',
    externalUrl: 'https://cdn.jsdelivr.net/gh/ArnePilworker/iansui@1.000/webfont/jf-openhuninn-2.1.woff2',
    category: 'sans-serif',
  },
];

// ============================================================================
// NERD FONTS (Monospace with programming ligatures and icons)
// ============================================================================

export const NERD_FONTS: FontOption[] = [
  // Popular programming fonts with Nerd Font patches
  {
    name: 'JetBrains Mono Nerd',
    family: '"JetBrainsMono Nerd Font", "JetBrains Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'FiraCode Nerd',
    family: '"FiraCode Nerd Font", "Fira Code", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Hack Nerd',
    family: '"Hack Nerd Font", "Hack", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'CaskaydiaCove Nerd (Cascadia Code)',
    family: '"CaskaydiaCove Nerd Font", "Cascadia Code", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'MesloLGS Nerd',
    family: '"MesloLGS Nerd Font", "Meslo LG S", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'SourceCodePro Nerd',
    family: '"SauceCodePro Nerd Font", "Source Code Pro", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'UbuntuMono Nerd',
    family: '"UbuntuMono Nerd Font", "Ubuntu Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'DejaVuSansMono Nerd',
    family: '"DejaVuSansMono Nerd Font", "DejaVu Sans Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'RobotoMono Nerd',
    family: '"RobotoMono Nerd Font", "Roboto Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'InconsolataGo Nerd',
    family: '"InconsolataGo Nerd Font", "Inconsolata", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'VictorMono Nerd',
    family: '"VictorMono Nerd Font", "Victor Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Iosevka Nerd',
    family: '"Iosevka Nerd Font", "Iosevka", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Lilex Nerd',
    family: '"Lilex Nerd Font", "Lilex", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'FantasqueSansMono Nerd',
    family: '"FantasqueSansMono Nerd Font", "Fantasque Sans Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Agave Nerd',
    family: '"Agave Nerd Font", "Agave", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'AnonymousPro Nerd',
    family: '"AnonymicePro Nerd Font", "Anonymous Pro", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'BitstreamVeraSansMono Nerd',
    family: '"BitstreamVeraSansMono Nerd Font", "Bitstream Vera Sans Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'CodeNewRoman Nerd',
    family: '"CodeNewRoman Nerd Font", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Cousine Nerd',
    family: '"Cousine Nerd Font", "Cousine", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'DaddyTimeMono Nerd',
    family: '"DaddyTimeMono Nerd Font", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'DroidSansMono Nerd',
    family: '"DroidSansMono Nerd Font", "Droid Sans Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'GoMono Nerd',
    family: '"GoMono Nerd Font", "Go Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Hermit Nerd',
    family: '"Hermit Nerd Font", "Hermit", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'iMWritingMono Nerd',
    family: '"iMWritingMono Nerd Font", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'LiberationMono Nerd',
    family: '"LiterationMono Nerd Font", "Liberation Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Monofur Nerd',
    family: '"Monofur Nerd Font", "Monofur", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Monoid Nerd',
    family: '"Monoid Nerd Font", "Monoid", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Mononoki Nerd',
    family: '"Mononoki Nerd Font", "Mononoki", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'NotoMono Nerd',
    family: '"NotoMono Nerd Font", "Noto Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'OpenDyslexicMono Nerd',
    family: '"OpenDyslexicMono Nerd Font", "OpenDyslexic Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Overpass Mono Nerd',
    family: '"OverpassMono Nerd Font", "Overpass Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'ProFont Nerd',
    family: '"ProFont Nerd Font", "ProFont", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'ProggyClean Nerd',
    family: '"ProggyClean Nerd Font", "ProggyClean", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'ShareTechMono Nerd',
    family: '"ShareTechMono Nerd Font", "Share Tech Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'SpaceMono Nerd',
    family: '"SpaceMono Nerd Font", "Space Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Terminus Nerd',
    family: '"Terminess Nerd Font", "Terminus", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Tinos Nerd',
    family: '"Tinos Nerd Font", "Tinos", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Ubuntu Nerd',
    family: '"Ubuntu Nerd Font", "Ubuntu", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: '0xProto Nerd',
    family: '"0xProto Nerd Font", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'CommitMono Nerd',
    family: '"CommitMono Nerd Font", "Commit Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'GeistMono Nerd',
    family: '"GeistMono Nerd Font", "Geist Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Maple Mono Nerd',
    family: '"Maple Mono Nerd Font", "Maple Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Monaspace Argon Nerd',
    family: '"MonaspaceArgon Nerd Font", "Monaspace Argon", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Monaspace Krypton Nerd',
    family: '"MonaspaceKrypton Nerd Font", "Monaspace Krypton", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Monaspace Neon Nerd',
    family: '"MonaspaceNeon Nerd Font", "Monaspace Neon", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Monaspace Radon Nerd',
    family: '"MonaspaceRadon Nerd Font", "Monaspace Radon", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Monaspace Xenon Nerd',
    family: '"MonaspaceXenon Nerd Font", "Monaspace Xenon", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'Recursive Mono Nerd',
    family: '"RecursiveMono Nerd Font", "Recursive Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
  {
    name: 'ZedMono Nerd',
    family: '"ZedMono Nerd Font", "Zed Mono", monospace',
    category: 'monospace',
    isNerdFont: true,
  },
];

// ============================================================================
// GOOGLE FONTS - Sans-Serif (for body text)
// ============================================================================

export const GOOGLE_SANS_FONTS: FontOption[] = [
  // Popular sans-serif fonts
  {
    name: 'Inter',
    family: '"Inter", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Roboto',
    family: '"Roboto", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Open Sans',
    family: '"Open Sans", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Lato',
    family: '"Lato", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Montserrat',
    family: '"Montserrat", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Poppins',
    family: '"Poppins", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Nunito',
    family: '"Nunito", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Raleway',
    family: '"Raleway", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Work Sans',
    family: '"Work Sans", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Source Sans 3',
    family: '"Source Sans 3", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Nunito Sans',
    family: '"Nunito Sans", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Ubuntu',
    family: '"Ubuntu", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Rubik',
    family: '"Rubik", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Quicksand',
    family: '"Quicksand", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Mulish',
    family: '"Mulish", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Barlow',
    family: '"Barlow", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'DM Sans',
    family: '"DM Sans", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Outfit',
    family: '"Outfit", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Manrope',
    family: '"Manrope", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Figtree',
    family: '"Figtree", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Plus Jakarta Sans',
    family: '"Plus Jakarta Sans", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Karla',
    family: '"Karla", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Cabin',
    family: '"Cabin", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cabin:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Josefin Sans',
    family: '"Josefin Sans", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Lexend',
    family: '"Lexend", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lexend:wght@100;200;300;400;500;600;700;800;900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Exo 2',
    family: '"Exo 2", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'IBM Plex Sans',
    family: '"IBM Plex Sans", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Archivo',
    family: '"Archivo", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Oxygen',
    family: '"Oxygen", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Oxygen:wght@300;400;700&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Hind',
    family: '"Hind", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Hind:wght@300;400;500;600;700&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Asap',
    family: '"Asap", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Asap:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Titillium Web',
    family: '"Titillium Web", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Public Sans',
    family: '"Public Sans", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Be Vietnam Pro',
    family: '"Be Vietnam Pro", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Signika',
    family: '"Signika", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Signika:wght@300;400;500;600;700&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Atkinson Hyperlegible',
    family: '"Atkinson Hyperlegible", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    category: 'sans-serif',
  },
  // CJK fonts (Chinese, Japanese, Korean)
  {
    name: 'Noto Sans SC (简体中文)',
    family: '"Noto Sans SC", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100;200;300;400;500;600;700;800;900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Noto Sans TC (繁體中文)',
    family: '"Noto Sans TC", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100;200;300;400;500;600;700;800;900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Noto Sans JP (日本語)',
    family: '"Noto Sans JP", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100;200;300;400;500;600;700;800;900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'Noto Sans KR (한국어)',
    family: '"Noto Sans KR", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;200;300;400;500;600;700;800;900&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'LXGW WenKai (霞鹜文楷)',
    family: '"LXGW WenKai", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=LXGW+WenKai&display=swap',
    category: 'sans-serif',
  },
  {
    name: 'LXGW WenKai TC (霞鶩文楷)',
    family: '"LXGW WenKai TC", sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC&display=swap',
    category: 'sans-serif',
  },
];

// ============================================================================
// GOOGLE FONTS - Serif (for body text)
// ============================================================================

export const GOOGLE_SERIF_FONTS: FontOption[] = [
  {
    name: 'Merriweather',
    family: '"Merriweather", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=swap',
    category: 'serif',
  },
  {
    name: 'Playfair Display',
    family: '"Playfair Display", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'serif',
  },
  {
    name: 'Lora',
    family: '"Lora", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap',
    category: 'serif',
  },
  {
    name: 'Source Serif 4',
    family: '"Source Serif 4", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'serif',
  },
  {
    name: 'Libre Baskerville',
    family: '"Libre Baskerville", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap',
    category: 'serif',
  },
  {
    name: 'EB Garamond',
    family: '"EB Garamond", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&display=swap',
    category: 'serif',
  },
  {
    name: 'Crimson Text',
    family: '"Crimson Text", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap',
    category: 'serif',
  },
  {
    name: 'Cormorant Garamond',
    family: '"Cormorant Garamond", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap',
    category: 'serif',
  },
  {
    name: 'Bitter',
    family: '"Bitter", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'serif',
  },
  {
    name: 'IBM Plex Serif',
    family: '"IBM Plex Serif", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
    category: 'serif',
  },
  {
    name: 'Spectral',
    family: '"Spectral", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap',
    category: 'serif',
  },
  {
    name: 'Zilla Slab',
    family: '"Zilla Slab", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Zilla+Slab:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap',
    category: 'serif',
  },
  {
    name: 'Noto Serif',
    family: '"Noto Serif", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'serif',
  },
  {
    name: 'Gelasio',
    family: '"Gelasio", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Gelasio:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap',
    category: 'serif',
  },
  // CJK serif fonts
  {
    name: 'Noto Serif SC (简体中文)',
    family: '"Noto Serif SC", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@200;300;400;500;600;700;800;900&display=swap',
    category: 'serif',
  },
  {
    name: 'Noto Serif TC (繁體中文)',
    family: '"Noto Serif TC", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@200;300;400;500;600;700;800;900&display=swap',
    category: 'serif',
  },
  {
    name: 'Noto Serif JP (日本語)',
    family: '"Noto Serif JP", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@200;300;400;500;600;700;800;900&display=swap',
    category: 'serif',
  },
  {
    name: 'Noto Serif KR (한국어)',
    family: '"Noto Serif KR", serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200;300;400;500;600;700;800;900&display=swap',
    category: 'serif',
  },
];

// ============================================================================
// GOOGLE FONTS - Monospace (for code)
// ============================================================================

export const GOOGLE_MONO_FONTS: FontOption[] = [
  {
    name: 'Fira Code',
    family: '"Fira Code", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap',
    category: 'monospace',
  },
  {
    name: 'JetBrains Mono',
    family: '"JetBrains Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap',
    category: 'monospace',
  },
  {
    name: 'Source Code Pro',
    family: '"Source Code Pro", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'monospace',
  },
  {
    name: 'Roboto Mono',
    family: '"Roboto Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
    category: 'monospace',
  },
  {
    name: 'Ubuntu Mono',
    family: '"Ubuntu Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    category: 'monospace',
  },
  {
    name: 'IBM Plex Mono',
    family: '"IBM Plex Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
    category: 'monospace',
  },
  {
    name: 'Space Mono',
    family: '"Space Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    category: 'monospace',
  },
  {
    name: 'Inconsolata',
    family: '"Inconsolata", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inconsolata:wght@200;300;400;500;600;700;800;900&display=swap',
    category: 'monospace',
  },
  {
    name: 'DM Mono',
    family: '"DM Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap',
    category: 'monospace',
  },
  {
    name: 'Overpass Mono',
    family: '"Overpass Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Overpass+Mono:wght@300;400;500;600;700&display=swap',
    category: 'monospace',
  },
  {
    name: 'Anonymous Pro',
    family: '"Anonymous Pro", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Anonymous+Pro:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    category: 'monospace',
  },
  {
    name: 'Cousine',
    family: '"Cousine", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cousine:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    category: 'monospace',
  },
  {
    name: 'PT Mono',
    family: '"PT Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=PT+Mono&display=swap',
    category: 'monospace',
  },
  {
    name: 'Noto Sans Mono',
    family: '"Noto Sans Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100;200;300;400;500;600;700;800;900&display=swap',
    category: 'monospace',
  },
  {
    name: 'Red Hat Mono',
    family: '"Red Hat Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Red+Hat+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap',
    category: 'monospace',
  },
  {
    name: 'Azeret Mono',
    family: '"Azeret Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Azeret+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    category: 'monospace',
  },
  {
    name: 'Martian Mono',
    family: '"Martian Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Martian+Mono:wght@100;200;300;400;500;600;700;800&display=swap',
    category: 'monospace',
  },
  {
    name: 'Sometype Mono',
    family: '"Sometype Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Sometype+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap',
    category: 'monospace',
  },
  {
    name: 'Geist Mono',
    family: '"Geist Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100;200;300;400;500;600;700;800;900&display=swap',
    category: 'monospace',
  },
  {
    name: 'Commit Mono',
    family: '"Commit Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Commit+Mono&display=swap',
    category: 'monospace',
  },
];

// ============================================================================
// COMBINED LISTS FOR UI
// ============================================================================

/** All fonts for normal text (sans-serif + serif + special) */
export const NORMAL_TEXT_FONTS: FontOption[] = [
  NO_FONT_CHANGE,
  ...SPECIAL_FONTS,
  ...GOOGLE_SANS_FONTS,
  ...GOOGLE_SERIF_FONTS,
];

/** All fonts for monospace/code blocks (monospace only) */
export const MONOSPACE_FONTS: FontOption[] = [
  NO_FONT_CHANGE,
  ...GOOGLE_MONO_FONTS,
  ...NERD_FONTS,
];

/** All fonts combined */
export const ALL_FONTS: FontOption[] = [
  NO_FONT_CHANGE,
  ...SPECIAL_FONTS,
  ...GOOGLE_SANS_FONTS,
  ...GOOGLE_SERIF_FONTS,
  ...GOOGLE_MONO_FONTS,
  ...NERD_FONTS,
];

// ============================================================================
// FONT SETTINGS TYPE
// ============================================================================

export interface FontSettings {
  /** Font family for normal text (empty string = keep original) */
  normalFont: string;
  /** Font family for monospace/code blocks (empty string = keep original) */
  monoFont: string;
  /** Google Fonts import URLs needed for the selected fonts */
  googleFontsImports: string[];
  /** External font URLs for non-Google fonts */
  externalFontUrls: string[];
}

/**
 * Get the FontOption by family string
 */
export function getFontByFamily(family: string): FontOption | undefined {
  return ALL_FONTS.find(f => f.family === family);
}

/**
 * Build font settings from selected font families
 */
export function buildFontSettings(normalFontFamily: string, monoFontFamily: string): FontSettings {
  const googleFontsImports: string[] = [];
  const externalFontUrls: string[] = [];

  const normalFont = getFontByFamily(normalFontFamily);
  const monoFont = getFontByFamily(monoFontFamily);

  if (normalFont?.googleFontsUrl) {
    googleFontsImports.push(normalFont.googleFontsUrl);
  }
  if (normalFont?.externalUrl) {
    externalFontUrls.push(normalFont.externalUrl);
  }

  if (monoFont?.googleFontsUrl && !googleFontsImports.includes(monoFont.googleFontsUrl)) {
    googleFontsImports.push(monoFont.googleFontsUrl);
  }
  if (monoFont?.externalUrl && !externalFontUrls.includes(monoFont.externalUrl)) {
    externalFontUrls.push(monoFont.externalUrl);
  }

  return {
    normalFont: normalFontFamily,
    monoFont: monoFontFamily,
    googleFontsImports,
    externalFontUrls,
  };
}
