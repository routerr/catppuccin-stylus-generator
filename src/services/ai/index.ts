import type { AIConfig, AIModel } from '../../types/theme';
import type { WebsiteColorAnalysis, ColorMapping } from '../../types/catppuccin';
import type { CrawlerResult } from '../../types/theme';
import { analyzeColorsWithOpenRouter, OPENROUTER_MODELS } from './openrouter';
import { analyzeColorsWithChutes, CHUTES_MODELS } from './chutes';
import { analyzeColorsWithOllama, OLLAMA_MODELS } from './ollama';

export async function analyzeWebsiteColors(
  crawlerResult: CrawlerResult,
  config: AIConfig
): Promise<{ analysis: WebsiteColorAnalysis; mappings: ColorMapping[] }> {
  switch (config.provider) {
    case 'openrouter':
      return analyzeColorsWithOpenRouter(crawlerResult, config.apiKey, config.model);
    case 'chutes':
      return analyzeColorsWithChutes(crawlerResult, config.apiKey, config.model);
    case 'ollama':
      return analyzeColorsWithOllama(crawlerResult, config.model);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

export function getAvailableModels(): AIModel[] {
  return [...OPENROUTER_MODELS, ...CHUTES_MODELS, ...OLLAMA_MODELS];
}

export function getModelsByProvider(provider: 'openrouter' | 'chutes' | 'ollama'): AIModel[] {
  switch (provider) {
    case 'openrouter':
      return OPENROUTER_MODELS;
    case 'chutes':
      return CHUTES_MODELS;
    case 'ollama':
      return OLLAMA_MODELS;
    default:
      return [];
  }
}

export { OPENROUTER_MODELS, CHUTES_MODELS, OLLAMA_MODELS };
