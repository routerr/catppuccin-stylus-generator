Ollama from GitHub Pages (HTTPS)
================================

Static hosting (e.g., GitHub Pages) cannot reach your `http://localhost:11434` due to HTTPS mixed content and CORS. Use one of these options:

Option A: HTTPS tunnel (recommended)
------------------------------------
1) Start Ollama with CORS for your page origin:

   OLLAMA_ORIGINS="https://<your-gh-username>.github.io" ollama serve

2) Expose with a tunnel (ngrok example):

   ngrok http 11434

3) Copy the `https://...ngrok.io` URL into the app’s “Custom Ollama URL”.

Option B: Cloudflare Worker proxy
---------------------------------
Deploy this Worker and set `UPSTREAM` to your tunnel URL (HTTPS). It adds CORS and forwards `/api/*`.

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });
    const upstream = env.UPSTREAM; // e.g., https://your-tunnel.example.com
    const target = upstream.replace(/\/$/, '') + url.pathname;
    const res = await fetch(target, { method: request.method, headers: request.headers, body: request.body });
    const cors = { 'Access-Control-Allow-Origin': url.origin, 'Access-Control-Allow-Headers': '*' };
    return new Response(res.body, { status: res.status, headers: { ...Object.fromEntries(res.headers), ...cors } });
  }
}
```

Option C: Netlify Function proxy
--------------------------------
Create `netlify/functions/ollama.js`:

```js
export async function handler(event) {
  const upstream = process.env.UPSTREAM; // https tunnel
  const path = event.path.replace(/^\/\.netlify\/functions\/ollama/, '');
  const url = upstream.replace(/\/$/, '') + path;
  const res = await fetch(url, { method: event.httpMethod, headers: event.headers, body: event.body });
  return { statusCode: res.status, headers: { 'Access-Control-Allow-Origin': event.headers.origin || '*', ...Object.fromEntries(res.headers) }, body: await res.text() };
}
```

Option D: Vercel API Route proxy
--------------------------------
Create `api/ollama.ts`:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const upstream = process.env.UPSTREAM as string; // https tunnel
  const target = upstream.replace(/\/$/, '') + (req.url || '').replace(/^\/api\/ollama/, '');
  const r = await fetch(target, { method: req.method, headers: req.headers as any, body: req.method === 'GET' ? undefined : req.body });
  res.status(r.status);
  r.headers.forEach((v, k) => res.setHeader(k, v));
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.send(await r.text());
}
```

Then set the app’s Custom Ollama URL to your deployed proxy (`https://<your-app>/api/ollama`).

