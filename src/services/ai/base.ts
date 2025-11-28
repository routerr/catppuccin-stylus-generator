/**
 * Shared AI service base functions for JSON extraction and response parsing
 */

import type { WebsiteColorAnalysis, ColorMapping } from '../../types/catppuccin';
import type { AIAnalysisResponse, JSONExtractionOptions } from './types';
import { createJSONExtractionPrompt } from './prompts';

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 2,
  backoffMs = 600
): Promise<Response> {
  let attempt = 0;
  let lastError: any;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, init);
      if (res.status === 429 || res.status === 503) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      lastError = e;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
    }
    attempt += 1;
  }
  throw lastError || new Error('Request failed');
}

/**
 * Parse and validate color analysis response
 */
export function parseColorAnalysisResponse(
  responseText: string
): AIAnalysisResponse {
  console.log('Parsing color analysis response...');
  console.log('Response length:', responseText.length);
  console.log('Response preview:', responseText.slice(0, 200));

  let jsonStr = responseText.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```')) {
    console.log('Detected markdown code block, extracting...');
    // Use a more efficient approach: find first ``` and last ```
    const firstBacktick = jsonStr.indexOf('```');
    const afterFirstBlock = jsonStr.indexOf('\n', firstBacktick);
    const lastBacktick = jsonStr.lastIndexOf('```');

    if (afterFirstBlock !== -1 && lastBacktick > afterFirstBlock) {
      jsonStr = jsonStr.substring(afterFirstBlock + 1, lastBacktick).trim();
      console.log('Extracted JSON from code block using indexOf');
    } else {
      console.warn('Could not extract from code block, trying regex...');
      // Fallback to regex with length limit
      if (jsonStr.length < 50000) {
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1].trim();
          console.log('Extracted JSON from code block using regex');
        }
      } else {
        console.error('Response too large for regex extraction, skipping');
      }
    }
  }

  console.log('Attempting JSON.parse...');
  try {
    const parsed = JSON.parse(jsonStr);
    console.log('JSON.parse successful');

    if (!parsed.analysis || !parsed.mappings) {
      throw new Error('Response missing required fields: analysis or mappings');
    }

    if (!Array.isArray(parsed.mappings) || parsed.mappings.length === 0) {
      throw new Error('Mappings must be a non-empty array');
    }

    console.log('Validation passed, returning result');
    return {
      analysis: parsed.analysis,
      mappings: parsed.mappings,
    };
  } catch (error) {
    console.error('Failed to parse response as JSON:', error);
    console.error('Problematic JSON string (first 500 chars):', jsonStr.slice(0, 500));
    throw new Error(`Invalid JSON response: ${error}`);
  }
}

/**
 * Extract JSON manually from text with thinking tags or other noise
 * Uses brace counting algorithm to find complete JSON object
 */
export function extractJSONManually(text: string): AIAnalysisResponse {
  console.log('Attempting manual JSON extraction...');
  console.log('Input text length:', text.length);
  console.log('Input preview:', text.slice(0, 300));

  let cleanText = text;

  // Step 1: Remove ALL types of thinking tags aggressively (including content inside)
  const thinkingPatterns = [
    /<think>[\s\S]*?<\/think>/gi,
    /<thinking>[\s\S]*?<\/thinking>/gi,
    /<thought>[\s\S]*?<\/thought>/gi,
    /<reasoning>[\s\S]*?<\/reasoning>/gi,
    /<reflection>[\s\S]*?<\/reflection>/gi,
  ];

  thinkingPatterns.forEach(pattern => {
    const before = cleanText.length;
    cleanText = cleanText.replace(pattern, '');
    if (before !== cleanText.length) {
      console.log(`Removed ${before - cleanText.length} chars with pattern ${pattern}`);
    }
  });

  // Step 2: Remove unclosed thinking tags at the start (everything before closing tag)
  const unclosedMatch = cleanText.match(/^[\s\S]*?<\/(think|thinking|thought|reasoning|reflection)>/i);
  if (unclosedMatch) {
    console.log('Found unclosed thinking tag at start, removing:', unclosedMatch[0].slice(0, 100));
    cleanText = cleanText.replace(/^[\s\S]*?<\/(think|thinking|thought|reasoning|reflection)>/i, '');
  }

  console.log('After tag removal, text length:', cleanText.length);
  console.log('Clean text preview:', cleanText.slice(0, 300));

  // Step 3: Find the JSON object by brace counting (most reliable method)
  const firstBrace = cleanText.indexOf('{');
  if (firstBrace === -1) {
    throw new Error('No JSON object found in text');
  }

  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  let jsonEnd = -1;

  for (let i = firstBrace; i < cleanText.length; i++) {
    const char = cleanText[i];

    // Handle string escaping
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    // Track if we're inside a string
    if (char === '"') {
      inString = !inString;
      continue;
    }

    // Only count braces outside of strings
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i;
          break;
        }
      }
    }
  }

  if (jsonEnd === -1) {
    throw new Error('No complete JSON object found (unmatched braces)');
  }

  const jsonStr = cleanText.substring(firstBrace, jsonEnd + 1);

  console.log('Extracted JSON string, length:', jsonStr.length);
  console.log('JSON preview:', jsonStr.slice(0, 150) + '...');

  // Parse and validate
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (jsonError) {
    console.error('JSON parse error:', jsonError);
    console.error('Failed JSON string:', jsonStr.slice(0, 500));
    throw new Error(`Failed to parse JSON: ${jsonError}`);
  }

  // Check if the parsed object has the expected structure
  if (!parsed.analysis || !parsed.mappings) {
    console.error('Parsed object structure:', Object.keys(parsed));
    console.error('Full parsed object:', JSON.stringify(parsed, null, 2).slice(0, 1000));

    // Try to find if the structure is nested or wrapped in another object
    if (typeof parsed === 'object') {
      for (const key of Object.keys(parsed)) {
        const value = parsed[key];
        if (value && typeof value === 'object' && value.analysis && value.mappings) {
          console.log(`Found valid structure nested under key '${key}'`);
          return {
            analysis: value.analysis,
            mappings: value.mappings,
          };
        }
      }
    }

    throw new Error(`Invalid JSON structure: missing ${!parsed.analysis ? 'analysis' : 'mappings'}. Keys found: ${Object.keys(parsed).join(', ')}`);
  }

  if (!Array.isArray(parsed.analysis.primaryColors)) {
    console.error('Invalid primaryColors:', parsed.analysis.primaryColors);
    throw new Error('Invalid analysis: primaryColors must be an array');
  }

  if (!Array.isArray(parsed.mappings) || parsed.mappings.length === 0) {
    console.error('Invalid mappings:', parsed.mappings);
    throw new Error('Invalid mappings: must be a non-empty array');
  }

  console.log('Manual extraction successful!');
  console.log(`Found ${parsed.analysis.primaryColors.length} primary colors and ${parsed.mappings.length} mappings`);
  return {
    analysis: parsed.analysis,
    mappings: parsed.mappings,
  };
}

