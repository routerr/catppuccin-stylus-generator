import { useCallback, useState } from 'react'
import { ensurePrimaryHtml, runProviders, withFallbackText } from '@lib/providers'
import { runAiGeneration } from '@lib/aiClient'
import type { GenerationRequest, GenerationResult } from '@lib/types'

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseGenerationReturn {
  status: GenerationStatus
  result?: GenerationResult
  error?: string
  generate: (request: GenerationRequest) => Promise<void>
}

export const useGeneration = (): UseGenerationReturn => {
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [result, setResult] = useState<GenerationResult | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  const generate = useCallback(async (request: GenerationRequest) => {
    setStatus('loading')
    setError(undefined)
    try {
      const baseContext = await ensurePrimaryHtml({
        url: request.url,
        metadata: {}
      })
      const enrichedContext = await runProviders(baseContext, request.optionalProviders)
      const hydratedContext = withFallbackText(enrichedContext)
      const aiResult = await runAiGeneration(request, {
        text: hydratedContext.text,
        metadata: hydratedContext.metadata
      })
      setResult(aiResult)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setResult(undefined)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    }
  }, [])

  return { status, result, error, generate }
}
