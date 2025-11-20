import { StateCreator } from "zustand";
import { ThemePackage, CrawlerResult, AIProvider } from "../../types/theme";

export interface ResultSlice {
  themePackage: ThemePackage | null;
  lastCrawlerResult: CrawlerResult | null;
  lastSource: string | null;
  lastAIConfig: { provider: AIProvider; model: string; apiKey: string } | null;
  lastUrl: string | null;
  lastUploadedFileName: string;
  lastUploadedDirPath: string;
  hasCompleted: boolean;
  setThemePackage: (pkg: ThemePackage | null) => void;
  setLastCrawlerResult: (result: CrawlerResult | null) => void;
  setLastSource: (source: string | null) => void;
  setLastAIConfig: (
    config: { provider: AIProvider; model: string; apiKey: string } | null
  ) => void;
  setLastUrl: (url: string | null) => void;
  setLastUploadedFileName: (name: string) => void;
  setLastUploadedDirPath: (path: string) => void;
  setHasCompleted: (completed: boolean) => void;
  resetResult: () => void;
}

export const createResultSlice: StateCreator<ResultSlice> = (set) => ({
  themePackage: null,
  lastCrawlerResult: null,
  lastSource: null,
  lastAIConfig: null,
  lastUrl: null,
  lastUploadedFileName: "",
  lastUploadedDirPath: "",
  hasCompleted: false,
  setThemePackage: (pkg) => set({ themePackage: pkg }),
  setLastCrawlerResult: (result) => set({ lastCrawlerResult: result }),
  setLastSource: (source) => set({ lastSource: source }),
  setLastAIConfig: (config) => set({ lastAIConfig: config }),
  setLastUrl: (url) => set({ lastUrl: url }),
  setLastUploadedFileName: (name) => set({ lastUploadedFileName: name }),
  setLastUploadedDirPath: (path) => set({ lastUploadedDirPath: path }),
  setHasCompleted: (completed) => set({ hasCompleted: completed }),
  resetResult: () =>
    set({
      themePackage: null,
      hasCompleted: false,
    }),
});
