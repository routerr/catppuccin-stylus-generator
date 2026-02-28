import type { AIModel } from '../../types/theme';
import type { CrawlerResult } from '../../types/theme';
import type { ColorAnalysisResult, ExtendedCrawlerResult } from './types';
import { createModeDetectionPrompt, createColorAnalysisPrompt, createClassMappingPrompt } from './prompts';
import { parseColorAnalysisResponse, extractJSONWithAI, detectWebsiteMode, fetchWithRetry, createTimeoutSignal, COLOR_ANALYSIS_TIMEOUT_MS } from './base';
import { DEFAULT_OPENAI_COMPATIBLE_BASE } from './model-catalog';

export const OPENAI_COMPATIBLE_MODELS: AIModel[] = [
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 mini',
    provider: 'openai-compatible',
    isFree: false,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'openai-compatible',
    isFree: false,
  },
];

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveBase(baseUrl?: string): string {
  const input = trimTrailingSlash(baseUrl?.trim() || DEFAULT_OPENAI_COMPATIBLE_BASE);
  if (input.endsWith('/v1') || /\/v\d+$/.test(input)) {
    return input;
  }
  return `${input}/v1`;
}

function chatCompletionsEndpoint(baseUrl?: string): string {
  return `${resolveBase(baseUrl)}/chat/completions`;
}

export async function analyzeColorsWithOpenAICompatible(
  crawlerResult: CrawlerResult,
  apiKey: string,
  model: string,
  baseUrl?: string,
  options?: { aiClassMapping?: boolean }
): Promise<ColorAnalysisResult> {
  const extendedResult: ExtendedCrawlerResult = crawlerResult as ExtendedCrawlerResult;
  const endpoint = chatCompletionsEndpoint(baseUrl);

  const modePrompt = createModeDetectionPrompt(extendedResult);
  const detectedMode = await detectWebsiteMode(
    endpoint,
    apiKey,
    model,
    modePrompt,
    false,
  );

  extendedResult.detectedMode = detectedMode;
  const prompt = createColorAnalysisPrompt(extendedResult);

  try {
    const response = await fetchWithRetry(endpoint, {
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
      throw new Error(`OpenAI-compatible API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI-compatible provider');
    }

    try {
      const result = parseColorAnalysisResponse(content);
      const classRoles = options?.aiClassMapping
        ? await requestClassMappingOpenAICompatible(apiKey, model, endpoint, extendedResult)
        : undefined;
      return { ...result, mode: detectedMode, classRoles };
    } catch {
      const result = await extractJSONWithAI({
        apiEndpoint: endpoint,
        apiKey,
        model,
        rawResponse: content,
      });
      const classRoles = options?.aiClassMapping
        ? await requestClassMappingOpenAICompatible(apiKey, model, endpoint, extendedResult)
        : undefined;
      return { ...result, mode: detectedMode, classRoles };
    }
  } catch (error) {
    throw new Error(`Failed to analyze colors with OpenAI-compatible provider: ${error}`);
  }
}

async function requestClassMappingOpenAICompatible(
  apiKey: string,
  model: string,
  endpoint: string,
  crawlerResult: ExtendedCrawlerResult
) {
  const prompt = createClassMappingPrompt(crawlerResult);
  const response = await fetchWithRetry(endpoint, {
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
    return [];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return [];

  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}
