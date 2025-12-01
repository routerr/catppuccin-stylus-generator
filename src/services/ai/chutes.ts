import type { AIModel } from '../../types/theme';
import type { CrawlerResult } from '../../types/theme';
import type { ColorAnalysisResult, ExtendedCrawlerResult } from './types';
import { createModeDetectionPrompt, createColorAnalysisPrompt, createClassMappingPrompt } from './prompts';
import { parseColorAnalysisResponse, extractJSONWithAI, detectWebsiteMode, fetchWithRetry, createTimeoutSignal, COLOR_ANALYSIS_TIMEOUT_MS } from './base';

// Chutes AI API endpoint
const CHUTES_API_ENDPOINT = 'https://llm.chutes.ai/v1/chat/completions';

// Chutes AI models - Official endpoint: https://llm.chutes.ai
// NOTE: Check https://llm.chutes.ai/v1/models for current models and pricing
export const CHUTES_MODELS: AIModel[] = [
  // Popular models (updated 2025-12-01)
  {
    id: 'deepseek-ai/DeepSeek-V3.2-Exp',
    name: 'DeepSeek V3.2 Exp ($0.25/$0.35)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-0528',
    name: 'DeepSeek R1 0528 ($0.30/$1.20)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'Qwen/Qwen3-235B-A22B',
    name: 'Qwen3 235B A22B ($0.18/$0.54)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
    name: 'Qwen3 Coder 480B ($0.30/$1.20)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'moonshotai/Kimi-K2-Instruct-0905',
    name: 'Kimi K2 Instruct ($0.39/$1.90)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'MiniMaxAI/MiniMax-M2',
    name: 'MiniMax M2 ($0.15/$0.45)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'zai-org/GLM-4.5-Air-0111',
    name: 'GLM 4.5 Air ($0.10/$0.70)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'microsoft/MAI-DS-R1-FP8',
    name: 'Microsoft MAI-DS-R1 ($0.30/$1.20)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'NousResearch/Hermes-4-405B-FP8',
    name: 'Hermes 4 405B ($0.30/$1.20)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'mistralai/Mistral-Small-3.1-24B-Instruct-2503',
    name: 'Mistral Small 3.1 24B ($0.06/$0.18)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct',
    name: 'Llama 3.3 70B ($0.10/$0.30)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'google/gemma-3-27b-it',
    name: 'Gemma 3 27B ($0.05/$0.15)',
    provider: 'chutes',
    isFree: false,
  },
];

/**
 * Analyze website colors using Chutes AI API
 */
export async function analyzeColorsWithChutes(
  crawlerResult: CrawlerResult,
  apiKey: string,
  model: string,
  options?: { aiClassMapping?: boolean }
): Promise<ColorAnalysisResult> {
  const extendedResult: ExtendedCrawlerResult = crawlerResult as ExtendedCrawlerResult;

  // Step 1: Detect dark/light mode using AI
  const modePrompt = createModeDetectionPrompt(extendedResult);
  const detectedMode = await detectWebsiteMode(
    CHUTES_API_ENDPOINT,
    apiKey,
    model,
    modePrompt,
    false // Chutes doesn't support HTTP-Referer/X-Title headers
  );

  console.log(`Detected mode: ${detectedMode}`);

  // Step 2: Color analysis with detected mode in prompt
  extendedResult.detectedMode = detectedMode;
  const prompt = createColorAnalysisPrompt(extendedResult);

  try {
    // Stage 1: AI analyzes colors (may return messy output)
    console.log('Stage 1: Analyzing colors with Chutes AI...');
    const response = await fetchWithRetry(CHUTES_API_ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
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
      throw new Error(`Chutes AI API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from Chutes AI');
    }

    // Try to parse directly first
    try {
      console.log('Attempting direct JSON parsing...');
      const result = parseColorAnalysisResponse(content);
      const classRoles = options?.aiClassMapping ? await requestClassMappingChutes(apiKey, model, extendedResult) : undefined;
      return { ...result, mode: detectedMode, classRoles };
    } catch (parseError) {
      // Stage 2: If direct parsing fails, use AI to extract JSON
      console.log('Direct parsing failed, using AI to extract JSON...');
      console.log('Parse error:', parseError);
      const result = await extractJSONWithAI({
        apiEndpoint: CHUTES_API_ENDPOINT,
        apiKey,
        model,
        rawResponse: content,
      });
      const classRoles = options?.aiClassMapping ? await requestClassMappingChutes(apiKey, model, extendedResult) : undefined;
      return { ...result, mode: detectedMode, classRoles };
    }
  } catch (error) {
    throw new Error(`Failed to analyze colors with Chutes AI: ${error}`);
  }
}

async function requestClassMappingChutes(apiKey: string, model: string, crawlerResult: ExtendedCrawlerResult) {
  const prompt = createClassMappingPrompt(crawlerResult);
  const response = await fetchWithRetry(CHUTES_API_ENDPOINT, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
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
    console.warn('AI-assisted mapping failed (Chutes)', response.statusText);
    return [];
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return [];
  try { return JSON.parse(content); } catch { return []; }
}
