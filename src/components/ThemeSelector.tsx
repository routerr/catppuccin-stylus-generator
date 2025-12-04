import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { CatppuccinFlavor, AccentColor } from '../types/catppuccin';
import { CATPPUCCIN_PALETTES } from '../constants/catppuccin-colors';

export function ThemeSelector() {
  const { theme, setFlavor, setAccent, flavors, accents } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current accent color hex
  const currentAccentHex = CATPPUCCIN_PALETTES[theme.flavor][theme.accent].hex;
  const currentFlavorInfo = flavors.find(f => f.name === theme.flavor);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Theme Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ctp-surface0 hover:bg-ctp-surface1 border border-ctp-surface1 transition-colors"
        title="Change app theme"
      >
        <div
          className="w-4 h-4 rounded-full border border-ctp-overlay0"
          style={{ backgroundColor: currentAccentHex }}
        />
        <span className="text-sm text-ctp-text">
          {currentFlavorInfo?.emoji} {currentFlavorInfo?.displayName}
        </span>
        <svg
          className={`w-4 h-4 text-ctp-subtext0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-ctp-base border border-ctp-surface1 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Flavor Selection */}
          <div className="p-3 border-b border-ctp-surface0">
            <div className="text-xs font-medium text-ctp-subtext0 mb-2 uppercase tracking-wider">Flavor</div>
            <div className="grid grid-cols-4 gap-1">
              {flavors.map((flavor) => {
                const isSelected = theme.flavor === flavor.name;
                const flavorPalette = CATPPUCCIN_PALETTES[flavor.name as CatppuccinFlavor];
                return (
                  <button
                    key={flavor.name}
                    onClick={() => setFlavor(flavor.name as CatppuccinFlavor)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-ctp-surface1 ring-2 ring-ctp-accent'
                        : 'hover:bg-ctp-surface0'
                    }`}
                    title={flavor.description}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-ctp-overlay0"
                      style={{ backgroundColor: flavorPalette.base.hex }}
                    />
                    <span className="text-xs text-ctp-text">{flavor.emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Selection */}
          <div className="p-3">
            <div className="text-xs font-medium text-ctp-subtext0 mb-2 uppercase tracking-wider">Accent</div>
            <div className="grid grid-cols-7 gap-1">
              {accents.map((accent) => {
                const isSelected = theme.accent === accent.name;
                const accentHex = CATPPUCCIN_PALETTES[theme.flavor][accent.name as AccentColor].hex;
                return (
                  <button
                    key={accent.name}
                    onClick={() => setAccent(accent.name as AccentColor)}
                    className={`group relative p-1 rounded-lg transition-all ${
                      isSelected ? 'bg-ctp-surface1' : 'hover:bg-ctp-surface0'
                    }`}
                    title={accent.displayName}
                  >
                    <div
                      className={`w-6 h-6 rounded-full transition-transform ${
                        isSelected ? 'ring-2 ring-ctp-text ring-offset-1 ring-offset-ctp-base scale-110' : 'group-hover:scale-110'
                      }`}
                      style={{ backgroundColor: accentHex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Theme Display */}
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between p-2 bg-ctp-mantle rounded-lg">
              <span className="text-xs text-ctp-subtext0">Current:</span>
              <span className="text-sm font-medium text-ctp-text">
                {currentFlavorInfo?.displayName} · {accents.find(a => a.name === theme.accent)?.displayName}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
