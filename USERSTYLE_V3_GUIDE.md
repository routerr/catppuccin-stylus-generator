# UserStyle V3 - Dynamic Multi-Flavor Generator Guide

## Overview

UserStyle V3 is a revolutionary enhancement to the Catppuccin theme generator that provides:

- ✨ **Dynamic Flavor/Accent Selection** - Change themes without regenerating!
- 🎨 **Cascading Bi-Accent Gradients** - 3-level gradient harmony system
- 📊 **Higher Page Coverage** - Comprehensive gradient patterns across all elements
- 🚀 **56 Theme Combinations** - All 4 flavors × 14 accents instantly available

## Key Features

### 1. Dynamic Multi-Flavor Support

**Before (V2):** Each generated theme was baked with a single flavor and accent:
```less
/* Generated for Mocha + Blue only */
@blue: #89b4fa;
@text: #cdd6f4;
button { background: @blue; }
```

**After (V3):** One theme supports ALL flavors and accents:
```less
/* User Configuration: Change these to switch themes instantly! */
@lightFlavor: latte;  /* latte | frappe | macchiato | mocha */
@darkFlavor: mocha;   /* latte | frappe | macchiato | mocha */
@accentColor: blue;   /* blue | lavender | mauve | pink | red | ... (14 options) */

/* Palette automatically loads based on your selection */
#apply-catppuccin(@flavorName) {
  #catppuccin-mocha() when (@flavorName = mocha);
  #catppuccin-latte() when (@flavorName = latte);
  /* ... */
}
```

**Users can now:**
1. Download ONE theme file
2. Change flavor by editing `@lightFlavor` / `@darkFlavor`
3. Change accent by editing `@accentColor`
4. No regeneration needed!

### 2. Cascading Bi-Accent Gradient System

V3 implements a sophisticated 3-level gradient system based on the analogous color harmony (±72° hue):

```
Level 1: Elements using main-accent
  main-accent: blue
  ├─ bi-accent-1: sapphire (±72° from blue)
  ├─ bi-accent-2: lavender (±72° from blue)
  └─ Gradients: blue → sapphire | blue → lavender

Level 2: Elements using bi-accent-1 (variety elements)
  main-accent: sapphire (was blue's bi-accent-1)
  ├─ bi1-sub-1: sky (±72° from sapphire)
  ├─ bi1-sub-2: blue (±72° from sapphire)
  └─ Gradients: sapphire → sky | sapphire → blue

Level 3: Elements using bi-accent-2 (secondary variety)
  main-accent: lavender (was blue's bi-accent-2)
  ├─ bi2-sub-1: mauve (±72° from lavender)
  ├─ bi2-sub-2: pink (±72° from lavender)
  └─ Gradients: lavender → mauve | lavender → pink
```

**Why This Matters:**
- Creates visual hierarchy through color relationships
- Maintains harmonious color palette (analogous harmony)
- Provides variety without chaos (70-30 main-accent distribution)
- Each element's gradient is contextually appropriate

### 3. Comprehensive Gradient Coverage

V3 offers three coverage levels:

#### Minimal Coverage
Basic hover gradients on primary interactive elements only.

#### Standard Coverage (Default)
```less
/* Primary buttons - Level 1 gradients */
button:hover {
  background: linear-gradient(135deg, @accent, fade(@bi-accent-1, 12%));
}

/* Links - Level 1 gradients */
a:hover {
  background: linear-gradient(45deg, @accent, fade(@bi-accent-2, 10%));
  background-clip: text;
}

/* Badges - Level 2 gradients (variety) */
.badge:hover {
  background: linear-gradient(90deg, @bi-accent-1, fade(@bi1-sub-1, 12%));
}

/* Chips - Level 3 gradients (secondary variety) */
.chip:hover {
  background: linear-gradient(90deg, @bi-accent-2, fade(@bi2-sub-1, 12%));
}
```

