import { DEFAULT_ACCENTS } from '@lib/catppuccin'
import type { AccentPalette, ThemeVariant } from '@lib/types'
import './form.css'

interface ThemeOptionsProps {
  selectedVariants: ThemeVariant[]
  onVariantToggle: (variant: ThemeVariant) => void
  selectedPalette: AccentPalette
  onPaletteChange: (paletteName: string) => void
}

const ThemeOptions = ({
  selectedVariants,
  onVariantToggle,
  selectedPalette,
  onPaletteChange
}: ThemeOptionsProps) => {
  const isVariantEnabled = (variant: ThemeVariant) => selectedVariants.includes(variant)

  return (
    <section className="card">
      <div className="card__header">
        <h2>Theme variants & accents</h2>
        <p>Select which Catppuccin flavors and accent palette should be generated.</p>
      </div>
      <div className="field">
        <label>Variants</label>
        <div className="provider-grid">
          {(['latte', 'frappe', 'macchiato', 'mocha'] as ThemeVariant[]).map((variant) => (
            <label key={variant} className="toggle-row">
              <span className="variant-label">{variant.toUpperCase()}</span>
              <input
                type="checkbox"
                checked={isVariantEnabled(variant)}
                onChange={() => onVariantToggle(variant)}
              />
            </label>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="accent">Accent palette</label>
        <select
          id="accent"
          value={selectedPalette.name}
          onChange={(event) => onPaletteChange(event.target.value)}
        >
          {DEFAULT_ACCENTS.map((palette) => (
            <option key={palette.name} value={palette.name}>
              {palette.name} — {palette.description}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Preview accents</label>
        <div className="provider-grid">
          {Object.entries(selectedPalette.accents).map(([name, value]) => (
            <div key={name} className="toggle-row" style={{ borderColor: value }}>
              <span>{name}</span>
              <span style={{ color: value }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ThemeOptions
