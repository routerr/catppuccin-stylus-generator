import { useEffect, useMemo } from 'react'
import type { GenerationResult, ThemeVariant } from '@lib/types'
import './form.css'

interface ResultPanelProps {
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
  result?: GenerationResult
}

const ResultPanel = ({ status, error, result }: ResultPanelProps) => {
  const downloadHref = useMemo(() => {
    if (!result) return undefined
    const blob = new Blob([JSON.stringify(result.downloadableJson, null, 2)], {
      type: 'application/json'
    })
    return URL.createObjectURL(blob)
  }, [result])

  useEffect(() => {
    return () => {
      if (downloadHref) {
        URL.revokeObjectURL(downloadHref)
      }
    }
  }, [downloadHref])

  const disabled = status === 'loading' || !result

  return (
    <section className="card">
      <div className="card__header">
        <h2>Generation result</h2>
        <p>Inspect the generated LESS snippets and download a Stylus importable package.</p>
      </div>
      {status === 'idle' && <p>Provide inputs to start generating.</p>}
      {status === 'loading' && <p>Working with providers and AI model…</p>}
      {status === 'error' && error && <p role="alert">{error}</p>}
      {result && (
        <>
          <div className="meta-grid">
            <div>
              <strong>URL</strong>
              <p>{result.metadata.url}</p>
            </div>
            <div>
              <strong>Model</strong>
              <p>
                {result.metadata.provider} / {result.metadata.model}
              </p>
            </div>
            <div>
              <strong>Generated</strong>
              <p>{new Date(result.metadata.generatedAt).toLocaleString()}</p>
            </div>
            <div>
              <strong>App version</strong>
              <p>{result.metadata.version}</p>
            </div>
          </div>
          {(Object.keys(result.themes) as ThemeVariant[]).map((variant) => (
            <div className="field" key={variant}>
              <label htmlFor={`result-${variant}`}>{variant.toUpperCase()} LESS</label>
              <textarea
                id={`result-${variant}`}
                className="result-box"
                value={result.themes[variant] ?? '// not returned'}
                readOnly
              />
            </div>
          ))}
          <a
            className="primary"
            role="button"
            style={{ textAlign: 'center', textDecoration: 'none' }}
            download={`catppuccin-${result.metadata.url.replace(/[^a-z0-9]+/gi, '-')}.json`}
            href={downloadHref}
            aria-disabled={disabled}
            onClick={(event) => {
              if (disabled) {
                event.preventDefault()
              }
            }}
          >
            Download Stylus JSON
          </a>
        </>
      )}
    </section>
  )
}

export default ResultPanel
