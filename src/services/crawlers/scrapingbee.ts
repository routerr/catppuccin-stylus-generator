/**
 * ScrapingBee Service
 *
 * Headless browser-based crawler for JS-rendered websites.
 * Uses ScrapingBee's cloud-based headless Chrome infrastructure.
 *
 * @see https://www.scrapingbee.com/documentation/
 */

const SCRAPINGBEE_API_ENDPOINT = "https://app.scrapingbee.com/api/v1/";

/**
 * ScrapingBee configuration options
 */
export interface ScrapingBeeConfig {
  apiKey: string;
  /** Wait time for JS to render (ms), default 5000 */
  waitMs?: number;
  /** Use premium proxies for better success rate */
  premiumProxy?: boolean;
}

/**
 * ScrapingBee scrape result
 */
export interface ScrapingBeeResult {
  success: boolean;
  html?: string;
  metadata?: {
    resolvedUrl?: string;
    statusCode?: number;
  };
  error?: string;
}

/**
 * Scrape a URL using ScrapingBee's headless browser
 *
 * @param url - URL to scrape
 * @param config - ScrapingBee configuration
 * @returns Scraped content with HTML
 */
export async function scrapeWithScrapingBee(
  url: string,
  config: ScrapingBeeConfig
): Promise<ScrapingBeeResult> {
  const { apiKey, waitMs = 5000, premiumProxy = false } = config;

  if (!apiKey) {
    return {
      success: false,
      error: "ScrapingBee API key is required",
    };
  }

  console.log(`🐝 [ScrapingBee] Scraping: ${url}`);

  try {
    // Build query parameters
    const params = new URLSearchParams({
      api_key: apiKey,
      url: url,
      render_js: "true",
      wait: String(waitMs),
      premium_proxy: String(premiumProxy),
      // Return HTML content
      return_page_source: "true",
    });

    const response = await fetch(`${SCRAPINGBEE_API_ENDPOINT}?${params}`, {
      method: "GET",
      headers: {
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `🐝 [ScrapingBee] API error: ${response.status}`,
        errorText
      );

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      // Handle specific ScrapingBee error codes
      if (response.status === 401) {
        errorMessage = "Invalid ScrapingBee API key";
      } else if (response.status === 402) {
        errorMessage = "ScrapingBee credits exhausted";
      } else if (response.status === 500) {
        errorMessage = "ScrapingBee internal error - try again later";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const html = await response.text();

    // Get metadata from headers
    const resolvedUrl = response.headers.get("Spb-Resolved-Url") || url;
    const statusCode = parseInt(
      response.headers.get("Spb-Initial-Status-Code") || "200"
    );

    console.log(`🐝 [ScrapingBee] Success!`);
    console.log(`   HTML: ${html.length} chars`);
    console.log(`   Resolved URL: ${resolvedUrl}`);

    return {
      success: true,
      html,
      metadata: {
        resolvedUrl,
        statusCode,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`🐝 [ScrapingBee] Error:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if ScrapingBee API key is valid
 */
export async function validateScrapingBeeKey(apiKey: string): Promise<boolean> {
  try {
    // Use a lightweight test request
    const params = new URLSearchParams({
      api_key: apiKey,
      url: "https://example.com",
      render_js: "false", // Don't render JS for validation (saves credits)
    });

    const response = await fetch(`${SCRAPINGBEE_API_ENDPOINT}?${params}`, {
      method: "GET",
    });

    // 401 = invalid key, 200 = valid
    return response.status === 200;
  } catch {
    return false;
  }
}