#### Comprehensive Coverage
Adds gradients to:
- Cards and panels
- Navigation items
- Tabs
- List items
- Dropdown menus
- Active/selected states
- Input focus states
- And many more!

## Usage

### Basic Usage (Pipeline)

```typescript
import { runDeepAnalysisPipeline } from './src/services/deep-analysis';

const result = await runDeepAnalysisPipeline({
  url: 'https://example.com',
  flavor: 'mocha',        // Default flavor (user can change in LESS)
  mainAccent: 'blue',     // Default accent (user can change in LESS)
  useV3Generator: true,   // 🎯 Enable V3 generator
  userstyleV3: {
    enableCascadingGradients: true,
    gradientCoverage: 'comprehensive',  // 'minimal' | 'standard' | 'comprehensive'
  },
  mapper: {
    provider: 'openrouter',
    apiKey: 'sk-...',
    model: 'gpt-4.1-mini',
  },
});

// Download result.userstyle.less
console.log(result.userstyle.less);
```

### Direct Generator Usage

```typescript
import { generateUserstyleV3 } from './src/services/generators/userstyle-v3';

const theme = generateUserstyleV3(analysis, mappings, {
  url: 'https://example.com',
  defaultFlavor: 'mocha',
  defaultAccent: 'blue',
  enableCascadingGradients: true,
  gradientCoverage: 'comprehensive',
  includeComments: true,
});
```

## Generated Output Structure

V3 generates a comprehensive LESS file with the following structure:

```less
/* ==UserStyle==
@name Example Com Catppuccin
@namespace github.com/catppuccin/userstyles/styles/example-com
@homepageURL https://github.com/catppuccin/userstyles/tree/main/styles/example-com
@version 2025.01.15
@description Soothing pastel theme for Example Com
@author Catppuccin
@license MIT

@preprocessor less
@var select lightFlavor "Light Flavor" ["latte:Latte*", "frappe:Frappé", "macchiato:Macchiato", "mocha:Mocha"]
@var select darkFlavor "Dark Flavor" ["latte:Latte", "frappe:Frappé", "macchiato:Macchiato", "mocha:Mocha*"]
@var select accentColor "Accent" ["rosewater:Rosewater", "flamingo:Flamingo", "pink:Pink", "mauve:Mauve", "red:Red", "maroon:Maroon", "peach:Peach", "yellow:Yellow", "green:Green", "teal:Teal", "blue:Blue*", "sapphire:Sapphire", "sky:Sky", "lavender:Lavender"]
==/UserStyle== */

@import "https://userstyles.catppuccin.com/lib/lib.less";

/* ════════════════════════════════════════════════════════════ */
/* Accent Scheme Library - Cascading Bi-Accent System           */
/* ════════════════════════════════════════════════════════════ */
#accent-scheme(@mainAccent, @flavor) when (@mainAccent = blue) and (@flavor = mocha) {
  @accent: @blue;
  @bi-accent-1: @sapphire;
  @bi-accent-2: @lavender;
  @bi1-sub-1: @sky;      /* Sapphire's bi-accent-1 */
  @bi1-sub-2: @blue;     /* Sapphire's bi-accent-2 */
  @bi2-sub-1: @mauve;    /* Lavender's bi-accent-1 */
  @bi2-sub-2: @pink;     /* Lavender's bi-accent-2 */
}
/* ... 56 combinations (4 flavors × 14 accents) */

@-moz-document domain("example.com") {

  #apply-catppuccin(@flavorName) {
    /* Load official Catppuccin palette */
    #catppuccin(@lookup, @flavorName);
    /* Load accent scheme */
    #accent-scheme(@accentColor, @flavorName);

    /* SECTION 1: CSS VARIABLES */
    :root {
      --primary-color: @accent !important;
      --bg-main: @base !important;
      /* ... */
    }

    /* SECTION 2: SVG REPLACEMENTS */
    /* ... */

    /* SECTION 3: SITE-SPECIFIC SELECTORS */
    /* ... */

    /* SECTION 4: CASCADING GRADIENT SYSTEM */
    /* Level 1: Main-accent gradients */
    button:hover { background: linear-gradient(135deg, @accent, fade(@bi-accent-1, 12%)); }

    /* Level 2: Bi-accent-1 as main */
    .badge:hover { background: linear-gradient(90deg, @bi-accent-1, fade(@bi1-sub-1, 12%)); }

    /* Level 3: Bi-accent-2 as main */
    .chip:hover { background: linear-gradient(90deg, @bi-accent-2, fade(@bi2-sub-1, 12%)); }

    /* SECTION 5: FALLBACK GUARDS */
    /* ... */
  }

  /* Apply to detected mode */
  :root[data-theme="dark"] { #apply-catppuccin(@darkFlavor); }
}
```

