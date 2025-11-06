/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_CHUTES_API_KEY?: string
  readonly VITE_BROWSERBASE_API_KEY?: string
  readonly VITE_EXA_API_KEY?: string
  readonly VITE_FIRECRAWL_API_KEY?: string
  readonly VITE_BRAVE_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
