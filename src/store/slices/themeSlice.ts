import { StateCreator } from "zustand";
import { CatppuccinFlavor, AccentColor } from "../../types/catppuccin";

export interface ThemeSlice {
  enableDeepAnalysis: boolean;
  flavor: CatppuccinFlavor;
  accent: AccentColor;
  useV3Generator: boolean;
  enableCascadingGradients: boolean;
  gradientCoverage: "minimal" | "standard" | "comprehensive";
  setEnableDeepAnalysis: (enabled: boolean) => void;
  setFlavor: (flavor: CatppuccinFlavor) => void;
  setAccent: (accent: AccentColor) => void;
  setUseV3Generator: (useV3: boolean) => void;
  setEnableCascadingGradients: (enabled: boolean) => void;
  setGradientCoverage: (
    coverage: "minimal" | "standard" | "comprehensive"
  ) => void;
}

export const createThemeSlice: StateCreator<ThemeSlice> = (set) => ({
  enableDeepAnalysis: false,
  flavor: "mocha",
  accent: "blue",
  useV3Generator: false,
  enableCascadingGradients: true,
  gradientCoverage: "comprehensive",
  setEnableDeepAnalysis: (enabled) => set({ enableDeepAnalysis: enabled }),
  setFlavor: (flavor) => set({ flavor }),
  setAccent: (accent) => set({ accent }),
  setUseV3Generator: (useV3) => set({ useV3Generator: useV3 }),
  setEnableCascadingGradients: (enabled) =>
    set({ enableCascadingGradients: enabled }),
  setGradientCoverage: (coverage) => set({ gradientCoverage: coverage }),
});
