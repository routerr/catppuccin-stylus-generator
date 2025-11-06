import type { CrawlerConfig, CrawlerResult } from '../../types/theme';
import { crawlWithBrowserbase } from './browserbase';
import { crawlWithExa } from './exa';
import { crawlWithFirecrawl } from './firecrawl';
import { crawlWithBrave } from './brave';

export async function crawlWebsite(
  url: string,
  config: CrawlerConfig
): Promise<CrawlerResult> {
  switch (config.service) {
    case 'browserbase':
      return crawlWithBrowserbase(url, config.apiKey);
    case 'exa':
      return crawlWithExa(url, config.apiKey);
    case 'firecrawl':
      return crawlWithFirecrawl(url, config.apiKey);
    case 'brave':
      return crawlWithBrave(url, config.apiKey);
    default:
      throw new Error(`Unknown crawler service: ${config.service}`);
  }
}

export { crawlWithBrowserbase, crawlWithExa, crawlWithFirecrawl, crawlWithBrave };
