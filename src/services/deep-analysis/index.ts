/**
 * Deep Analysis Pipeline - Simplified
 *
 * Single generator using SiteSignature system for site-specific themes.
 * All V1-V4 legacy generators have been removed.
 */

import type { AccentColor, CatppuccinFlavor } from "../../types/catppuccin";
import type {
  DeepAnalysisResult,
  DeepAnalysisConfig,
  GeneratedTheme,
} from "../../types/deep-analysis";
import type { AIProvider } from "../../types/theme";
import type {
  SiteSignature,
  MappingResult as SiteSignatureMappings,
} from "../../types/analysis";
import { fetchWithDeepAnalysis, type CrawlerConfig } from "../fetcher-v2";
import { buildSiteSignature, summarizeSignature } from "../analysis";
import {
  generateMappings,
  type AIProviderConfig,
} from "../ai/signature-prompt-builder";
import { generateTheme } from "../generators/theme-generator-v4";
import { getBiAccents } from "../../utils/bi-accent";

// ============================================================================
// Pipeline Options
// ============================================================================

export interface PipelineOptions {
  /** URL to analyze */
  url: string;
  /** Optional raw HTML content (for file uploads) */
  content?: string;
  /** Default flavor for the theme */
  flavor: CatppuccinFlavor;
  /** Main accent color */
  mainAccent: AccentColor;
  /** Fetch configuration */
  fetchConfig?: Partial<DeepAnalysisConfig>;
  /** Crawler service configuration (e.g., Firecrawl API key) */
  crawlerConfig?: CrawlerConfig;
  /** AI provider configuration */
  ai: {
    provider: AIProvider;
    apiKey?: string;
    model?: string;
  };
  /** Use heuristic mappings instead of AI (faster but less accurate) */
  useHeuristics?: boolean;
}

export interface PipelineResult {
  /** Deep analysis of the website */
  analysis: DeepAnalysisResult;
  /** Site signature (unique fingerprint) */
  signature: SiteSignature;
  /** Color mappings */
  mappings: SiteSignatureMappings;
  /** Generated theme */
  theme: GeneratedTheme;
}

// ============================================================================
// Main Pipeline
// ============================================================================

/**
 * Run the theme generation pipeline.
 * Uses SiteSignature system for site-specific themes.
 */
