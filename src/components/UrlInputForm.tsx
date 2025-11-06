import { FormEvent } from 'react'
import './form.css'

interface UrlInputFormProps {
  url: string
  onUrlChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
}

const UrlInputForm = ({ url, onUrlChange, onSubmit, isLoading }: UrlInputFormProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="card__header">
        <h2>Target URL</h2>
        <p>Provide the page you want to theme. We will fetch it and design Catppuccin styles.</p>
      </div>
      <div className="field">
        <label htmlFor="url">URL</label>
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://example.com"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          autoComplete="url"
        />
      </div>
      <button type="submit" className="primary" disabled={isLoading}>
        {isLoading ? 'Generating…' : 'Generate theme'}
      </button>
    </form>
  )
}

export default UrlInputForm
