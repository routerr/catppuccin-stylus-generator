import { Sparkles, Palette, Droplet } from 'lucide-react';
import type { CatppuccinFlavor, AccentColor } from '../types/catppuccin';

interface DeepAnalysisControlsProps {
  enabled: boolean;
  flavor: CatppuccinFlavor;
  accent: AccentColor;
  onEnabledChange: (enabled: boolean) => void;
  onFlavorChange: (flavor: CatppuccinFlavor) => void;
  onAccentChange: (accent: AccentColor) => void;
  disabled?: boolean;
}

const FLAVORS: Array<{ value: CatppuccinFlavor; label: string; emoji: string }> = [
  { value: 'latte', label: 'Latte', emoji: '☕' },
  { value: 'frappe', label: 'Frappé', emoji: '🍧' },
  { value: 'macchiato', label: 'Macchiato', emoji: '🎨' },
  { value: 'mocha', label: 'Mocha', emoji: '🖤' },
];

const ACCENTS: Array<{ value: AccentColor; label: string }> = [
  { value: 'rosewater', label: 'Rosewater' },
  { value: 'flamingo', label: 'Flamingo' },
  { value: 'pink', label: 'Pink' },
  { value: 'mauve', label: 'Mauve' },
  { value: 'red', label: 'Red' },
  { value: 'maroon', label: 'Maroon' },
  { value: 'peach', label: 'Peach' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'teal', label: 'Teal' },
  { value: 'sky', label: 'Sky' },
  { value: 'sapphire', label: 'Sapphire' },
  { value: 'blue', label: 'Blue' },
  { value: 'lavender', label: 'Lavender' },
];

export function DeepAnalysisControls({
  enabled,
  flavor,
  accent,
  onEnabledChange,
  onFlavorChange,
  onAccentChange,
  disabled = false,
}: DeepAnalysisControlsProps) {
  return (
    <div className="space-y-4">
      {/* Deep Analysis Toggle */}
      <div className="flex items-center gap-3 p-4 bg-ctp-surface1/50 rounded-xl border border-ctp-surface2 hover:border-ctp-accent/30 transition-colors">
        <label className="flex items-center gap-3 flex-1 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            disabled={disabled}
            className="w-5 h-5 rounded border-2 border-ctp-surface2 bg-ctp-surface0 checked:bg-ctp-accent checked:border-ctp-accent focus:ring-2 focus:ring-ctp-accent/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ctp-accent" />
              <span className="font-semibold text-ctp-text">Deep Analysis Mode</span>
            </div>
            <p className="text-sm text-ctp-subtext0 mt-1">
              AI-powered precision mapping with CSS variables, SVGs, and design system detection
            </p>
          </div>
        </label>
      </div>

      {/* Flavor and Accent Selectors - Only show when enabled */}
      {enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Flavor Selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-ctp-text">
              <Palette className="w-4 h-4 text-ctp-accent" />
              Flavor
            </label>
            <select
              value={flavor}
              onChange={(e) => onFlavorChange(e.target.value as CatppuccinFlavor)}
              disabled={disabled}
              className="w-full px-3 py-2 bg-ctp-surface0 border border-ctp-surface2 rounded-lg text-ctp-text focus:outline-none focus:ring-2 focus:ring-ctp-accent/50 focus:border-ctp-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {FLAVORS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.emoji} {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Accent Selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-ctp-text">
              <Droplet className="w-4 h-4 text-ctp-accent" />
              Main Accent
            </label>
            <select
              value={accent}
              onChange={(e) => onAccentChange(e.target.value as AccentColor)}
              disabled={disabled}
              className="w-full px-3 py-2 bg-ctp-surface0 border border-ctp-surface2 rounded-lg text-ctp-text focus:outline-none focus:ring-2 focus:ring-ctp-accent/50 focus:border-ctp-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ACCENTS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Info Banner */}
      {enabled && (
        <div className="p-3 bg-ctp-accent/10 border border-ctp-accent/20 rounded-lg">
          <p className="text-xs text-ctp-subtext0">
            💡 <strong>Deep Analysis</strong> provides superior theme quality by analyzing CSS variables,
            SVG icons, and design system patterns. Best for modern websites with design systems
            (DuckDuckGo, GitHub, etc.)
          </p>
        </div>
      )}
    </div>
  );
}
