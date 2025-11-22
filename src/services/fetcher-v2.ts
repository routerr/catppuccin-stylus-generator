/**
 * Enhanced Content Fetcher v2
 * Fetches website content with deep analysis capabilities
 */

import type {
  DeepAnalysisResult,
  DeepAnalysisConfig,
} from "../types/deep-analysis";
import type { CrawlerResult } from "../types/theme";
import {
  extractCSSVariables,
  getVariableStats,
} from "../utils/deep-analysis/css-variables";
import { analyzeSVGs, getSVGStats } from "../utils/deep-analysis/svg-analyzer";
import { detectDesignSystem } from "../utils/deep-analysis/design-system";
import {
  discoverSelectors,
  filterColorSelectors,
  getSelectorStats,
} from "../utils/deep-analysis/selector-discovery";
import { DEFAULT_DEEP_ANALYSIS_CONFIG } from "../types/deep-analysis";

// CORS proxy options - we need these because browsers block direct cross-origin requests
const CORS_PROXIES = [
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?",
  "https://api.codetabs.com/v1/proxy?quest=",
];

let currentProxyIndex = 0;

/**
 * Fetch website with complete deep analysis
 */
export async function fetchWithDeepAnalysis(
  url: string,
  config: Partial<DeepAnalysisConfig> = {},
  htmlContent?: string
): Promise<DeepAnalysisResult> {
  const startTime = Date.now();
  const fullConfig = { ...DEFAULT_DEEP_ANALYSIS_CONFIG, ...config };

  console.log(`🔍 Starting deep analysis for: ${url}`);

  // Step 1: Fetch basic content (or use provided content)
  const basicContent = htmlContent
    ? await processBasicContent(htmlContent, url)
    : await fetchBasicContent(url);

  // Step 2: Fetch all CSS (external + inline)
  const allCSS = await fetchAllCSS(url, basicContent.html);

  // Step 3: Run deep analysis
  const cssVariables = fullConfig.enableCSSVariables
    ? extractCSSVariables(basicContent.html, allCSS)
    : [];

  const svgs = fullConfig.enableSVGReplacement
    ? analyzeSVGs(basicContent.html, allCSS)
    : [];

  const designSystem = fullConfig.enableDesignSystemDetection
    ? detectDesignSystem(basicContent.html, allCSS, cssVariables)
    : {
        framework: "unknown" as const,
        confidence: 0,
        variablePrefix: [],
        colorTokens: new Map(),
        componentPatterns: [],
      };

  const selectorGroups = fullConfig.enableSelectorDiscovery
    ? discoverSelectors(allCSS, basicContent.html)
    : [];

  // Step 4: Filter to color-related selectors only
  const colorSelectors = filterColorSelectors(selectorGroups);

  // Step 5: Detect color scheme (dark/light)
  const mode = detectColorScheme(basicContent.html, allCSS, cssVariables);

  // Step 6: Extract dominant colors
  const dominantColors = extractDominantColors(cssVariables, allCSS);
  const accentColors = extractAccentColors(cssVariables, allCSS);

  const analysisTime = Date.now() - startTime;

  console.log(`✅ Deep analysis complete in ${analysisTime}ms`);
  console.log(`   CSS Variables: ${cssVariables.length}`);
  console.log(`   SVGs: ${svgs.length}`);
  console.log(
    `   Design System: ${designSystem.framework} (${Math.round(
      designSystem.confidence * 100
    )}% confidence)`
  );
  console.log(
    `   Selectors: ${selectorGroups.reduce((sum, g) => sum + g.totalCount, 0)}`
  );

  return {
    url,
    title: basicContent.title,
    content: basicContent.content,
    html: basicContent.html,

    cssVariables,
    svgs,
    designSystem,
    selectorGroups: colorSelectors,

    allCSS,
    externalStylesheets: basicContent.externalStylesheets,
    inlineStyles: basicContent.inlineStyles,

    dominantColors,
    accentColors,
    mode,

    analyzedAt: new Date(),
    analysisTime,
    coverage: {
      variables: cssVariables.length,
      svgs: svgs.length,
      selectors: colorSelectors.reduce((sum, g) => sum + g.totalCount, 0),
    },
  };
}

