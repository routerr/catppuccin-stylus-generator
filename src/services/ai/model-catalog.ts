import type { AIModel, AIProvider } from '../../types/theme';

export const DEFAULT_OPENAI_COMPATIBLE_BASE = 'https://api.openai.com/v1';
export const DEFAULT_OLLAMA_CLOUD_BASE = 'https://ollama.com';
export const DEFAULT_OLLAMA_MODEL_CATALOG_BASE = 'https://api.ollama.com';
const LOCAL_OLLAMA_PROXY_BASE = '/ollama-api';
const LOCAL_OLLAMA_MODELS_PROXY_BASE = '/ollama-models';
const PUBLIC_MODEL_PROXY_PREFIXES = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

interface ModelDiscoveryOptions {
  apiKey?: string;
  baseUrl?: string;
}

interface OpenRouterModelEntry {
  id?: string;
  name?: string;
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
    input?: string | number;
    output?: string | number;
  };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isOllamaCloudHost(hostname: string): boolean {
  return hostname === 'ollama.com' || hostname === 'api.ollama.com' || hostname.endsWith('.ollama.com');
}

function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toPricePerMillionFromPerToken(value: unknown): number | undefined {
  const n = toNumber(value);
  if (n == null) return undefined;
  return n * 1_000_000;
}

function normalizeOpenAICompatibleBase(baseUrl?: string): string {
  const input = trimTrailingSlash(baseUrl?.trim() || DEFAULT_OPENAI_COMPATIBLE_BASE);
  if (input.endsWith('/v1')) return input;
  if (/\/v\d+$/.test(input)) return input;
  return `${input}/v1`;
}

function normalizeOllamaBase(baseUrl?: string): string {
  let input = trimTrailingSlash(baseUrl?.trim() || DEFAULT_OLLAMA_CLOUD_BASE);
  if (input.endsWith('/api')) {
    input = input.slice(0, -4);
  }

  // Keep Ollama Cloud base canonical even if the user accidentally enters a path.
  if (isHttpUrl(input)) {
    try {
      const parsed = new URL(input);
      if (isOllamaCloudHost(parsed.hostname) && parsed.pathname !== '/' && parsed.pathname !== '') {
        input = `${parsed.protocol}//${parsed.host}`;
      }
    } catch {
      // Leave as-is when URL parsing fails; caller validates separately.
    }
  }

  return input;
}

function resolveOllamaBaseForBrowser(baseUrl?: string): string {
  const normalized = normalizeOllamaBase(baseUrl);
  if (typeof window === 'undefined') return normalized;
  if (!isHttpUrl(normalized)) return normalized;

  try {
    const target = new URL(normalized);
    const appHost = window.location.hostname;
    if (isOllamaCloudHost(target.hostname) && isLocalDevHost(appHost)) {
      // Avoid browser CORS preflight failures in local dev by using Vite proxy.
      return LOCAL_OLLAMA_PROXY_BASE;
    }
  } catch {
    // Keep normalized value when parsing fails.
  }

  return normalized;
}

function resolveOllamaModelCatalogBaseForBrowser(): string {
  const normalized = trimTrailingSlash(DEFAULT_OLLAMA_MODEL_CATALOG_BASE);
  if (typeof window === 'undefined') return normalized;

  const appHost = window.location.hostname;
  if (isLocalDevHost(appHost)) {
    // Avoid browser CORS preflight failures in local dev by using Vite proxy.
    return LOCAL_OLLAMA_MODELS_PROXY_BASE;
  }

  return normalized;
}

function resolveOllamaModelCatalogCandidates(): string[] {
  const officialUrl = `${trimTrailingSlash(DEFAULT_OLLAMA_MODEL_CATALOG_BASE)}/api/tags`;
  if (typeof window === 'undefined') {
    return [officialUrl];
  }

  const candidates: string[] = [officialUrl];
  if (isLocalDevHost(window.location.hostname)) {
    candidates.push(`${LOCAL_OLLAMA_MODELS_PROXY_BASE}/api/tags`);
  }

  PUBLIC_MODEL_PROXY_PREFIXES.forEach((prefix) => {
    candidates.push(`${prefix}${encodeURIComponent(officialUrl)}`);
  });

  return Array.from(new Set(candidates));
}

