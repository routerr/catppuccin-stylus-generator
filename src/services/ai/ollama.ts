import type { AIModel } from '../../types/theme';
import type { WebsiteColorAnalysis, ColorMapping } from '../../types/catppuccin';
import type { CrawlerResult } from '../../types/theme';

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
];

// Base URL for Ollama. We try a relative proxy first (dev), then fallback to localhost.
const OLLAMA_BASES = ['/ollama', 'http://localhost:11434'];

async function postOllama(path: string, body: any) {
  let lastErr: any = null;
  for (const base of OLLAMA_BASES) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  model: string
): Promise<{ analysis: WebsiteColorAnalysis; mappings: ColorMapping[]; mode: 'dark' | 'light' }> {
  // Step 1: Detect dark/light mode using AI
  const modePrompt = `You are a web design expert. Analyze the following website content and CSS and answer with ONLY "dark" or "light" (no explanation, no markdown, just the word). Is this site primarily dark mode or light mode?\n\nWebsite: ${crawlerResult.url} | ${crawlerResult.title}\nContent: ${crawlerResult.content.slice(0, 2000)}\nCSS: ${crawlerResult.cssAnalysis ? JSON.stringify(crawlerResult.cssAnalysis).slice(0, 2000) : ''}`;

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
  const prompt = createColorAnalysisPrompt({ ...crawlerResult, detectedMode });

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
      return { ...result, mode: detectedMode };
    } catch (parseError) {
      // Stage 2: If direct parsing fails, use AI to extract JSON
      console.log('Direct parsing failed, using AI to extract JSON...');
      console.log('Parse error:', parseError);
      const result = await extractJSONWithOllama(content, model);
      return { ...result, mode: detectedMode };
    }
  } catch (error) {
    throw new Error(`Failed to analyze colors with Ollama: ${error}`);
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

// Manual JSON extraction function (no AI, pure logic)
function extractJSONManually(text: string): { analysis: WebsiteColorAnalysis; mappings: ColorMapping[] } {
  let cleanText = text;
  const thinkingPatterns = [
    /<think>[\s\S]*?<\/think>/gi,
    /<thinking>[\s\S]*?<\/thinking>/gi,
    /<thought>[\s\S]*?<\/thought>/gi,
    /<reasoning>[\s\S]*?<\/reasoning>/gi,
    /<reflection>[\s\S]*?<\/reflection>/gi,
  ];
  thinkingPatterns.forEach(pattern => {
    cleanText = cleanText.replace(pattern, '');
  });

  const unclosedMatch = cleanText.match(/^[\s\S]*?<\/(think|thinking|thought|reasoning|reflection)>/i);
  if (unclosedMatch) {
    cleanText = cleanText.replace(/^[\s\S]*?<\/(think|thinking|thought|reasoning|reflection)>/i, '');
  }

  const firstBrace = cleanText.indexOf('{');
  if (firstBrace === -1) throw new Error('No JSON object found in text');

  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  let jsonEnd = -1;
  for (let i = firstBrace; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (char === '\\') { escapeNext = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') { braceCount--; if (braceCount === 0) { jsonEnd = i; break; } }
    }
  }
  if (jsonEnd === -1) throw new Error('No complete JSON object found (unmatched braces)');
  const jsonStr = cleanText.substring(firstBrace, jsonEnd + 1);
  const parsed = JSON.parse(jsonStr);
  if (!parsed.analysis || !parsed.mappings) {
    if (typeof parsed === 'object') {
      for (const key of Object.keys(parsed)) {
        const value = (parsed as any)[key];
        if (value && typeof value === 'object' && value.analysis && value.mappings) {
          return { analysis: value.analysis, mappings: value.mappings };
        }
      }
    }
    throw new Error('Invalid JSON structure: missing analysis or mappings');
  }
  return { analysis: parsed.analysis, mappings: parsed.mappings };
}

function createColorAnalysisPrompt(crawler: CrawlerResult & { detectedMode?: 'dark' | 'light' }) {
  const modeText = crawler.detectedMode ? `The site appears to be ${crawler.detectedMode} mode.` : '';
  return `You are a color analysis expert specializing in mapping website colors to the Catppuccin palette.\n\n${modeText}\n\nAnalyze the website content and colors, then output a JSON object with:\n- analysis.primaryColors: an array of prominent hex colors (strings)\n- analysis.accentColors: an array of 2-4 accent hex colors\n- analysis.neutralColors: an array of background/neutral hex colors\n- mappings: an array of objects mapping UI roles to Catppuccin roles/colors with reasons\n\nWebsite: ${crawler.url} | ${crawler.title}\nColors: ${(crawler.colors || []).slice(0, 30).join(', ')}\nContent snippet: ${crawler.content.slice(0, 1500)}\n\nCRITICAL: Output ONLY the JSON object. No markdown, no commentary. If you are a reasoning model, put your thinking before the JSON and then output ONLY the JSON object.`;
}

function parseColorAnalysisResponse(content: string): { analysis: WebsiteColorAnalysis; mappings: ColorMapping[] } {
  let jsonStr = content.trim();
  jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/gi, '');
  jsonStr = jsonStr.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  jsonStr = jsonStr.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  jsonStr = jsonStr.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  jsonStr = jsonStr.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '');
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  const firstBrace = jsonStr.indexOf('{');
  if (firstBrace === -1) throw new Error('No JSON object found - response contains no opening brace');
  let braceCount = 0; let jsonEnd = -1;
  for (let i = firstBrace; i < jsonStr.length; i++) {
    if (jsonStr[i] === '{') braceCount++;
    if (jsonStr[i] === '}') { braceCount--; if (braceCount === 0) { jsonEnd = i; break; } }
  }
  if (jsonEnd === -1) throw new Error('No complete JSON object found - unmatched braces');
  jsonStr = jsonStr.substring(firstBrace, jsonEnd + 1);
  const parsed = JSON.parse(jsonStr);
  if (!parsed.analysis || !parsed.mappings) throw new Error('Invalid JSON structure');
  if (!Array.isArray(parsed.mappings) || parsed.mappings.length === 0) throw new Error('Invalid mappings');
  return { analysis: parsed.analysis, mappings: parsed.mappings };
}

