# Catppuccin Theme Generator - Project Plan

## Overview
A web application that analyzes any website's color scheme and generates Catppuccin-themed stylesheets in multiple formats (Stylus, LESS, CSS).

## Architecture

### Frontend (React 19 + Vite)
- **Client-side only** - All API calls made from browser
- Deployed on **GitHub Pages**
- No backend server required (user provides API keys in UI)

### Processing Chain
```
URL Input → Crawler API → Website Content → AI Analysis → Color Mapping → Theme Generation → JSON Export
```

## Features

### 1. Crawler Integration (User chooses one)
- **Browserbase** - Browser automation with stealth
- **Exa Search** - AI-powered search and content extraction
- **Firecrawl** - Web scraping API
- **Brave Search** - Search API with web content

User provides their own API key for selected service.

### 2. AI Provider Integration (User chooses one)
- **OpenRouter**
  - Free models: `meta-llama/llama-3.2-11b-vision-instruct:free`, `google/gemma-2-9b-it:free`
  - Paid models available
- **Chutes** (need to research available free models)

User provides their own API key and selects model.

### 3. Catppuccin Themes
Four flavors:
- **Latte** (Light theme)
- **Frappé** (Medium dark)
- **Macchiato** (Dark)
- **Mocha** (Darkest)

Each flavor has 26 colors including base colors and accents.

### 4. Accent Colors (15 options)
Rosewater, Flamingo, Pink, Mauve, Red, Maroon, Peach, Yellow, Green, Teal, Sky, Sapphire, Blue, Lavender, Gray

User can select which accent(s) to emphasize in theme generation.

### 5. Theme Generation
**AI Task**: Analyze website colors and map them to Catppuccin palette

**Output formats**:
- Stylus (.styl)
- LESS (.less)
- CSS (custom properties)

**Output**: Single JSON file containing all formats and themes

## Project Structure
```
catppuccin-stylus-generator/
├── src/
│   ├── components/
│   │   ├── URLInput.tsx
│   │   ├── APIKeyConfig.tsx
│   │   ├── CrawlerSelector.tsx
│   │   ├── AIProviderSelector.tsx
│   │   ├── AccentSelector.tsx
│   │   ├── ThemePreview.tsx
│   │   └── ExportButton.tsx
│   ├── services/
│   │   ├── crawlers/
│   │   │   ├── browserbase.ts
│   │   │   ├── exa.ts
│   │   │   ├── firecrawl.ts
│   │   │   └── brave.ts
│   │   ├── ai/
│   │   │   ├── openrouter.ts
│   │   │   └── chutes.ts
│   │   └── generators/
│   │       ├── stylus.ts
│   │       ├── less.ts
│   │       └── css.ts
│   ├── types/
│   │   ├── catppuccin.ts
│   │   └── theme.ts
│   ├── constants/
│   │   └── catppuccin-colors.ts
│   ├── utils/
│   │   ├── color-analysis.ts
│   │   └── theme-builder.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Implementation Steps

### Phase 1: Setup
1. Initialize Vite + React 19 project
2. Set up TypeScript
3. Install dependencies (React, Vite, TailwindCSS, etc.)
4. Configure GitHub Pages deployment

### Phase 2: Catppuccin Foundation
1. Define Catppuccin color palettes (all 4 flavors)
2. Create TypeScript types for themes
3. Set up color constants

### Phase 3: Crawler Integration
1. Implement Browserbase client
2. Implement Exa Search client
3. Implement Firecrawl client
4. Implement Brave Search client
5. Create unified crawler interface

### Phase 4: AI Integration
1. Implement OpenRouter client with free models
2. Implement Chutes client with free models
3. Create prompt engineering for color analysis
4. Build color mapping logic

### Phase 5: Theme Generation
1. Build Stylus generator
2. Build LESS generator
3. Build CSS generator
4. Create JSON packer

### Phase 6: UI Components
1. URL input with validation
2. API key configuration panel
3. Crawler service selector
4. AI provider & model selector
5. Accent color selector (multi-select)
6. Theme preview panel
7. Export button with download

### Phase 7: Testing & Documentation
1. Test with various websites
2. Write comprehensive README
3. Create deployment guide
4. Add usage examples

## API Endpoints & Documentation

### Crawlers
- **Browserbase**: https://docs.browserbase.com/
- **Exa Search**: https://docs.exa.ai/
- **Firecrawl**: https://docs.firecrawl.dev/
- **Brave Search**: https://brave.com/search/api/

### AI Providers
- **OpenRouter**: https://openrouter.ai/docs
- **Chutes**: (need to research)

### Catppuccin
- **Repository**: https://github.com/catppuccin/catppuccin
- **Palette**: https://github.com/catppuccin/catppuccin#-palette

## Deployment Strategy

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

### GitHub Pages Deployment
1. Configure `vite.config.ts` with correct base path
2. Build project
3. Deploy `dist/` folder to `gh-pages` branch
4. Enable GitHub Pages in repository settings

Can use GitHub Actions for automated deployment on push.

## Security Considerations
- API keys stored in browser localStorage (encrypted)
- Clear warning to users about key security
- Option to clear keys after use
- No keys sent to any server except intended APIs

## Future Enhancements
- Support for more output formats (SCSS, PostCSS)
- Theme preview with live website simulation
- Batch processing multiple URLs
- Theme sharing/export to GitHub
- Integration with Stylus/Stylelus extension
