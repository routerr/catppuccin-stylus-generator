import type { AIModel } from '../../types/theme';
import type { WebsiteColorAnalysis, ColorMapping } from '../../types/catppuccin';
import type { CrawlerResult } from '../../types/theme';
import { generateAccentSystemGuide } from '../../utils/accent-schemes';

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

export async function analyzeColorsWithChutes(
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
    const modeResponse = await fetch('https://llm.chutes.ai/v1/chat/completions', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a web design expert. Only answer "dark" or "light".' },
          { role: 'user', content: modePrompt },
        ],
        stream: false,
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
    const response = await fetch('https://llm.chutes.ai/v1/chat/completions', {
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
      const result = parseColorAnalysisResponse(content);
      return { ...result, mode: detectedMode };
    } catch (parseError) {
      // Stage 2: If direct parsing fails, use AI to extract JSON
      console.log('Direct parsing failed, using AI to extract JSON...');
      console.log('Parse error:', parseError);
      console.log('Original AI response preview:', content.slice(0, 800));
      const result = await extractJSONWithAI(content, apiKey, model);
      return { ...result, mode: detectedMode };
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
  if (model.includes('deepseek-r1') || model.includes('DeepResearch')) {
    // Switch to a simpler model that doesn't use reasoning
    extractionModel = 'unsloth/gemma-3-4b-it';
    console.log(`Switching from reasoning model ${model} to simpler model ${extractionModel} for JSON extraction`);
  }

  // If manual extraction fails, try AI extraction with very explicit instructions
  const extractionPrompt = `CRITICAL: You MUST output ONLY the JSON object. NO thinking tags, NO explanations, NO markdown.

Find the JSON object in the text below and output it EXACTLY as-is.

TEXT:
${messyResponse.slice(0, 3000)}

OUTPUT FORMAT: Just the JSON object starting with { and ending with }`;

  try {
    const response = await fetch('https://llm.chutes.ai/v1/chat/completions', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
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
        stream: false,
        temperature: 0.0, // Zero temperature for deterministic extraction
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

    console.log('Stage 2 AI response received, attempting to parse...');
    console.log('Stage 2 response preview:', content.slice(0, 500));

    // Try manual extraction on the AI's response (in case AI also added thinking tags)
    try {
      return extractJSONManually(content);
    } catch (e) {
      console.log('Manual extraction failed on Stage 2 response:', e);
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
Link classes (${grouped.links.length}): ${grouped.links.slice(0, 10).map((c: any) => c.className).join(', ')}
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

COLOR DISTRIBUTION STRATEGY:
CRITICAL: Use main-accent for MOST elements (70-80%), bi-accents for VARIETY (20-30%)

Main-accent system provides THREE analogous colors:
  - main-accent: PRIMARY color - use for MOST colored elements
  - bi-accent1: ACCENT color - use for SOME elements for variety
  - bi-accent2: ACCENT color - use for SOME elements for variety

ELEMENT COLOR ASSIGNMENT (70-30 Rule):
  - ALL <a> and link text → main-accent
  - Button text → main-accent
  - Some badges/tags/icons → bi-accent1 or bi-accent2

ACCENT COLOR MAPPING STRATEGY:
Map different original colors to different Catppuccin accents based on their semantic meaning.

COLOR DISTRIBUTION STRATEGY:
CRITICAL: Use main-accent for MOST elements (70-80%), bi-accents for VARIETY (20-30%)

Main-accent system provides THREE analogous colors:
  - main-accent: PRIMARY color - use for MOST colored elements (e.g., blue)
  - bi-accent1: ACCENT color - use for SOME elements for variety (e.g., sapphire, ±72° from blue)
  - bi-accent2: ACCENT color - use for SOME elements for variety (e.g., lavender, ±72° from blue)

ELEMENT COLOR ASSIGNMENT (70-30 Rule):

CRITICAL - MOST COMMON ELEMENTS (ALWAYS use main-accent):
  - ALL <a> tags and text links → ALWAYS main-accent (these are the most frequent!)
  - ALL button text colors → ALWAYS main-accent
  - Link hover states → main-accent (with gradient background)

MAJORITY of other elements (70-80%) → main-accent:
  - Primary buttons, CTAs, main interactive elements → main-accent
  - Navigation links, menu items → main-accent
  - Primary headings, emphasis text → main-accent
  - Most accent borders and highlights → main-accent
  - Active/selected states → main-accent

VARIETY elements (20-30%) → bi-accents (randomly distributed):
  - SOME secondary buttons/badges → bi-accent1 or bi-accent2 (random choice)
  - SOME tags, chips, labels → bi-accent1 or bi-accent2 (random choice)
  - SOME icons or decorative elements → bi-accent1 or bi-accent2 (random choice)
  - OCCASIONAL navigation items → bi-accent1 or bi-accent2 (for visual interest)

EXAMPLE with Blue as main-accent:
  - 7-8 out of 10 colored elements → blue
  - 2-3 out of 10 colored elements → sapphire or lavender (randomly chosen)

SEMANTIC STATES (use appropriate color family, main-accent preferred):
  - Success → green (main), teal/yellow (accents for variety)
  - Warning → yellow (main), peach/maroon (accents for variety)
  - Error → red (main), maroon/pink (accents for variety)
  - Info → blue (main), sapphire/lavender (accents for variety)

CRITICAL: The main-accent should dominate the color scheme. Bi-accents are for variety and visual interest, NOT as equal alternatives!

TEXT CLARITY RULES:
CRITICAL: Text must always be fully opaque.
- All text colors must be fully opaque (opacity: 1.0, no rgba with alpha < 1)
- Do not use any alpha for text colors
- Text should always be readable with solid colors from the Catppuccin palette
 - Prefer SOLID text colors first; only use gradient text when supported by background-clip: text
 - Never switch text color to 'base' unless it provides strictly higher contrast than 'text'

DEFAULT STATE STYLING RULES:
CRITICAL: Apply Catppuccin colors to text while preserving or mapping backgrounds/borders:

TEXT COLORS (Default State):
- ALL <a> tags and text links → Use Catppuccin main-accent color
- Button text → Use Catppuccin main-accent color
- Navigation links → Use Catppuccin main-accent color
- Headings, emphasized text → Use Catppuccin accent colors
- Body text → Use Catppuccin text colors (text, subtext0, subtext1)

BACKGROUNDS & BORDERS (Default State):
- Keep original background colors OR map to Catppuccin base colors (base, surface0, surface1, surface2)
- If original background is light → map to Catppuccin light base colors
- If original background is dark → map to Catppuccin dark base colors
- Match parent/universal background when appropriate
- Preserve border styles (only change border colors if they were accent colors originally)

HOVER STATE STYLING RULES:
Apply Catppuccin gradient effects on hover:

TEXT GRADIENTS (progressive enhancement on WebKit only):
- Apply gradient to TEXT only when both -webkit-background-clip: text and -webkit-text-fill-color: transparent are supported
- Gradient angles: 45deg, 225deg, or 315deg
- Use main-color + bi-accent gradient
- Example: a:hover { background: linear-gradient(45deg, blue, sapphire); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

BACKGROUND GRADIENTS (for solid buttons, cards, panels):
- Apply gradient to BACKGROUND
- Gradient angles: 135deg or 225deg
- Use main-color + bi-accent gradient
- CRITICAL: When background changes, adjust text color for readability (use @text, @base, or high contrast color)
- Example: .btn:hover { background: linear-gradient(135deg, blue, sapphire); color: @text; }

READABILITY RULES:
- ALWAYS ensure minimum contrast ratio of 4.5:1 for normal text
- When applying background gradient on hover, change text color to ensure readability
- Test contrast: light gradient → use @text or @crust, dark gradient → use @base or @text
- Text must ALWAYS be fully opaque (no transparency on text colors)

HOVER GRADIENT DETECTION RULES (NEW):
CRITICAL: Analyze each interactive element (buttons, links, cards, etc.) to determine hover gradient behavior:

1. VISIBLE BACKGROUND ELEMENTS (apply gradient to background on hover):
   - Elements with visible background colors different from their parent
   - Elements with visible borders (border-width > 0 and not transparent)
   - Set: hasVisibleBackground: true OR hasBorder: true
   - Hover effect: Apply linear-gradient to background with random angle
   - Generate random angle (0-360°) for each element's hover gradient

2. INVISIBLE BACKGROUND ELEMENTS (apply gradient to text on hover):
   - Text-only elements with transparent/invisible backgrounds (same as parent)
   - No visible borders
   - Set: isTextOnly: true, hasVisibleBackground: false, hasBorder: false
   - Hover effect: Apply linear-gradient to text using background-clip technique
   - Generate random angle (0-360°) for each element's hover gradient

3. FOR EACH MAPPING, DETECT AND SET:
   - hasVisibleBackground: true if element has visible background different from parent
   - hasBorder: true if element has borders (border-width > 0 and not transparent)
   - isTextOnly: true if element is text-only with invisible background
   - hoverGradientAngle: random integer between 0-360 degrees

EXAMPLES:
- Button with solid background: {hasVisibleBackground: true, hasBorder: false, isTextOnly: false, hoverGradientAngle: 135}
- Link with no background: {hasVisibleBackground: false, hasBorder: false, isTextOnly: true, hoverGradientAngle: 225}
- Button with border only: {hasVisibleBackground: false, hasBorder: true, isTextOnly: false, hoverGradientAngle: 45}

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
    {"originalColor": "#HEX1", "catppuccinColor": "blue", "reason": "Primary CTA buttons (e.g., 'Sign Up', 'Buy Now')", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 135},
    {"originalColor": "#HEX2", "catppuccinColor": "sapphire", "reason": "Navigation links and secondary clickable items", "hasVisibleBackground": false, "hasBorder": false, "isTextOnly": true, "hoverGradientAngle": 225},
    {"originalColor": "#HEX3", "catppuccinColor": "mauve", "reason": "Secondary buttons (e.g., 'Learn More', 'Cancel')", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 315},
    {"originalColor": "#HEX4", "catppuccinColor": "lavender", "reason": "Page headings and section titles", "hasVisibleBackground": false, "hasBorder": false, "isTextOnly": true, "hoverGradientAngle": 45},
    {"originalColor": "#HEX5", "catppuccinColor": "pink", "reason": "Accent badges and tags", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 180},
    {"originalColor": "#HEX6", "catppuccinColor": "base", "reason": "Main page background", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 0},
    {"originalColor": "#HEX7", "catppuccinColor": "text", "reason": "Primary body text", "hasVisibleBackground": false, "hasBorder": false, "isTextOnly": true, "hoverGradientAngle": 90},
    {"originalColor": "#HEX8", "catppuccinColor": "green", "reason": "Success indicators and confirm buttons", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 270},
    {"originalColor": "#HEX9", "catppuccinColor": "red", "reason": "Error messages and delete buttons", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 160},
    {"originalColor": "#HEX10", "catppuccinColor": "surface0", "reason": "Card backgrounds", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 120},
    {"originalColor": "#HEX11", "catppuccinColor": "overlay0", "reason": "Subtle borders and dividers", "hasVisibleBackground": false, "hasBorder": true, "isTextOnly": false, "hoverGradientAngle": 200},
    {"originalColor": "#HEX12", "catppuccinColor": "sky", "reason": "Link hover states and info messages", "hasVisibleBackground": false, "hasBorder": false, "isTextOnly": true, "hoverGradientAngle": 330},
    {"originalColor": "#HEX13", "catppuccinColor": "yellow", "reason": "Warning banners and caution indicators", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 75},
    {"originalColor": "#HEX14", "catppuccinColor": "teal", "reason": "Active/selected state backgrounds", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 240},
    {"originalColor": "#HEX15", "catppuccinColor": "peach", "reason": "Notification badges and highlights", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 300}
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
