# Quick Start Guide

Get up and running with the Catppuccin Theme Generator in 5 minutes!

## Step 1: Get Your AI API Key

Pick ONE AI provider (all have free options):

### Option A: OpenRouter (Recommended - Free Models Available)
1. Visit [openrouter.ai](https://openrouter.ai/)
2. Sign up for a free account
3. Copy your API key
4. **Free Models Available**:
   - DeepSeek R1 Distill Llama 70B
   - Llama 3.2 11B Vision
   - Google Gemma 2 9B

### Option B: Chutes AI
1. Visit [chutes.ai](https://chutes.ai/)
2. Sign up and get API key
3. Free tier available

### Option C: Ollama (No API Key Required!)
1. **Local Option**: Install [Ollama](https://ollama.com/) and run locally
   ```bash
   ollama pull llama3.2
   ```
2. **Cloud Option**: Use a cloud Ollama instance URL
3. No API key needed for local setup!

---

## Step 2: Install & Run Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/catppuccin-stylus-generator.git
cd catppuccin-stylus-generator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Step 3: Crawl a URL

- Paste any public URL into the Generate card.
- For JS-heavy sites, run the bundled Playwright crawler (optional):
  ```bash
  npm run crawler:serve             # defaults to http://localhost:8787/crawl
  # env: CRAWLER_PORT=8787 CRAWLER_KEY=your-token CRAWLER_TIMEOUT=60000
  ```
  Then paste `http://localhost:8787/crawl` (or your tunnel) + API key into **API Key Configuration → Playwright Crawler**.
  If you want richer CSS/class discovery and the site works without JS, you can skip Playwright and use the built-in HTTP fetch.

---

## Step 4: Generate Your Theme

1. **Provide the URL**
   - Enter the site address and ensure the Playwright crawler is running if you need full rendering.

2. **Configure AI Provider**
   - Select provider: OpenRouter, Chutes, or Ollama
   - Enter API key (or Ollama URL for local)
   - Choose AI model (recommend free models to start)

3. **Select Accent Color** (Optional)
   - Pick from 15 Catppuccin accents
   - Blue, Lavender, Mauve, Pink, Red, etc.
   - Skip to auto-detect from website

4. **Generate Theme**
   - Click "Generate Theme"
   - Watch AI thinking process (20-60 seconds)
   - Preview generated themes

5. **Download & Install**
   - Download `.user.less` file (for Stylus extension)
   - Or download `.styl`, `.less`, `.css` formats
   - Install in your browser's Stylus extension
   - Enjoy your Catppuccin theme!

---

## Step 5: Deploy to GitHub Pages (Optional)

1. **Update repository name in `vite.config.ts`**
   ```typescript
   base: '/your-repo-name/',
   ```

2. **Enable GitHub Pages**
   - Go to repository **Settings → Pages**
   - Source: **GitHub Actions**
   - Push your code - automatic deployment!

3. **Access your app**
   - `https://yourusername.github.io/your-repo-name/`

---

## 🎨 Tips for Best Results

- **Start simple**: Try well-structured sites like GitHub or documentation sites
- **Use free models**: Free OpenRouter models work great for most sites
- **Run Playwright**: If a site needs JS rendering or blocks proxies, use the Playwright crawler endpoint
- **Local AI**: Ollama is perfect for privacy and no API costs
- **Save your keys**: Keys stored in browser localStorage (never sent anywhere except to your chosen AI provider)

---

## 🔧 Troubleshooting

### "Failed to fetch website" error
- **Enable Playwright**: Start `npm run crawler:serve` and set the endpoint
- **Check URL**: Ensure it's a valid public URL
- **Adjust timeout**: For slow sites, run `CRAWLER_TIMEOUT=90000 npm run crawler:serve`

### "AI analysis failed" error
- Check your API key is correct
- Try a different AI model
- Free models may have rate limits - wait and retry

### Generated theme looks wrong
- Try a different AI model (results vary)
- Ensure Playwright crawler is running for JS-heavy pages
- If class coverage drops with Playwright (blocked external CSS), retry with HTTP-only fetch
- Check Palette Diagnostics for contrast warnings; the generator will auto-fallback to safer text colors when needed. Class colors favor role guesses (CTA → accent, nav/link → bi-accent1, badge/tag → bi-accent2) to keep variety.
- Some sites have complex styling that needs manual tweaking

### Blank page after deployment
- Check `base` path in `vite.config.ts` matches your repo name
- Verify GitHub Pages is enabled
- Check browser console for errors

---

## 📖 Common Use Cases

### 1. Theme Your Personal Website
```
Input: Direct URL (https://yoursite.com)
Output: CSS format
Usage: Import the CSS into your site
```

### 2. Create Stylus Browser Extension Theme
```
Input: URL of target site (Playwright crawler optional)
Output: UserStyle (.user.less) format
Usage: Install in Stylus browser extension
```

---

## 🚀 Next Steps

- Read the full [README.md](README.md) for architecture details
- Check [docs/refactor-plan.md](docs/refactor-plan.md) for the latest implementation guide
- Explore [Catppuccin documentation](https://github.com/catppuccin/catppuccin)
- Customize generated themes to your needs
- Share your themes with the community!

---

## 💡 Pro Tips

1. **Accent Color Selection**:
   - Blue/Sapphire: Professional sites
   - Pink/Mauve: Creative/design sites
   - Green: Developer tools
   - Red/Maroon: Bold/energetic sites

2. **AI Model Selection**:
   - Free models (DeepSeek, Llama): Great for most sites
   - Premium models (Claude, GPT-4): Complex sites with many colors
   - Local Ollama: Maximum privacy, no API costs

3. **Crawling Tips**:
   - URL + HTTP proxy: Works for most public sites
   - Playwright crawler: Capture JS-heavy/interactive pages

4. **Output Format Selection**:
   - UserStyle: Browser extension themes (most common)
   - Stylus/LESS: Preprocessor workflows
   - CSS: Direct stylesheet import

---

## 🆘 Need Help?

- Open an issue on [GitHub](https://github.com/yourusername/catppuccin-stylus-generator/issues)
- Check existing issues for solutions
- Read troubleshooting in [README.md](README.md)
- Join the [Catppuccin Discord](https://discord.gg/catppuccin) community

---

**Built with ❤️ using the [Catppuccin](https://github.com/catppuccin/catppuccin) color palette**