/**
 * Fetch basic HTML content with CORS proxy fallback
 */
async function fetchBasicContent(url: string): Promise<{
  html: string;
  title: string;
  content: string;
  externalStylesheets: string[];
  inlineStyles: string[];
}> {
  // Try multiple CORS proxies if one fails
  let lastError: Error | null = null;

  for (
    let proxyAttempt = 0;
    proxyAttempt < CORS_PROXIES.length;
    proxyAttempt++
  ) {
    try {
      currentProxyIndex = proxyAttempt;
      const proxiedUrl =
        CORS_PROXIES[currentProxyIndex] + encodeURIComponent(url);

      console.log(
        `🌐 Fetching HTML with proxy ${proxyAttempt + 1}/${
          CORS_PROXIES.length
        }...`
      );

      const response = await fetch(proxiedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log(
        `✅ Successfully fetched HTML with proxy ${proxyAttempt + 1}`
      );

      return await processBasicContent(html, url);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️  Proxy ${proxyAttempt + 1} failed:`, lastError.message);
      // Continue to next proxy
    }
  }

  // All proxies failed
  throw new Error(
    `Failed to fetch website after trying ${CORS_PROXIES.length} CORS proxies. ` +
      `Last error: ${lastError?.message || "Unknown error"}. ` +
      `The website may be blocking proxy requests or is temporarily unavailable.`
  );
}

/**
 * Process fetched HTML content
 */
async function processBasicContent(
  html: string,
  url: string
): Promise<{
  html: string;
  title: string;
  content: string;
  externalStylesheets: string[];
  inlineStyles: string[];
}> {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  let title = titleMatch ? titleMatch[1].trim() : "";
  if (!title) {
    try {
      title = new URL(url).hostname;
    } catch {
      title = url;
    }
  }

  // Extract text content (simplified)
  const content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 5000); // Limit to 5000 chars

  // Extract external stylesheets
  const externalStylesheets: string[] = [];
  const linkRegex =
    /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    try {
      const absoluteUrl = new URL(href, url).href;
      externalStylesheets.push(absoluteUrl);
    } catch (e) {
      // Try as absolute URL if base is invalid
      try {
        const absoluteUrl = new URL(href).href;
        externalStylesheets.push(absoluteUrl);
      } catch {
        console.warn(`Invalid stylesheet URL: ${href}`);
      }
    }
  }

  // Extract inline styles
  const inlineStyles: string[] = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;

  while ((match = styleRegex.exec(html)) !== null) {
    inlineStyles.push(match[1]);
  }

  return {
    html,
    title,
    content,
    externalStylesheets,
    inlineStyles,
  };
}

/**
 * Fetch all CSS (external stylesheets + inline styles) using CORS proxies
 */
async function fetchAllCSS(baseUrl: string, html: string): Promise<string> {
  let allCSS = "";

  // Extract inline styles
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;

  while ((match = styleRegex.exec(html)) !== null) {
    allCSS += match[1] + "\n\n";
  }

  // Extract external stylesheet URLs
  const linkRegex =
    /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi;
  const stylesheetUrls: string[] = [];

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    try {
      const absoluteUrl = new URL(href, baseUrl).href;
      stylesheetUrls.push(absoluteUrl);
    } catch (e) {
      // Try as absolute URL if base is invalid
      try {
        const absoluteUrl = new URL(href).href;
        stylesheetUrls.push(absoluteUrl);
      } catch {
        console.warn(`Invalid stylesheet URL: ${href}`);
      }
    }
  }

  // Fetch external stylesheets (limit to 10 to avoid overload)
  const fetchLimit = Math.min(stylesheetUrls.length, 10);
  console.log(
    `📄 Fetching ${fetchLimit} external stylesheets with CORS proxy...`
  );

  for (let i = 0; i < fetchLimit; i++) {
    const cssUrl = stylesheetUrls[i];
    try {
      // Use CORS proxy for external CSS files
      const proxiedUrl =
        CORS_PROXIES[currentProxyIndex] + encodeURIComponent(cssUrl);

      const response = await fetch(proxiedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.ok) {
        const css = await response.text();
        // Limit CSS size to prevent memory issues
        const truncatedCSS = css.length > 100000 ? css.slice(0, 100000) : css;
        allCSS += `\n\n/* External CSS: ${cssUrl} */\n${truncatedCSS}\n`;
        console.log(`   ✅ Fetched CSS (${css.length} bytes): ${cssUrl}`);
      } else {
        console.warn(`   ⚠️  HTTP ${response.status} for CSS: ${cssUrl}`);
      }
    } catch (error) {
      console.warn(`   ❌ Failed to fetch CSS: ${cssUrl}`, error);
    }
  }

  console.log(`📊 Total CSS collected: ${allCSS.length} characters`);
  return allCSS;
}

/**
 * Detect color scheme (dark or light)
 */
function detectColorScheme(
  html: string,
  css: string,
  variables: any[]
): "dark" | "light" {
  // Check for dark class or attribute
  if (
    html.includes('class="dark"') ||
    html.includes('data-theme="dark"') ||
    css.includes(".dark") ||
    css.includes('[data-theme="dark"]')
  ) {
    return "dark";
  }

  // Check background colors in variables
  const bgVars = variables.filter(
    (v) => v.name.includes("bg") || v.name.includes("background")
  );

  if (bgVars.length > 0) {
    // Check if backgrounds are dark
    const darkBgs = bgVars.filter((v) => {
      const color = v.computedValue || v.value;
      return isDarkColor(color);
    });

    if (darkBgs.length > bgVars.length / 2) {
      return "dark";
    }
  }

  // Default to light
  return "light";
}

/**
 * Check if a color is dark
 */
function isDarkColor(color: string): boolean {
  // Simple heuristic: check if hex value is < 0x808080
  if (color.startsWith("#")) {
    const hex = color.substring(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return (r + g + b) / 3 < 128;
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (r + g + b) / 3 < 128;
    }
  }

  // Check for color names
  const darkColors = [
    "black",
    "navy",
    "maroon",
    "darkblue",
    "darkgreen",
    "darkred",
  ];
  return darkColors.some((dc) => color.toLowerCase().includes(dc));
}

/**
 * Extract dominant colors from variables and CSS
 */
function extractDominantColors(variables: any[], css: string): string[] {
  const colorCounts = new Map<string, number>();

  // Count colors from variables
  variables.forEach((v) => {
    const color = v.computedValue || v.value;
    if (isColorValue(color)) {
      colorCounts.set(color, (colorCounts.get(color) || 0) + v.frequency);
    }
  });

  // Sort by frequency
  return Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([color]) => color);
}

/**
 * Extract accent colors (likely interactive element colors)
 */
function extractAccentColors(variables: any[], css: string): string[] {
  const accentKeywords = [
    "primary",
    "accent",
    "link",
    "button",
    "active",
    "hover",
    "focus",
    "highlight",
  ];

  const accentVars = variables.filter((v) =>
    accentKeywords.some((keyword) => v.name.toLowerCase().includes(keyword))
  );

  return accentVars
    .map((v) => v.computedValue || v.value)
    .filter(isColorValue)
    .slice(0, 5);
}

/**
 * Check if value is a color
 */
function isColorValue(value: string): boolean {
  if (!value) return false;
  const cleaned = value.trim().toLowerCase();

  return (
    cleaned.startsWith("#") ||
    cleaned.startsWith("rgb") ||
    cleaned.startsWith("hsl")
  );
}

/**
 * Export statistics for debugging
 */
export function getDeepAnalysisStats(result: DeepAnalysisResult) {
  return {
    url: result.url,
    title: result.title,
    mode: result.mode,
    analysisTime: `${result.analysisTime}ms`,

    cssVariables: getVariableStats(result.cssVariables),
    svgs: getSVGStats(result.svgs),
    selectors: getSelectorStats(result.selectorGroups),

    designSystem: {
      framework: result.designSystem.framework,
      confidence: `${Math.round(result.designSystem.confidence * 100)}%`,
      prefixes: result.designSystem.variablePrefix,
      colorTokens: result.designSystem.colorTokens.size,
    },

    coverage: result.coverage,
    dominantColors: result.dominantColors.slice(0, 5),
    accentColors: result.accentColors,
  };
}
