import type { CrawlerResult } from '../../types/theme';

export async function crawlWithFirecrawl(
  url: string,
  apiKey: string
): Promise<CrawlerResult> {
  try {
    // Firecrawl API - web scraping service
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      url,
      title: data.metadata?.title || 'Untitled',
      content: data.markdown || data.content || '',
      html: data.html,
      colors: extractColorsFromHTML(data.html || ''),
    };
  } catch (error) {
    throw new Error(`Failed to crawl with Firecrawl: ${error}`);
  }
}

function extractColorsFromHTML(html: string): string[] {
  const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
  const colors = html.match(colorRegex) || [];
  return [...new Set(colors)].slice(0, 50);
}
