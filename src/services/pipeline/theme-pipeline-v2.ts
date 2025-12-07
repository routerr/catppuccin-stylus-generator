/**
 * Theme Pipeline V2 - End-to-end pipeline using SiteSignature system.
 *
 * This is the main entry point for the new theme generation system.
 * It orchestrates: CSS extraction -> Analysis -> AI Mapping -> LESS Generation.
 */

import {
  buildSiteSignature,
  summarizeSignature,
  type SiteSignature,
} from "../analysis";
import {
  buildMappingPrompt,
  parseMappingResponse,
  callAI,
  generateMappings,
  type AIProviderConfig,
} from "../ai/signature-prompt-builder";
import {
  generateDefaultTheme,
  generateTheme,
} from "../generators/theme-generator-v4";
import type {
  MappingResult,
  GeneratedThemeOutput,
  GenerationConfig,
} from "../../types/analysis";
import type { AccentColor } from "../../types/catppuccin";

// ============================================================================
// PIPELINE TYPES
// ============================================================================

export interface PipelineInput {
  /** CSS content to analyze (raw CSS string) */
  css: string;
  /** Domain name for the theme */
  domain: string;
  /** Source type */
  sourceType: "url" | "directory" | "mhtml";
  /** User's selected accent color (optional) */
  userAccent?: AccentColor;
  /** AI provider configuration */
  aiConfig: AIProviderConfig;
  /** Generation configuration */
  generationConfig?: Partial<GenerationConfig>;
}

export interface PipelineResult {
  /** Site signature (unique fingerprint) */
  signature: SiteSignature;
  /** AI mapping result */
  mappings: MappingResult;
  /** Generated theme output */
  theme: GeneratedThemeOutput;
  /** Human-readable summary */
  summary: string;
  /** Timing information */
  timing: {
    analysisMs: number;
    mappingMs: number;
    generationMs: number;
    totalMs: number;
  };
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Run the complete theme generation pipeline.
 */
export async function runPipeline(
  input: PipelineInput
): Promise<PipelineResult> {
  const startTime = performance.now();

  // Step 1: Build Site Signature
  console.log("Step 1: Building site signature...");
  const analysisStart = performance.now();
  const signature = buildSiteSignature(
    input.css,
    input.domain,
    input.sourceType
  );
  const analysisMs = performance.now() - analysisStart;
  console.log(`  Signature built in ${analysisMs.toFixed(0)}ms`);
  console.log(`  Dominant hue: ${signature.colorProfile.dominantHueName}`);
  console.log(`  Suggested accent: ${signature.suggestedAccent}`);

  // Step 2: Generate AI Mappings
  console.log("Step 2: Generating AI mappings...");
  const mappingStart = performance.now();
  const mappings = await generateMappings(
    signature,
    input.aiConfig,
    input.userAccent
  );
  const mappingMs = performance.now() - mappingStart;
  console.log(`  Mappings generated in ${mappingMs.toFixed(0)}ms`);
  console.log(`  Total mappings: ${mappings.mappings.length}`);
  console.log(`  Confidence: ${(mappings.confidence * 100).toFixed(0)}%`);

  // Step 3: Generate Theme
  console.log("Step 3: Generating theme...");
  const generationStart = performance.now();
  const theme = generateTheme(signature, mappings, input.generationConfig);
  const generationMs = performance.now() - generationStart;
  console.log(`  Theme generated in ${generationMs.toFixed(0)}ms`);
  console.log(`  Rules: ${theme.stats.rulesGenerated}`);
  console.log(`  Colors replaced: ${theme.stats.colorsReplaced}`);

  const totalMs = performance.now() - startTime;
  console.log(`\nTotal pipeline time: ${totalMs.toFixed(0)}ms`);

  return {
    signature,
    mappings,
    theme,
    summary: summarizeSignature(signature),
    timing: {
      analysisMs,
      mappingMs,
      generationMs,
      totalMs,
    },
  };
}

/**
 * Run pipeline without AI (uses heuristic mappings).
 * Useful for testing or when AI is unavailable.
 */
export function runPipelineOffline(input: Omit<PipelineInput, "aiConfig">): {
  signature: SiteSignature;
  mappings: MappingResult;
  theme: GeneratedThemeOutput;
  summary: string;
} {
  // Step 1: Build Site Signature
  const signature = buildSiteSignature(
    input.css,
    input.domain,
    input.sourceType
  );

  // Step 2: Create heuristic mappings (no AI)
  const mappings = createHeuristicMappings(signature, input.userAccent);

  // Step 3: Generate Theme
  const theme = generateDefaultTheme(signature, mappings);

  return {
    signature,
    mappings,
    theme,
    summary: summarizeSignature(signature),
  };
}

/**
 * Create mappings using heuristics instead of AI.
 * This is faster but less accurate.
 */
function createHeuristicMappings(
  signature: SiteSignature,
  userAccent?: AccentColor
): MappingResult {
  const accent = userAccent || signature.suggestedAccent;
  const mappings: MappingResult["mappings"] = [];

  // Map semantic roles to Catppuccin tokens
  const roleToToken: Record<string, string> = {
    "background.primary": "base",
    "background.secondary": "mantle",
    "surface.card": "surface0",
    "surface.overlay": "surface1",
    "text.primary": "text",
    "text.secondary": "subtext1",
    "text.muted": "subtext0",
    "accent.brand": accent,
    "accent.link": accent,
    "accent.interactive": accent,
    "semantic.success": "green",
    "semantic.warning": "yellow",
    "semantic.error": "red",
    "semantic.info": "blue",
    "border.subtle": "surface2",
    "border.default": "overlay0",
  };

  for (const [role, hex] of signature.semanticRoles) {
    const token = roleToToken[role] || "text";
    mappings.push({
      original: hex,
      catppuccinToken: token,
      role: role as any,
      reason: "Heuristic mapping",
      usesAccent: token === accent,
    });
  }

  return {
    mappings,
    chosenAccent: accent,
    biAccents: ["pink", "lavender"], // Simple fallback
    warnings: ["Using heuristic mappings (no AI)"],
    confidence: 0.6,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { buildSiteSignature, summarizeSignature } from "../analysis";
export {
  generateTheme,
  generateDefaultTheme,
} from "../generators/theme-generator-v4";
export type {
  SiteSignature,
  MappingResult,
  GeneratedThemeOutput,
  AIProviderConfig,
};
