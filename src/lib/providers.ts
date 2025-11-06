import type {
  DataFetchContext,
  OptionalProviderId,
  ProviderConfig,
  ProviderDefinition,
  ProviderImplementation
} from './types'

const makeHeaders = (apiKey?: string) =>
  apiKey
    ? {
        Authorization: `Bearer ${apiKey}`
      }
    : {}

export const OPTIONAL_PROVIDERS: ProviderDefinition[] = [
  {
    id: 'browserbase',
    label: 'Browserbase',
    description: 'Browser-native scraping with session replay.',
    docsUrl: 'https://www.browserbase.com/docs',
    envKey: 'VITE_BROWSERBASE_API_KEY'
  },
  {
    id: 'exa',
    label: 'Exa',
    description: 'Semantic search snippets with citations.',
    docsUrl: 'https://docs.exa.ai',
    envKey: 'VITE_EXA_API_KEY'
  },
  {
    id: 'firecrawl',
    label: 'Firecrawl',
    description: 'Fast crawler for multi-page sites.',
    docsUrl: 'https://docs.firecrawl.dev',
    envKey: 'VITE_FIRECRAWL_API_KEY'
  },
  {
    id: 'brave',
    label: 'Brave Search',
    description: 'Privacy-first search results.',
    docsUrl: 'https://api.search.brave.com/app/documentation',
    envKey: 'VITE_BRAVE_API_KEY'
  }
]

export const providerImplementations: Record<OptionalProviderId, ProviderImplementation> = {
  browserbase: {
    canRun: (config) => Boolean(config.enabled && config.apiKey),
    fetch: async (config, context) => {
      if (!context.html) {
        const response = await fetch('https://api.browserbase.com/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...makeHeaders(config.apiKey)
          },
          body: JSON.stringify({ url: context.url, waitFor: 'networkidle' })
        })
        if (response.ok) {
          const payload = await response.json()
          return {
            ...context,
            html: payload.html ?? context.html,
            metadata: { ...context.metadata, browserbase: payload.metadata }
          }
        }
      }
      return context
    }
  },
  exa: {
    canRun: (config) => Boolean(config.enabled && config.apiKey),
    fetch: async (config, context) => {
      let hostname = ''
      try {
        hostname = new URL(context.url).hostname
      } catch (error) {
        return {
          ...context,
          metadata: {
            ...context.metadata,
            exaError: error instanceof Error ? error.message : 'Invalid URL for Exa search'
          }
        }
      }

      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...makeHeaders(config.apiKey)
        },
        body: JSON.stringify({
          query: `site:${hostname} theme palette css`,
          type: 'neural'
        })
      })
      if (response.ok) {
        const payload = await response.json()
        return {
          ...context,
          metadata: { ...context.metadata, exa: payload.results }
        }
      }
      return context
    }
  },
  firecrawl: {
    canRun: (config) => Boolean(config.enabled && config.apiKey),
    fetch: async (config, context) => {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...makeHeaders(config.apiKey)
        },
        body: JSON.stringify({ url: context.url, formats: ['markdown'] })
      })
      if (response.ok) {
        const payload = await response.json()
        return {
          ...context,
          text: payload.markdown ?? context.text,
          metadata: { ...context.metadata, firecrawl: payload.metadata }
        }
      }
      return context
    }
  },
  brave: {
    canRun: (config) => Boolean(config.enabled && config.apiKey),
    fetch: async (config, context) => {
      const response = await fetch('https://api.search.brave.com/res/v1/web/search?q=theme+css', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': config.apiKey ?? ''
        }
      })
      if (response.ok) {
        const payload = await response.json()
        return {
          ...context,
          metadata: { ...context.metadata, brave: payload.web?.results }
        }
      }
      return context
    }
  }
}

export const runProviders = async (
  context: DataFetchContext,
  providers: Partial<Record<OptionalProviderId, ProviderConfig>>
): Promise<DataFetchContext> => {
  let current = context
  for (const [providerId, config] of Object.entries(providers)) {
    if (!config) continue
    const implementation = providerImplementations[providerId as OptionalProviderId]
    if (!implementation) continue
    if (!implementation.canRun(config)) continue
    try {
      current = await implementation.fetch(config, current)
    } catch (error) {
      current = {
        ...current,
        metadata: {
          ...current.metadata,
          [`${providerId}Error`]:
            error instanceof Error ? error.message : 'Unknown provider error'
        }
      }
    }
  }
  return current
}

export const ensurePrimaryHtml = async (context: DataFetchContext) => {
  if (context.html) return context
  try {
    const response = await fetch(context.url)
    if (response.ok) {
      const html = await response.text()
      return { ...context, html }
    }
  } catch (error) {
    return {
      ...context,
      metadata: {
        ...context.metadata,
        fetchError: error instanceof Error ? error.message : 'Unknown fetch error'
      }
    }
  }
  return context
}

export const withFallbackText = (context: DataFetchContext): DataFetchContext => {
  if (context.text) return context
  if (!context.html) return context
  const text = context.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return { ...context, text }
}
