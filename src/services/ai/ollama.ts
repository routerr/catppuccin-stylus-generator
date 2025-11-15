import type { AIModel } from '../../types/theme';
import type { WebsiteColorAnalysis, ColorMapping } from '../../types/catppuccin';
import type { CrawlerResult } from '../../types/theme';
import { getOllamaBaseFromStorage, loadAPIKeys } from '../../utils/storage';
import { createColorAnalysisPrompt, createClassMappingPrompt, createModeDetectionPrompt } from './prompts';
import { parseColorAnalysisResponse, extractJSONManually } from './base';
import type { ColorAnalysisResult, ExtendedCrawlerResult } from './types';

// Ollama models (local). These are common tags; your local install may vary.
export const OLLAMA_MODELS: AIModel[] = [
  {
    id: 'llama3.1:8b-instruct',
    name: 'Llama 3.1 8B Instruct (local)',
    provider: 'ollama',
    isFree: true,
  },
  {
    id: 'qwen2.5:7b-instruct',
    name: 'Qwen2.5 7B Instruct (local)',
    provider: 'ollama',
    isFree: true,
  },
  {
    id: 'mistral:7b-instruct',
    name: 'Mistral 7B Instruct (local)',
    provider: 'ollama',
    isFree: true,
  },
  // Cloud examples (require Ollama Cloud API key)
  {
    id: 'gpt-oss:120b-cloud',
    name: 'GPT-OSS 120B (cloud)',
    provider: 'ollama',
    isFree: false,
  },
  {
    id: 'deepseek-v3.1:671b-cloud',
    name: 'Deepseek V3.1 671B (cloud)',
    provider: 'ollama',
    isFree: false,
  },
  {
    id: 'glm-4.6:cloud',
    name: 'GLM 4.6 (cloud)',
    provider: 'ollama',
    isFree: false,
  },
  {
    id: 'gpt-oss:20b-cloud',
    name: 'GPT-OSS 20B (cloud)',
    provider: 'ollama',
    isFree: false,
  },
  {
    id: 'kimi-k2:1t-cloud',
    name: 'Kimi K2 1T (cloud)',
    provider: 'ollama',
    isFree: false,
  },
  {
    id: 'qwen3-coder:480b-cloud',
    name: 'Qwen3 Coder 480B (cloud)',
    provider: 'ollama',
    isFree: false,
  },
  {
    id: 'minimax-m2:cloud',
    name: 'MiniMax M2 (cloud)',
    provider: 'ollama',
    isFree: false,
  },
];

// Base URL(s) for Ollama. Prefer custom (from storage), then relative proxy, then localhost.
function getOllamaBases(): string[] {
  const bases: string[] = [];
  const { ollama: cloudKey } = loadAPIKeys();
  // If cloud key is present, prefer Ollama Cloud API host
  if (cloudKey) {
    bases.push('https://ollama.com');
  }
  const custom = getOllamaBaseFromStorage();
  if (custom && typeof custom === 'string' && custom.trim()) {
    bases.push(custom.trim());
  }
  bases.push('/ollama');
  bases.push('http://localhost:11434');
  return bases;
}

async function postOllama(path: string, body: any) {
  let lastErr: any = null;
  const bases = getOllamaBases();
  const { ollama: cloudKey } = loadAPIKeys();
  for (const base of bases) {
    try {
      const url = `${base}${path}`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (base.startsWith('https://ollama.com') && cloudKey) {
        headers['Authorization'] = `Bearer ${cloudKey}`;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      // try next base
    }
  }
  throw lastErr || new Error('Failed to reach Ollama server');
}

export async function analyzeColorsWithOllama(
  crawlerResult: CrawlerResult,
  model: string,
  options?: { aiClassMapping?: boolean }
): Promise<ColorAnalysisResult> {
  const extendedResult: ExtendedCrawlerResult = crawlerResult as ExtendedCrawlerResult;

  // Step 1: Detect dark/light mode using AI
  const modePrompt = createModeDetectionPrompt(extendedResult);

  let detectedMode: 'dark' | 'light' = 'light';
  try {
    const modeData = await postOllama('/api/chat', {
      model,
      messages: [
        { role: 'system', content: 'You are a web design expert. Only answer "dark" or "light".' },
        { role: 'user', content: modePrompt },
      ],
      stream: false,
      options: { temperature: 0.0 },
    });
    const modeText: string = modeData?.message?.content?.trim()?.toLowerCase() || modeData?.response?.trim()?.toLowerCase();
    if (modeText === 'dark' || modeText === 'light') {
      detectedMode = modeText;
    }
  } catch (e) {
    console.warn('Ollama mode detection failed, defaulting to light mode.', e);
  }

  // Step 2: Color analysis, pass detected mode to prompt
  extendedResult.detectedMode = detectedMode;
  const prompt = createColorAnalysisPrompt(extendedResult);

  try {
    // Stage 1: AI analyzes colors (may return messy output)
    console.log('Stage 1: Analyzing colors with Ollama...');
    const data = await postOllama('/api/chat', {
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

    // Try to parse directly first
    try {
      console.log('Attempting direct JSON parsing...');
      const result = parseColorAnalysisResponse(content);
      const classRoles = options?.aiClassMapping ? await requestClassMappingOllama(model, extendedResult) : undefined;
      return { ...result, mode: detectedMode, classRoles };
    } catch (parseError) {
      // Stage 2: If direct parsing fails, use AI to extract JSON
      console.log('Direct parsing failed, using AI to extract JSON...');
      console.log('Parse error:', parseError);
      const result = await extractJSONWithOllama(content, model);
      const classRoles = options?.aiClassMapping ? await requestClassMappingOllama(model, extendedResult) : undefined;
      return { ...result, mode: detectedMode, classRoles };
    }
  } catch (error) {
    throw new Error(`Failed to analyze colors with Ollama: ${error}`);
  }
}

async function requestClassMappingOllama(model: string, crawlerResult: ExtendedCrawlerResult) {
  const prompt = createClassMappingPrompt(crawlerResult);
  try {
    const data = await postOllama('/api/chat', {
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
  } catch (err) {
    console.warn('AI-assisted mapping failed (Ollama)', err);
    return [];
  }
}

// Stage 2: Use Ollama to extract clean JSON from messy response
async function extractJSONWithOllama(
  messyResponse: string,
  model: string
): Promise<{ analysis: WebsiteColorAnalysis; mappings: ColorMapping[] }> {
  console.log('Stage 2: Attempting Ollama-powered JSON extraction...');

  // First, try manual extraction without AI
  try {
    console.log('Attempting manual extraction first...');
    const manuallyExtracted = extractJSONManually(messyResponse);
    console.log('Manual extraction successful!');
    return manuallyExtracted;
  } catch (manualError) {
    console.log('Manual extraction failed, trying Ollama extraction...', manualError);
  }

  const extractionPrompt = `CRITICAL: You MUST output ONLY the JSON object. NO thinking tags, NO explanations, NO markdown.\n\nFind the JSON object in the text below and output it EXACTLY as-is.\n\nTEXT:\n${messyResponse.slice(0, 3000)}\n\nOUTPUT FORMAT: Just the JSON object starting with { and ending with }`;

  const data = await postOllama('/api/chat', {
    model,
    messages: [
      { role: 'system', content: 'Output only JSON. No thinking. No markdown. Just JSON.' },
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
      if (Array.isArray((parsed as any).classRoles)) return (parsed as any).classRoles;
      if (Array.isArray((parsed as any).roles)) return (parsed as any).roles;
    } catch {
      // ignore parse errors and try next candidate
    }
  }

  return [];
}
