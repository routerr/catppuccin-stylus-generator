// Direct HTTP/HTTPS fetcher - replaces crawler services
// Fetches HTML, CSS, and extracts color information directly

export interface FetchResult {
  url: string;
  title: string;
  html: string;
  css: string[];
  colors: string[];
  error?: string;
}

// CORS proxy options - we need these because browsers block direct cross-origin requests
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

let currentProxyIndex = 0;

export async function fetchWebsiteContent(url: string): Promise<FetchResult> {
  // Try multiple CORS proxies if one fails
  let lastError: Error | null = null;

  for (let proxyAttempt = 0; proxyAttempt < CORS_PROXIES.length; proxyAttempt++) {
    try {
      currentProxyIndex = proxyAttempt;
      const proxiedUrl = CORS_PROXIES[currentProxyIndex] + encodeURIComponent(url);

      console.log(`Attempting fetch with proxy ${proxyAttempt + 1}/${CORS_PROXIES.length}:`, CORS_PROXIES[currentProxyIndex]);

      const response = await fetch(proxiedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // If we got here, the fetch was successful
      console.log(`Successfully fetched with proxy ${proxyAttempt + 1}`);
      return await processHTML(html, url);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Proxy ${proxyAttempt + 1} failed:`, lastError.message);
      // Continue to next proxy
    }
  }

  // All proxies failed
  throw new Error(
    `Failed to fetch website after trying ${CORS_PROXIES.length} CORS proxies. ` +
    `Last error: ${lastError?.message || 'Unknown error'}. ` +
    `The website may be blocking proxy requests or is temporarily unavailable.`
  );
}

async function processHTML(html: string, url: string): Promise<FetchResult> {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

  // Extract CSS links
  const cssLinks = extractCSSLinks(html, url);

  // Fetch external CSS files
  const cssContents = await fetchCSSFiles(cssLinks);

  // Extract inline styles
  const inlineStyles = extractInlineStyles(html);

  // Combine all CSS
  const allCSS = [...cssContents, ...inlineStyles];

  // Extract colors from HTML and CSS
  const colors = extractColors(html, allCSS);

  return {
    url,
    title,
    html: html.slice(0, 50000), // Limit HTML size
    css: allCSS,
    colors,
  };
}

function extractCSSLinks(html: string, baseUrl: string): string[] {
  const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi;
  const links: string[] = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const absoluteUrl = new URL(href, baseUrl).href;
    links.push(absoluteUrl);
  }

  return links.slice(0, 10); // Limit to 10 CSS files
}

async function fetchCSSFiles(urls: string[]): Promise<string[]> {
  const cssContents: string[] = [];

  for (const url of urls) {
    try {
      // Use CORS proxy for CSS files too
      const proxiedUrl = CORS_PROXIES[currentProxyIndex] + encodeURIComponent(url);
      const response = await fetch(proxiedUrl);
      if (response.ok) {
        const css = await response.text();
        cssContents.push(css.slice(0, 100000)); // Limit CSS size
      }
    } catch (error) {
      // Skip failed CSS files
      console.warn(`Failed to fetch CSS: ${url}`, error);
    }
  }

  return cssContents;
}

function extractInlineStyles(html: string): string[] {
  const styles: string[] = [];

  // Extract <style> tags
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;

  while ((match = styleRegex.exec(html)) !== null) {
    styles.push(match[1]);
  }

  return styles;
}

function extractColors(html: string, cssArray: string[]): string[] {
  const colorSet = new Set<string>();
  const colorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b|rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)|rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/g;

  // Extract from HTML
  let match;
  while ((match = colorRegex.exec(html)) !== null) {
    const color = normalizeColor(match[0]);
    if (color) colorSet.add(color);
  }

  // Extract from CSS
  const allCSS = cssArray.join('\n');
  while ((match = colorRegex.exec(allCSS)) !== null) {
    const color = normalizeColor(match[0]);
    if (color) colorSet.add(color);
  }

  return Array.from(colorSet).slice(0, 50); // Limit to 50 unique colors
}

function normalizeColor(color: string): string | null {
  color = color.trim().toLowerCase();

  // Already hex
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color.toUpperCase();
  }

  // Convert 3-digit hex to 6-digit
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }

  // Convert rgb/rgba to hex
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