/**
 * Use AI to extract clean JSON from malformed response
 * Two-stage fallback: manual extraction first, then AI extraction
 */
export async function extractJSONWithAI(
  options: JSONExtractionOptions
): Promise<AIAnalysisResponse> {
  console.log('Stage 2: Attempting AI-powered JSON extraction...');

  // First, try to extract JSON manually without AI (most reliable)
  try {
    console.log('Attempting manual extraction first...');
    const manuallyExtracted = extractJSONManually(options.rawResponse);
    console.log('Manual extraction successful!');
    return manuallyExtracted;
  } catch (manualError) {
    console.log('Manual extraction failed, trying AI extraction...', manualError);
  }

  // Use a simpler, non-reasoning model for extraction to avoid thinking tags
  // If the original model is a reasoning model, switch to a simpler one
  let extractionModel = options.model;
  if (options.model.includes('deepseek-r1') || options.model.includes('DeepResearch') || options.model.includes('r1') || options.model.includes('mai-ds')) {
    // Switch to a simpler model that doesn't use reasoning
    // This is provider-specific, so we'll use a generic fallback
    extractionModel = options.model.includes('chutes') ? 'unsloth/gemma-3-4b-it' : 'minimax/minimax-m2:free';
    console.log(`Switching from reasoning model ${options.model} to simpler model ${extractionModel} for JSON extraction`);
  }

  // If manual extraction fails, try AI extraction with very explicit instructions
  const extractionPrompt = `CRITICAL: You MUST output ONLY the JSON object. NO thinking tags, NO explanations, NO markdown.

Find the JSON object in the text below and output it EXACTLY as-is.

TEXT:
${options.rawResponse.slice(0, 3000)}

OUTPUT FORMAT: Just the JSON object starting with { and ending with }`;

  try {
    const response = await fetch(options.apiEndpoint, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Catppuccin Theme Generator',
      },
      body: JSON.stringify({
        model: extractionModel,
        messages: [
          {
            role: 'system',
            content: 'Output only JSON. No thinking. No markdown. Just JSON.',
          },
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        temperature: 0.0, // Zero temperature for deterministic extraction
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`JSON extraction API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from JSON extraction');
    }

    console.log('Stage 2 AI response received, attempting to parse...');

    // Try manual extraction on the AI's response (in case AI also added thinking tags)
    try {
      return extractJSONManually(content);
    } catch (e) {
      // Fall back to regular parsing
      return parseColorAnalysisResponse(content);
    }
  } catch (error) {
    throw new Error(`Failed to extract JSON with AI: ${error}`);
  }
}

/**
 * Detect website mode (dark/light) using AI
 */
export async function detectWebsiteMode(
  apiEndpoint: string,
  apiKey: string,
  model: string,
  modePrompt: string,
  includeRefererHeaders: boolean = true
): Promise<'dark' | 'light'> {
  const RETRIES = 2;
  try {
    // Base headers that all providers support
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    // OpenRouter-specific headers (causes CORS issues with Chutes)
    if (includeRefererHeaders) {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'Catppuccin Theme Generator';
    }

    let attempt = 0;
    let response: Response | null = null;
    let lastError: any = null;

    while (attempt <= RETRIES) {
      try {
        response = await fetch(apiEndpoint, {
          method: 'POST',
          mode: 'cors',
          headers,
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: modePrompt,
              },
            ],
            temperature: 0.0,
            max_tokens: 10,
          }),
        });
        if (response.status === 429 || response.status === 503) {
          throw new Error(`HTTP ${response.status}`);
        }
        break;
      } catch (err) {
        lastError = err;
        if (attempt === RETRIES) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
      attempt += 1;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Mode detection API error: ${response.statusText}`, errorData);
      return 'light'; // Default fallback
    }

    const data = await response.json();
    const modeText = data.choices?.[0]?.message?.content?.trim().toLowerCase();

    return modeText === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.error('Failed to detect mode, defaulting to light:', error);
    return 'light';
  }
}
