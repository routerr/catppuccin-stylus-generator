import type { CrawlerResult } from '../../types/theme';

export async function crawlWithBrowserbase(
  url: string,
  apiKey: string
): Promise<CrawlerResult> {
  try {
    // Browserbase API - creates a browser session and extracts content
    const response = await fetch('https://api.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        url,
        extractContent: true,
        captureScreenshot: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Browserbase API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      url,
      title: data.title || 'Untitled',
      content: data.content || '',
      html: data.html,
      screenshot: data.screenshot,
      colors: extractColorsFromHTML(data.html || ''),
    };
  } catch (error) {
    throw new Error(`Failed to crawl with Browserbase: ${error}`);
  }
}

function extractColorsFromHTML(html: string): string[] {
  const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g;
  const colors = html.match(colorRegex) || [];
  return [...new Set(colors)].slice(0, 50); // Limit to 50 unique colors
}