## User Instructions for Generated Themes

When you distribute V3 themes to users, include these instructions:

### How to Change Flavor & Accent (Stylus UI)

1. Click the **Stylus** browser extension icon
2. Click the **⚙️ gear icon** next to your installed theme
3. Use the dropdown menus:
   - **Light Flavor**: Choose Latte, Frappé, Macchiato, or Mocha
   - **Dark Flavor**: Choose Latte, Frappé, Macchiato, or Mocha
   - **Accent**: Choose from 14 colors (Blue, Lavender, Mauve, Pink, etc.)
4. Changes apply **instantly** - no manual editing needed!

### Alternative: Manual Editing (Advanced)

If you prefer to edit the LESS file directly:

1. Click **Edit** in Stylus
2. Find the UserStyle metadata header:
   ```less
   @var select lightFlavor "Light Flavor" ["latte:Latte*", ...]
   @var select darkFlavor "Dark Flavor" [...]
   @var select accentColor "Accent" [...]
   ```
3. Move the `*` marker to set defaults
4. Save and reload!

## Benefits Over V2

| Feature | V2 | V3 |
|---------|----|----|
| **Themes per generation** | 1 (baked) | 56 (dynamic) |
| **Regeneration needed** | Yes | No |
| **Gradient levels** | 1 | 3 (cascading) |
| **Gradient coverage** | Hover only | Comprehensive |
| **User customization** | None | Full (flavor + accent) |
| **File size** | ~30 KB | ~45 KB |
| **Backward compatible** | N/A | Yes (via flag) |

## Migration Guide

### For Developers

To migrate from V2 to V3:

```typescript
// Before (V2)
const result = await runDeepAnalysisPipeline({
  url: 'https://example.com',
  flavor: 'mocha',
  mainAccent: 'blue',
  // ...
});

// After (V3)
const result = await runDeepAnalysisPipeline({
  url: 'https://example.com',
  flavor: 'mocha',          // Now used as DEFAULT only
  mainAccent: 'blue',       // Now used as DEFAULT only
  useV3Generator: true,     // 🎯 Enable V3
  userstyleV3: {            // 🎯 V3-specific options
    enableCascadingGradients: true,
    gradientCoverage: 'comprehensive',
  },
  // ...
});
```

### For End Users

V3 themes are **backward compatible** with V2 workflow:
- Still works in Stylus/Stylish extensions
- Still applies to the same domains
- Just adds new customization options!

Users can:
1. **Ignore** the configuration variables → Theme works as-is
2. **Customize** by editing variables → Get 56 themes in one!

## Examples

### Example 1: Generate DuckDuckGo Theme

```typescript
const duckTheme = await runDeepAnalysisPipeline({
  url: 'https://duckduckgo.com',
  flavor: 'mocha',
  mainAccent: 'blue',
  useV3Generator: true,
  userstyleV3: {
    enableCascadingGradients: true,
    gradientCoverage: 'comprehensive',
  },
  mapper: {
    provider: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY!,
    model: 'gpt-4.1-mini',
  },
});

// User can now edit @lightFlavor, @darkFlavor, @accentColor in the output!
```

