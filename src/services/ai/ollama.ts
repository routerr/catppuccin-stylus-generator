import type { AIModel } from '../../types/theme';
import type { WebsiteColorAnalysis, ColorMapping } from '../../types/catppuccin';
import type { CrawlerResult } from '../../types/theme';
import { createColorAnalysisPrompt, createClassMappingPrompt, createModeDetectionPrompt } from './prompts';
import { parseColorAnalysisResponse, extractJSONManually, createTimeoutSignal, COLOR_ANALYSIS_TIMEOUT_MS, MODE_DETECTION_TIMEOUT_MS, isTimeoutError } from './base';
import type { ColorAnalysisResult, ExtendedCrawlerResult } from './types';
import { getOllamaApiBase } from './model-catalog';

export const OLLAMA_MODELS: AIModel[] = [
  {
    id: 'gpt-oss:20b',
    name: 'GPT-OSS 20B',
    provider: 'ollama',
    isFree: false,
  },
  {
    id: 'gpt-oss:120b',
    name: 'GPT-OSS 120B',
    provider: 'ollama',
    isFree: false,
  },
];

async function postOllama(
  baseUrl: string | undefined,
  apiKey: string,
  path: string,
  body: Record<string, unknown>,
  timeoutMs: number = COLOR_ANALYSIS_TIMEOUT_MS,
) {
  let attempt = 0;
  let lastErr: unknown = null;
  const base = getOllamaApiBase(baseUrl);

  while (attempt <= 2) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: createTimeoutSignal(timeoutMs),
      });

      if (res.status === 429 || res.status === 503) {
        throw new Error(`HTTP ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      lastErr = error;
      if (isTimeoutError(error)) {
        throw new Error('Request timed out. The Ollama Cloud model may be overloaded or slow. Try a different model.');
      }

      if (attempt === 2) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
    attempt += 1;
  }

  throw lastErr || new Error('Failed to reach Ollama Cloud');
}

export async function analyzeColorsWithOllama(
  crawlerResult: CrawlerResult,
  apiKey: string,
  model: string,
  baseUrl?: string,
  options?: { aiClassMapping?: boolean }
): Promise<ColorAnalysisResult> {
  const extendedResult: ExtendedCrawlerResult = crawlerResult as ExtendedCrawlerResult;

  const modePrompt = createModeDetectionPrompt(extendedResult);

  let detectedMode: 'dark' | 'light' = 'light';
  try {
    const modeData = await postOllama(baseUrl, apiKey, '/api/chat', {
      model,
      messages: [
        { role: 'system', content: 'You are a web design expert. Only answer "dark" or "light".' },
        { role: 'user', content: modePrompt },
      ],
      stream: false,
      options: { temperature: 0.0 },
    }, MODE_DETECTION_TIMEOUT_MS);
    const modeText: string = modeData?.message?.content?.trim()?.toLowerCase() || modeData?.response?.trim()?.toLowerCase();
    if (modeText === 'dark' || modeText === 'light') {
      detectedMode = modeText;
    }
  } catch {
    // Mode detection fallback is intentionally non-fatal.
  }

  extendedResult.detectedMode = detectedMode;
  const prompt = createColorAnalysisPrompt(extendedResult);

  try {
    const data = await postOllama(baseUrl, apiKey, '/api/chat', {
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a color analysis expert specializing in web design. Analyze website colors and provide structured JSON responses.',
        },
        { role: 'user', content: prompt },
      ],
      stream: false,
      options: { temperature: 0.3 },
    });

    const content: string = data?.message?.content || data?.response;
    if (!content) throw new Error('No response from Ollama');

    try {
      const result = parseColorAnalysisResponse(content);
      const classRoles = options?.aiClassMapping
        ? await requestClassMappingOllama(baseUrl, apiKey, model, extendedResult)
        : undefined;
      return { ...result, mode: detectedMode, classRoles };
    } catch {
      const result = await extractJSONWithOllama(content, baseUrl, apiKey, model);
      const classRoles = options?.aiClassMapping
        ? await requestClassMappingOllama(baseUrl, apiKey, model, extendedResult)
        : undefined;
      return { ...result, mode: detectedMode, classRoles };
    }
  } catch (error) {
    throw new Error(`Failed to analyze colors with Ollama Cloud: ${error}`);
  }
}

async function requestClassMappingOllama(
  baseUrl: string | undefined,
  apiKey: string,
  model: string,
  crawlerResult: ExtendedCrawlerResult
) {
  const prompt = createClassMappingPrompt(crawlerResult);
  try {
    const data = await postOllama(baseUrl, apiKey, '/api/chat', {
      model,
      messages: [
        { role: 'system', content: 'You are a UI role classifier. Respond with JSON array of {className, role, confidence} entries.' },
        { role: 'user', content: prompt },
      ],
      stream: false,
      options: { temperature: 0.1 },
    });

    const content: string = data?.message?.content || data?.response;
    return parseClassMapping(content);
  } catch {
    return [];
  }
}

async function extractJSONWithOllama(
  messyResponse: string,
  baseUrl: string | undefined,
  apiKey: string,
  model: string
): Promise<{ analysis: WebsiteColorAnalysis; mappings: ColorMapping[] }> {
  try {
    return extractJSONManually(messyResponse);
  } catch {
    // Fall through to extraction request.
  }

  const extractionPrompt = `CRITICAL: Output ONLY the JSON object.\nFind the JSON object in the text below and output it exactly.\n\nTEXT:\n${messyResponse.slice(0, 3000)}`;

  const data = await postOllama(baseUrl, apiKey, '/api/chat', {
    model,
    messages: [
      { role: 'system', content: 'Output only JSON. No markdown or explanations.' },
      { role: 'user', content: extractionPrompt },
    ],
    stream: false,
    options: { temperature: 0.0 },
  });

  const content: string = data?.message?.content || data?.response;
  if (!content) throw new Error('No response from JSON extraction');

  try {
    return extractJSONManually(content);
  } catch {
    return parseColorAnalysisResponse(content);
  }
}

function parseClassMapping(content: string): Array<{ className: string; role: string; confidence?: number }> {
  if (!content) return [];
  const cleaned = content.replace(/```json/gi, '```').replace(/```/g, '').trim();
  const candidates: string[] = [];

  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end > start) {
    candidates.push(cleaned.slice(start, end + 1));
  }
  candidates.push(cleaned);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray((parsed as { classRoles?: unknown[] }).classRoles)) {
        return (parsed as { classRoles: Array<{ className: string; role: string; confidence?: number }> }).classRoles;
      }
      if (Array.isArray((parsed as { roles?: unknown[] }).roles)) {
        return (parsed as { roles: Array<{ className: string; role: string; confidence?: number }> }).roles;
      }
    } catch {
      // ignore parse errors and try next candidate
    }
  }

  return [];
}
