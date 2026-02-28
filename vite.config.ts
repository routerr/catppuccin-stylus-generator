import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ollama-api': {
        target: 'https://ollama.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ollama-api/, ''),
      },
      '/catppuccin-stylus-generator/ollama-api': {
        target: 'https://ollama.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/catppuccin-stylus-generator\/ollama-api/, ''),
      },
      '/ollama-models': {
        target: 'https://api.ollama.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ollama-models/, ''),
      },
      '/catppuccin-stylus-generator/ollama-models': {
        target: 'https://api.ollama.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/catppuccin-stylus-generator\/ollama-models/, ''),
      },
    },
  },
  // Must match repo name for GitHub Pages project site
  base: '/catppuccin-stylus-generator/',
  build: {
    outDir: 'dist',
  },
})
