import type { AIModel } from '../../types/theme';
import type { CrawlerResult } from '../../types/theme';
import type { ColorAnalysisResult, ExtendedCrawlerResult } from './types';
import { createModeDetectionPrompt, createColorAnalysisPrompt, createClassMappingPrompt } from './prompts';
import { parseColorAnalysisResponse, extractJSONWithAI, detectWebsiteMode, fetchWithRetry, createTimeoutSignal, COLOR_ANALYSIS_TIMEOUT_MS } from './base';

// OpenRouter API endpoint
const OPENROUTER_API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// OpenRouter models
// NOTE: Free models change frequently. Check https://openrouter.ai/models for current free models.
// Models with ":free" suffix are free to use (rate-limited)
export const OPENROUTER_MODELS: AIModel[] = [
  // Free models (updated 2025-12-01)
  {
    id: 'x-ai/grok-4.1-fast:free',
    name: 'xAI Grok 4.1 Fast (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'qwen/qwen3-235b-a22b:free',
    name: 'Qwen3 235B A22B (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder 480B (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'moonshotai/kimi-k2:free',
    name: 'Kimi K2 0711 (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'openai/gpt-oss-20b:free',
    name: 'OpenAI GPT-OSS 20B (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'alibaba/tongyi-deepresearch-30b-a3b:free',
    name: 'Tongyi DeepResearch 30B (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'meituan/longcat-flash-chat:free',
    name: 'LongCat Flash Chat (Free)',
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
    id: 'tngtech/deepseek-r1t-chimera:free',
    name: 'DeepSeek R1T Chimera (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Exp (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b:free',
    name: 'Hermes 3 405B Instruct (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral Small 3.1 24B (Free)',
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
  model: string,
  options?: { aiClassMapping?: boolean }
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
    const response = await fetchWithRetry(OPENROUTER_API_ENDPOINT, {
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
      signal: createTimeoutSignal(COLOR_ANALYSIS_TIMEOUT_MS),
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
      const classRoles = options?.aiClassMapping ? await requestClassMapping(apiKey, model, extendedResult) : undefined;
      return { ...result, mode: detectedMode, classRoles };
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
      const classRoles = options?.aiClassMapping ? await requestClassMapping(apiKey, model, extendedResult) : undefined;
      return { ...result, mode: detectedMode, classRoles };
    }
  } catch (error) {
    throw new Error(`Failed to analyze colors with OpenRouter: ${error}`);
  }
}

async function requestClassMapping(apiKey: string, model: string, crawlerResult: ExtendedCrawlerResult) {
  const prompt = createClassMappingPrompt(crawlerResult);

  const response = await fetchWithRetry(OPENROUTER_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : undefined,
      'X-Title': 'Catppuccin Theme Generator',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a UI role classifier.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 1200,
    }),
    signal: createTimeoutSignal(COLOR_ANALYSIS_TIMEOUT_MS),
  });

  if (!response.ok) {
    console.warn('AI-assisted mapping failed (OpenRouter)', response.statusText);
    return [];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return [];

  try {
    return JSON.parse(content);
  } catch {
    try {
      const extracted = await extractJSONWithAI({
        apiEndpoint: OPENROUTER_API_ENDPOINT,
        apiKey,
        model,
        rawResponse: content,
      });
      return extracted as any[];
    } catch (err) {
      console.warn('Failed to parse class mapping JSON', err);
      return [];
    }
  }
}
