import { Sparkles, Palette, Droplet, Layers, Zap } from 'lucide-react';
import type { CatppuccinFlavor, AccentColor } from '../types/catppuccin';

interface DeepAnalysisControlsProps {
  enabled: boolean;
  flavor: CatppuccinFlavor;
  accent: AccentColor;
  onEnabledChange: (enabled: boolean) => void;
  onFlavorChange: (flavor: CatppuccinFlavor) => void;
  onAccentChange: (accent: AccentColor) => void;
  disabled?: boolean;
  useV3Generator?: boolean;
  onUseV3GeneratorChange?: (enabled: boolean) => void;
  enableCascadingGradients?: boolean;
  onEnableCascadingGradientsChange?: (enabled: boolean) => void;
  gradientCoverage?: 'minimal' | 'standard' | 'comprehensive';
  onGradientCoverageChange?: (coverage: 'minimal' | 'standard' | 'comprehensive') => void;
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
  useV3Generator = false,
  onUseV3GeneratorChange,
  enableCascadingGradients = true,
  onEnableCascadingGradientsChange,
  gradientCoverage = 'comprehensive',
  onGradientCoverageChange,
}: DeepAnalysisControlsProps) {
  return (
    <div className="space-y-4">
      {/* Deep Analysis Toggle */}
      <div className="flex items-center gap-3 p-4 bg-ctp-surface1/50 rounded-xl border border-ctp-surface2 hover:border-ctp-accent/30 transition-colors">
        <label htmlFor="deep-analysis-toggle" className="flex items-center gap-3 flex-1 cursor-pointer">
          <input
            id="deep-analysis-toggle"
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            disabled={disabled}
            aria-label="Enable Deep Analysis Mode for precision theme generation"
            className="w-5 h-5 rounded border-2 border-ctp-surface2 bg-ctp-surface0 checked:bg-ctp-accent checked:border-ctp-accent focus:ring-2 focus:ring-ctp-accent/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ctp-accent" aria-hidden="true" />
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Flavor Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-ctp-text">
                <Palette className="w-4 h-4 text-ctp-accent" />
                {useV3Generator ? 'Default Flavor' : 'Flavor'}
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
              {useV3Generator && (
                <p className="text-xs text-ctp-subtext0">
                  Users can change in Stylus UI after install
                </p>
              )}
            </div>

            {/* Accent Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-ctp-text">
                <Droplet className="w-4 h-4 text-ctp-accent" />
                {useV3Generator ? 'Default Accent' : 'Main Accent'}
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
              {useV3Generator && (
                <p className="text-xs text-ctp-subtext0">
                  Users can switch between all 14 accents
                </p>
              )}
            </div>
          </div>

          {/* V3 Generator Toggle */}
          {onUseV3GeneratorChange && (
            <div className="flex items-center gap-3 p-4 bg-ctp-accent/5 rounded-xl border border-ctp-accent/20 hover:border-ctp-accent/40 transition-colors">
              <label htmlFor="v3-generator-toggle" className="flex items-center gap-3 flex-1 cursor-pointer">
                <input
                  id="v3-generator-toggle"
                  type="checkbox"
                  checked={useV3Generator}
                  onChange={(e) => onUseV3GeneratorChange(e.target.checked)}
                  disabled={disabled}
                  className="w-5 h-5 rounded border-2 border-ctp-surface2 bg-ctp-surface0 checked:bg-ctp-accent checked:border-ctp-accent focus:ring-2 focus:ring-ctp-accent/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-ctp-accent" />
                    <span className="font-semibold text-ctp-text">V3 Generator</span>
                    <span className="px-2 py-0.5 bg-ctp-green/20 text-ctp-green text-xs font-bold rounded-full">NEW</span>
                  </div>
                  <p className="text-sm text-ctp-subtext0 mt-1">
                    Dynamic multi-flavor support – users can change flavors and accents in Stylus UI after install!
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* V3 Advanced Options */}
          {useV3Generator && onEnableCascadingGradientsChange && onGradientCoverageChange && (
            <div className="space-y-3 p-4 bg-ctp-surface1/30 rounded-xl border border-ctp-surface2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ctp-text">
                <Layers className="w-4 h-4 text-ctp-accent" />
                V3 Advanced Options
              </h3>

              {/* Cascading Gradients Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCascadingGradients}
                  onChange={(e) => onEnableCascadingGradientsChange(e.target.checked)}
                  disabled={disabled}
                  className="w-4 h-4 rounded border-2 border-ctp-surface2 bg-ctp-surface0 checked:bg-ctp-accent checked:border-ctp-accent focus:ring-2 focus:ring-ctp-accent/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-ctp-text">Cascading Gradients</span>
                  <p className="text-xs text-ctp-subtext0 mt-0.5">
                    3-level gradient system with analogous color harmony (±72° hue)
                  </p>
                </div>
              </label>

              {/* Gradient Coverage Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-ctp-text block">
                  Gradient Coverage
                </label>
                <select
                  value={gradientCoverage}
                  onChange={(e) => onGradientCoverageChange(e.target.value as 'minimal' | 'standard' | 'comprehensive')}
                  disabled={disabled}
                  className="w-full px-3 py-2 bg-ctp-surface0 border border-ctp-surface2 rounded-lg text-ctp-text focus:outline-none focus:ring-2 focus:ring-ctp-accent/50 focus:border-ctp-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <option value="minimal">Minimal - Basic hover effects only</option>
                  <option value="standard">Standard - Balanced coverage (recommended)</option>
                  <option value="comprehensive">Comprehensive - Maximum coverage (50+ patterns)</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Banner */}
      {enabled && (
        <div className="p-3 bg-ctp-accent/10 border border-ctp-accent/20 rounded-lg">
          <p className="text-xs text-ctp-subtext0">
            💡 <strong>Deep Analysis</strong> provides superior theme quality by analyzing CSS variables,
            SVG icons, and design system patterns. Best for modern websites with design systems
            (DuckDuckGo, GitHub, etc.)
            {useV3Generator && (
              <>
                {' '}<strong className="text-ctp-green">V3 Generator</strong> creates themes with dynamic
                flavor/accent switching – one theme, 56 combinations (4 flavors × 14 accents)!
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
