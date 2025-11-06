# AI Providers

The Catppuccin Stylus generator supports two AI inference backends. Provide keys via `.env` or
in the UI before generating themes.

## OpenRouter

- **Env var:** `VITE_OPENROUTER_API_KEY`
- **Free models:** `openrouter/auto` uses OpenRouter's community free tier when available.
- **Notes:** Requests target `https://openrouter.ai/api/v1/chat/completions` with the Chat
  Completions schema.

## Chutes

- **Env var:** `VITE_CHUTES_API_KEY`
- **Free models:** `chutes/free` exposes the platform's beta tier without billing.
- **Notes:** Requests target `https://api.chutes.ai/v1/chat/completions`.

Both providers expect JSON-mode responses and must return a dictionary with `latte`, `frappe`,
`macchiato`, and `mocha` keys. Missing keys fall back to the raw payload string.
