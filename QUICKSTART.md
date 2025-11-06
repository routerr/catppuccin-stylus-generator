# Quick Start Guide

Get up and running with the Catppuccin Theme Generator in 5 minutes!

## Step 1: Get Your API Keys

### Crawler Service (Pick ONE)

1. **Firecrawl** (Recommended for beginners)
   - Visit https://firecrawl.dev/
   - Sign up for free account
   - Get API key from dashboard

2. **Exa Search**
   - Visit https://exa.ai/
   - Sign up and get API key

3. **Browserbase**
   - Visit https://browserbase.com/
   - Sign up and get API key

4. **Brave Search**
   - Visit https://brave.com/search/api/
   - Sign up and get API key

### AI Provider (Pick ONE)

1. **OpenRouter** (Recommended - has free models)
   - Visit https://openrouter.ai/
   - Sign up
   - Add credits (optional) or use free models
   - Copy API key

2. **Chutes**
   - Visit https://chutes.ai/
   - Sign up and get API key

## Step 2: Install & Run Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/catppuccin-stylus-generator-claude-code.git
cd catppuccin-stylus-generator-claude-code

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Step 3: Use the Application

1. **Select Services**
   - Choose Firecrawl as crawler
   - Choose OpenRouter as AI provider
   - Select "Llama 3.2 11B Vision (Free)" model

2. **Configure API Keys**
   - Enter your Firecrawl API key
   - Enter your OpenRouter API key
   - Click "Save Keys" (optional - they'll be remembered)

3. **Generate a Theme**
   - Enter a website URL (try: https://github.com)
   - Click "Generate Theme"
   - Wait 30-60 seconds for processing

4. **Download Your Themes**
   - View the 4 generated Catppuccin flavors
   - Download individual .styl, .less, or .css files
   - Or download all as a JSON package

## Step 4: Deploy to GitHub Pages (Optional)

1. **Update repository name in vite.config.ts**
   ```typescript
   base: '/your-repo-name/',
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

3. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Source: GitHub Actions
   - Wait for deployment

## Tips for Best Results

- **Use popular websites**: Well-structured sites work better
- **Try different models**: Results vary by AI model
- **Save your keys**: Click "Save Keys" to avoid re-entering
- **Free models**: Start with free models, upgrade if needed

## Troubleshooting

### "Failed to crawl" error
- Check your API key is correct
- Verify you have credits/quota remaining
- Try a different crawler service

### "Failed to analyze colors" error
- Check your AI provider API key
- Try a different model
- Some free models have rate limits

### Generated themes look wrong
- Try a simpler website first
- Use a different AI model
- Different crawlers extract different content

## Common Use Cases

### 1. Theme Your Personal Site
```bash
# Generate theme from your site
URL: https://yoursite.com
Download: CSS format
Apply: Import the CSS into your site
```

### 2. Create Custom Stylus Theme
```bash
# For Stylus users
URL: https://yoursite.com
Download: Stylus (.styl) format
Use: Import into your Stylus workflow
```

### 3. Batch Multiple Sites
```bash
# Process multiple URLs
For each site:
  - Generate theme
  - Download JSON
  - Combine later
```

## Next Steps

- Read the full [README.md](README.md) for more details
- Check out [Catppuccin documentation](https://github.com/catppuccin/catppuccin)
- Customize the generated themes to your needs
- Share your themes with the community!

## Need Help?

- Open an issue on GitHub
- Check existing issues for solutions
- Read the troubleshooting section in README.md
