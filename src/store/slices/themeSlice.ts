import { StateCreator } from "zustand";
import { CatppuccinFlavor, AccentColor } from "../../types/catppuccin";

export interface ThemeSlice {
  enableDeepAnalysis: boolean;
  flavor: CatppuccinFlavor;
  accent: AccentColor;
  setEnableDeepAnalysis: (enabled: boolean) => void;
  setFlavor: (flavor: CatppuccinFlavor) => void;
  setAccent: (accent: AccentColor) => void;
}

export const createThemeSlice: StateCreator<ThemeSlice> = (set) => ({
  enableDeepAnalysis: false,
  flavor: "mocha",
  accent: "blue",
  setEnableDeepAnalysis: (enabled) => set({ enableDeepAnalysis: enabled }),
  setFlavor: (flavor) => set({ flavor }),
  setAccent: (accent) => set({ accent }),
});
