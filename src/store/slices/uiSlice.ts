import { StateCreator } from "zustand";
import { ThinkingStep } from "../../components/ThinkingProcess";

export interface UISlice {
  isProcessing: boolean;
  error: string;
  progress: string;
  thinkingSteps: ThinkingStep[];
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string) => void;
  setProgress: (progress: string) => void;
  setThinkingSteps: (steps: ThinkingStep[]) => void;
  addThinkingStep: (step: ThinkingStep) => void;
  updateThinkingStep: (id: string, updates: Partial<ThinkingStep>) => void;
  resetUI: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isProcessing: false,
  error: "",
  progress: "",
  thinkingSteps: [],
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),
  setProgress: (progress) => set({ progress }),
  setThinkingSteps: (steps) => set({ thinkingSteps: steps }),
  addThinkingStep: (step) =>
    set((state) => ({
      thinkingSteps: [
        ...state.thinkingSteps,
        { ...step, timestamp: Date.now() },
      ],
    })),
  updateThinkingStep: (id, updates) =>
    set((state) => ({
      thinkingSteps: state.thinkingSteps.map((step) =>
        step.id === id ? { ...step, ...updates, timestamp: Date.now() } : step
      ),
    })),
  resetUI: () =>
    set({
      error: "",
      progress: "",
      isProcessing: false,
      thinkingSteps: [],
    }),
});
