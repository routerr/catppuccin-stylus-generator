import { ChangeEvent } from 'react'
import './form.css'

interface ProviderModel {
  value: string
  label: string
  isFree?: boolean
}

export interface ModelCatalog {
  provider: 'openrouter' | 'chutes'
  models: ProviderModel[]
}

interface ModelSelectorProps {
  provider: 'openrouter' | 'chutes'
  onProviderChange: (provider: 'openrouter' | 'chutes') => void
  model: string
  onModelChange: (model: string) => void
  catalogs: Record<'openrouter' | 'chutes', ProviderModel[]>
  apiKey: string
  onApiKeyChange: (value: string) => void
  inheritedKey?: string
}

const ModelSelector = ({
  provider,
  onProviderChange,
  model,
  onModelChange,
  catalogs,
  apiKey,
  onApiKeyChange,
  inheritedKey
}: ModelSelectorProps) => {
  const handleProviderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onProviderChange(event.target.value as 'openrouter' | 'chutes')
  }

  const handleModelChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onModelChange(event.target.value)
  }

  return (
    <section className="card">
      <div className="card__header">
        <h2>Model selection</h2>
        <p>Choose the AI provider and model to synthesize your Catppuccin theme.</p>
      </div>
      <div className="field">
        <label htmlFor="provider">Provider</label>
        <select id="provider" value={provider} onChange={handleProviderChange}>
          <option value="openrouter">OpenRouter</option>
          <option value="chutes">Chutes</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="model">Model</label>
        <select id="model" value={model} onChange={handleModelChange}>
          {catalogs[provider].map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
              {entry.isFree ? ' · free tier' : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="api-key">
          API key {inheritedKey ? '(overrides env default)' : ''}
        </label>
        <input
          id="api-key"
          type="password"
          placeholder="Paste your key (never stored)"
          value={apiKey}
          onChange={(event) => onApiKeyChange(event.target.value)}
        />
        {inheritedKey && !apiKey && (
          <small>Using key from environment variable.</small>
        )}
      </div>
    </section>
  )
}

export default ModelSelector
