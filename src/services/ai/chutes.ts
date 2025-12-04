import type { AIModel } from '../../types/theme';
import type { CrawlerResult } from '../../types/theme';
import type { ColorAnalysisResult, ExtendedCrawlerResult } from './types';
import { createModeDetectionPrompt, createColorAnalysisPrompt, createClassMappingPrompt } from './prompts';
import { parseColorAnalysisResponse, extractJSONWithAI, detectWebsiteMode, fetchWithRetry, createTimeoutSignal, COLOR_ANALYSIS_TIMEOUT_MS } from './base';

// Chutes AI API endpoint
const CHUTES_API_ENDPOINT = 'https://llm.chutes.ai/v1/chat/completions';

// Chutes AI models - Official endpoint: https://llm.chutes.ai
// NOTE: Check https://chutes.ai/app for current models and pricing
export const CHUTES_MODELS: AIModel[] = [
  // Popular models (updated 2025-12-05)
  {
    id: 'deepseek-ai/DeepSeek-V3.2',
    name: 'DeepSeek V3.2',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'deepseek-ai/DeepSeek-V3-0324',
    name: 'DeepSeek V3 0324',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'zai-org/GLM-4.6',
    name: 'GLM 4.6',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'tngtech/TNG-R1T-Chimera',
    name: 'TNG R1T Chimera',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'moonshotai/Kimi-K2-Instruct-0905',
    name: 'Kimi K2 Instruct 0905',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'Qwen/Qwen3-235B-A22B',
    name: 'Qwen3 235B A22B',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'MiniMaxAI/MiniMax-M2',
    name: 'MiniMax M2',
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
