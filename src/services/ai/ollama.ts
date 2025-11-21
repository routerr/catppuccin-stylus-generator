import type { AIModel } from "../../types/theme";
import type {
  WebsiteColorAnalysis,
  ColorMapping,
} from "../../types/catppuccin";
import type { CrawlerResult } from "../../types/theme";
import { getOllamaBaseFromStorage, loadAPIKeys } from "../../utils/storage";
import { generateAccentSystemGuide } from "../../utils/accent-schemes";

// Ollama models (local). These are common tags; your local install may vary.
export const OLLAMA_MODELS: AIModel[] = [
  {
    id: "llama3.1:8b-instruct",
    name: "Llama 3.1 8B Instruct (local)",
    provider: "ollama",
    isFree: true,
  },
  {
    id: "qwen2.5:7b-instruct",
    name: "Qwen2.5 7B Instruct (local)",
    provider: "ollama",
    isFree: true,
  },
  {
    id: "mistral:7b-instruct",
    name: "Mistral 7B Instruct (local)",
    provider: "ollama",
    isFree: true,
  },
  // Cloud examples (require Ollama Cloud API key)
  {
    id: "gpt-oss:120b-cloud",
    name: "GPT-OSS 120B (cloud)",
    provider: "ollama",
    isFree: false,
  },
  {
    id: "deepseek-v3.1:671b-cloud",
    name: "Deepseek V3.1 671B (cloud)",
    provider: "ollama",
    isFree: false,
  },
  {
    id: "glm-4.6:cloud",
    name: "GLM 4.6 (cloud)",
    provider: "ollama",
    isFree: false,
  },
  {
    id: "gpt-oss:20b-cloud",
    name: "GPT-OSS 20B (cloud)",
    provider: "ollama",
    isFree: false,
  },
  {
    id: "kimi-k2:1t-cloud",
    name: "Kimi K2 1T (cloud)",
    provider: "ollama",
    isFree: false,
  },
  {
    id: "qwen3-coder:480b-cloud",
    name: "Qwen3 Coder 480B (cloud)",
    provider: "ollama",
    isFree: false,
  },
  {
    id: "minimax-m2:cloud",
    name: "MiniMax M2 (cloud)",
    provider: "ollama",
    isFree: false,
  },
];

// Base URL(s) for Ollama. Prefer custom (from storage), then relative proxy, then localhost.
function getOllamaBases(): string[] {
  const bases: string[] = [];
  const { ollama: cloudKey } = loadAPIKeys();
  // If cloud key is present, prefer Ollama Cloud API host
  if (cloudKey) {
    bases.push("https://ollama.com");
  }
  const custom = getOllamaBaseFromStorage();
  if (custom && typeof custom === "string" && custom.trim()) {
    bases.push(custom.trim());
  }
  bases.push("/ollama");
  bases.push("http://localhost:11434");
  return bases;
}

