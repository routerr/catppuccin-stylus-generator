import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { CatppuccinFlavor, AccentColor } from '../types/catppuccin';
import { CATPPUCCIN_PALETTES, ACCENT_COLORS, FLAVORS } from '../constants/catppuccin-colors';

// Theme configuration interface
export interface ThemeConfig {
  flavor: CatppuccinFlavor;
  accent: AccentColor;
}

// Context value interface
interface ThemeContextValue {
  theme: ThemeConfig;
  setFlavor: (flavor: CatppuccinFlavor) => void;
  setAccent: (accent: AccentColor) => void;
  setTheme: (config: ThemeConfig) => void;
  flavors: typeof FLAVORS;
  accents: typeof ACCENT_COLORS;
  isDark: boolean;
}

// Default theme: Mocha-Mauve
const DEFAULT_THEME: ThemeConfig = {
  flavor: 'mocha',
  accent: 'mauve',
};

const THEME_STORAGE_KEY = 'catppuccin-app-theme';

// Theme Context
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Load theme from localStorage
function loadTheme(): ThemeConfig {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the stored values
      if (
        FLAVORS.some(f => f.name === parsed.flavor) &&
        ACCENT_COLORS.some(a => a.name === parsed.accent)
      ) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_THEME;
}

// Save theme to localStorage
function saveTheme(config: ThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

// Apply theme CSS variables to document
function applyThemeVariables(config: ThemeConfig): void {
  const palette = CATPPUCCIN_PALETTES[config.flavor];
  const root = document.documentElement;

  // Apply all color variables
  Object.entries(palette).forEach(([colorName, colorValue]) => {
    root.style.setProperty(`--ctp-${colorName}`, colorValue.hex);
    root.style.setProperty(`--ctp-${colorName}-rgb`, `${colorValue.rgb.r}, ${colorValue.rgb.g}, ${colorValue.rgb.b}`);
  });

  // Apply accent variable
  const accentValue = palette[config.accent];
  root.style.setProperty('--ctp-accent', accentValue.hex);
  root.style.setProperty('--ctp-accent-rgb', `${accentValue.rgb.r}, ${accentValue.rgb.g}, ${accentValue.rgb.b}`);

  // Set data attribute for potential CSS selectors
  root.setAttribute('data-ctp-flavor', config.flavor);
  root.setAttribute('data-ctp-accent', config.accent);
}

// Theme Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(loadTheme);

  // Apply theme on mount and changes
  useEffect(() => {
    applyThemeVariables(theme);
    saveTheme(theme);
  }, [theme]);

  const setFlavor = useCallback((flavor: CatppuccinFlavor) => {
    setThemeState(prev => ({ ...prev, flavor }));
  }, []);

  const setAccent = useCallback((accent: AccentColor) => {
    setThemeState(prev => ({ ...prev, accent }));
  }, []);

  const setTheme = useCallback((config: ThemeConfig) => {
    setThemeState(config);
  }, []);

  const isDark = theme.flavor !== 'latte';

  const value: ThemeContextValue = {
    theme,
    setFlavor,
    setAccent,
    setTheme,
    flavors: FLAVORS,
    accents: ACCENT_COLORS,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
