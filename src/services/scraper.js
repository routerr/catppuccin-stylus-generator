export const scrapeUrl = async (scraper, url, apiKey) => {
  console.log(`Scraping ${url} with ${scraper}`);

  try {
    if (scraper === 'Browserbase') {
      const response = await fetch('https://api.browserbase.com/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error(`Browserbase API error: ${response.statusText}`);
      const data = await response.json();
      return data.html;
    } else if (scraper === 'Exa Search') {
      const response = await fetch('https://api.exa.ai/contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error(`Exa Search API error: ${response.statusText}`);
      const data = await response.json();
      return data.results[0].html;
    } else if (scraper === 'Firecrawl') {
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error(`Firecrawl API error: ${response.statusText}`);
      const data = await response.json();
      return data.data.html;
    } else if (scraper === 'Brave Search') {
        throw new Error('Brave Search does not support direct URL scraping. Please choose another service.');
    }
  } catch (error) {
    console.error(error);
    throw error;
  }

  throw new Error('Invalid scraper service selected');
};
