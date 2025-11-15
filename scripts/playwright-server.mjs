import http from 'http';
import { chromium } from 'playwright';

const PORT = Number(process.env.CRAWLER_PORT || process.env.PORT || 8787);
const AUTH_KEY = process.env.CRAWLER_KEY;

async function crawl(url) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const html = await page.content();
    const title = await page.title();
    const styles = await page.evaluate(() => {
      const collected = [];
      for (const style of document.querySelectorAll('style')) {
        collected.push(style.textContent || '');
      }
      const sheets = Array.from(document.styleSheets || []);
      for (const sheet of sheets) {
        try {
          const rules = sheet.cssRules || [];
          collected.push(Array.from(rules).map(rule => rule.cssText).join('\n'));
        } catch {
          // Ignore cross-origin styles
        }
      }
      return collected;
    });
    return { html, title, styles };
  } finally {
    await browser.close();
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || !req.url?.startsWith('/crawl')) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  if (AUTH_KEY) {
    const authHeader = req.headers.authorization || '';
    const provided = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!provided || provided !== AUTH_KEY) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
  }

  let payload = '';
  req.on('data', chunk => {
    payload += chunk;
  });

  req.on('end', async () => {
    try {
      const body = JSON.parse(payload || '{}');
      if (!body?.url) {
        throw new Error('Missing "url" field');
      }
      const result = await crawl(body.url);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ url: body.url, ...result }));
    } catch (err) {
      console.error('Crawler error:', err);
      let message = err?.message || 'Crawler error';
      if (message.includes('executable doesn\'t exist')) {
        message = 'Playwright Chromium browser is not installed. Run "npx playwright install chromium" (or --with-deps on Linux) and restart npm run crawler:serve.';
      } else if (message.includes('Failed to launch') && message.includes('sandbox')) {
        message = 'Chromium could not launch due to sandbox restrictions. Try running inside a terminal with sandbox support or configure Playwright to run with --no-sandbox.';
      }
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Playwright crawler listening on http://localhost:${PORT}/crawl`);
  if (AUTH_KEY) {
    console.log('Authorization required (Bearer token).');
  }
});
