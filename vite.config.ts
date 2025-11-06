import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from 'node:url'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? process.env.npm_package_name
const isGitHubPagesBuild = Boolean(process.env.GITHUB_PAGES || process.env.GITHUB_ACTIONS)

export default defineConfig({
  plugins: [react()],
  base: isGitHubPagesBuild && repositoryName ? `/${repositoryName}/` : '/',
  resolve: {
    alias: {
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url))
    }
  },
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  },
  build: {
    target: 'es2019'
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
})