async function postOllama(path: string, body: any) {
  let lastErr: any = null;
  const bases = getOllamaBases();
  const { ollama: cloudKey } = loadAPIKeys();
  for (const base of bases) {
    try {
      const url = `${base}${path}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (base.startsWith("https://ollama.com") && cloudKey) {
        headers["Authorization"] = `Bearer ${cloudKey}`;
      }
      const res = await fetch(url, {
        method: "POST",
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
  throw lastErr || new Error("Failed to reach Ollama server");
}

export async function analyzeColorsWithOllama(
  crawlerResult: CrawlerResult,
  model: string,
  customPrompt?: string
): Promise<
  | {
      analysis: WebsiteColorAnalysis;
      mappings: ColorMapping[];
      mode: "dark" | "light";
    }
  | string
> {
  // If custom prompt is provided, use it directly (for deep analysis)
  if (customPrompt) {
    console.log("Using custom deep analysis prompt with Ollama");
    const data = await postOllama("/api/chat", {
      model,
      messages: [
        {
          role: "system",
          content: "You are a color mapping expert. Return only valid JSON.",
        },
        {
          role: "user",
          content: customPrompt,
        },
      ],
      stream: false,
      options: { temperature: 0.3 },
    });

    const content: string = data?.message?.content || data?.response;
    if (!content) throw new Error("No response from Ollama");
    return content;
  }

  // Original generic flow below
  // Step 1: Detect dark/light mode using AI
  const modePrompt = `You are a web design expert. Analyze the following website content and CSS and answer with ONLY "dark" or "light" (no explanation, no markdown, just the word). Is this site primarily dark mode or light mode?\n\nWebsite: ${
    crawlerResult.url
  } | ${crawlerResult.title}\nContent: ${crawlerResult.content.slice(
    0,
    2000
  )}\nCSS: ${
    crawlerResult.cssAnalysis
      ? JSON.stringify(crawlerResult.cssAnalysis).slice(0, 2000)
      : ""
  }`;

  let detectedMode: "dark" | "light" = "light";
  try {
    const modeData = await postOllama("/api/chat", {
      model,
      messages: [
        {
          role: "system",
          content:
            'You are a web design expert. Only answer "dark" or "light".',
        },
        { role: "user", content: modePrompt },
      ],
      stream: false,
      options: { temperature: 0.0 },
    });
    const modeText: string =
      modeData?.message?.content?.trim()?.toLowerCase() ||
      modeData?.response?.trim()?.toLowerCase();
    if (modeText === "dark" || modeText === "light") {
      detectedMode = modeText;
    }
  } catch (e) {
    console.warn("Ollama mode detection failed, defaulting to light mode.", e);
  }

  // Step 2: Color analysis, pass detected mode to prompt
  const prompt = createColorAnalysisPrompt({ ...crawlerResult, detectedMode });

  try {
    // Stage 1: AI analyzes colors (may return messy output)
    console.log("Stage 1: Analyzing colors with Ollama...");
    const data = await postOllama("/api/chat", {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a color analysis expert specializing in web design. Analyze website colors and provide structured JSON responses.",
        },
        { role: "user", content: prompt },
      ],
      stream: false,
      options: { temperature: 0.3 },
    });

    const content: string = data?.message?.content || data?.response;
    if (!content) throw new Error("No response from Ollama");

    // Try to parse directly first
    try {
      console.log("Attempting direct JSON parsing...");
      const result = parseColorAnalysisResponse(content);
      return { ...result, mode: detectedMode };
    } catch (parseError) {
      // Stage 2: If direct parsing fails, use AI to extract JSON
      console.log("Direct parsing failed, using AI to extract JSON...");
      console.log("Parse error:", parseError);
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
  console.log("Stage 2: Attempting Ollama-powered JSON extraction...");

  // First, try manual extraction without AI
  try {
    console.log("Attempting manual extraction first...");
    const manuallyExtracted = extractJSONManually(messyResponse);
    console.log("Manual extraction successful!");
    return manuallyExtracted;
  } catch (manualError) {
    console.log(
      "Manual extraction failed, trying Ollama extraction...",
      manualError
    );
  }

  const extractionPrompt = `CRITICAL: You MUST output ONLY the JSON object. NO thinking tags, NO explanations, NO markdown.\n\nFind the JSON object in the text below and output it EXACTLY as-is.\n\nTEXT:\n${messyResponse.slice(
    0,
    3000
  )}\n\nOUTPUT FORMAT: Just the JSON object starting with { and ending with }`;

  const data = await postOllama("/api/chat", {
    model,
    messages: [
      {
        role: "system",
        content: "Output only JSON. No thinking. No markdown. Just JSON.",
      },
      { role: "user", content: extractionPrompt },
    ],
    stream: false,
    options: { temperature: 0.0 },
  });

  const content: string = data?.message?.content || data?.response;
  if (!content) throw new Error("No response from JSON extraction");

  try {
    return extractJSONManually(content);
  } catch {
    return parseColorAnalysisResponse(content);
  }
}

// Manual JSON extraction function (no AI, pure logic)
function extractJSONManually(text: string): {
  analysis: WebsiteColorAnalysis;
  mappings: ColorMapping[];
} {
  let cleanText = text;
  const thinkingPatterns = [
    /<think>[\s\S]*?<\/think>/gi,
    /<thinking>[\s\S]*?<\/thinking>/gi,
    /<thought>[\s\S]*?<\/thought>/gi,
    /<reasoning>[\s\S]*?<\/reasoning>/gi,
    /<reflection>[\s\S]*?<\/reflection>/gi,
  ];
  thinkingPatterns.forEach((pattern) => {
    cleanText = cleanText.replace(pattern, "");
  });

  const unclosedMatch = cleanText.match(
    /^[\s\S]*?<\/(think|thinking|thought|reasoning|reflection)>/i
  );
  if (unclosedMatch) {
    cleanText = cleanText.replace(
      /^[\s\S]*?<\/(think|thinking|thought|reasoning|reflection)>/i,
      ""
    );
  }

  const firstBrace = cleanText.indexOf("{");
  if (firstBrace === -1) throw new Error("No JSON object found in text");

  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  let jsonEnd = -1;
  for (let i = firstBrace; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === "\\") {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") braceCount++;
      else if (char === "}") {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i;
          break;
        }
      }
    }
  }
  if (jsonEnd === -1)
    throw new Error("No complete JSON object found (unmatched braces)");
  const jsonStr = cleanText.substring(firstBrace, jsonEnd + 1);
  const parsed = JSON.parse(jsonStr);
  if (!parsed.analysis || !parsed.mappings) {
    if (typeof parsed === "object") {
      for (const key of Object.keys(parsed)) {
        const value = (parsed as any)[key];
        if (
          value &&
          typeof value === "object" &&
          value.analysis &&
          value.mappings
        ) {
          return { analysis: value.analysis, mappings: value.mappings };
        }
      }
    }
    throw new Error("Invalid JSON structure: missing analysis or mappings");
  }
  return { analysis: parsed.analysis, mappings: parsed.mappings };
}

function createColorAnalysisPrompt(
  crawler: CrawlerResult & {
    cssAnalysis?: any;
    detectedMode?: "dark" | "light";
  }
) {
  const modeText = crawler.detectedMode
    ? `MODE DETECTED: ${crawler.detectedMode}`
    : "";
  // Enhanced CSS class information if available
  let cssClassInfo = "";
  const anyCrawler: any = crawler as any;
  if (anyCrawler.cssAnalysis && anyCrawler.cssAnalysis.grouped) {
    const grouped = anyCrawler.cssAnalysis.grouped;
    cssClassInfo = `\n\nCSS CLASS ANALYSIS (use this for precise class-specific mappings):
Button classes (${grouped.buttons.length}): ${grouped.buttons
      .slice(0, 10)
      .map((c: any) => c.className)
      .join(", ")}
Link classes (${grouped.links.length}): ${grouped.links
      .slice(0, 10)
      .map((c: any) => c.className)
      .join(", ")}
Background classes (${grouped.backgrounds.length}): ${grouped.backgrounds
      .slice(0, 10)
      .map((c: any) => c.className)
      .join(", ")}
Text classes (${grouped.text.length}): ${grouped.text
      .slice(0, 10)
      .map((c: any) => c.className)
      .join(", ")}
Border classes (${grouped.borders.length}): ${grouped.borders
      .slice(0, 10)
      .map((c: any) => c.className)
      .join(", ")}
\nIMPORTANT: Generate mappings that include these specific class names for more targeted styling.`;
  }

  // Determine flavor based on detected mode
  const flavor = crawler.detectedMode === "dark" ? "mocha" : "latte";
  const accentGuide = generateAccentSystemGuide(flavor);

  return `You are a color analysis expert specializing in mapping website colors to the Catppuccin palette.

  Website: ${crawler.url} | ${crawler.title}
  ${modeText}
  Detected colors: ${(crawler.colors || []).slice(0, 30).join(", ")}
  ${cssClassInfo}
  Content snippet: ${crawler.content.slice(0, 1500)}

  ${accentGuide}

  ═════════════════════════════════════════════════════════════════════
  CRITICAL LAYOUT PRESERVATION RULES - READ THIS CAREFULLY
  ═════════════════════════════════════════════════════════════════════

  YOU MUST ONLY CHANGE COLORS. DO NOT CHANGE ANYTHING ELSE.
  THE GENERATED CSS MUST NOT INCLUDE ANY LAYOUT OR POSITIONING PROPERTIES.

  NEVER MODIFY THESE PROPERTIES (this breaks layouts):
  ❌ width, height, min-width, min-height, max-width, max-height
  ❌ padding, margin, padding-top, padding-bottom, padding-left, padding-right
  ❌ margin-top, margin-bottom, margin-left, margin-right
  ❌ border-width, border-radius, border-style
  ❌ font-size, font-weight, font-family, line-height
  ❌ display, position, top, left, right, bottom, float, clear
  ❌ flex, grid, flex-direction, flex-wrap, justify-content, align-items, align-content
  ❌ gap, row-gap, column-gap, grid-template-columns, grid-template-rows
  ❌ transform, translate, scale, rotate, skew
  ❌ z-index, overflow, overflow-x, overflow-y, clip, clip-path
  ❌ visibility (except when used with opacity for transitions)
  ❌ opacity (except for fade() function in colors)
  ❌ white-space, word-wrap, word-break, text-overflow
  ❌ vertical-align, text-align

  ONLY MODIFY COLOR PROPERTIES:
  ✓ color (text color)
  ✓ background-color, background (gradient colors only)
  ✓ border-color (not border-width!)
  ✓ box-shadow (color values only, preserve blur/spread)
  ✓ outline-color (not outline-width!)
  ✓ fill, stroke (for SVGs, color only)

  BORDER RULES:
  - If original has NO border → DO NOT add borders
  - If original has border → ONLY change border-color, NEVER border-width or border-style
  - DO NOT add accent borders to buttons unless original uses colored borders

  BACKGROUND RULES:
  - Preserve transparent backgrounds if original is transparent
  - DO NOT add backgrounds where none exist
  - Match parent background when appropriate

  GRADIENT TEXT RULES (CRITICAL - HIGHEST PRIORITY):
  ════════════════════════════════════════════════════════════════════
  ⚠️  EXTREMELY IMPORTANT: PRESERVE ORIGINAL GRADIENT COLORS  ⚠️
  ════════════════════════════════════════════════════════════════════

  Elements with gradient text (Tailwind/modern CSS) MUST keep their ORIGINAL colors:
  - class="bg-clip-text text-transparent" → SKIP entirely, do NOT map
  - class="bg-gradient-to-*" → SKIP entirely, do NOT map
  - class="from-* via-* to-*" → SKIP entirely, do NOT map
  - Gradient colors (green/moss, rose/pink, indigo/purple, etc.) → DO NOT map to Catppuccin

  WHY: These gradients are intentional branding/visual elements. Changing them to
  Catppuccin colors destroys the visual impact and breaks the site's identity.

  ACTION: Completely ignore gradient text when analyzing. Do NOT include any gradient
  colors in your color mappings. These elements will keep 100% of their original colors.

  EXAMPLES to COMPLETELY SKIP:
  ❌ <span class="from-moss bg-gradient-to-br via-rose-300 via-60% to-indigo-500 bg-clip-text text-transparent">Breakthrough</span>
  ❌ Any element with bg-clip-text, text-transparent, bg-gradient-*, from-*, via-*, to-*
  ❌ Colors only used in gradients: moss, rose, indigo shades in gradient context

  The theme must look IDENTICAL to the original except for colors.

  ═════════════════════════════════════════════════════════════════════

  TASK: Analyze the website's color usage and map to Catppuccin colors.

  KEY RULES:
  1. CRITICAL - MOST COMMON ELEMENTS: ALL <a> tags, text links, and button text → ALWAYS main-accent (these are most frequent!)
  2. COLOR DISTRIBUTION (70-30 Rule): Use main-accent for 70-80% of elements, bi-accents for 20-30% variety
  3. Main-colors = main-accent (PRIMARY) + bi-accent1 (variety) + bi-accent2 (variety)
  4. MAJORITY of colored elements → main-accent (buttons, links, headings, borders, active states)
  5. SOME elements for variety → bi-accent1 or bi-accent2 (randomly: badges, tags, icons)
  6. Each main-color uses its OWN bi-accents for gradients
  7. Preserve semantic meaning (green=success, red=error, etc.)
  8. CRITICAL: Main-accent should DOMINATE. Bi-accents are accents, not equal alternatives!

  DEFAULT STATE STYLING:
  TEXT COLORS: Apply Catppuccin colors
  - Links, button text, navigation → main-accent color
  - Headings, emphasized text → accent colors
  - Body text → Catppuccin text colors

  BACKGROUNDS & BORDERS: Preserve or map to Catppuccin base colors
  - Keep original OR map to base, surface0, surface1, surface2
  - Match parent/universal background when appropriate

  HOVER STATE STYLING:
  TEXT CLARITY:
  - Prefer SOLID text colors first; only use gradient text when supported by background-clip: text
  - Never switch text color to 'base' unless it provides strictly higher contrast than 'text'
  TEXT GRADIENTS (links, text buttons):
  - Apply gradient to TEXT using background-clip: text
  - Angles: 45deg, 225deg, or 315deg
  - Example: a:hover { background: linear-gradient(45deg, blue, sapphire); -webkit-background-clip: text; }

  BACKGROUND GRADIENTS (solid buttons, cards):
  - Apply gradient to BACKGROUND
  - Angles: 135deg or 225deg
  - CRITICAL: Adjust text color for readability when background changes
  - Example: .btn:hover { background: linear-gradient(135deg, blue, sapphire); color: @text; }
  - Ensure minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text according to WCAG guidelines to ensure readability.
  - Example: .btn:hover { background: linear-gradient(135deg, blue, sapphire); }
  - Different angles: 135deg or 225deg

  HOVER GRADIENT DETECTION RULES (NEW):
  CRITICAL: Analyze each interactive element to determine hover gradient behavior:

  1. VISIBLE BACKGROUND ELEMENTS (gradient to background on hover):
     - Elements with visible background colors different from their parent
     - Elements with visible borders (border-width > 0 and not transparent)
     - Set: hasVisibleBackground: true OR hasBorder: true
     - Hover effect: Apply linear-gradient to background with random angle (0-360°)

  2. INVISIBLE BACKGROUND ELEMENTS (gradient to text on hover):
     - Text-only elements with transparent/invisible backgrounds (same as parent)
     - No visible borders
     - Set: isTextOnly: true, hasVisibleBackground: false, hasBorder: false
     - Hover effect: Apply linear-gradient to text using background-clip technique

  3. FOR EACH MAPPING, DETECT AND SET:
     - hasVisibleBackground: true if element has visible background different from parent
     - hasBorder: true if element has borders (border-width > 0 and not transparent)
     - isTextOnly: true if element is text-only with invisible background
     - hoverGradientAngle: random integer between 0-360 degrees

  OUTPUT FORMAT (JSON only, no markdown):
  {
    "analysis": {
      "primaryColors": ["#HEX1", "#HEX2"],
      "accentColors": ["#HEX3", "#HEX4"],
      "backgroundColor": "#HEX5",
      "textColor": "#HEX6"
    },
    "mappings": [
      {"originalColor": "#HEX1", "catppuccinColor": "blue", "reason": "Primary CTA buttons", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 135},
      {"originalColor": "#HEX2", "catppuccinColor": "sapphire", "reason": "Secondary buttons (blue's bi-accent1)", "hasVisibleBackground": true, "hasBorder": false, "isTextOnly": false, "hoverGradientAngle": 225},
      {"originalColor": "#HEX3", "catppuccinColor": "lavender", "reason": "Badges and tags (blue's bi-accent2)", "hasVisibleBackground": false, "hasBorder": false, "isTextOnly": true, "hoverGradientAngle": 315}
    ]
  }

  CRITICAL: Output ONLY the JSON object. No markdown, no commentary. If you are a reasoning model, put your thinking before the JSON and then output ONLY the JSON object.`;
}

function parseColorAnalysisResponse(content: string): {
  analysis: WebsiteColorAnalysis;
  mappings: ColorMapping[];
} {
  let jsonStr = content.trim();
  jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/gi, "");
  jsonStr = jsonStr.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
  jsonStr = jsonStr.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
  jsonStr = jsonStr.replace(/<thought>[\s\S]*?<\/thought>/gi, "");
  jsonStr = jsonStr.replace(/<analysis>[\s\S]*?<\/analysis>/gi, "");
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  const firstBrace = jsonStr.indexOf("{");
  if (firstBrace === -1)
    throw new Error(
      "No JSON object found - response contains no opening brace"
    );
  let braceCount = 0;
  let jsonEnd = -1;
  for (let i = firstBrace; i < jsonStr.length; i++) {
    if (jsonStr[i] === "{") braceCount++;
    if (jsonStr[i] === "}") {
      braceCount--;
      if (braceCount === 0) {
        jsonEnd = i;
        break;
      }
    }
  }
  if (jsonEnd === -1)
    throw new Error("No complete JSON object found - unmatched braces");
  jsonStr = jsonStr.substring(firstBrace, jsonEnd + 1);
  const parsed = JSON.parse(jsonStr);
  if (!parsed.analysis || !parsed.mappings)
    throw new Error("Invalid JSON structure");
  if (!Array.isArray(parsed.mappings) || parsed.mappings.length === 0)
    throw new Error("Invalid mappings");
  return { analysis: parsed.analysis, mappings: parsed.mappings };
}
