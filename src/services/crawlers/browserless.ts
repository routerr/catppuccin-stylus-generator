/**
 * Browserless Service
 *
 * Headless browser-based crawler using Browserless.io's cloud Puppeteer.
 * Uses the /content API to get fully rendered HTML.
 *
 * @see https://docs.browserless.io/docs/content.html
 */

const BROWSERLESS_API_ENDPOINT = "https://chrome.browserless.io/content";

/**
 * Browserless configuration options
 */
export interface BrowserlessConfig {
  apiKey: string;
  /** Wait time for page to load (ms), default 5000 */
  waitMs?: number;
  /** Wait for a specific selector before returning */
  waitForSelector?: string;
}

/**
 * Browserless scrape result
 */
export interface BrowserlessResult {
  success: boolean;
  html?: string;
  error?: string;
}

/**
 * Scrape a URL using Browserless's headless browser
 *
 * @param url - URL to scrape
 * @param config - Browserless configuration
 * @returns Scraped content with fully rendered HTML
 */
export async function scrapeWithBrowserless(
  url: string,
  config: BrowserlessConfig
): Promise<BrowserlessResult> {
  const { apiKey, waitMs = 5000, waitForSelector } = config;

  if (!apiKey) {
    return {
      success: false,
      error: "Browserless API key is required",
    };
  }

  console.log(`🌐 [Browserless] Scraping: ${url}`);

  try {
    // Build request body
    const body: Record<string, unknown> = {
      url,
      gotoOptions: {
        waitUntil: "networkidle2",
        timeout: waitMs + 10000, // Extra buffer
      },
    };

    // Add waitFor if selector specified
    if (waitForSelector) {
      body.waitForSelector = {
        selector: waitForSelector,
        timeout: waitMs,
      };
    } else {
      // Default: wait for page to settle
      body.waitForTimeout = waitMs;
    }

    const response = await fetch(
      `${BROWSERLESS_API_ENDPOINT}?token=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `🌐 [Browserless] API error: ${response.status}`,
        errorText
      );

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      // Handle specific Browserless error codes
      if (response.status === 401 || response.status === 403) {
        errorMessage = "Invalid Browserless API key";
      } else if (response.status === 429) {
        errorMessage = "Browserless rate limit exceeded";
      }

      // Try to parse error JSON
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // Use default error message
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const html = await response.text();

    console.log(`🌐 [Browserless] Success!`);
    console.log(`   HTML: ${html.length} chars`);

    return {
      success: true,
      html,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`🌐 [Browserless] Error:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if Browserless API key is valid
 */
export async function validateBrowserlessKey(apiKey: string): Promise<boolean> {
  try {
    // Use a lightweight test request
    const response = await fetch(
      `${BROWSERLESS_API_ENDPOINT}?token=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: "https://example.com",
          gotoOptions: {
            waitUntil: "domcontentloaded",
            timeout: 5000,
          },
        }),
      }
    );

    // 401/403 = invalid key, 200 = valid
    return response.status === 200;
  } catch {
    return false;
  }
}
