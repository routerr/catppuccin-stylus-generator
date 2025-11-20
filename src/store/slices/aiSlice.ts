import { StateCreator } from "zustand";
import { AIProvider } from "../../types/theme";

export interface AISlice {
  aiProvider: AIProvider;
  aiModel: string;
  aiKey: string;
  discoveredOllamaModels: string[];
  setAIProvider: (provider: AIProvider) => void;
  setAIModel: (model: string) => void;
  setAIKey: (key: string) => void;
  setDiscoveredOllamaModels: (models: string[]) => void;
}

export const createAISlice: StateCreator<AISlice> = (set) => ({
  aiProvider: "openrouter",
  aiModel: "tngtech/deepseek-r1t2-chimera:free",
  aiKey: "",
  discoveredOllamaModels: [],
  setAIProvider: (provider) => set({ aiProvider: provider }),
  setAIModel: (model) => set({ aiModel: model }),
  setAIKey: (key) => set({ aiKey: key }),
  setDiscoveredOllamaModels: (models) =>
    set({ discoveredOllamaModels: models }),
});