export async function runPipeline(
  options: PipelineOptions
): Promise<PipelineResult> {
  const {
    url,
    content,
    flavor,
    mainAccent,
    fetchConfig,
    crawlerConfig,
    ai,
    useHeuristics,
  } = options;

  // Step 1: Fetch and analyze website
  console.log("[Pipeline] Fetching and analyzing website...");
  const analysis = await fetchWithDeepAnalysis(
    url,
    fetchConfig,
    content,
    crawlerConfig
  );

  // Step 2: Build site signature
  console.log("[Pipeline] Building site signature...");
  const cssContent =
    analysis.cssVariables.map((v) => `${v.name}: ${v.value};`).join("\n") +
    "\n" +
    (analysis.allCSS || "");

  const hostname = new URL(url.startsWith("http") ? url : `https://${url}`)
    .hostname;
  const signature = buildSiteSignature(cssContent, hostname, "url");
  console.log(`[Pipeline] ${summarizeSignature(signature)}`);

  // Step 3: Generate mappings
  console.log("[Pipeline] Generating color mappings...");
  let mappings: SiteSignatureMappings;

  if (useHeuristics) {
    mappings = createHeuristicMappings(signature, mainAccent);
  } else {
    const aiConfig: AIProviderConfig = {
      type: ai.provider === "ollama" ? "ollama" : "chutes",
      apiKey: ai.apiKey,
      model: ai.model || "gpt-4",
    };
    mappings = await generateMappings(signature, aiConfig, mainAccent);
  }

  // Step 4: Generate theme
  console.log("[Pipeline] Generating theme...");
  const themeOutput = generateTheme(signature, mappings, {
    domain: hostname,
    coverageLevel: "standard",
  });

  const theme: GeneratedTheme = {
    less: themeOutput.lessCode,
    metadata: {
      url,
      generatedAt: new Date(),
      version: "1.0.0",
      mode: signature.colorProfile.luminanceMode,
    },
    sections: {
      variables: "",
      svgs: "",
      selectors: themeOutput.lessCode,
      gradients: "",
      fallbacks: "",
    },
    coverage: {
      variableCoverage: 100,
      svgCoverage: 0,
      selectorCoverage: Math.min(100, mappings.mappings.length * 10),
    },
  };

  console.log("[Pipeline] Done!");

  return {
    analysis,
    signature,
    mappings,
    theme,
  };
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * @deprecated Use `runPipeline` instead
 */
export async function runDeepAnalysisPipeline(options: {
  url: string;
  content?: string;
  flavor: CatppuccinFlavor;
  mainAccent: AccentColor;
  fetchConfig?: Partial<DeepAnalysisConfig>;
  mapper: { provider: AIProvider; apiKey?: string; model?: string };
  useHeuristics?: boolean;
  crawlerConfig?: CrawlerConfig;
}): Promise<{
  analysis: DeepAnalysisResult;
  mappings: any;
  userstyle: GeneratedTheme;
}> {
  const result = await runPipeline({
    url: options.url,
    content: options.content,
    flavor: options.flavor,
    mainAccent: options.mainAccent,
    fetchConfig: options.fetchConfig,
    ai: {
      provider: options.mapper.provider,
      apiKey: options.mapper.apiKey,
      model: options.mapper.model,
    },
    useHeuristics: options.useHeuristics,
    crawlerConfig: options.crawlerConfig,
  });

  // Return in legacy format
  return {
    analysis: result.analysis,
    mappings: {
      variableMappings: [],
      svgMappings: new Map(),
      selectorMappings: [],
      processedSVGs: [],
      stats: {
        totalVariables: result.analysis.cssVariables.length,
        mappedVariables: result.mappings.mappings.length,
        totalSVGs: 0,
        processedSVGs: 0,
        totalSelectors: 0,
        mappedSelectors: result.mappings.mappings.length,
        accentUsage: { mainAccent: 0, biAccent1: 0, biAccent2: 0 },
      },
    },
    userstyle: result.theme,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function createHeuristicMappings(
  signature: SiteSignature,
  userAccent: AccentColor
): SiteSignatureMappings {
  const accent = userAccent || signature.suggestedAccent;
  const mappings: SiteSignatureMappings["mappings"] = [];

  // Calculate bi-accents using 72° color wheel rule
  const [biAccent1, biAccent2] = getBiAccents(accent);

  // 60/20/20 distribution: primary accent (60%), biAccent1 (20%), biAccent2 (20%)
  const roleToToken: Record<string, string> = {
    // Layout roles
    "background.primary": "base",
    "background.secondary": "mantle",
    "surface.card": "surface0",
    "surface.overlay": "surface1",
    // Text roles
    "text.primary": "text",
    "text.secondary": "subtext1",
    "text.muted": "subtext0",
    // Primary accent (60%) - links, primary buttons
    "accent.brand": accent,
    "accent.link": accent,
    "accent.interactive": accent,
    // Secondary accent (20%) - badges, secondary buttons
    "accent.secondary": biAccent1,
    // Tertiary accent (20%) - hover states, highlights
    "accent.tertiary": biAccent2,
    // Semantic colors
    "semantic.success": "green",
    "semantic.warning": "yellow",
    "semantic.error": "red",
    "semantic.info": "blue",
    // Border roles
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
      usesAccent:
        token === accent || token === biAccent1 || token === biAccent2,
    });
  }

  return {
    mappings,
    chosenAccent: accent,
    biAccents: [biAccent1, biAccent2],
    warnings: ["Using heuristic mappings (no AI)"],
    confidence: 0.6,
  };
}

// For backwards compatibility
const useHeuristics = false;
