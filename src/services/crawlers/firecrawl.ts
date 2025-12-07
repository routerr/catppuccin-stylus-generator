/**
 * Firecrawl Service
 *
 * Headless browser-based crawler for JS-rendered websites.
 * Used as fallback when CORS proxy fails.
 *
 * @see https://docs.firecrawl.dev/api-reference/endpoint/scrape
 */

const FIRECRAWL_API_ENDPOINT = "https://api.firecrawl.dev/v1/scrape";

/**
 * Firecrawl configuration options
 */
export interface FirecrawlConfig {
  apiKey: string;
  /** Wait time for JS to render (ms), default 3000 */
  waitFor?: number;
  /** Request specific formats */
  formats?: Array<"html" | "markdown" | "branding">;
}

/**
 * Branding data extracted by Firecrawl
 */
export interface FirecrawlBranding {
  colors?: {
    primary?: string[];
    secondary?: string[];
    accent?: string[];
    background?: string[];
    text?: string[];
  };
  fonts?: {
    primary?: string;
    secondary?: string;
  };
  typography?: {
    headingStyle?: string;
    bodyStyle?: string;
  };
}

/**
 * Firecrawl scrape result
 */
export interface FirecrawlResult {
  success: boolean;
  html?: string;
  markdown?: string;
  branding?: FirecrawlBranding;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
  };
  error?: string;
}

/**
 * Scrape a URL using Firecrawl's headless browser
 *
 * @param url - URL to scrape
 * @param config - Firecrawl configuration
 * @returns Scraped content with HTML and optional branding data
 */
export async function scrapeWithFirecrawl(
  url: string,
  config: FirecrawlConfig
): Promise<FirecrawlResult> {
  const { apiKey, waitFor = 3000, formats = ["html", "branding"] } = config;

  if (!apiKey) {
    return {
      success: false,
      error: "Firecrawl API key is required",
    };
  }

  console.log(`🔥 [Firecrawl] Scraping: ${url}`);
  console.log(`   Formats: ${formats.join(", ")}`);

  try {
    const response = await fetch(FIRECRAWL_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats,
        waitFor,
        // Ensure we get the full rendered page
        onlyMainContent: false,
        // Include all stylesheets
        includeTags: ["style", "link"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🔥 [Firecrawl] API error: ${response.status}`, errorText);

      // Parse error message if JSON
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // Use default error message
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();

    // Handle Firecrawl V1 response format
    if (!data.success && data.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    // Extract data from response
    const result: FirecrawlResult = {
      success: true,
      html: data.data?.html || data.html,
      markdown: data.data?.markdown || data.markdown,
      branding: data.data?.branding || data.branding,
      metadata: {
        title: data.data?.metadata?.title || data.metadata?.title,
        description:
          data.data?.metadata?.description || data.metadata?.description,
        language: data.data?.metadata?.language || data.metadata?.language,
      },
    };

    console.log(`🔥 [Firecrawl] Success!`);
    console.log(`   HTML: ${result.html?.length || 0} chars`);
    console.log(
      `   Branding colors: ${result.branding?.colors ? "Yes" : "No"}`
    );

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`🔥 [Firecrawl] Error:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if Firecrawl API key is valid
 */
export async function validateFirecrawlKey(apiKey: string): Promise<boolean> {
  try {
    // Use a lightweight test request
    const response = await fetch(FIRECRAWL_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: "https://example.com",
        formats: ["markdown"],
        waitFor: 0,
      }),
    });

    // 401/403 = invalid key, 200 = valid
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Extract colors from Firecrawl branding data
 */
export function extractColorsFromBranding(
  branding: FirecrawlBranding
): string[] {
  const colors: string[] = [];

  if (branding.colors) {
    const { primary, secondary, accent, background, text } = branding.colors;
    if (primary) colors.push(...primary);
    if (secondary) colors.push(...secondary);
    if (accent) colors.push(...accent);
    if (background) colors.push(...background);
    if (text) colors.push(...text);
  }

  // Normalize and dedupe
  const normalized = colors
    .filter((c) => c && typeof c === "string")
    .map((c) => c.toLowerCase().trim())
    .filter((c) => c.startsWith("#") || c.startsWith("rgb"));

  return [...new Set(normalized)];
}
