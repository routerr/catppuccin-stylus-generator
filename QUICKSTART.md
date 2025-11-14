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

## Step 3: Choose Your Input Method

The app supports **3 ways** to provide website content:

### Method 1: Direct URL (Easiest)
- Enter any public website URL
- Direct fetch - no external crawler needed!
- Example: `https://github.com`

### Method 2: MHTML Upload
- Save webpage in Chrome: `File → Save As → Webpage, Complete (.mhtml)`
- Upload the `.mhtml` file
- Works offline, bypasses CORS issues

### Method 3: Directory Upload
- Upload complete website directory with HTML/CSS files
- Best for local testing and detailed CSS analysis
- Supports multiple HTML files and stylesheets

---

## Step 4: Generate Your Theme

1. **Select Input Method**
   - Choose URL, MHTML, or Directory tab
   - Provide your content

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
- **MHTML for CORS**: If URL fetch fails due to CORS, use MHTML upload
- **Local AI**: Ollama is perfect for privacy and no API costs
- **Save your keys**: Keys stored in browser localStorage (never sent anywhere except to your chosen AI provider)

---

## 🔧 Troubleshooting

### "Failed to fetch website" error
- **CORS issue**: Use MHTML upload instead
- **Private site**: Upload directory or MHTML
- **Check URL**: Ensure it's a valid public URL

### "AI analysis failed" error
- Check your API key is correct
- Try a different AI model
- Free models may have rate limits - wait and retry

### Generated theme looks wrong
- Try a different AI model (results vary)
- Use directory upload for better CSS analysis
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
Input: URL or MHTML of target site
Output: UserStyle (.user.less) format
Usage: Install in Stylus browser extension
```

### 3. Local Development Testing
```
Input: Directory upload (your local site folder)
Output: All formats (Stylus/LESS/CSS)
Usage: Test themes before deployment
```

### 4. Offline Theme Generation
```
Input: MHTML file (saved webpage)
Output: Any format
Usage: Work without internet or bypass CORS
```

---

## 🚀 Next Steps

- Read the full [README.md](README.md) for architecture details
- Check [AGENTS.md](AGENTS.md) for implementation guide
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

3. **Input Method Selection**:
   - URL: Quick generation for public sites
   - MHTML: CORS issues or offline work
   - Directory: Local development, detailed CSS

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
