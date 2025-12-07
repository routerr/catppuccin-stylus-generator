/**
 * Signature Prompt Builder - Generates AI prompts based on SiteSignature.
 *
 * This is the KEY component that ensures different sites get different mappings.
 * The prompt includes the site's unique color profile, so the AI makes
 * decisions based on what it actually sees in the site.
 */

import type {
  SiteSignature,
  SemanticRole,
  MappingResult,
  ColorMapping,
} from "../../types/analysis";
import type { AccentColor } from "../../types/catppuccin";
import { CATPPUCCIN_PALETTES } from "../../constants/catppuccin-colors";
import { calculateBiAccents } from "../../utils/color-analysis";

// ============================================================================
// PROMPT GENERATION
// ============================================================================

/**
 * Build a mapping prompt based on the site signature.
 * This prompt tells the AI exactly what colors are in the site and how to map them.
 */
export function buildMappingPrompt(
  signature: SiteSignature,
  userAccent?: AccentColor
): string {
  const { colorProfile, semanticRoles, domain } = signature;

  // Determine accent to use
  const accent = userAccent || signature.suggestedAccent;
  const palette = CATPPUCCIN_PALETTES.mocha; // Use mocha as reference
  const { biAccent1, biAccent2 } = calculateBiAccents(accent, palette);

  // Format semantic roles for the prompt
  const roleLines: string[] = [];
  for (const [role, hex] of semanticRoles) {
    roleLines.push(`- ${role}: ${hex}`);
  }

  // Format brand colors
  const brandColorsStr =
    colorProfile.brandColors.length > 0
      ? colorProfile.brandColors.join(", ")
      : "none detected";

  // Build the prompt
  return `You are mapping colors for the website "${domain}" to the Catppuccin color palette.

## Site Analysis

**Color Mode**: ${colorProfile.luminanceMode} (the site is ${
    colorProfile.luminanceMode === "dark" ? "dark" : "light"
  } themed)
**Dominant Hue**: ${colorProfile.dominantHueName} (${colorProfile.dominantHue}°)
**Saturation Style**: ${colorProfile.saturationLevel}
**Brand Colors**: ${brandColorsStr}
**Unique Colors Found**: ${colorProfile.uniqueColorCount}

## Detected Semantic Roles

${roleLines.join("\n")}

## User's Chosen Accent

The user has selected **${accent}** as their main accent color.
- Bi-Accent 1: ${biAccent1}
- Bi-Accent 2: ${biAccent2}

## Your Task

Map each site color to the MOST APPROPRIATE Catppuccin color. Follow these rules:

1. **Preserve Color ROLE**: Backgrounds stay backgrounds, text stays text, accents stay accents.
2. **Match Visual Weight**: Vibrant site colors → vibrant Catppuccin accents. Muted site colors → muted Catppuccin neutrals.
3. **Honor Brand Colors**: The site's brand colors should map to the user's chosen accent (${accent}) or its bi-accents (${biAccent1}, ${biAccent2}).
4. **Respect Light/Dark Mode**: For ${colorProfile.luminanceMode} mode sites:
${
  colorProfile.luminanceMode === "dark"
    ? "   - Dark backgrounds → Catppuccin base/mantle/crust\n   - Light text → Catppuccin text/subtext\n   - Saturated accents → Catppuccin accent colors"
    : "   - Light backgrounds → Catppuccin base (latte)\n   - Dark text → Catppuccin text (latte)\n   - Saturated accents → Catppuccin accent colors"
}

## Catppuccin Palette Reference (Mocha)

**Neutrals** (for backgrounds, surfaces, text):
- base: #1e1e2e (darkest background)
- mantle: #181825 (secondary background)
- crust: #11111b (tertiary background)
- surface0/1/2: #313244, #45475a, #585b70 (cards, overlays)
- overlay0/1/2: #6c7086, #7f849c, #9399b2 (borders, dividers)
- subtext0/1: #a6adc8, #bac2de (secondary text)
- text: #cdd6f4 (primary text)

**Accents** (for links, buttons, highlights):
- rosewater: #f5e0dc, flamingo: #f2cdcd, pink: #f5c2e7, mauve: #cba6f7
- red: #f38ba8, maroon: #eba0ac, peach: #fab387, yellow: #f9e2af
- green: #a6e3a1, teal: #94e2d5, sky: #89dceb, sapphire: #74c7ec
- blue: #89b4fa, lavender: #b4befe

## Output Format

Return ONLY valid JSON in this exact format:

{
  "mappings": [
    {
      "original": "#hexcolor",
      "catppuccinToken": "tokenName",
      "role": "semantic.role",
      "reason": "Brief explanation"
    }
  ],
  "chosenAccent": "${accent}",
  "biAccents": ["${biAccent1}", "${biAccent2}"],
  "confidence": 0.85
}

Important:
- Map ALL colors from the semantic roles above
- Use exact Catppuccin token names (base, text, blue, etc.)
- Keep reasons brief (under 50 characters)
- Confidence should be 0.0-1.0

Now generate the JSON mapping:`;
}

