# Deploying the Playwright Crawler (HTTPS)

You can host the bundled Playwright crawler on Render with a single click. This gives you an HTTPS endpoint that the Catppuccin Theme Generator can call directly from the browser.

## 1. Files already in the repo
- `Dockerfile.playwright` – containerized crawler server (installs Chromium + deps).
- `render.yaml` – Render blueprint to create the service automatically.

## 2. One-click deploy on Render
1. Push this repo (with `Dockerfile.playwright` and `render.yaml`) to GitHub.
2. Go to [https://dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**.
3. Paste your repository URL. Render will detect `render.yaml` and show the service definition.
4. Click **Deploy**. Render builds the Dockerfile and provisions an HTTPS endpoint. Once live, note the public URL, e.g. `https://<service>.onrender.com`.

## 3. Configure the app
1. In the Catppuccin Theme Generator UI, open **API Key Configuration → Playwright Crawler**.
2. Set the endpoint to `https://<service>.onrender.com/crawl`.
3. (Optional) Add a `CRAWLER_KEY` env var in Render for security, then fill the same key in the app.

The UI will now use the cloud Playwright server. No local setup required.

Troubleshooting:
- If Render logs show “Chromium browser is not installed”, redeploy (the Dockerfile runs `npx playwright install chromium`).
- Slow cold starts? Playwright needs ~30s for the first launch after idle periods.
