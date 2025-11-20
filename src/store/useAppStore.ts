import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createAISlice, AISlice } from "./slices/aiSlice";
import { createThemeSlice, ThemeSlice } from "./slices/themeSlice";
import { createUISlice, UISlice } from "./slices/uiSlice";
import { createResultSlice, ResultSlice } from "./slices/resultSlice";

export type AppState = AISlice & ThemeSlice & UISlice & ResultSlice;

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createAISlice(...a),
      ...createThemeSlice(...a),
      ...createUISlice(...a),
      ...createResultSlice(...a),
    }),
    {
      name: "catppuccin-generator-storage",
      partialize: (state) => ({
        // Persist AI config
        aiProvider: state.aiProvider,
        aiModel: state.aiModel,
        aiKey: state.aiKey,
        discoveredOllamaModels: state.discoveredOllamaModels,
        // Persist Theme config
        enableDeepAnalysis: state.enableDeepAnalysis,
        flavor: state.flavor,
        accent: state.accent,
        useV3Generator: state.useV3Generator,
        enableCascadingGradients: state.enableCascadingGradients,
        gradientCoverage: state.gradientCoverage,
      }),
    }
  )
);