async function parseJsonResponse(response: Response, label: string): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();

  if (!/application\/json/i.test(contentType)) {
    const snippet = body.slice(0, 120).replace(/\s+/g, ' ').trim();
    throw new Error(`${label} returned non-JSON response (${contentType || 'unknown'}): ${snippet}`);
  }

  try {
    return JSON.parse(body);
  } catch {
    const snippet = body.slice(0, 120).replace(/\s+/g, ' ').trim();
    throw new Error(`${label} returned invalid JSON: ${snippet}`);
  }
}

function modelPriceScore(model: AIModel): number {
  if (model.isFree) return 0;
  const input = model.inputPricePerMillion;
  const output = model.outputPricePerMillion;
  if (input == null && output == null) return Number.POSITIVE_INFINITY;
  return (input ?? 0) + (output ?? 0);
}

function dedupeModels(models: AIModel[]): AIModel[] {
  const map = new Map<string, AIModel>();
  models.forEach((model) => map.set(model.id, model));
  return Array.from(map.values());
}

export function sortModelsByPrice(models: AIModel[]): AIModel[] {
  return [...models].sort((a, b) => {
    const aScore = modelPriceScore(a);
    const bScore = modelPriceScore(b);

    if (aScore !== bScore) return aScore - bScore;
    if (a.inputPricePerMillion !== b.inputPricePerMillion) {
      return (a.inputPricePerMillion ?? Number.POSITIVE_INFINITY) - (b.inputPricePerMillion ?? Number.POSITIVE_INFINITY);
    }
    if (a.outputPricePerMillion !== b.outputPricePerMillion) {
      return (a.outputPricePerMillion ?? Number.POSITIVE_INFINITY) - (b.outputPricePerMillion ?? Number.POSITIVE_INFINITY);
    }
    return a.name.localeCompare(b.name);
  });
}

export function formatModelPrice(model: AIModel): string {
  if (model.isFree) return 'Free';
  if (model.inputPricePerMillion == null && model.outputPricePerMillion == null) return 'Price unavailable';
  const input = model.inputPricePerMillion != null ? `$${model.inputPricePerMillion.toFixed(2)}` : '?';
  const output = model.outputPricePerMillion != null ? `$${model.outputPricePerMillion.toFixed(2)}` : '?';
  return `${input}/${output} per 1M tokens`;
}

function parseOpenRouterModels(data: unknown): AIModel[] {
  const entries = Array.isArray((data as { data?: unknown[] })?.data)
    ? ((data as { data: unknown[] }).data as OpenRouterModelEntry[])
    : [];

  return entries
    .map((entry): AIModel | null => {
      if (!entry?.id) return null;
      const input = toPricePerMillionFromPerToken(entry.pricing?.prompt ?? entry.pricing?.input);
      const output = toPricePerMillionFromPerToken(entry.pricing?.completion ?? entry.pricing?.output);
      const isFree = (input ?? 0) === 0 && (output ?? 0) === 0;

      return {
        id: entry.id,
        name: entry.name || entry.id,
        provider: 'openrouter',
        isFree,
        inputPricePerMillion: input,
        outputPricePerMillion: output,
      };
    })
    .filter((model): model is AIModel => model != null);
}

