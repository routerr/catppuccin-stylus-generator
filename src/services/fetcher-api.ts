/**
 * API-based Content Fetcher
 * 
 * Fetches website content using cloud-based scraping APIs instead of self-hosted Playwright.
 * Implements a fallback chain: Firecrawl → Jina Reader → ScrapingBee → CORS Proxies
 * 
 * Services supported:
 * - Firecrawl: Best for HTML+CSS extraction (500 free credits/month)
 * - Jina Reader: Free, no API key required, returns markdown
 * - ScrapingBee: 1000 free API calls, full JS rendering
 * - CORS Proxies: Last resort fallback (existing implementation)
 */

export interface FetcherAPIConfig {
  /** Preferred fetcher service */
  service: FetcherServiceType;
  /** API keys for various services */
  apiKeys: {
    firecrawl?: string;
    scrapingbee?: string;
    browserless?: string;
  };
  /** Enable fallback chain if primary service fails */
  enableFallback: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Wait time for JS rendering (services that support it) */
  waitForJs?: number;
}

export type FetcherServiceType = 
  | 'firecrawl'
  | 'jina'
  | 'scrapingbee'
  | 'browserless'
  | 'cors-proxy'
  | 'auto';

export interface APIFetchResult {
  url: string;
  title: string;
  html: string;
  css: string;
  markdown?: string;
  screenshot?: string;
  colors: string[];
  serviceUsed: FetcherServiceType;
  error?: string;
}

// Default CORS proxies as last fallback
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

/**
 * Main function to fetch website content using API-based services
 */
