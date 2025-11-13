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

**Layout Preservation (CRITICAL)**:
The AI and CSS generators are specifically designed to ONLY change colors:
- ✅ **ONLY modifies**: `color`, `background-color`, `border-color`, `box-shadow` (colors), SVG `fill`/`stroke`
- ❌ **NEVER modifies**: Layout (`width`, `height`, `padding`, `margin`), positioning (`top`, `left`, `position`, `transform`), typography (`font-size`, `font-weight`), borders (`border-width`, `border-radius`), display/flex/grid properties

**Two-Pronged Protection**:
1. **AI Prevention**: Comprehensive prompt instructions with explicit "DO NOT MODIFY" lists
2. **CSS Protection**: Multiple exclusion layers using `:not()`, `:has()`, and attribute selectors

**Gradient Text Preservation (HIGHEST PRIORITY)**:
Elements with gradient text (e.g., Tailwind `bg-clip-text`, `text-transparent`, `from-*`, `via-*`, `to-*`) keep their ORIGINAL colors:
- **Why**: Gradient text is often branding/visual identity (e.g., colorful "Breakthrough" text with moss→rose→indigo gradient)
- **AI Action**: Completely ignore gradient text in color analysis - DO NOT map these colors
- **CSS Action**: Exclude gradient elements from all theme rules with attribute selectors

**Color Distribution Strategy (70-30 Rule)**:
- **70-80% of elements** use the main-accent color
- **20-30% of elements** use bi-accents for variety and visual interest

**Accent Application Strategy**:
1. **MAJORITY (70-80%)** → main-accent (e.g., Blue)
   - Primary buttons, CTAs, main interactive elements
   - Navigation links, menu items
   - Primary headings, emphasis text
   - Most accent borders and highlights
   - Active/selected states

2. **VARIETY (20-30%)** → bi-accents (e.g., Sapphire, Lavender)
   - SOME secondary buttons/badges → bi-accent1 or bi-accent2 (randomly)
   - SOME tags, chips, labels → bi-accent1 or bi-accent2 (randomly)
   - SOME icons or decorative elements → bi-accent1 or bi-accent2 (randomly)
   - OCCASIONAL navigation items → for visual interest

3. Create gradients: each main-color uses its own bi-accents (8-12% opacity)
4. Apply cascading: bi-accents get their own bi-accents when used as main-colors

**CRITICAL**: Main-accent dominates the color scheme. Bi-accents provide variety, not equal distribution.

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
6. ✅ Layout preservation system (color-only modifications)
7. ✅ Gradient text preservation (original colors protected)
8. ✅ CSS exclusion layers (`:not()`, `:has()`, attribute selectors)
9. ✅ AI prompt engineering (comprehensive layout rules)

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

### Phase 7: Testing & Documentation 🔄 IN PROGRESS
1. ✅ Test with various websites (layout preservation validated)
2. ✅ Write comprehensive README (updated)
3. ✅ Write AGENTS.md technical guide (updated)
4. ✅ Update CLAUDE.md project plan (current file)
5. 🔄 Create deployment guide (see DEPLOYMENT.md)
6. 🔄 Add usage examples (see QUICKSTART.md)

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

## Recent Improvements

### Layout Preservation System (v0.1.24+)
Comprehensive fixes to ensure generated themes ONLY change colors:

**Problem**: Generated themes were modifying layout properties, causing misalignment and broken designs.

**Solution**: Two-pronged approach implemented across all AI providers and generators:

#### 1. AI Prompt Engineering
Added detailed "CRITICAL LAYOUT PRESERVATION RULES" to all AI service files:
- Explicit lists of properties to NEVER modify
- Clear instructions to ONLY change color properties
- Emoji-decorated warnings for visibility
- Concrete examples of what to avoid

**Files updated:**
- [src/services/ai/openrouter.ts](src/services/ai/openrouter.ts) (lines 490-549)
- [src/services/ai/chutes.ts](src/services/ai/chutes.ts) (lines 479-538)
- [src/services/ai/ollama.ts](src/services/ai/ollama.ts) (lines 302-361)

#### 2. CSS Generator Protection
Enhanced [userstyle.ts](src/services/generators/userstyle.ts) with multiple protection layers:
- Removed explicit sizing from switches/toggles
- Fixed input styling (no forced transparent backgrounds)
- Reduced !important usage on structural properties
- Added CSS exclusion selectors

### Gradient Text Preservation (v0.1.24+)
Protection for brand elements with colorful gradients:

**Problem**: Gradient text (e.g., "Breakthrough" with moss→rose→indigo gradient) was being changed to Catppuccin colors, destroying visual identity.

**Solution**: Complete preservation of original gradient colors:

#### AI Level
Added "GRADIENT TEXT RULES (HIGHEST PRIORITY)" section to all AI prompts:
- Instructions to SKIP gradient text entirely in analysis
- Explanation of WHY preservation is critical
- Examples of elements to ignore

#### CSS Level
Multiple exclusion layers in [userstyle.ts](src/services/generators/userstyle.ts):
```less
/* Preserve gradient text elements */
[class*="bg-clip-text"],
[class*="text-transparent"],
[class*="bg-gradient"],
[class*="from-"],
[class*="via-"],
[class*="to-"] {
  /* DO NOT apply theme colors */
}

/* Exclude gradient children from heading styles */
h1:not([class*="bg-clip-text"]):not(:has([class*="bg-clip-text"])) {
  color: @text;
}

/* Exclude gradient elements from link styles */
a:not([class*="bg-clip-text"]):not([class*="text-transparent"]) {
  color: @accent !important;
}
```

**Key sections:**
- Gradient preservation: lines 326-355
- Link protection: lines 371-378
- Heading protection: lines 464-500
- Input fixes: lines 506-543
- Switch fixes: lines 815-840

### Asset Loading Fix (v0.1.24)
Fixed Vite asset handling for header icon:
- Changed from string path to proper asset import in [App.tsx](src/App.tsx)
- Added cache-busting to favicon links in [index.html](index.html)

## Future Enhancements
- Support for more output formats (SCSS, PostCSS)
- Theme preview with live website simulation
- Batch processing multiple URLs
- Theme sharing/export to GitHub
- Integration with Stylus/Stylelus extension
