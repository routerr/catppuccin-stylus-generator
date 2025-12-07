/**
 * Enhanced Content Fetcher v2
 * Fetches website content with deep analysis capabilities
 */

import type {
  DeepAnalysisResult,
  DeepAnalysisConfig,
} from "../types/deep-analysis";
import {
  scrapeWithFirecrawl,
  extractColorsFromBranding,
  type FirecrawlBranding,
} from "./crawlers/firecrawl";
import { scrapeWithScrapingBee } from "./crawlers/scrapingbee";
import { scrapeWithBrowserless } from "./crawlers/browserless";
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
// Ordered by reliability (most reliable first)
const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
];

let currentProxyIndex = 0;

/**
 * Configuration for crawler services
 */
export interface CrawlerConfig {
  /** Firecrawl API key (optional - enables JS rendering) */
  firecrawlApiKey?: string;
  /** ScrapingBee API key (optional - backup crawler) */
  scrapingbeeApiKey?: string;
  /** Browserless API key (optional - backup crawler) */
  browserlessApiKey?: string;
  /** Prefer JS-rendering crawlers over CORS proxy */
  preferFirecrawl?: boolean;
}

/**
 * Fetch website with complete deep analysis
 */
export async function fetchWithDeepAnalysis(
  url: string,
  config: Partial<DeepAnalysisConfig> = {},
  htmlContent?: string,
  crawlerConfig?: CrawlerConfig
): Promise<DeepAnalysisResult> {
  const startTime = Date.now();
  const fullConfig = { ...DEFAULT_DEEP_ANALYSIS_CONFIG, ...config };

  console.log(`🔍 Starting deep analysis for: ${url}`);

  // Step 1: Fetch basic content (or use provided content)
  let basicContent: Awaited<ReturnType<typeof processBasicContent>>;
  let firecrawlBranding: FirecrawlBranding | undefined;

  if (htmlContent) {
    basicContent = await processBasicContent(htmlContent, url);
  } else {
    const result = await fetchBasicContent(url, crawlerConfig);
    basicContent = result.basicContent;
    firecrawlBranding = result.branding;
  }

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

  // Step 6: Extract dominant colors (enhanced with Firecrawl branding if available)
  let dominantColors = extractDominantColors(cssVariables, allCSS);
  let accentColors = extractAccentColors(cssVariables, allCSS);

  // Enhance with Firecrawl branding colors if available
  if (firecrawlBranding) {
    const brandingColors = extractColorsFromBranding(firecrawlBranding);
    if (brandingColors.length > 0) {
      console.log(`🔥 Firecrawl branding colors: ${brandingColors.join(", ")}`);
      // Prepend branding colors (they're likely more accurate for JS-rendered sites)
      dominantColors = [...new Set([...brandingColors, ...dominantColors])];
      accentColors = [
        ...new Set([...brandingColors.slice(0, 3), ...accentColors]),
      ];
    }
  }

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
 * Result from fetching basic content
 */
interface FetchBasicContentResult {
  basicContent: {
    html: string;
    title: string;
    content: string;
    externalStylesheets: string[];
    inlineStyles: string[];
  };
  branding?: FirecrawlBranding;
}

/**
 * Fetch basic HTML content with CORS proxy + JS-crawler fallback chain
 */
async function fetchBasicContent(
  url: string,
  crawlerConfig?: CrawlerConfig
): Promise<FetchBasicContentResult> {
  const {
    firecrawlApiKey,
    scrapingbeeApiKey,
    browserlessApiKey,
    preferFirecrawl,
  } = crawlerConfig || {};

  // Build fallback chain based on available API keys
  const crawlerChain: Array<{
    name: string;
    tryFn: () => Promise<FetchBasicContentResult | null>;
  }> = [];

  if (firecrawlApiKey) {
    crawlerChain.push({
      name: "Firecrawl",
      tryFn: () => tryFirecrawl(url, firecrawlApiKey),
    });
  }
  if (scrapingbeeApiKey) {
    crawlerChain.push({
      name: "ScrapingBee",
      tryFn: () => tryScrapingBee(url, scrapingbeeApiKey),
    });
  }
  if (browserlessApiKey) {
    crawlerChain.push({
      name: "Browserless",
      tryFn: () => tryBrowserless(url, browserlessApiKey),
    });
  }

  // If preferFirecrawl and we have any crawlers, try them first
  if (preferFirecrawl && crawlerChain.length > 0) {
    console.log(
      `🚀 JS-rendering preferred - trying ${crawlerChain.length} crawler(s) first...`
    );
    for (const crawler of crawlerChain) {
      const result = await crawler.tryFn();
      if (result) {
        return result;
      }
      console.log(`⚠️ ${crawler.name} failed, trying next...`);
    }
    console.log(
      "⚠️ All preferred crawlers failed, falling back to CORS proxies..."
    );
  }

  // Try CORS proxies
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

      // Validate that we got meaningful content (not just a JS shell)
      const basicContent = await processBasicContent(html, url);
      const hasStyles =
        basicContent.inlineStyles.length > 0 ||
        basicContent.externalStylesheets.length > 0;
      const hasContent = basicContent.content.length > 100;

      // If content is minimal and we have crawlers, try them
      if (!hasStyles && !hasContent && crawlerChain.length > 0) {
        console.log(
          `⚠️ Proxy returned minimal content (JS-rendered site?), trying fallback crawlers...`
        );
        for (const crawler of crawlerChain) {
          const result = await crawler.tryFn();
          if (result) {
            return result;
          }
        }
        // Continue with CORS result if all crawlers fail
      }

      console.log(
        `✅ Successfully fetched HTML with proxy ${proxyAttempt + 1}`
      );

      return {
        basicContent,
        branding: undefined,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️  Proxy ${proxyAttempt + 1} failed:`, lastError.message);
      // Continue to next proxy
    }
  }

  // All CORS proxies failed - try crawlers as last resort
  if (!preferFirecrawl && crawlerChain.length > 0) {
    console.log("⚠️ All CORS proxies failed, trying fallback crawlers...");
    for (const crawler of crawlerChain) {
      const result = await crawler.tryFn();
      if (result) {
        return result;
      }
      console.log(`⚠️ ${crawler.name} failed, trying next...`);
    }
  }

  // Build error message with list of services tried
  const servicesTried = crawlerChain.map((c) => c.name).join(", ");
  throw new Error(
    `Failed to fetch website after trying ${CORS_PROXIES.length} CORS proxies` +
      (servicesTried ? ` and crawlers (${servicesTried})` : "") +
      `. Last error: ${lastError?.message || "Unknown error"}. ` +
      `The website may be blocking requests or requires JavaScript rendering.`
  );
}

/**
 * Try fetching with Firecrawl
 */
async function tryFirecrawl(
  url: string,
  apiKey: string
): Promise<FetchBasicContentResult | null> {
  const result = await scrapeWithFirecrawl(url, {
    apiKey,
    formats: ["html", "branding"],
    waitFor: 5000,
  });

  if (result.success && result.html) {
    console.log("🔥 Firecrawl fetch successful!");
    return {
      basicContent: await processBasicContent(result.html, url),
      branding: result.branding,
    };
  }

  console.warn("🔥 Firecrawl failed:", result.error);
  return null;
}

/**
 * Try fetching with ScrapingBee
 */
async function tryScrapingBee(
  url: string,
  apiKey: string
): Promise<FetchBasicContentResult | null> {
  const result = await scrapeWithScrapingBee(url, {
    apiKey,
    waitMs: 5000,
    premiumProxy: true,
  });

  if (result.success && result.html) {
    console.log("🐝 ScrapingBee fetch successful!");
    return {
      basicContent: await processBasicContent(result.html, url),
      branding: undefined,
    };
  }

  console.warn("🐝 ScrapingBee failed:", result.error);
  return null;
}

/**
 * Try fetching with Browserless
 */
async function tryBrowserless(
  url: string,
  apiKey: string
): Promise<FetchBasicContentResult | null> {
  const result = await scrapeWithBrowserless(url, {
    apiKey,
    waitMs: 5000,
  });

  if (result.success && result.html) {
    console.log("🌐 Browserless fetch successful!");
    return {
      basicContent: await processBasicContent(result.html, url),
      branding: undefined,
    };
  }

  console.warn("🌐 Browserless failed:", result.error);
  return null;
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
