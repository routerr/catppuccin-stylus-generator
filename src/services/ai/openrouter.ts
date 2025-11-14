import type { AIModel } from '../../types/theme';
import type { CrawlerResult } from '../../types/theme';
import type { ColorAnalysisResult, ExtendedCrawlerResult } from './types';
import { createModeDetectionPrompt, createColorAnalysisPrompt } from './prompts';
import { parseColorAnalysisResponse, extractJSONWithAI, detectWebsiteMode } from './base';

// OpenRouter API endpoint
const OPENROUTER_API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// OpenRouter models
// NOTE: Free models change frequently. Check https://openrouter.ai/models for current free models.
// Models with ":free" suffix are free to use (rate-limited)
export const OPENROUTER_MODELS: AIModel[] = [
  // Free models (updated 2025-01-06)
  {
    id: 'minimax/minimax-m2:free',
    name: 'MiniMax M2 (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-chat-v3.1:free',
    name: 'DeepSeek Chat v3.1 (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-r1-distill-llama-70b:free',
    name: 'DeepSeek R1 Distill Llama 70B (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM 4.5 Air (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'tngtech/deepseek-r1t2-chimera:free',
    name: 'DeepSeek R1T2 Chimera (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'microsoft/mai-ds-r1:free',
    name: 'Microsoft MAI DS R1 (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'openrouter/polaris-alpha:free',
    name: 'Polaris Alpha (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'mistralai/mistral-small-3.2-24b-instruct:free',
    name: 'Mistral Small 3.2 24B Instruct (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'Nvidia Nemotron Nano 12B v2 VL (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  // Paid models (popular options)
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (Paid)',
    provider: 'openrouter',
    isFree: false,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Paid)',
    provider: 'openrouter',
    isFree: false,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5 (Paid)',
    provider: 'openrouter',
    isFree: false,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct (Paid)',
    provider: 'openrouter',
    isFree: false,
  },
];

/**
 * Analyze website colors using OpenRouter API
 */
export async function analyzeColorsWithOpenRouter(
  crawlerResult: CrawlerResult,
  apiKey: string,
  model: string
): Promise<ColorAnalysisResult> {
  const extendedResult: ExtendedCrawlerResult = crawlerResult as ExtendedCrawlerResult;

  // Step 1: Detect dark/light mode using AI
  const modePrompt = createModeDetectionPrompt(extendedResult);
  const detectedMode = await detectWebsiteMode(
    OPENROUTER_API_ENDPOINT,
    apiKey,
    model,
    modePrompt
  );

  console.log(`Detected mode: ${detectedMode}`);

  // Step 2: Color analysis with detected mode in prompt
  extendedResult.detectedMode = detectedMode;
  const prompt = createColorAnalysisPrompt(extendedResult);

  try {
    // Stage 1: AI analyzes colors (may return messy output)
    console.log('Stage 1: Analyzing colors with OpenRouter AI...');
    const response = await fetch(OPENROUTER_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Catppuccin Theme Generator',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a color analysis expert specializing in web design. Analyze website colors and provide structured JSON responses.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenRouter');
    }

    // Try to parse directly first
    try {
      console.log('Attempting direct JSON parsing...');
      const result = parseColorAnalysisResponse(content);
      return { ...result, mode: detectedMode };
    } catch (parseError) {
      // Stage 2: If direct parsing fails, use AI to extract JSON
      console.log('Direct parsing failed, using AI to extract JSON...');
      console.log('Parse error:', parseError);
      const result = await extractJSONWithAI({
        apiEndpoint: OPENROUTER_API_ENDPOINT,
        apiKey,
        model,
        rawResponse: content,
      });
      return { ...result, mode: detectedMode };
    }
  } catch (error) {
    throw new Error(`Failed to analyze colors with OpenRouter: ${error}`);
  }
}
