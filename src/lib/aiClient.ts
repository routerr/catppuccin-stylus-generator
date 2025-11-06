import type { GenerationRequest, GenerationResult, ThemeVariant } from './types'
import { buildStylusThemePackage } from './themePackage'

interface AiPayload {
  prompt: string
  input?: unknown
}

const ENDPOINTS = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  chutes: 'https://api.chutes.ai/v1/chat/completions'
}

const formatPrompt = (request: GenerationRequest, context: string) => `You are a Catppuccin stylist.
Generate optimized LESS snippets for Stylus that recolor the target site using Catppuccin's Latte, Frappé, Macchiato, and Mocha variants.
Include variables and mixins when helpful.
Ensure selectors are specific to the target URL: ${request.url}.
Return JSON with keys latte, frappe, macchiato, mocha each containing a LESS string.
Provide short commentary with reasoning and highlight usage of the selected accent palette ${request.accentPalette.name}.
Context:
${context}
`

const parseResponse = (text: string): Record<ThemeVariant, string> => {
  try {
    const parsed = JSON.parse(text)
    const keys: ThemeVariant[] = ['latte', 'frappe', 'macchiato', 'mocha']
    return keys.reduce((acc, key) => {
      const value = parsed[key]
      if (typeof value === 'string') {
        acc[key] = value
      } else {
        acc[key] = '// Model did not return LESS for this variant.'
      }
      return acc
    }, {} as Record<ThemeVariant, string>)
  } catch (error) {
    return {
      latte: text,
      frappe: text,
      macchiato: text,
      mocha: text
    }
  }
}

export const runAiGeneration = async (
  request: GenerationRequest,
  context: { text?: string; metadata: Record<string, unknown> }
): Promise<GenerationResult> => {
  if (!request.apiKey) {
    throw new Error('An API key is required for the selected model provider.')
  }

  const endpoint = ENDPOINTS[request.provider]
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${request.apiKey}`
    },
    body: JSON.stringify({
      model: request.model,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional Catppuccin theme designer skilled at LESS and web styling.'
        },
        {
          role: 'user',
          content: formatPrompt(request, context.text ?? 'No content extracted.')
        }
      ],
      response_format: { type: 'json_object' }
    } satisfies AiPayload)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI provider returned ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const messageContent: string | undefined =
    data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text

  if (!messageContent) {
    throw new Error('AI provider did not return content.')
  }

  const fullResponse = parseResponse(messageContent)
  const lessByVariant = request.themeVariants.reduce((acc, variant) => {
    acc[variant] = fullResponse[variant]
    return acc
  }, {} as Record<ThemeVariant, string>)
  const packageJson = buildStylusThemePackage(
    new URL(request.url).hostname,
    'Generated Catppuccin LESS theme bundle',
    lessByVariant,
    request.accentPalette
  )

  return {
    metadata: {
      url: request.url,
      generatedAt: new Date().toISOString(),
      model: request.model,
      provider: request.provider,
      version: __APP_VERSION__
    },
    themes: lessByVariant,
    accentPalette: request.accentPalette,
    downloadableJson: packageJson
  }
}
