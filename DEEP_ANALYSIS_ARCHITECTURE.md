# Deep Analysis System Architecture

## Overview
Transform the generic theme generator into a precision masterpiece generator inspired by the DuckDuckGo Catppuccin theme.

## Architecture Layers

### Layer 1: Deep Website Analysis
**Location:** `src/utils/deep-analysis/`

#### 1.1 CSS Variable Extractor (`css-variables.ts`)
```typescript
interface CSSVariable {
  name: string;              // e.g., "--theme-col-txt-title"
  value: string;             // e.g., "#1a73e8"
  scope: 'root' | 'element'; // where it's defined
  usage: string[];           // selectors using this variable
  semanticPurpose: string;   // AI-detected purpose
}

function extractCSSVariables(dom: Document): CSSVariable[]
```

**Capabilities:**
- Parse `:root`, `html`, `body` for CSS custom properties
- Track variable usage across the DOM
- Detect variable inheritance and overrides
- Build complete variable dependency tree

#### 1.2 SVG Analyzer (`svg-analyzer.ts`)
```typescript
interface SVGInfo {
  location: 'inline' | 'background' | 'img';
  selector: string;
  svg: string;              // Raw SVG markup
  colors: string[];         // All fill/stroke colors
  semanticPurpose: string;  // e.g., "search icon", "logo"
}

function analyzeSVGs(dom: Document, css: string): SVGInfo[]
```

**Capabilities:**
- Extract inline `<svg>` elements
- Parse `background-image: url("data:image/svg+xml,...")`
- Detect SVG masks and clip-paths
- Find all color attributes (`fill`, `stroke`, `stop-color`)

#### 1.3 Design System Detector (`design-system.ts`)
```typescript
interface DesignSystem {
  framework: 'material' | 'bootstrap' | 'tailwind' | 'custom' | 'unknown';
  variablePrefix: string;   // e.g., "--sds-", "--theme-", "--tw-"
  colorTokens: Map<string, string>;
  componentPatterns: string[]; // Common class patterns
}

function detectDesignSystem(dom: Document, css: string): DesignSystem
```

**Capabilities:**
- Detect Material Design (MDC variables)
- Detect Bootstrap (BS variables)
- Detect Tailwind CSS (utility classes)
- Identify custom design systems
- Extract color token naming conventions

#### 1.4 Selector Discovery (`selector-discovery.ts`)
```typescript
interface SelectorGroup {
  category: 'button' | 'link' | 'card' | 'input' | 'text' | 'background';
  selectors: string[];      // Site-specific selectors
  specificity: number;      // CSS specificity score
  frequency: number;        // How often it appears
  currentColor: string;     // Current computed color
}

function discoverSelectors(dom: Document): SelectorGroup[]
```

**Capabilities:**
- Build complete selector hierarchy
- Group semantically similar selectors
- Detect site-specific patterns (e.g., `.featureCards_root__brAX3`)
- Calculate optimal specificity for overrides

---

### Layer 2: AI-Powered Precision Mapping
**Location:** `src/services/ai/deep-mapper.ts`

#### 2.1 CSS Variable Mapping
```typescript
interface VariableMapping {
  original: string;         // "--theme-col-txt-title"
  catppuccin: string;       // "blue"
  reason: string;           // "Primary link and title color"
  priority: 'critical' | 'high' | 'medium' | 'low';
}

async function mapCSSVariables(
  variables: CSSVariable[],
  aiProvider: AIProvider
): Promise<VariableMapping[]>
```

**AI Prompt Strategy:**
- Provide complete CSS variable list with current values
- Ask AI to map each to Catppuccin color
- Request semantic reasoning for each mapping
- Enforce 70-30 main-accent distribution

#### 2.2 SVG Color Mapping
```typescript
interface SVGColorMapping {
  originalColor: string;    // "#1a73e8"
  catppuccinColor: string;  // "blue"
  svgPurpose: string;       // "Search icon in header"
}

async function mapSVGColors(
  svgs: SVGInfo[],
  aiProvider: AIProvider
): Promise<Map<string, SVGColorMapping>>
```

**AI Prompt Strategy:**
- Show SVG purpose and current colors
- Map to appropriate Catppuccin colors
- Maintain semantic meaning (green=success, red=error)

#### 2.3 Selector Mapping
```typescript
interface SelectorMapping {
  selector: string;         // ".modal--dropdown--settings"
  properties: {
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
  };
  reason: string;
  hoverGradient?: {
    angle: number;
    colors: [string, string];
  };
}

async function mapSelectors(
  groups: SelectorGroup[],
  aiProvider: AIProvider
): Promise<SelectorMapping[]>
```

---

### Layer 3: Masterpiece Generation
**Location:** `src/services/generators/userstyle-v2.ts`

