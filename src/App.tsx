import { useMemo, useState } from 'react'
import UrlInputForm from '@components/UrlInputForm'
import ModelSelector from '@components/ModelSelector'
import ThemeOptions from '@components/ThemeOptions'
import ProviderIntegrations from '@components/ProviderIntegrations'
import ResultPanel from '@components/ResultPanel'
import { DEFAULT_ACCENTS, getAccentPalette } from '@lib/catppuccin'
import { OPTIONAL_PROVIDERS } from '@lib/providers'
import type { AccentPalette, OptionalProviderId, ProviderConfig, ThemeVariant } from '@lib/types'
import { useGeneration } from '@hooks/useGeneration'
import './styles/app.css'

interface AppProps {
  appVersion: string
}

const MODEL_CATALOG: Record<'openrouter' | 'chutes', { value: string; label: string; isFree?: boolean }[]> = {
  openrouter: [
    { value: 'openrouter/auto', label: 'OpenRouter Auto (free)', isFree: true },
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku via OpenRouter' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o mini via OpenRouter' }
  ],
  chutes: [
    { value: 'chutes/free', label: 'Chutes Free (beta)', isFree: true },
    { value: 'chutes/premium', label: 'Chutes Premium' }
  ]
}

const App = ({ appVersion }: AppProps) => {
  const [url, setUrl] = useState('')
  const [provider, setProvider] = useState<'openrouter' | 'chutes'>('openrouter')
  const [model, setModel] = useState(MODEL_CATALOG.openrouter[0].value)
  const [apiKeys, setApiKeys] = useState<Record<'openrouter' | 'chutes', string>>({
    openrouter: import.meta.env.VITE_OPENROUTER_API_KEY ?? '',
    chutes: import.meta.env.VITE_CHUTES_API_KEY ?? ''
  })
  const [selectedPalette, setSelectedPalette] = useState<AccentPalette>(DEFAULT_ACCENTS[0])
  const [selectedVariants, setSelectedVariants] = useState<ThemeVariant[]>([
    'latte',
    'frappe',
    'macchiato',
    'mocha'
  ])
  const [optionalProviders, setOptionalProviders] = useState<
    Partial<Record<OptionalProviderId, ProviderConfig>>
  >(() =>
    Object.fromEntries(
      OPTIONAL_PROVIDERS.map((provider) => [
        provider.id,
        {
          enabled: false,
          apiKey: import.meta.env[provider.envKey] ?? ''
        }
      ])
    ) as Partial<Record<OptionalProviderId, ProviderConfig>>
  )

  const { status, result, error, generate } = useGeneration()

  const resolveEnvKey = (currentProvider: 'openrouter' | 'chutes') =>
    currentProvider === 'openrouter'
      ? import.meta.env.VITE_OPENROUTER_API_KEY ?? ''
      : import.meta.env.VITE_CHUTES_API_KEY ?? ''

  const canGenerate = useMemo(() => {
    if (!url) return false
    if (selectedVariants.length === 0) return false
    const key = apiKeys[provider] || resolveEnvKey(provider)
    return Boolean(key)
  }, [url, selectedVariants, apiKeys, provider])

  const handleGenerate = () => {
    if (!canGenerate) return
    const palette = accentPalette
    void generate({
      url,
      provider,
      model,
      apiKey: apiKeys[provider] || resolveEnvKey(provider),
      themeVariants: selectedVariants,
      accentPalette: palette,
      optionalProviders
    })
  }

  const handleProviderToggle = (
    id: OptionalProviderId,
    updater: (previous: ProviderConfig | undefined) => ProviderConfig
  ) => {
    setOptionalProviders((previous) => ({
      ...previous,
      [id]: updater(previous?.[id])
    }))
  }

  const accentPalette = useMemo(() => getAccentPalette(selectedPalette.name) ?? selectedPalette, [selectedPalette])

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>Catppuccin Stylus Generator</h1>
        <p>
          Craft Catppuccin-compliant LESS themes with optional data fetch providers and AI-powered
          styling.
        </p>
        <small>v{appVersion}</small>
      </header>
      <main className="grid">
        <UrlInputForm url={url} onUrlChange={setUrl} onSubmit={handleGenerate} isLoading={status === 'loading'} />
        <ModelSelector
          provider={provider}
          onProviderChange={(next) => {
            setProvider(next)
            setModel(MODEL_CATALOG[next][0].value)
          }}
          model={model}
          onModelChange={setModel}
          catalogs={MODEL_CATALOG}
          apiKey={apiKeys[provider]}
          onApiKeyChange={(value) =>
            setApiKeys((previous) => ({
              ...previous,
              [provider]: value
            }))
          }
          inheritedKey={resolveEnvKey(provider) || undefined}
        />
        <ThemeOptions
          selectedVariants={selectedVariants}
          onVariantToggle={(variant) =>
            setSelectedVariants((previous) =>
              previous.includes(variant)
                ? previous.filter((entry) => entry !== variant)
                : [...previous, variant]
            )
          }
          selectedPalette={accentPalette}
          onPaletteChange={(value) => {
            const palette = getAccentPalette(value)
            if (palette) {
              setSelectedPalette(palette)
            }
          }}
        />
        <ProviderIntegrations providers={optionalProviders} onProviderChange={handleProviderToggle} />
        <ResultPanel status={status} error={error} result={result} />
      </main>
      {!canGenerate && (
        <footer className="footer">
          <p>Provide a URL and API key to generate a theme.</p>
        </footer>
      )}
    </div>
  )
}

export default App
