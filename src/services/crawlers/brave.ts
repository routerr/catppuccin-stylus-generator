import type { CrawlerResult } from '../../types/theme';

export async function crawlWithBrave(
  url: string,
  apiKey: string
): Promise<CrawlerResult> {
  // Note: Brave Search API has CORS restrictions that prevent direct client-side requests
  // This will not work in a browser environment without a proxy server

  throw new Error(
    'Brave Search is not supported for client-side requests due to CORS restrictions.\n\n' +
    'Please use one of these alternatives:\n' +
    '• Firecrawl (recommended) - https://firecrawl.dev\n' +
    '• Exa Search - https://exa.ai\n' +
    '• Browserbase - https://browserbase.com\n\n' +
    'Note: To use Brave Search, you would need to set up a backend proxy server.'
  );

  /* Original implementation kept for reference if you add a backend proxy:

  try {
    const searchQuery = encodeURIComponent(url);
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${searchQuery}`,
      {
        headers: {
          'X-Subscription-Token': apiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.statusText}`);
    }

    const data = await response.json();
    const webResults = data.web?.results || [];

    const matchingResult = webResults.find((r: any) =>
      r.url === url || r.url.includes(new URL(url).hostname)
    );

    if (!matchingResult && webResults.length === 0) {
      throw new Error('No results found from Brave Search');
    }

    const result = matchingResult || webResults[0];

    return {
      url,
      title: result.title || 'Untitled',
      content: result.description || '',
      colors: [],
    };
  } catch (error) {
    throw new Error(`Failed to crawl with Brave: ${error}`);
  }
  */
}