function parseOpenAICompatibleModels(data: unknown, provider: AIProvider): AIModel[] {
  const entries = Array.isArray((data as { data?: unknown[] })?.data)
    ? ((data as { data: Array<Record<string, unknown>> }).data)
    : [];

  return entries
    .map((entry): AIModel | null => {
      const id = typeof entry.id === 'string' ? entry.id : undefined;
      if (!id) return null;

      const pricing = (entry.pricing as Record<string, unknown> | undefined) ?? {};
      const input = toNumber(entry.input_price_per_million ?? entry.input_price_per_1m_tokens ?? pricing.input ?? pricing.prompt);
      const output = toNumber(entry.output_price_per_million ?? entry.output_price_per_1m_tokens ?? pricing.output ?? pricing.completion);
      const isFree = (input ?? 0) === 0 && (output ?? 0) === 0 && (input != null || output != null);

      return {
        id,
        name: (typeof entry.name === 'string' && entry.name.trim()) ? entry.name : id,
        provider,
        isFree,
        inputPricePerMillion: input,
        outputPricePerMillion: output,
      };
    })
    .filter((model): model is AIModel => model != null);
}

function parseOllamaModels(data: unknown): AIModel[] {
  const entries = Array.isArray((data as { models?: unknown[] })?.models)
    ? ((data as { models: Array<Record<string, unknown>> }).models)
    : [];

  return entries
    .map((entry): AIModel | null => {
      const id = typeof entry.name === 'string'
        ? entry.name
        : (typeof entry.model === 'string' ? entry.model : undefined);

      if (!id) return null;

      return {
        id,
        name: id,
        provider: 'ollama',
        isFree: false,
      };
    })
    .filter((model): model is AIModel => model != null);
}

export async function fetchModelsForProvider(
  provider: AIProvider,
  options: ModelDiscoveryOptions = {},
): Promise<AIModel[]> {
  switch (provider) {
    case 'openrouter': {
      const headers: HeadersInit = {};
      if (options.apiKey) headers.Authorization = `Bearer ${options.apiKey}`;
      const response = await fetch('https://openrouter.ai/api/v1/models', { headers });
      if (!response.ok) throw new Error(`OpenRouter model list failed (HTTP ${response.status})`);
      const parsed = parseOpenRouterModels(await parseJsonResponse(response, 'OpenRouter model list'));
      return sortModelsByPrice(dedupeModels(parsed));
    }
    case 'openai-compatible': {
      const base = normalizeOpenAICompatibleBase(options.baseUrl);
      const headers: HeadersInit = {};
      if (options.apiKey) headers.Authorization = `Bearer ${options.apiKey}`;
      const response = await fetch(`${base}/models`, { headers });
      if (!response.ok) throw new Error(`OpenAI-compatible model list failed (HTTP ${response.status})`);
      const parsed = parseOpenAICompatibleModels(await parseJsonResponse(response, 'OpenAI-compatible model list'), 'openai-compatible');
      return sortModelsByPrice(dedupeModels(parsed));
    }
    case 'ollama': {
      const candidates = resolveOllamaModelCatalogCandidates();
      const failures: string[] = [];

      for (const candidate of candidates) {
        try {
          const response = await fetch(candidate, {
            headers: {
              Accept: 'application/json',
            },
          });
          if (!response.ok) {
            failures.push(`${candidate} -> HTTP ${response.status}`);
            continue;
          }

          const parsed = parseOllamaModels(await parseJsonResponse(response, `Ollama model list (${candidate})`));
          if (parsed.length > 0) {
            return sortModelsByPrice(dedupeModels(parsed));
          }
          failures.push(`${candidate} -> empty model list`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${candidate} -> ${message}`);
        }
      }

      throw new Error(`Ollama model list failed across all endpoints. ${failures.join(' | ')}`);
    }
    default:
      return [];
  }
}

export function getProviderBaseUrl(provider: AIProvider, baseUrl?: string): string | undefined {
  switch (provider) {
    case 'openai-compatible':
      return normalizeOpenAICompatibleBase(baseUrl);
    case 'ollama':
      return normalizeOllamaBase(baseUrl);
    default:
      return undefined;
  }
}

export function getOllamaApiBase(baseUrl?: string): string {
  return resolveOllamaBaseForBrowser(baseUrl);
}
