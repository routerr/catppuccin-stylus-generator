import type { AIModel } from '../../types/theme';
import type { WebsiteColorAnalysis, ColorMapping } from '../../types/catppuccin';
import type { CrawlerResult } from '../../types/theme';
import { generateAccentSystemGuide } from '../../utils/accent-schemes';

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
    id: 'openrouter/polaris-alpha:free',
    name: 'Polaris Alpha (Free)',
    provider: 'openrouter',
    isFree: true,
  },
  {
    id: 'mistralai/mistral-small-3.2-24b-instruct:free',
    name: 'Mistral Small 3.2 24B Instruct (Free)',
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
): Promise<{ analysis: WebsiteColorAnalysis; mappings: ColorMapping[]; mode: 'dark' | 'light' }> {
  // Step 1: Detect dark/light mode using AI
  const modePrompt = `You are a web design expert. Analyze the following website content and CSS and answer with ONLY "dark" or "light" (no explanation, no markdown, just the word). Is this site primarily dark mode or light mode?

Website: ${crawlerResult.url} | ${crawlerResult.title}
Content: ${crawlerResult.content.slice(0, 2000)}
CSS: ${crawlerResult.cssAnalysis ? JSON.stringify(crawlerResult.cssAnalysis).slice(0, 2000) : ''}`;

  let detectedMode: 'dark' | 'light' = 'light';
  try {
    const modeResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
          { role: 'system', content: 'You are a web design expert. Only answer "dark" or "light".' },
          { role: 'user', content: modePrompt },
        ],
        temperature: 0.0,
        max_tokens: 10,
      }),
    });
    if (modeResponse.ok) {
      const modeData = await modeResponse.json();
      const modeText = modeData.choices?.[0]?.message?.content?.trim().toLowerCase();
      if (modeText === 'dark' || modeText === 'light') {
        detectedMode = modeText;
      }
    }
  } catch (e) {
    console.warn('Mode detection failed, defaulting to light mode.', e);
  }

  // Step 2: Color analysis, pass detected mode to prompt
  const prompt = createColorAnalysisPrompt({ ...crawlerResult, detectedMode });

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
      const result = parseColorAnalysisResponse(content);
      return { ...result, mode: detectedMode };
    } catch (parseError) {
      // Stage 2: If direct parsing fails, use AI to extract JSON
      console.log('Direct parsing failed, using AI to extract JSON...');
      console.log('Parse error:', parseError);
      const result = await extractJSONWithAI(content, apiKey, model);
      return { ...result, mode: detectedMode };
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
  console.log('Stage 2: Attempting AI-powered JSON extraction...');

  // First, try to extract JSON manually without AI (most reliable)
  try {
    console.log('Attempting manual extraction first...');
    const manuallyExtracted = extractJSONManually(messyResponse);
    console.log('Manual extraction successful!');
    return manuallyExtracted;
  } catch (manualError) {
    console.log('Manual extraction failed, trying AI extraction...', manualError);
  }

  // Use a simpler, non-reasoning model for extraction to avoid thinking tags
  // If the original model is a reasoning model, switch to a simpler one
  let extractionModel = model;
  if (model.includes('deepseek-r1') || model.includes('DeepResearch') || model.includes('r1') || model.includes('mai-ds')) {
    // Switch to a simpler model that doesn't use reasoning
    extractionModel = 'minimax/minimax-m2:free';
    console.log(`Switching from reasoning model ${model} to simpler model ${extractionModel} for JSON extraction`);
  }

  // If manual extraction fails, try AI extraction with very explicit instructions
  const extractionPrompt = `CRITICAL: You MUST output ONLY the JSON object. NO thinking tags, NO explanations, NO markdown.

Find the JSON object in the text below and output it EXACTLY as-is.

TEXT:
${messyResponse.slice(0, 3000)}

OUTPUT FORMAT: Just the JSON object starting with { and ending with }`;

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

// Manual JSON extraction function (no AI, pure logic)
function extractJSONManually(text: string): { analysis: WebsiteColorAnalysis; mappings: ColorMapping[] } {
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

function createColorAnalysisPrompt(crawlerResult: CrawlerResult & { cssAnalysis?: any; detectedMode?: 'dark' | 'light' }): string {
  const colorsInfo = crawlerResult.colors && crawlerResult.colors.length > 0
    ? `\nDetected colors:\n${crawlerResult.colors.slice(0, 30).join(', ')}`
    : '';

  // Enhanced CSS class information if available
  let cssClassInfo = '';
  if (crawlerResult.cssAnalysis && crawlerResult.cssAnalysis.grouped) {
    const grouped = crawlerResult.cssAnalysis.grouped;
    cssClassInfo = `\n\nCSS CLASS ANALYSIS (use this for precise class-specific mappings):
Button classes (${grouped.buttons.length}): ${grouped.buttons.slice(0, 10).map((c: any) => c.className).join(', ')}
Link classes (${grouped.links.length}): ${grouped.links.slice(0, 0).map((c: any) => c.className).join(', ')}
Background classes (${grouped.backgrounds.length}): ${grouped.backgrounds.slice(0, 10).map((c: any) => c.className).join(', ')}
Text classes (${grouped.text.length}): ${grouped.text.slice(0, 10).map((c: any) => c.className).join(', ')}
Border classes (${grouped.borders.length}): ${grouped.borders.slice(0, 10).map((c: any) => c.className).join(', ')}
 
IMPORTANT: Generate mappings that include these specific class names for more targeted styling.`;
  }

  // Determine flavor based on detected mode
  const flavor = (crawlerResult.detectedMode === 'dark') ? 'mocha' : 'latte';
  const accentGuide = generateAccentSystemGuide(flavor);

  return `You are a color analysis system. Your output MUST be ONLY valid JSON. No thinking, no explanations, no markdown - JUST JSON.

Website: ${crawlerResult.url} | ${crawlerResult.title}
${colorsInfo}
${cssClassInfo}

Content: ${crawlerResult.content.slice(0, 2000)}

MODE DETECTED: ${crawlerResult.detectedMode || 'light'}

CRITICAL: Analyze the website's color usage carefully and create DIVERSE, ELEGANT mappings!

TASK - Identify colors for DIFFERENT UI PURPOSES by examining the actual website:
1. Page backgrounds (main bg, secondary bg, sidebar bg)
2. Text colors (headings, body text, muted text, link text, code text)
3. Buttons & CTAs (primary action, secondary action, tertiary, danger/delete, success/confirm)
4. Cards/Panels (card background, card border, card hover state)
5. Interactive elements (link hover, button hover, active states, focus rings, selected items)
6. Borders & dividers (subtle separators, emphasis borders)
7. Status indicators (success, warning, error, info, neutral)
8. UI chrome (navbar, sidebar, footer, badges, tags)

MAP TO CATPPUCCIN - Create VISUAL HIERARCHY with variety:

BACKGROUNDS (use appropriate base colors):
- Main page background: base
- Secondary backgrounds: mantle, crust
- Cards/surfaces: surface0, surface1, surface2
- Overlays/modals: overlay0

BORDERS & LINES:
- Subtle dividers: overlay0
- Emphasized borders: overlay1, overlay2

TEXT (maintain readability):
- Primary text: text
- Secondary/muted text: subtext0, subtext1
- Disabled text: overlay2

CRITICAL LAYOUT PRESERVATION RULES:
1. DO NOT change any layout, positioning, sizing, or spacing from the original website
2. DO NOT add new borders if the original site doesn't have them
3. DO NOT modify border-radius, padding, margin, or dimensions
4. ONLY change COLORS - preserve ALL other CSS properties from the original
5. The theme should look identical to the original except for the color palette

IMPORTANT: For BUTTON BORDERS, DO NOT add accent color borders if the original site does not use accent borders. Only modify button borders if the original site uses accent colors for borders. Otherwise, preserve the original border style from the website.

${accentGuide}

ACCENT COLOR MAPPING STRATEGY:
Map different original colors to different Catppuccin accents based on their semantic meaning:

Primary/Brand Colors → blue or sapphire (main CTAs, primary buttons)
  - Use their bi-accents for gradients
  - Use their co-accents for OTHER elements (badges, secondary items)

Secondary Actions → mauve or lavender (secondary buttons, less important actions)
  - Use their bi-accents for gradients

Links & Navigation → sapphire or sky (clickable text, navigation items)
  - Use their bi-accents for hover gradients
  - Their co-accents can be used for active/visited states on OTHER elements

Success States → green or teal
Warning States → yellow or peach
Error States → red or maroon
Info States → blue or sky

VARIETY IS KEY: If the website has multiple shades of blue, map them to DIFFERENT Catppuccin colors:
- Bright blue button → blue (gradients with sapphire/lavender)
- Darker blue link → sapphire (gradients with blue/sky)
- Light blue banner → sky (gradients with sapphire/teal)
- Blue's co-accents (peach/pink) → use for badges or other distinct elements
This prevents everything from looking the same color!

TEXT CLARITY RULES:
CRITICAL: Text must always be fully opaque.
- All text colors must be fully opaque (opacity: 1.0, no rgba with alpha < 1)
- Do not use any alpha for text colors
- Text should always be readable with solid colors from the Catppuccin palette

HOVER STATE RULES FOR TEXT & LINKS (DIFFERENT FROM BUTTONS):
Text elements (links, text buttons, hoverable text):
- Hover background: Gradient at 45deg or 225deg angle (e.g., linear-gradient(45deg, blue, sapphire))
- Hover text: Solid color (text or base - always opaque)
- Ensure minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text according to WCAG guidelines to ensure readability.
- Example: a:hover { background: linear-gradient(45deg, blue, sapphire); color: text; }
- Different angles: 45deg, 225deg, or 315deg for visual variety

Button elements (solid buttons, CTAs):
- Hover background: Gradient at 135deg or 225deg angle (different angles from text!)
- Hover text: Solid color (text or base - always opaque)
- Ensure minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text according to WCAG guidelines to ensure readability.
- Example: .btn:hover { background: linear-gradient(135deg, blue, sapphire); }
- Different angles: 135deg or 225deg

CRITICAL RULES:
- Text is ALWAYS solid and opaque
- Gradients go on BACKGROUNDS only (not text)
- Links use 45deg/225deg/315deg gradients
- Buttons use 135deg/225deg gradients
- Different angles create visual distinction between text and buttons!

REQUIRED JSON OUTPUT (no thinking tags, no markdown, just this structure):
{
  "analysis": {
    "primaryColors": ["#HEX1", "#HEX2", "#HEX3"],
    "secondaryColors": ["#HEX4", "#HEX5"],
    "backgroundColor": "#HEX6",
    "textColor": "#HEX7",
    "accentColors": ["#HEX8", "#HEX9", "#HEX10", "#HEX11"]
  },
  "mappings": [
    {"originalColor": "#HEX1", "catppuccinColor": "blue", "reason": "Primary CTA buttons (e.g., 'Sign Up', 'Buy Now')"},
    {"originalColor": "#HEX2", "catppuccinColor": "sapphire", "reason": "Navigation links and secondary clickable items"},
    {"originalColor": "#HEX3", "catppuccinColor": "mauve", "reason": "Secondary buttons (e.g., 'Learn More', 'Cancel')"},
    {"originalColor": "#HEX4", "catppuccinColor": "lavender", "reason": "Page headings and section titles"},
    {"originalColor": "#HEX5", "catppuccinColor": "pink", "reason": "Accent badges and tags"},
    {"originalColor": "#HEX6", "catppuccinColor": "base", "reason": "Main page background"},
    {"originalColor": "#HEX7", "catppuccinColor": "text", "reason": "Primary body text"},
    {"originalColor": "#HEX8", "catppuccinColor": "green", "reason": "Success indicators and confirm buttons"},
    {"originalColor": "#HEX9", "catppuccinColor": "red", "reason": "Error messages and delete buttons"},
    {"originalColor": "#HEX10", "catppuccinColor": "surface0", "reason": "Card backgrounds"},
    {"originalColor": "#HEX11", "catppuccinColor": "overlay0", "reason": "Subtle borders and dividers"},
    {"originalColor": "#HEX12", "catppuccinColor": "sky", "reason": "Link hover states and info messages"},
    {"originalColor": "#HEX13", "catppuccinColor": "yellow", "reason": "Warning banners and caution indicators"},
    {"originalColor": "#HEX14", "catppuccinColor": "teal", "reason": "Active/selected state backgrounds"},
    {"originalColor": "#HEX15", "catppuccinColor": "peach", "reason": "Notification badges and highlights"}
  ]
}

If you are a reasoning model that uses thinking tags: Put your thinking BEFORE the JSON, then output ONLY the JSON object after your thinking is complete.`;
}

function parseColorAnalysisResponse(content: string): { analysis: WebsiteColorAnalysis; mappings: ColorMapping[] } {
  try {
    let jsonStr = content.trim();

    console.log('Parsing AI response, length:', jsonStr.length);

    // Step 1: Remove ALL thinking/reasoning tags (reasoning models like DeepSeek R1 use these)
    // These patterns handle both closed and potentially unclosed tags
    jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/gi, '');
    jsonStr = jsonStr.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    jsonStr = jsonStr.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    jsonStr = jsonStr.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
    jsonStr = jsonStr.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '');

    // Also try to remove unclosed thinking tags at the start (common with reasoning models)
    jsonStr = jsonStr.replace(/^[\s\S]*?<\/think>/i, '');
    jsonStr = jsonStr.replace(/^[\s\S]*?<\/thinking>/i, '');
    jsonStr = jsonStr.replace(/^[\s\S]*?<\/thought>/i, '');

    // Step 2: Remove markdown code blocks
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    // Step 3: Find the JSON object (most reliable approach)
    // Look for balanced braces starting with the first {
    const firstBrace = jsonStr.indexOf('{');
    if (firstBrace === -1) {
      throw new Error('No JSON object found - response contains no opening brace');
    }

    // Find matching closing brace by counting brace pairs
    let braceCount = 0;
    let jsonStart = firstBrace;
    let jsonEnd = -1;

    for (let i = firstBrace; i < jsonStr.length; i++) {
      if (jsonStr[i] === '{') braceCount++;
      if (jsonStr[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i;
          break;
        }
      }
    }

    if (jsonEnd === -1) {
      throw new Error('No complete JSON object found - unmatched braces');
    }

    jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);

    console.log('Extracted JSON string, length:', jsonStr.length);
    console.log('JSON preview:', jsonStr.slice(0, 200));

    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.analysis || !parsed.mappings) {
      throw new Error(`Invalid JSON structure: missing ${!parsed.analysis ? 'analysis' : 'mappings'}`);
    }

    // Validate analysis fields
    if (!parsed.analysis.primaryColors || !Array.isArray(parsed.analysis.primaryColors)) {
      throw new Error('Invalid analysis: primaryColors must be an array');
    }

    // Validate mappings
    if (!Array.isArray(parsed.mappings) || parsed.mappings.length === 0) {
      throw new Error('Invalid mappings: must be a non-empty array');
    }

    console.log('Successfully parsed and validated JSON');
    return {
      analysis: parsed.analysis,
      mappings: parsed.mappings,
    };
  } catch (error) {
    // Show first 500 chars of response in error for debugging
    const preview = content.slice(0, 500).replace(/\n/g, ' ');
    throw new Error(`Failed to parse AI response: ${error}\n\nResponse preview: ${preview}...`);
  }
}
