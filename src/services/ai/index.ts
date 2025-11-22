import type { AIModel } from "../../types/theme";
import { AIProvider } from "../../types/theme";

export const getAvailableModels = () => {
  return [
    {
      id: "google/gemini-2.0-flash-lite-preview-02-05:free",
      name: "Gemini 2.0 Flash Lite",
      provider: "openrouter",
      isFree: true,
    },
    {
      id: "google/gemini-2.0-pro-exp-02-05:free",
      name: "Gemini 2.0 Pro",
      provider: "openrouter",
      isFree: true,
    },
    {
      id: "google/gemini-2.0-flash-thinking-exp:free",
      name: "Gemini 2.0 Flash Thinking",
      provider: "openrouter",
      isFree: true,
    },
    {
      id: "deepseek/deepseek-r1:free",
      name: "DeepSeek R1",
      provider: "openrouter",
      isFree: true,
    },
    {
      id: "deepseek/deepseek-r1-distill-llama-70b:free",
      name: "DeepSeek R1 Distill Llama 70B",
      provider: "openrouter",
      isFree: true,
    },
    {
      id: "qwen/qwen-2.5-coder-32b-instruct:free",
      name: "Qwen 2.5 Coder 32B",
      provider: "openrouter",
      isFree: true,
    },
    {
      id: "meta-llama/llama-3.3-70b-instruct:free",
      name: "Llama 3.3 70B",
      provider: "openrouter",
      isFree: true,
    },
    {
      id: "nvidia/llama-3.1-nemotron-70b-instruct:free",
      name: "Llama 3.1 Nemotron 70B",
      provider: "openrouter",
      isFree: true,
    },
  ];
};

export const getModelsByProvider = (provider: AIProvider) => {
  if (provider === "openrouter") {
    return getAvailableModels().filter((m) => m.provider === "openrouter");
  }
  if (provider === "chutes") {
    return [
      {
        id: "deepseek-ai/DeepSeek-R1",
        name: "DeepSeek R1",
        provider: "chutes",
        isFree: true,
      },
      {
        id: "deepseek-ai/DeepSeek-V3",
        name: "DeepSeek V3",
        provider: "chutes",
        isFree: true,
      },
      {
        id: "Qwen/Qwen2.5-Coder-32B-Instruct",
        name: "Qwen 2.5 Coder 32B",
        provider: "chutes",
        isFree: true,
      },
      {
        id: "nous-hermes-llama-3-70b",
        name: "Nous Hermes Llama 3 70B",
        provider: "chutes",
        isFree: true,
      },
    ];
  }
  if (provider === "ollama") {
    return []; // Ollama models are discovered dynamically
  }
  return [];
};
