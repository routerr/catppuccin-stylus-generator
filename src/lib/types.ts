export type ThemeVariant = 'latte' | 'frappe' | 'macchiato' | 'mocha'

export interface AccentPalette {
  name: string
  description: string
  accents: Record<string, string>
}

export interface GenerationRequest {
  url: string
  model: string
  provider: 'openrouter' | 'chutes'
  themeVariants: ThemeVariant[]
  accentPalette: AccentPalette
  apiKey?: string
  optionalProviders: Partial<Record<OptionalProviderId, ProviderConfig>>
}

export interface GenerationResult {
  metadata: {
    url: string
    generatedAt: string
    model: string
    provider: string
    version: string
  }
  themes: Record<ThemeVariant, string>
  accentPalette: AccentPalette
  downloadableJson: StylusThemePackage
}

export interface ProviderConfig {
  enabled: boolean
  apiKey?: string
}

export type OptionalProviderId = 'browserbase' | 'exa' | 'firecrawl' | 'brave'

export interface ProviderDefinition {
  id: OptionalProviderId
  label: string
  description: string
  docsUrl: string
  envKey: keyof ImportMetaEnv
}

export interface DataFetchContext {
  url: string
  html?: string
  text?: string
  metadata: Record<string, unknown>
}

export interface ProviderImplementation {
  canRun: (config: ProviderConfig) => boolean
  fetch: (config: ProviderConfig, context: DataFetchContext) => Promise<DataFetchContext>
}

export interface StylusThemePackage {
  name: string
  id: string
  description: string
  tags: string[]
  versions: Record<ThemeVariant, {
    less: string
    accentPalette: Record<string, string>
  }>
}
