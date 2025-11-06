import { OPTIONAL_PROVIDERS } from '@lib/providers'
import type { OptionalProviderId, ProviderConfig } from '@lib/types'
import './form.css'

interface ProviderIntegrationsProps {
  providers: Partial<Record<OptionalProviderId, ProviderConfig>>
  onProviderChange: (
    id: OptionalProviderId,
    updater: (previous: ProviderConfig | undefined) => ProviderConfig
  ) => void
}

const ProviderIntegrations = ({ providers, onProviderChange }: ProviderIntegrationsProps) => {
  return (
    <section className="card">
      <div className="card__header">
        <h2>Optional scraping/search providers</h2>
        <p>
          Bring your own keys to enrich the prompt. All integrations are opt-in and evaluated in
          a pluggable pipeline.
        </p>
      </div>
      <div className="provider-grid">
        {OPTIONAL_PROVIDERS.map((provider) => {
          const config = providers[provider.id] ?? { enabled: false }
          return (
            <div key={provider.id} className="card" style={{ gap: 12 }}>
              <div className="card__header">
                <h3 style={{ margin: 0 }}>{provider.label}</h3>
                <p>{provider.description}</p>
              </div>
              <label className="toggle-row">
                <span>Enable</span>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(event) =>
                    onProviderChange(provider.id, () => ({
                      ...config,
                      enabled: event.target.checked,
                      apiKey: event.target.checked ? config.apiKey : ''
                    }))
                  }
                />
              </label>
              <div className="field">
                <label htmlFor={`${provider.id}-key`}>API key</label>
                <input
                  id={`${provider.id}-key`}
                  type="password"
                  placeholder={
                    import.meta.env[provider.envKey] ?
                      'Using env key (override by typing)' :
                      'Paste your key'
                  }
                  value={config.apiKey ?? ''}
                  onChange={(event) =>
                    onProviderChange(provider.id, (previous = { enabled: true }) => ({
                      ...previous,
                      apiKey: event.target.value,
                      enabled: previous.enabled || Boolean(event.target.value)
                    }))
                  }
                  disabled={!config.enabled}
                />
              </div>
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="secondary"
              >
                Documentation
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ProviderIntegrations