### Example 2: Minimal Gradient Coverage

```typescript
const minimalTheme = await runDeepAnalysisPipeline({
  url: 'https://example.com',
  flavor: 'frappe',
  mainAccent: 'lavender',
  useV3Generator: true,
  userstyleV3: {
    gradientCoverage: 'minimal',  // Only basic hover effects
  },
  mapper: { /* ... */ },
});
```

### Example 3: Disable Cascading Gradients

```typescript
const simpleTheme = await runDeepAnalysisPipeline({
  url: 'https://example.com',
  flavor: 'latte',
  mainAccent: 'mauve',
  useV3Generator: true,
  userstyleV3: {
    enableCascadingGradients: false,  // Only Level 1 gradients
    gradientCoverage: 'standard',
  },
  mapper: { /* ... */ },
});
```

## Technical Details

### Cascading Gradient Algorithm

```typescript
// For main-accent = 'blue'
const level1 = {
  main: 'blue',
  bi1: 'sapphire',    // +72° hue from blue
  bi2: 'lavender',    // -72° hue from blue
};

// For bi-accent-1 = 'sapphire' (used on variety elements)
const level2 = {
  main: 'sapphire',
  bi1: 'sky',         // +72° hue from sapphire
  bi2: 'blue',        // -72° hue from sapphire
};

// For bi-accent-2 = 'lavender' (used on secondary variety)
const level3 = {
  main: 'lavender',
  bi1: 'mauve',       // +72° hue from lavender
  bi2: 'pink',        // -72° hue from lavender
};
```

All these relationships are precomputed in `PRECOMPUTED_ACCENTS` for instant lookups!

### LESS Variable Resolution

V3 uses LESS guards for dynamic resolution:

```less
/* Load palette for selected flavor */
#catppuccin-mocha() when (@flavorName = mocha) {
  @blue: #89b4fa;
  @text: #cdd6f4;
  /* ... */
}

/* Load accent scheme */
#accent-scheme(@mainAccent, @flavor) when (@mainAccent = blue) and (@flavor = mocha) {
  @accent: @blue;
  @bi-accent-1: @sapphire;
  /* ... */
}
```

When user sets `@accentColor: blue`, LESS compiler:
1. Finds matching `#catppuccin-mocha()` guard
2. Loads Mocha color definitions
3. Finds matching `#accent-scheme(blue, mocha)` guard
4. Sets `@accent`, `@bi-accent-1`, etc.
5. All selectors using `@accent` resolve to `#89b4fa`!

## Troubleshooting

### Theme not applying?
- Check `@-moz-document domain("...")` matches your site
- Verify LESS compilation succeeded (no errors in Stylus console)

### Wrong colors showing?
- Check `@lightFlavor` / `@darkFlavor` settings
- Verify `@accentColor` is spelled correctly
- Ensure flavor/accent combination exists in palette library

### Gradients not visible?
- Check `gradientCoverage` setting (try `comprehensive`)
- Verify `enableCascadingGradients: true`
- Some elements may have `!important` overrides blocking gradients

## Performance

V3 themes are optimized for:
- **Compile time**: LESS guards compile instantly
- **File size**: ~45 KB (vs ~30 KB for V2) - acceptable tradeoff for 56 combinations
- **Runtime**: No performance impact - resolved at stylesheet load time

## Future Enhancements

Potential V4 features:
- [ ] Custom gradient angles per element type
- [ ] Opacity customization via variables
- [ ] Border radius theming
- [ ] Shadow theming
- [ ] Animation/transition speed controls
- [ ] Export to SCSS/PostCSS

## Credits

- **Catppuccin Palette**: https://github.com/catppuccin/catppuccin
- **Analogous Color Harmony**: ±72° hue shifts for harmonious gradients
- **Deep Analysis System**: AI-powered precision mapping

---

**Built with ❤️ for the Catppuccin community**
