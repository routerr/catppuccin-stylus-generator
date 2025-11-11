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
URL Input / MHTML Upload / Directory Upload → Direct HTTP Fetch → Website Content → AI Analysis → Color Mapping → Theme Generation → UserStyle Export
```

## Features

### 1. Content Input Methods
- **Direct URL Fetch** - Direct HTTP/HTTPS requests to fetch website content
- **MHTML Upload** - Upload saved MHTML files for offline analysis
- **Directory Upload** - Upload complete webpage directories for detailed CSS analysis

No external crawler API needed - all processing is done client-side!

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

### 5. Accent System (Analogous Harmony)

**Main Accent**: The primary accent color selected by the user from the Catppuccin palette.

**Bi-accents (±72° Analogous Harmony)**:
- **Calculation**: Two colors at ±72° on the hue wheel from the main-accent
- **Matching**: The nearest Catppuccin palette colors to these raw ±72° hue positions
- **Dual Usage**:
  1. As **main-colors** for different elements (alongside main-accent)
  2. As **gradient companions** for any main-color they're paired with
- **Example**: If Blue is the main-accent, its bi-accents might be Sapphire and Lavender
- **Application**: `background: linear-gradient(blue, sapphire 8%)`

**Main-Colors for Elements**:
- The three analogous colors used as primary colors for different UI elements
- Consists of: **main-accent + bi-accent1 + bi-accent2**
- Example: If main-accent is Blue → main-colors are [Blue, Sapphire, Lavender]
- Each main-color can be used independently on different elements:
  - Blue → Primary buttons, main CTAs
  - Sapphire → Secondary buttons, badges
  - Lavender → Tertiary elements, tags, chips

**Cascading Bi-Accent System**:
```
Element with Blue:
  main-color: Blue
  └─ gradient-bi1: Sapphire (±72° from Blue)
  └─ gradient-bi2: Lavender (±72° from Blue)

Element with Sapphire (Blue's bi-accent1):
  main-color: Sapphire
  └─ gradient-bi1: Sky (±72° from Sapphire)
  └─ gradient-bi2: Blue (±72° from Sapphire)

Element with Lavender (Blue's bi-accent2):
  main-color: Lavender
  └─ gradient-bi1: Mauve (±72° from Lavender)
  └─ gradient-bi2: Pink (±72° from Lavender)
```

**Color Harmony Rules**:
1. Main-colors distributed across elements create visual hierarchy (primary, secondary, tertiary)
2. Each main-color gets its own bi-accents for gradients (analogous harmony at ±72°)
3. When user changes the main-accent, all derived bi-accents update automatically
4. Bi-accents cascade: when used as main-colors, they get their own bi-accents

### 6. Theme Generation
**AI Task**: Analyze website colors and map them to Catppuccin palette

**Layout Preservation**: The AI is instructed to ONLY change colors - no layout, sizing, spacing, borders, or positioning changes. The theme should look identical to the original except for the color palette.

**Accent Application Strategy**:
1. Identify primary interactive elements → assign main-accent (e.g., Blue)
2. Identify secondary elements → assign bi-accent1 (e.g., Sapphire)
3. Identify tertiary elements → assign bi-accent2 (e.g., Lavender)
4. Create gradients: each main-color uses its own bi-accents (8-12% opacity)
5. Apply cascading: bi-accents get their own bi-accents when used as main-colors

**Output format**:
- **UserStyle (.user.less)** - Single comprehensive theme file supporting all 4 Catppuccin flavors with automatic light/dark mode detection and customizable accent colors

## Project Structure
```
catppuccin-stylus-generator/
├── src/
│   ├── components/
│   │   ├── URLInput.tsx
│   │   ├── FileUpload.tsx
│   │   ├── DirectoryUpload.tsx
│   │   ├── InputSelector.tsx
│   │   ├── APIKeyConfig.tsx
│   │   ├── ServiceSelector.tsx
│   │   ├── ThemePreview.tsx
│   │   └── ThinkingProcess.tsx
│   ├── services/
│   │   ├── fetcher.ts (Direct HTTP fetching)
│   │   ├── ai/
│   │   │   ├── openrouter.ts
│   │   │   ├── chutes.ts
│   │   │   ├── ollama.ts
│   │   │   └── index.ts
│   │   └── generators/
│   │       ├── userstyle.ts (Main generator)
│   │       ├── stylus.ts
│   │       ├── less.ts
│   │       ├── css.ts
│   │       └── index.ts
│   ├── types/
│   │   ├── catppuccin.ts
│   │   └── theme.ts
│   ├── constants/
│   │   └── catppuccin-colors.ts
│   ├── utils/
│   │   ├── color-analysis.ts
│   │   ├── mhtml-parser.ts
│   │   ├── directory-parser.ts
│   │   └── storage.ts
│   ├── hooks/
│   │   └── useVersion.ts
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

### Phase 3: Content Fetching ✅ COMPLETED
1. ✅ Implement direct HTTP/HTTPS fetcher
2. ✅ Implement MHTML parser
3. ✅ Implement directory parser with CSS analysis
4. ✅ Unified content interface

### Phase 4: AI Integration ✅ COMPLETED
1. Implement OpenRouter client with free models
2. Implement Chutes client with free models
3. Create prompt engineering for color analysis
4. Build color mapping logic

### Phase 5: Theme Generation ✅ COMPLETED
1. ✅ Build UserStyle generator (main)
2. ✅ Build Stylus generator
3. ✅ Build LESS generator
4. ✅ Build CSS generator
5. ✅ Bi-accent gradient system

### Phase 6: UI Components ✅ COMPLETED
1. ✅ URL input with validation
2. ✅ File upload (MHTML)
3. ✅ Directory upload
4. ✅ Input selector component
5. ✅ API key configuration panel
6. ✅ AI provider & model selector
7. ✅ Theme preview panel
8. ✅ Thinking process display
9. ✅ Download button

### Phase 7: Testing & Documentation
1. Test with various websites
2. Write comprehensive README
3. Create deployment guide
4. Add usage examples

## API Documentation

### AI Providers
- **OpenRouter**: https://openrouter.ai/docs
  - Free models available (DeepSeek, Llama, Gemma, etc.)
  - Paid premium models
- **Chutes AI**: https://chutes.ai/
  - Free tier available
- **Ollama**: https://ollama.ai/
  - Local models (no API key needed)
  - Run on localhost

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