export async function fetchWithAPI(
  url: string,
  config: Partial<FetcherAPIConfig> = {}
): Promise<APIFetchResult> {
  const fullConfig: FetcherAPIConfig = {
    service: config.service || 'auto',
    apiKeys: config.apiKeys || {},
    enableFallback: config.enableFallback ?? true,
    timeout: config.timeout || 30000,
    waitForJs: config.waitForJs || 2000,
  };

  console.log(`🌐 Fetching ${url} with API-based fetcher (service: ${fullConfig.service})`);

  // Build service chain based on config
  const serviceChain = buildServiceChain(fullConfig);

  let lastError: Error | null = null;

  for (const service of serviceChain) {
    try {
      console.log(`📡 Trying ${service}...`);
      const result = await fetchWithService(url, service, fullConfig);
      console.log(`✅ Successfully fetched with ${service}`);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️ ${service} failed:`, lastError.message);
      
      if (!fullConfig.enableFallback) {
        throw lastError;
      }
      // Continue to next service in chain
    }
  }

  throw new Error(
    `All fetch services failed. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Build the service chain based on configuration
 */
function buildServiceChain(config: FetcherAPIConfig): FetcherServiceType[] {
  if (config.service !== 'auto') {
    // If specific service requested, put it first, then fallbacks
    const chain: FetcherServiceType[] = [config.service];
    
    if (config.enableFallback) {
      // Add other services as fallbacks
      if (config.service !== 'firecrawl' && config.apiKeys.firecrawl) {
        chain.push('firecrawl');
      }
      if (config.service !== 'jina') {
        chain.push('jina');
      }
      if (config.service !== 'scrapingbee' && config.apiKeys.scrapingbee) {
        chain.push('scrapingbee');
      }
      chain.push('cors-proxy');
    }
    
    return chain;
  }

  // Auto mode: prioritize based on available API keys
  const chain: FetcherServiceType[] = [];
  
  // Firecrawl first if key available (best HTML+CSS extraction)
  if (config.apiKeys.firecrawl) {
    chain.push('firecrawl');
  }
  
  // Jina is always available (no API key needed)
  chain.push('jina');
  
  // ScrapingBee if key available
  if (config.apiKeys.scrapingbee) {
    chain.push('scrapingbee');
  }
  
  // CORS proxy as last resort
  chain.push('cors-proxy');
  
  return chain;
}

/**
 * Fetch with a specific service
 */
async function fetchWithService(
  url: string,
  service: FetcherServiceType,
  config: FetcherAPIConfig
): Promise<APIFetchResult> {
  switch (service) {
    case 'firecrawl':
      return fetchWithFirecrawl(url, config);
    case 'jina':
      return fetchWithJina(url, config);
    case 'scrapingbee':
      return fetchWithScrapingBee(url, config);
    case 'browserless':
      return fetchWithBrowserless(url, config);
    case 'cors-proxy':
      return fetchWithCORSProxy(url, config);
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

// ============================================================================
// FIRECRAWL IMPLEMENTATION
// ============================================================================

/**
 * Fetch using Firecrawl API
 * https://firecrawl.dev/
 * 
 * Features:
 * - Full JS rendering
 * - Returns HTML + rawHtml
 * - Can extract specific tags
 * - 500 free credits/month
 */
async function fetchWithFirecrawl(
  url: string,
  config: FetcherAPIConfig
): Promise<APIFetchResult> {
  const apiKey = config.apiKeys.firecrawl;
  if (!apiKey) {
    throw new Error('Firecrawl API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'rawHtml', 'markdown'],
        waitFor: config.waitForJs,
        includeTags: ['style', 'link'],
        onlyMainContent: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Firecrawl request failed');
    }

    const html = data.data?.rawHtml || data.data?.html || '';
    const markdown = data.data?.markdown || '';

    // Extract CSS from HTML
    const css = extractCSSFromHTML(html, url);
    const colors = extractColorsFromContent(html, css);
    const title = extractTitle(html) || data.data?.metadata?.title || 'Untitled';

    return {
      url,
      title,
      html,
      css,
      markdown,
      colors,
      serviceUsed: 'firecrawl',
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// JINA READER IMPLEMENTATION
// ============================================================================

/**
 * Fetch using Jina AI Reader
 * https://jina.ai/reader/
 * 
 * Features:
 * - FREE (no API key required)
 * - Renders JavaScript
 * - Returns clean markdown content
 * - Good for content extraction
 */
async function fetchWithJina(
  url: string,
  config: FetcherAPIConfig
): Promise<APIFetchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    // Jina Reader API - just prefix the URL
    const jinaUrl = `https://r.jina.ai/${url}`;

    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        // Optional: Use API key for higher rate limits
        // 'Authorization': 'Bearer jina_xxx',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Jina HTTP ${response.status}: ${response.statusText}`);
    }

    const markdown = await response.text();

    // Jina returns markdown, we need to also fetch HTML for CSS extraction
    // Try fetching HTML separately using CORS proxy as supplement
    let html = '';
    let css = '';

    try {
      const htmlResult = await fetchHTMLWithCORSProxy(url, config.timeout || 30000);
      html = htmlResult.html;
      css = extractCSSFromHTML(html, url);
    } catch (e) {
      console.warn('Could not fetch HTML supplement for Jina:', e);
      // Continue with markdown only
    }

    const colors = extractColorsFromContent(html || markdown, css);
    const title = extractTitleFromMarkdown(markdown) || extractTitle(html) || 'Untitled';

    return {
      url,
      title,
      html,
      css,
      markdown,
      colors,
      serviceUsed: 'jina',
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// SCRAPINGBEE IMPLEMENTATION
// ============================================================================

/**
 * Fetch using ScrapingBee API
 * https://www.scrapingbee.com/
 * 
 * Features:
 * - Full JS rendering
 * - Returns complete HTML
 * - 1000 free API calls
 * - Premium proxy option for difficult sites
 */
async function fetchWithScrapingBee(
  url: string,
  config: FetcherAPIConfig
): Promise<APIFetchResult> {
  const apiKey = config.apiKeys.scrapingbee;
  if (!apiKey) {
    throw new Error('ScrapingBee API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      url: url,
      render_js: 'true',
      premium_proxy: 'false', // Set to true for difficult sites (uses 10 credits)
      wait: String(config.waitForJs),
    });

    const response = await fetch(
      `https://app.scrapingbee.com/api/v1/?${params.toString()}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ScrapingBee HTTP ${response.status}: ${errorText}`);
    }

    const html = await response.text();
    const css = extractCSSFromHTML(html, url);
    const colors = extractColorsFromContent(html, css);
    const title = extractTitle(html) || 'Untitled';

    return {
      url,
      title,
      html,
      css,
      colors,
      serviceUsed: 'scrapingbee',
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// BROWSERLESS IMPLEMENTATION
// ============================================================================

/**
 * Fetch using Browserless API
 * https://browserless.io/
 * 
 * Features:
 * - Full Puppeteer/Playwright compatibility
 * - Can get screenshots, PDFs
 * - 6 hours free/month
 */
async function fetchWithBrowserless(
  url: string,
  config: FetcherAPIConfig
): Promise<APIFetchResult> {
  const apiKey = config.apiKeys.browserless;
  if (!apiKey) {
    throw new Error('Browserless API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(
      `https://chrome.browserless.io/content?token=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          waitFor: config.waitForJs,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browserless HTTP ${response.status}: ${errorText}`);
    }

    const html = await response.text();
    const css = extractCSSFromHTML(html, url);
    const colors = extractColorsFromContent(html, css);
    const title = extractTitle(html) || 'Untitled';

    return {
      url,
      title,
      html,
      css,
      colors,
      serviceUsed: 'browserless',
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// CORS PROXY FALLBACK
// ============================================================================

/**
 * Fetch using CORS proxies (existing implementation)
 */
async function fetchWithCORSProxy(
  url: string,
  config: FetcherAPIConfig
): Promise<APIFetchResult> {
  const result = await fetchHTMLWithCORSProxy(url, config.timeout || 30000);
  const css = await fetchCSSWithCORSProxy(url, result.html);
  const colors = extractColorsFromContent(result.html, css);

  return {
    url,
    title: result.title,
    html: result.html,
    css,
    colors,
    serviceUsed: 'cors-proxy',
  };
}

/**
 * Helper to fetch HTML using CORS proxies
 */
async function fetchHTMLWithCORSProxy(
  url: string,
  timeout: number
): Promise<{ html: string; title: string }> {
  let lastError: Error | null = null;

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxiedUrl = CORS_PROXIES[i] + encodeURIComponent(url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(proxiedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const title = extractTitle(html) || 'Untitled';

      return { html, title };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(`All CORS proxies failed: ${lastError?.message}`);
}

/**
 * Fetch external CSS files using CORS proxies
 */
async function fetchCSSWithCORSProxy(baseUrl: string, html: string): Promise<string> {
  let allCSS = '';

  // Extract inline styles
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    allCSS += match[1] + '\n\n';
  }

  // Extract external stylesheet URLs
  const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi;
  const stylesheetUrls: string[] = [];

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    try {
      const absoluteUrl = new URL(href, baseUrl).href;
      stylesheetUrls.push(absoluteUrl);
    } catch (e) {
      console.warn(`Invalid stylesheet URL: ${href}`);
    }
  }

  // Fetch external stylesheets (limit to 10)
  const proxyIndex = 0;
  for (let i = 0; i < Math.min(stylesheetUrls.length, 10); i++) {
    try {
      const proxiedUrl = CORS_PROXIES[proxyIndex] + encodeURIComponent(stylesheetUrls[i]);
      const response = await fetch(proxiedUrl);
      
      if (response.ok) {
        const css = await response.text();
        allCSS += `\n/* External: ${stylesheetUrls[i]} */\n${css.slice(0, 100000)}\n`;
      }
    } catch (e) {
      console.warn(`Failed to fetch CSS: ${stylesheetUrls[i]}`);
    }
  }

  return allCSS;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract CSS from HTML content
 */
function extractCSSFromHTML(html: string, baseUrl: string): string {
  let css = '';

  // Extract inline styles
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    css += match[1] + '\n\n';
  }

  return css;
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract title from markdown content
 */
function extractTitleFromMarkdown(markdown: string): string | null {
  // Look for first H1 heading
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Extract colors from HTML and CSS
 */
function extractColorsFromContent(html: string, css: string): string[] {
  const colorSet = new Set<string>();
  const colorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b|rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)|rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/g;

  const content = html + '\n' + css;
  let match;

  while ((match = colorRegex.exec(content)) !== null) {
    const color = normalizeColor(match[0]);
    if (color) colorSet.add(color);
  }

  return Array.from(colorSet).slice(0, 50);
}

/**
 * Normalize color to hex format
 */
function normalizeColor(color: string): string | null {
  color = color.trim().toLowerCase();

  // Already hex (6 digits)
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color.toUpperCase();
  }

  // 3-digit hex
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }

  // rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    if (r <= 255 && g <= 255 && b <= 255) {
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }
  }

  return null;
}

// ============================================================================
// CONFIGURATION HELPERS
// ============================================================================

/**
 * Get default configuration based on available API keys
 */
export function getDefaultFetcherConfig(apiKeys: FetcherAPIConfig['apiKeys']): FetcherAPIConfig {
  // Determine best service based on available keys
  let preferredService: FetcherServiceType = 'auto';
  
  if (apiKeys.firecrawl) {
    preferredService = 'firecrawl';
  } else if (apiKeys.scrapingbee) {
    preferredService = 'scrapingbee';
  } else {
    preferredService = 'jina'; // Free, always available
  }

  return {
    service: preferredService,
    apiKeys,
    enableFallback: true,
    timeout: 30000,
    waitForJs: 2000,
  };
}

/**
 * Check which services are available based on API keys
 */
export function getAvailableServices(apiKeys: FetcherAPIConfig['apiKeys']): {
  service: FetcherServiceType;
  available: boolean;
  requiresKey: boolean;
  description: string;
}[] {
  return [
    {
      service: 'firecrawl',
      available: !!apiKeys.firecrawl,
      requiresKey: true,
      description: 'Firecrawl - Best HTML+CSS extraction (500 free/month)',
    },
    {
      service: 'jina',
      available: true, // Always available
      requiresKey: false,
      description: 'Jina Reader - Free, no API key required',
    },
    {
      service: 'scrapingbee',
      available: !!apiKeys.scrapingbee,
      requiresKey: true,
      description: 'ScrapingBee - Full JS rendering (1000 free calls)',
    },
    {
      service: 'browserless',
      available: !!apiKeys.browserless,
      requiresKey: true,
      description: 'Browserless - Full browser control (6 free hours/month)',
    },
    {
      service: 'cors-proxy',
      available: true, // Always available as fallback
      requiresKey: false,
      description: 'CORS Proxy - Basic HTML fetch (no JS rendering)',
    },
  ];
}
