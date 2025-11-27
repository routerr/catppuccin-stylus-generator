/**
 * Shared AI prompt templates for color analysis
 */

import type { ExtendedCrawlerResult } from "./types";
import { generateAccentSystemGuide } from "../../utils/accent-schemes";

/**
 * Create a prompt for detecting dark/light mode
 */
export function createModeDetectionPrompt(
  crawlerResult: ExtendedCrawlerResult
): string {
  return `You are a web design expert. Analyze the following website content and CSS and answer with ONLY "dark" or "light" (no explanation, no markdown, just the word). Is this site primarily dark mode or light mode?

Website: ${crawlerResult.url} | ${crawlerResult.title}
Content: ${crawlerResult.content.slice(0, 2000)}
CSS: ${
    crawlerResult.cssAnalysis
      ? JSON.stringify(crawlerResult.cssAnalysis).slice(0, 2000)
      : ""
  }`;
}

/**
 * Create a comprehensive color analysis prompt
 */
export function createColorAnalysisPrompt(
  crawlerResult: ExtendedCrawlerResult
): string {
  const colorsInfo =
    crawlerResult.colors && crawlerResult.colors.length > 0
      ? `\nDetected colors:\n${crawlerResult.colors.slice(0, 30).join(", ")}`
      : "";

  // Enhanced CSS class information if available
  let cssClassInfo = "";
  if (crawlerResult.cssAnalysis && crawlerResult.cssAnalysis.grouped) {
    const grouped = crawlerResult.cssAnalysis.grouped;
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

IMPORTANT: Generate mappings that include these specific class names for more targeted styling.`;
  }

  // Determine flavor based on detected mode
  const flavor = crawlerResult.detectedMode === "dark" ? "mocha" : "latte";
  const accentGuide = generateAccentSystemGuide(flavor);

  return `You are a color analysis system. Your output MUST be ONLY valid JSON. No thinking, no explanations, no markdown - JUST JSON.

Website: ${crawlerResult.url} | ${crawlerResult.title}
${colorsInfo}
${cssClassInfo}

Content: ${crawlerResult.content.slice(0, 2000)}

MODE DETECTED: ${crawlerResult.detectedMode || "light"}

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
9. Specific components:
   - Sidebar/Navigation drawers
   - Code blocks/Preformatted text
   - Data tables/Grids
   - Tabs/Pills
   - Alerts/Notifications/Toasts

MAP TO CATPPUCCIN - Create VISUAL HIERARCHY with variety:

BACKGROUNDS (use appropriate base colors):
- Main page background: base
- Secondary backgrounds: mantle, crust
- Cards/surfaces: surface0, surface1, surface2
- Overlays/modals: overlay0
- Sidebar/Nav: mantle or crust (distinct from main bg)
- Code blocks: crust or mantle
- Tables: surface0 (header), base (body)

BORDERS & LINES:
- Subtle dividers: overlay0
- Emphasized borders: overlay1, overlay2

TEXT (maintain readability):
- Primary text: text
- Secondary/muted text: subtext0, subtext1
- Disabled text: overlay2

═════════════════════════════════════════════════════════════════════
CRITICAL LAYOUT PRESERVATION RULES - READ THIS CAREFULLY
═════════════════════════════════════════════════════════════════════

YOU MUST ONLY CHANGE COLORS. DO NOT CHANGE ANYTHING ELSE.

NEVER MODIFY THESE PROPERTIES (this breaks layouts):
❌ width, height, min-width, min-height, max-width, max-height
❌ padding, margin, padding-top, padding-bottom, padding-left, padding-right
❌ margin-top, margin-bottom, margin-left, margin-right
❌ border-width, border-radius, border-style
❌ font-size, font-weight, font-family, line-height
❌ display, position, top, left, right, bottom
❌ flex, grid, flex-direction, justify-content, align-items
❌ transform, translate, scale, rotate
❌ z-index, overflow, opacity (except for fade() function in colors)

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

${accentGuide}

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
- Text must be readable at all times with sufficient contrast
- Do NOT set text to transparent unless it's specifically for gradient text effects

LINK HOVER EFFECTS:
- Use hover gradient backgrounds (linear-gradient with multiple stops)
- Maintain solid text color on hover (never transparent)
- Example: background on hover with solid text color

CATPPUCCIN PALETTE REFERENCE:
Base/Surface/Overlay: base, mantle, crust, surface0, surface1, surface2, overlay0, overlay1, overlay2
Text: text, subtext0, subtext1
Accents: rosewater, flamingo, pink, mauve, red, maroon, peach, yellow, green, teal, sky, sapphire, blue, lavender

OUTPUT FORMAT - CRITICAL:
Return ONLY valid JSON with this exact structure (no code blocks, no markdown, no explanations):
{
  "analysis": {
    "primaryColors": ["#hex1", "#hex2", ...],
    "backgroundColors": ["#hex1", "#hex2", ...],
    "textColors": ["#hex1", "#hex2", ...],
    "accentColors": ["#hex1", "#hex2", ...],
    "mode": "dark" or "light"
  },
  "mappings": [
    {
      "from": "#original",
      "to": "catppuccin-color-name",
      "context": "where-used (e.g. buttons, links, headings, sidebar, code, table)",
      "cssProperties": ["color", "background-color", etc.],
      "selectors": [".class", "element", etc.],
      "isAccent": true/false (true if this maps to a primary/secondary accent color)
    },
    ...
  ]
}

Remember: Output ONLY the JSON. No explanations, no markdown, no code blocks. Just pure JSON.`;
}

/**
 * Create a prompt for AI-assisted JSON extraction from malformed responses
 */
export function createJSONExtractionPrompt(rawResponse: string): string {
  return `Extract ONLY the JSON object from this text. Return ONLY the JSON, nothing else. No explanations, no markdown code blocks, just the pure JSON:

${rawResponse}`;
}