/**
 * Parse the AI response into a MappingResult.
 */
export function parseMappingResponse(
  response: string,
  defaultAccent: AccentColor = "blue"
): MappingResult {
  // Try to extract JSON from the response
  let json: any;

  // Try direct parse first
  try {
    json = JSON.parse(response);
  } catch {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        json = JSON.parse(jsonMatch[0]);
      } catch {
        // Return empty result
        return {
          mappings: [],
          chosenAccent: defaultAccent,
          biAccents: ["pink", "lavender"],
          warnings: ["Failed to parse AI response"],
          confidence: 0,
        };
      }
    } else {
      return {
        mappings: [],
        chosenAccent: defaultAccent,
        biAccents: ["pink", "lavender"],
        warnings: ["No JSON found in AI response"],
        confidence: 0,
      };
    }
  }

  // Extract mappings
  const mappings: ColorMapping[] = [];
  if (Array.isArray(json.mappings)) {
    for (const m of json.mappings) {
      if (m.original && m.catppuccinToken) {
        mappings.push({
          original: m.original,
          catppuccinToken: m.catppuccinToken,
          role: m.role || "unknown",
          reason: m.reason || "",
          usesAccent: isAccentToken(m.catppuccinToken),
        });
      }
    }
  }

  // Extract accent info
  const chosenAccent = (json.chosenAccent as AccentColor) || defaultAccent;
  const biAccents: [AccentColor, AccentColor] =
    Array.isArray(json.biAccents) && json.biAccents.length >= 2
      ? [json.biAccents[0], json.biAccents[1]]
      : ["pink", "lavender"];

  // Confidence
  const confidence =
    typeof json.confidence === "number" ? json.confidence : 0.5;

  return {
    mappings,
    chosenAccent,
    biAccents,
    warnings: [],
    confidence,
  };
}

/**
 * Check if a token is an accent color.
 */
function isAccentToken(token: string): boolean {
  const accents = [
    "rosewater",
    "flamingo",
    "pink",
    "mauve",
    "red",
    "maroon",
    "peach",
    "yellow",
    "green",
    "teal",
    "sky",
    "sapphire",
    "blue",
    "lavender",
  ];
  return accents.includes(token.toLowerCase());
}

// ============================================================================
// AI PROVIDER ABSTRACTION
// ============================================================================

export interface AIProviderConfig {
  type: "chutes" | "ollama";
  apiKey?: string;
  model: string;
  baseUrl?: string;
}

/**
 * Call AI provider with a prompt and return raw response.
 */
export async function callAI(
  prompt: string,
  config: AIProviderConfig
): Promise<string> {
  if (config.type === "chutes") {
    return callChutes(prompt, config.apiKey!, config.model);
  } else {
    return callOllama(prompt, config.model, config.baseUrl);
  }
}

/**
 * Call Chutes AI.
 */
async function callChutes(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are a color mapping expert. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chutes API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Call Ollama (local or cloud).
 */
async function callOllama(
  prompt: string,
  model: string,
  baseUrl?: string
): Promise<string> {
  const url = baseUrl || "http://localhost:11434";

  const response = await fetch(`${url}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 3000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response || "";
}

// ============================================================================
// MAIN MAPPING FUNCTION
// ============================================================================

/**
 * Generate color mappings for a site using AI.
 */
export async function generateMappings(
  signature: SiteSignature,
  config: AIProviderConfig,
  userAccent?: AccentColor
): Promise<MappingResult> {
  // Build prompt
  const prompt = buildMappingPrompt(signature, userAccent);

  // Call AI
  const response = await callAI(prompt, config);

  // Parse response
  const result = parseMappingResponse(
    response,
    userAccent || signature.suggestedAccent
  );

  // Add warning if no mappings
  if (result.mappings.length === 0) {
    result.warnings.push("AI returned no mappings");
  }

  return result;
}
