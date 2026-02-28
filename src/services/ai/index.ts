import type { AIConfig, AIModel } from '../../types/theme';
import type { WebsiteColorAnalysis, ColorMapping } from '../../types/catppuccin';
import type { CrawlerResult } from '../../types/theme';
import { analyzeColorsWithOpenRouter, OPENROUTER_MODELS } from './openrouter';
import { analyzeColorsWithOpenAICompatible, OPENAI_COMPATIBLE_MODELS } from './openai-compatible';
import { analyzeColorsWithOllama, OLLAMA_MODELS } from './ollama';
import { fetchModelsForProvider, sortModelsByPrice } from './model-catalog';

export async function analyzeWebsiteColors(
  crawlerResult: CrawlerResult,
  config: AIConfig,
  options?: { aiClassMapping?: boolean }
): Promise<{ analysis: WebsiteColorAnalysis; mappings: ColorMapping[]; mode: 'dark' | 'light'; classRoles?: any[] }> {
  switch (config.provider) {
    case 'openrouter':
      return analyzeColorsWithOpenRouter(crawlerResult, config.apiKey, config.model, options);
    case 'openai-compatible':
      return analyzeColorsWithOpenAICompatible(crawlerResult, config.apiKey, config.model, config.baseUrl, options);
    case 'ollama':
      return analyzeColorsWithOllama(crawlerResult, config.apiKey, config.model, config.baseUrl, options);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

export function getAvailableModels(): AIModel[] {
  return sortModelsByPrice([...OPENROUTER_MODELS, ...OPENAI_COMPATIBLE_MODELS, ...OLLAMA_MODELS]);
}

export function getModelsByProvider(provider: 'openrouter' | 'openai-compatible' | 'ollama'): AIModel[] {
  switch (provider) {
    case 'openrouter':
      return sortModelsByPrice(OPENROUTER_MODELS);
    case 'openai-compatible':
      return sortModelsByPrice(OPENAI_COMPATIBLE_MODELS);
    case 'ollama':
      return sortModelsByPrice(OLLAMA_MODELS);
    default:
      return [];
  }
}

export async function discoverModels(
  provider: 'openrouter' | 'openai-compatible' | 'ollama',
  options?: { apiKey?: string; baseUrl?: string },
): Promise<AIModel[]> {
  return fetchModelsForProvider(provider, options);
}

export { OPENROUTER_MODELS, OPENAI_COMPATIBLE_MODELS, OLLAMA_MODELS };
