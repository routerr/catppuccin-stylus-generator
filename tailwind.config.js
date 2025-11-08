/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Catppuccin Mocha Palette
        ctp: {
          // Base
          base: '#1e1e2e',
          mantle: '#181825',
          crust: '#11111b',

          // Surface
          surface0: '#313244',
          surface1: '#45475a',
          surface2: '#585b70',

          // Overlay
          overlay0: '#6c7086',
          overlay1: '#7f849c',
          overlay2: '#9399b2',

          // Text
          subtext0: '#a6adc8',
          subtext1: '#bac2de',
          text: '#cdd6f4',

          // Accents
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
          lavender: '#b4befe',

          // Accent scheme
          accent: '#cba6f7',       // mauve (main accent)
          'bi-accent': '#f5c2e7',  // pink (similar to mauve, for gradients)
          'co-accent1': '#74c7ec', // sapphire (triadic, main accent)
          'co-accent2': '#a6e3a1', // green (triadic, main accent)
        },
      },
    },
  },
  plugins: [],
}
