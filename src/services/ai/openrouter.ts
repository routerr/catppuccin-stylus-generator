import type { AIModel } from '../../types/theme';
import type { WebsiteColorAnalysis, ColorMapping } from '../../types/catppuccin';
import type { CrawlerResult } from '../../types/theme';

// OpenRouter models
// NOTE: Free models change frequently. Check https://openrouter.ai/models for current free models.
// Models with ":free" suffix are free to use (rate-limited)
export const OPENROUTER_MODELS: AIModel[] = [
  // Free models (updated 2025-01-06)
  {
    id: 'minimax/minimax-m2:free',
    name: 'MiniMax M2 (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-chat-v3.1:free',
    name: 'DeepSeek Chat v3.1 (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-r1-distill-llama-70b:free',
    name: 'DeepSeek R1 Distill Llama 70B (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM 4.5 Air (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'tngtech/deepseek-r1t2-chimera:free',
    name: 'DeepSeek R1T2 Chimera (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'microsoft/mai-ds-r1:free',
    name: 'Microsoft MAI DS R1 (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'Nvidia Nemotron Nano 12B v2 VL (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  // Paid models (popular options)
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (Paid)',
    provider: 'openrouter',
    isFree: false,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Paid)',
    provider: 'openrouter',
    isFree: false,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5 (Paid)',
    provider: 'openrouter',
    isFree: false,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct (Paid)',
    provider: 'openrouter',
    isFree: false,
  },
];

export async function analyzeColorsWithOpenRouter(
  crawlerResult: CrawlerResult,
  apiKey: string,
  model: string
): Promise<{ analysis: WebsiteColorAnalysis; mappings: ColorMapping[] }> {
  const prompt = createColorAnalysisPrompt(crawlerResult);

  try {
    // Stage 1: AI analyzes colors (may return messy output)
    console.log('Stage 1: Analyzing colors with AI...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Catppuccin Theme Generator',
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
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenRouter');
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
    throw new Error(`Failed to analyze colors with OpenRouter: ${error}`);
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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Catppuccin Theme Generator',
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
        temperature: 0.1, // Low temperature for precise extraction
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

    console.log('Stage 2 response received, parsing...');
    return parseColorAnalysisResponse(content);
  } catch (error) {
    throw new Error(`Failed to extract JSON with AI: ${error}`);
  }
}

function createColorAnalysisPrompt(crawlerResult: CrawlerResult): string {
  const colorsInfo = crawlerResult.colors && crawlerResult.colors.length > 0
    ? `\nDetected colors:\n${crawlerResult.colors.slice(0, 30).join(', ')}`
    : '';

  return `Color extraction system. Output ONLY valid JSON.

Website: ${crawlerResult.url} | ${crawlerResult.title}
${colorsInfo}

Content: ${crawlerResult.content.slice(0, 2000)}

TASK:
1. Identify primary colors (2-3 brand colors)
2. Secondary colors (1-2 supporting)
3. Background (lightest/darkest)
4. Text color (main text)
5. Accent colors (buttons, links, highlights)

MAP TO CATPPUCCIN:
Base: base, mantle, crust
Surfaces: surface0, surface1, surface2
Overlays: overlay0, overlay1, overlay2
Text: text, subtext0, subtext1
Accents: rosewater, flamingo, pink, mauve, red, maroon, peach, yellow, green, teal, sky, sapphire, blue, lavender

GRADIENTS:
Create beautiful gradients for buttons/titles using accent Catppuccin colors:
- Primary button: linear-gradient(135deg, {accent1} 0%, {accent2} 100%)
- Secondary button: linear-gradient(45deg, {accent3}, {accent4})
- Title gradient: linear-gradient(90deg, {accent5}, {accent6})

JSON ONLY:
{
  "analysis": {
    "primaryColors": ["#HEX1", "#HEX2"],
    "secondaryColors": ["#HEX3"],
    "backgroundColor": "#HEX4",
    "textColor": "#HEX5",
    "accentColors": ["#HEX6", "#HEX7"]
  },
  "mappings": [
    {"originalColor": "#HEX1", "catppuccinColor": "mauve", "reason": "Main brand"},
    {"originalColor": "#HEX2", "catppuccinColor": "blue", "reason": "Secondary brand"},
    {"originalColor": "#HEX3", "catppuccinColor": "surface0", "reason": "UI element"},
    {"originalColor": "#HEX4", "catppuccinColor": "base", "reason": "Background"},
    {"originalColor": "#HEX5", "catppuccinColor": "text", "reason": "Main text"},
    {"originalColor": "#HEX6", "catppuccinColor": "peach", "reason": "Primary button"},
    {"originalColor": "#HEX7", "catppuccinColor": "green", "reason": "Success state"}
  ]
}

OUTPUT JSON ONLY.`;
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