#### 3.1 Output Structure
```less
@-moz-document domain("example.com") {
  // Flavor detection
  :root:not(.dark-theme) { #catppuccin(@lightFlavor); }
  :root.dark-theme { #catppuccin(@darkFlavor); }

  #catppuccin(@flavor) {
    #lib.palette();
    #lib.defaults();

    // SECTION 1: CSS VARIABLES (HIGHEST PRIORITY)
    // Direct variable mapping for maximum precision
    --primary-color: @blue !important;
    --bg-main: @base !important;
    --text-primary: @text !important;
    // ... 100+ variable mappings

    // SECTION 2: SVG REPLACEMENTS
    // Inline SVG data URIs with Catppuccin colors
    .icon-search {
      @svg: escape('<svg>...</svg>');
      background-image: url("data:image/svg+xml,@{svg}") !important;
    }

    // SECTION 3: SITE-SPECIFIC SELECTORS
    // Precision targeting of unique site elements
    .site-header { background-color: @mantle; }
    .modal--dropdown--settings { background: @surface0; }
    .feature-card__title { color: @text; }

    // SECTION 4: GRADIENTS & HOVERS
    .btn-primary:hover {
      background: linear-gradient(135deg, @blue, @sapphire);
    }

    // SECTION 5: GENERIC FALLBACKS (LOWEST PRIORITY)
    // Catch-all rules for uncovered elements
    a:not([class*="bg-clip-text"]) { color: @blue; }
    button:not(.custom-btn) { background: @surface0; }
  }
}
```

#### 3.2 Priority System
1. **CSS Variables** (90% effectiveness) - Override design system at source
2. **SVG Replacements** (Icon precision) - Perfect icon colors
3. **Specific Selectors** (Site patterns) - Target unique elements
4. **Gradients & Hovers** (Polish) - Enhanced interactivity
5. **Generic Fallbacks** (Safety net) - Catch stragglers

---

### Layer 4: Enhanced Content Fetching
**Location:** `src/services/fetcher-v2.ts`

#### 4.1 Complete CSS Extraction
```typescript
interface EnhancedCrawlerResult extends CrawlerResult {
  allCSS: string;           // All external + inline CSS
  computedStyles: Map<string, CSSStyleDeclaration>;
  cssVariables: CSSVariable[];
  svgs: SVGInfo[];
  designSystem: DesignSystem;
  selectorGroups: SelectorGroup[];
}

async function fetchWithDeepAnalysis(url: string): Promise<EnhancedCrawlerResult>
```

**Capabilities:**
- Fetch and parse all `<link rel="stylesheet">`
- Extract all `<style>` blocks
- Compute styles for major elements
- Run all Layer 1 analyzers
- Return comprehensive analysis

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. ✅ CSS Variable Extractor
2. ✅ Enhanced Content Fetcher
3. ✅ Basic variable mapping AI prompt

### Phase 2: Deep Analysis (Week 2)
4. ✅ SVG Analyzer
5. ✅ Design System Detector
6. ✅ Selector Discovery Engine

### Phase 3: AI Intelligence (Week 3)
7. ✅ Precision mapping prompts
8. ✅ CSS variable mapping logic
9. ✅ SVG color mapping logic

### Phase 4: Generation (Week 4)
10. ✅ UserStyle Generator v2
11. ✅ Priority layering system
12. ✅ DuckDuckGo-style output

### Phase 5: Testing & Polish (Week 5)
13. ✅ Test on DuckDuckGo
14. ✅ Test on Chutes
15. ✅ Test on OpenRouter
16. ✅ Fine-tune mappings

---

## Success Metrics

### Quality
- **CSS Variable Coverage**: >80% of site variables mapped
- **SVG Accuracy**: 100% icon color accuracy
- **Layout Preservation**: Zero layout breaks
- **Color Distribution**: 70-30 main-accent ratio maintained

### Performance
- **Analysis Time**: <10 seconds for deep analysis
- **Generation Time**: <5 seconds for output
- **Output Size**: <50KB for typical site

### Compatibility
- **DuckDuckGo**: Masterpiece quality (reference standard)
- **Chutes**: Masterpiece quality
- **OpenRouter**: Masterpiece quality
- **Generic Sites**: Fallback to enhanced generic mode

---

## Migration Strategy

### Backward Compatibility
- Keep existing generic system as fallback
- New deep analysis runs in parallel
- Merge results for best coverage

### User Experience
- Show analysis progress (CSS vars found, SVGs detected, etc.)
- Preview mode with before/after comparison
- Allow manual variable mapping overrides

---

## File Structure
```
src/
├── utils/
│   └── deep-analysis/
│       ├── css-variables.ts      (Extractor)
│       ├── svg-analyzer.ts       (SVG detection)
│       ├── design-system.ts      (Framework detection)
│       └── selector-discovery.ts (Pattern finder)
├── services/
│   ├── ai/
│   │   └── deep-mapper.ts        (Precision mapping)
│   ├── generators/
│   │   └── userstyle-v2.ts       (Masterpiece output)
│   └── fetcher-v2.ts             (Enhanced fetching)
└── types/
    └── deep-analysis.ts          (All interfaces)
```

---

## Next Steps
1. Create type definitions
2. Build CSS variable extractor
3. Enhance content fetcher
4. Implement AI mapping logic
5. Build v2 generator
6. Test and iterate
