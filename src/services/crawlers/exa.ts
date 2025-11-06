import type { CrawlerResult } from '../../types/theme';

export async function crawlWithExa(
  url: string,
  apiKey: string
): Promise<CrawlerResult> {
  try {
    // Exa Search API - intelligent content extraction
    const response = await fetch('https://api.exa.ai/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        urls: [url],
        text: {
          maxCharacters: 10000,
          includeHtmlTags: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.results?.[0];

    if (!result) {
      throw new Error('No content returned from Exa');
    }

    return {
      url,
      title: result.title || 'Untitled',
      content: result.text || '',
      html: result.html,
      colors: extractColorsFromText(result.text || ''),
    };
  } catch (error) {
    throw new Error(`Failed to crawl with Exa: ${error}`);
  }
}

function extractColorsFromText(text: string): string[] {
  const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g;
  const colors = text.match(colorRegex) || [];
  return [...new Set(colors)].slice(0, 50);
}
