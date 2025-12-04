# Run & Deploy (Quickstart)

> Static frontend: keys for AI/fetcher/crawler live in the browser (localStorage). No server-side secrets required.

## 1) Install & Run Locally

```bash
git clone https://github.com/yourusername/catppuccin-stylus-generator.git
cd catppuccin-stylus-generator
npm install
npm run dev
# open http://localhost:5173
```

## 2) Configure Fetching & AI (in the UI)
- Fetcher: leave on **Auto** (Firecrawl → Jina → ScrapingBee → Browserless → CORS) or pick one; add keys for paid services; Jina works without a key.
- AI: choose OpenRouter/Chutes/Ollama; enter API key (Ollama URL for cloud); default model is `tngtech/deepseek-r1t2-chimera:free` on OpenRouter.
- Optional: toggle AI-assisted selector mapping, accent coverage (badges/cards/tables, alerts), and font overrides.

## 3) Generate & Install
1. Paste a public URL, click **Generate Theme**, view palette diagnostics.
2. Use “Re-run with same crawl” to compare models without refetching.
3. Download/copy the generated `.user.less` (multi-flavor UserStyle) and install in Stylus/Cascadea.

## 4) Deploy (pick one)

### GitHub Pages (recommended)
1. Set `base` in `vite.config.ts` to your repo name (e.g., `/catppuccin-stylus-generator/`).
2. Push to GitHub; enable Pages via Actions; site will be at `https://<user>.github.io/<repo>/`.

### Vercel
```bash
npm install -g vercel
vercel           # follow prompts
vercel --prod    # for production
```
`vercel.json` (optional):
```json
{ "rewrites": [ { "source": "/(.*)", "destination": "/" } ] }
```

### Netlify
```bash
npm run build
netlify deploy --prod   # after netlify login
```
`netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Self-hosted (nginx example)
```bash
npm run build
scp -r dist/* user@server:/var/www/catppuccin-generator/
```
nginx:
```nginx
server {
  listen 80;
  server_name your-domain.com;
  root /var/www/catppuccin-generator;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  gzip on;
  gzip_types text/css application/javascript application/json;
}
```

### Docker (nginx)
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
```bash
docker build -t catppuccin-generator .
docker run -d -p 80:80 catppuccin-generator
```

## 5) Troubleshooting
- Blank page: ensure `base` matches your deployment path and all assets load.
- 404 on refresh: configure SPA fallback (`try_files ... /index.html` or Netlify redirects).
- Build fails: use Node 18+, reinstall deps, run `npm run build`.
- Fetch errors: try Auto fetcher or Jina; add keys for Firecrawl/ScrapingBee/Browserless; CORS limits may apply.
- AI errors: verify key/model; switch models; free tiers may rate-limit.

## Links
- README (architecture/advanced notes)
- Issues: https://github.com/routerr/catppuccin-stylus-generator/issues
