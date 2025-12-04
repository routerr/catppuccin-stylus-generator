/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Catppuccin Dynamic Palette (via CSS variables)
        ctp: {
          // Base
          base: 'var(--ctp-base)',
          mantle: 'var(--ctp-mantle)',
          crust: 'var(--ctp-crust)',

          // Surface
          surface0: 'var(--ctp-surface0)',
          surface1: 'var(--ctp-surface1)',
          surface2: 'var(--ctp-surface2)',

          // Overlay
          overlay0: 'var(--ctp-overlay0)',
          overlay1: 'var(--ctp-overlay1)',
          overlay2: 'var(--ctp-overlay2)',

          // Text
          subtext0: 'var(--ctp-subtext0)',
          subtext1: 'var(--ctp-subtext1)',
          text: 'var(--ctp-text)',

          // Accents (all available)
          rosewater: 'var(--ctp-rosewater)',
          flamingo: 'var(--ctp-flamingo)',
          pink: 'var(--ctp-pink)',
          mauve: 'var(--ctp-mauve)',
          red: 'var(--ctp-red)',
          maroon: 'var(--ctp-maroon)',
          peach: 'var(--ctp-peach)',
          yellow: 'var(--ctp-yellow)',
          green: 'var(--ctp-green)',
          teal: 'var(--ctp-teal)',
          sky: 'var(--ctp-sky)',
          sapphire: 'var(--ctp-sapphire)',
          blue: 'var(--ctp-blue)',
          lavender: 'var(--ctp-lavender)',

          // Dynamic accent (changes based on user selection)
          accent: 'var(--ctp-accent)',
        },
      },
    },
  },
  plugins: [],
}
