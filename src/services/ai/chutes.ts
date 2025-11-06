import type { AIModel } from '../../types/theme';
import type { WebsiteColorAnalysis, ColorMapping } from '../../types/catppuccin';
import type { CrawlerResult } from '../../types/theme';

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
    id: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
    name: 'DeepSeek R1 Qwen3 8B ($0.02/$0.35)',
    provider: 'chutes',
    isFree: false,
  },
];

export async function analyzeColorsWithChutes(
  crawlerResult: CrawlerResult,
  apiKey: string,
  model: string
): Promise<{ analysis: WebsiteColorAnalysis; mappings: ColorMapping[] }> {
  const prompt = createColorAnalysisPrompt(crawlerResult);

  try {
    // Stage 1: AI analyzes colors (may return messy output)
    console.log('Stage 1: Analyzing colors with AI...');
    const response = await fetch('https://llm.chutes.ai/v1/chat/completions', {
      method: 'POST',
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
        stream: false,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Chutes API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.response;

    if (!content) {
      throw new Error('No response from Chutes');
    }

    // Try to parse directly first
    try {
      console.log('Attempting direct JSON parsing...');
      return parseColorAnalysisResponse(content);
    } catch (parseError) {
      // Stage 2: If direct parsing fails, use AI to extract JSON
      console.log('Direct parsing failed, using AI to extract JSON...');
      console.log('Parse error:', parseError);
      return await extractJSONWithAI(content, apiKey, model);
    }
  } catch (error) {
    throw new Error(`Failed to analyze colors with Chutes: ${error}`);
  }
}

// Stage 2: Use AI to extract clean JSON from messy response
async function extractJSONWithAI(
  messyResponse: string,
  apiKey: string,
  model: string
): Promise<{ analysis: WebsiteColorAnalysis; mappings: ColorMapping[] }> {
  const extractionPrompt = `You are a JSON extraction system. Extract ONLY the JSON object from the text below.

The text may contain thinking tags like <think>, conversational text, explanations, or other artifacts.
Your task is to find and output ONLY the JSON object.

The JSON should have this structure:
{
  "analysis": {
    "primaryColors": [...],
    "secondaryColors": [...],
    "backgroundColor": "...",
    "textColor": "...",
    "accentColors": [...]
  },
  "mappings": [
    {"originalColor": "...", "catppuccinColor": "...", "reason": "..."},
    ...
  ]
}

TEXT TO EXTRACT FROM:
${messyResponse}

OUTPUT ONLY THE CLEAN JSON OBJECT. No explanations, no markdown, no code blocks. Just the JSON.`;

  try {
    const response = await fetch('https://llm.chutes.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a JSON extraction expert. Extract only valid JSON from text.',
          },
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        stream: false,
        temperature: 0.1, // Low temperature for precise extraction
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`JSON extraction API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.response;

    if (!content) {
      throw new Error('No response from JSON extraction');
    }

    console.log('Stage 2 response received, parsing...');
    return parseColorAnalysisResponse(content);
  } catch (error) {
    throw new Error(`Failed to extract JSON with AI: ${error}`);
  }
}

function createColorAnalysisPrompt(crawlerResult: CrawlerResult): string {
  const colorsInfo = crawlerResult.colors && crawlerResult.colors.length > 0
    ? `\nDetected colors from CSS/HTML:\n${crawlerResult.colors.slice(0, 30).join(', ')}`
    : '';

  return `You are a color extraction and mapping system. Your ONLY task is to output valid JSON. Do not include any explanatory text, greetings, or apologies.

WEBSITE DATA:
URL: ${crawlerResult.url}
Title: ${crawlerResult.title}
${colorsInfo}

HTML snippet (first 2000 chars):
${crawlerResult.content.slice(0, 2000)}

TASK:
1. Identify the website's primary colors (2-3 main brand colors)
2. Identify secondary colors (1-2 supporting colors)
3. Identify background color (usually lightest or darkest)
4. Identify text color (main text)
5. Identify accent colors (highlights, links, buttons - 2-5 colors)

6. Map EACH identified color to the closest Catppuccin color:

CATPPUCCIN PALETTE (choose from these):
Base: base, mantle, crust
Surfaces: surface0, surface1, surface2
Overlays: overlay0, overlay1, overlay2
Text: text, subtext0, subtext1
Accents: rosewater, flamingo, pink, mauve, red, maroon, peach, yellow, green, teal, sky, sapphire, blue, lavender

OUTPUT FORMAT (JSON ONLY - NO OTHER TEXT):
{
  "analysis": {
    "primaryColors": ["#HEX1", "#HEX2"],
    "secondaryColors": ["#HEX3"],
    "backgroundColor": "#HEX4",
    "textColor": "#HEX5",
    "accentColors": ["#HEX6", "#HEX7"]
  },
  "mappings": [
    {"originalColor": "#HEX1", "catppuccinColor": "mauve", "reason": "Main brand color"},
    {"originalColor": "#HEX2", "catppuccinColor": "blue", "reason": "Secondary brand"},
    {"originalColor": "#HEX3", "catppuccinColor": "surface0", "reason": "UI element"},
    {"originalColor": "#HEX4", "catppuccinColor": "base", "reason": "Background"},
    {"originalColor": "#HEX5", "catppuccinColor": "text", "reason": "Main text"},
    {"originalColor": "#HEX6", "catppuccinColor": "peach", "reason": "CTA button"},
    {"originalColor": "#HEX7", "catppuccinColor": "green", "reason": "Success state"}
  ]
}

CRITICAL: Output ONLY the JSON object above. No markdown, no code blocks, no explanations. Start with { and end with }.`;
}

function parseColorAnalysisResponse(content: string): { analysis: WebsiteColorAnalysis; mappings: ColorMapping[] } {
  try {
    let jsonStr = content.trim();

    // Remove thinking tags like <think>...</think>, <reasoning>...</reasoning>, etc.
    jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/gi, '');
    jsonStr = jsonStr.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    jsonStr = jsonStr.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    jsonStr = jsonStr.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '');

    // Remove markdown code blocks if present
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    // Try to find JSON object if AI added extra text
    const jsonObjMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonObjMatch) {
      jsonStr = jsonObjMatch[0];
    }

    // Remove any leading/trailing non-JSON text
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.analysis || !parsed.mappings) {
      throw new Error('Invalid JSON structure: missing analysis or mappings');
    }

    return {
      analysis: parsed.analysis,
      mappings: parsed.mappings,
    };
  } catch (error) {
    // Show only first 500 chars of response in error
    const preview = content.slice(0, 500);
    throw new Error(`Failed to parse AI response: ${error}\n\nResponse preview: ${preview}...`);
  }
}
