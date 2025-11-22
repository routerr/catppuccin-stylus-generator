import type { AIModel } from '../../types/theme';
import type { CrawlerResult } from '../../types/theme';
import type { ColorAnalysisResult, ExtendedCrawlerResult } from './types';
import { createModeDetectionPrompt, createColorAnalysisPrompt, createClassMappingPrompt } from './prompts';
import { parseColorAnalysisResponse, extractJSONWithAI, detectWebsiteMode, fetchWithRetry } from './base';

// Chutes AI API endpoint
const CHUTES_API_ENDPOINT = 'https://llm.chutes.ai/v1/chat/completions';

// Chutes AI models - Official endpoint: https://llm.chutes.ai
export const CHUTES_MODELS: AIModel[] = [
  // Free models
  {
    id: 'unsloth/gemma-3-4b-it',
    name: 'Gemma 3 4B Instruct (Free)',
    provider: 'chutes',
    isFree: true,
  },
  {
    id: 'zai-org/GLM-4.5-Air',
    name: 'GLM 4.5 Air (Free)',
    provider: 'chutes',
    isFree: true,
  },
  {
    id: 'meituan-longcat/LongCat-Flash-Chat-FP8',
    name: 'LongCat Flash Chat (Free)',
    provider: 'chutes',
    isFree: true,
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B (Free)',
    provider: 'chutes',
    isFree: true,
  },
  {
    id: 'Alibaba-NLP/Tongyi-DeepResearch-30B-A3B',
    name: 'Tongyi DeepResearch 30B (Free)',
    provider: 'chutes',
    isFree: true,
  },
  // Paid models
  {
    id: 'MiniMaxAI/MiniMax-M2',
    name: 'MiniMax M2 ($0.15/$0.45)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'zai-org/GLM-4.6',
    name: 'GLM 4.6 ($0.40/$1.75)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
    name: 'DeepSeek R1 Qwen3 8B ($0.02/$0.35)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'microsoft/MAI-DS-R1-FP8',
    name: 'Microsoft MAI-DS-R1-FP8 ($0.30/$1.20)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'NousResearch/Hermes-4-405B-FP8',
    name: 'Hermes 4 405B FP8 ($0.30/$1.20)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'moonshotai/Kimi-K2-Instruct-0905',
    name: 'Kimi K2 Instruct (moonshotai) ($0.39/$1.90)',
    provider: 'chutes',
    isFree: false,
  },
  {
    id: 'chutesai/Mistral-Small-3.2-24B-Instruct-2506',
    name: 'Mistral Small 3.2 24B Instruct 2506 ($0.06/$0.18)',
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
      signal: (AbortSignal as any)?.timeout ? (AbortSignal as any).timeout(30000) : undefined,
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
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
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
    signal: (AbortSignal as any)?.timeout ? (AbortSignal as any).timeout(30000) : undefined,
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
