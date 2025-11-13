# Agent Implementation Guide – Layout Preservation & Color Mapping

## Objective

Generate Catppuccin-themed stylesheets that ONLY change colors while preserving:
- ✅ Original website layout (100% identical)
- ✅ Original gradient text colors (brand elements)
- ✅ Original spacing, sizing, positioning
- ✅ Original typography and borders

**Core Principle**: If it's not a color property, don't touch it.

---

## Critical Constraints

### 1. Color-Only Modifications
**ONLY modify these CSS properties:**
- `color` (text color)
- `background-color` / `background` (gradient colors only)
- `border-color` (NOT border-width!)
- `box-shadow` (color values only, preserve blur/spread)
- `outline-color` (NOT outline-width!)
- SVG `fill` and `stroke` (colors only)

**NEVER modify these properties:**
- Layout: `width`, `height`, `min-*`, `max-*`, `padding`, `margin`
- Position: `top`, `left`, `right`, `bottom`, `position`, `transform`
- Typography: `font-size`, `font-weight`, `font-family`, `line-height`
- Borders: `border-width`, `border-radius`, `border-style`
- Display: `display`, `flex`, `grid`, `justify-content`, `align-items`
- Other: `opacity`, `z-index`, `overflow`

### 2. Gradient Text Preservation
**CRITICAL RULE**: Gradient text elements keep their ORIGINAL colors.

**Detection patterns:**
- Tailwind classes: `bg-clip-text`, `text-transparent`, `bg-gradient-*`, `from-*`, `via-*`, `to-*`
- CSS properties: `-webkit-background-clip: text`, `background-clip: text`, `text-fill-color: transparent`

**Why preserve?**
- Gradient text is often branding/visual identity
- Changing colorful gradients (moss→rose→indigo) to Catppuccin destroys impact
- These elements are intentional design choices

**Action:**
- AI: Completely ignore gradient text in color analysis
- CSS: Exclude gradient elements from all theme rules

---

## Implementation Strategy

### Two-Pronged Approach

#### 1. AI Prevention (Prompts)
Add comprehensive layout preservation rules to AI prompts:

```markdown
═══════════════════════════════════════════════════════════════════
CRITICAL LAYOUT PRESERVATION RULES - READ THIS CAREFULLY
═══════════════════════════════════════════════════════════════════

YOU MUST ONLY CHANGE COLORS. DO NOT CHANGE ANYTHING ELSE.

NEVER MODIFY THESE PROPERTIES:
❌ width, height, padding, margin, borders (width/radius/style)
❌ font-size, font-weight, display, position, flex, grid
❌ transform, z-index, opacity, overflow

ONLY MODIFY COLOR PROPERTIES:
✓ color, background-color, border-color
✓ box-shadow (color only), outline-color, fill, stroke

GRADIENT TEXT RULES (HIGHEST PRIORITY):
════════════════════════════════════════════════════════════════
⚠️  PRESERVE ORIGINAL GRADIENT COLORS - DO NOT MAP  ⚠️
════════════════════════════════════════════════════════════════

Elements with gradient text MUST keep ORIGINAL colors:
- class="bg-clip-text text-transparent" → SKIP entirely
- class="bg-gradient-to-*" → SKIP entirely
- Gradient colors (green, rose, indigo, etc.) → DO NOT map

WHY: Gradient text is branding. Changing destroys visual identity.

EXAMPLES to SKIP:
❌ <span class="from-moss bg-gradient-to-br via-rose-300 to-indigo-500
           bg-clip-text text-transparent">Breakthrough</span>
```

**Files to update:**
- [src/services/ai/openrouter.ts](src/services/ai/openrouter.ts) (lines 490-549)
- [src/services/ai/chutes.ts](src/services/ai/chutes.ts) (lines 479-538)
- [src/services/ai/ollama.ts](src/services/ai/ollama.ts) (lines 302-361)

#### 2. CSS Protection (Generators)
Add multiple protection layers in generated stylesheets:

```less
/* ═══════════════════════════════════════════════════════════════
   CRITICAL: PRESERVE ORIGINAL GRADIENT TEXT - DO NOT MODIFY
   ═══════════════════════════════════════════════════════════════ */

/* Explicitly preserve gradient text - highest priority */
[class*="bg-clip-text"],
[class*="text-transparent"],
[class*="bg-gradient"],
[class*="from-"],
[class*="via-"],
[class*="to-"] {
  /* DO NOT apply any theme colors */
}

/* Protect headings with gradient children */
h1:not([class*="bg-clip-text"]):not(:has([class*="bg-clip-text"])),
h2:not([class*="bg-clip-text"]):not(:has([class*="bg-clip-text"])) {
  color: @text;
}

/* Exclude gradient elements from link styling */
a:not([class*="bg-clip-text"]):not([class*="text-transparent"]) {
  color: @accent !important;
}
```

**Techniques used:**
- Attribute selectors: `[class*="bg-clip-text"]`
- Negation pseudo-class: `:not([class*="..."])`
- Child exclusion: `:has([class*="..."])`
- Multiple protection layers for redundancy

**Files to update:**
- [src/services/generators/userstyle.ts](src/services/generators/userstyle.ts) (lines 326-500)
- [src/services/generators/stylus.ts](src/services/generators/stylus.ts)
- [src/services/generators/less.ts](src/services/generators/less.ts)

---

## Implementation Checklist

### AI Prompts (All Providers)
- [x] Add "CRITICAL LAYOUT PRESERVATION RULES" section
- [x] List ALL properties to NEVER modify
- [x] List ONLY color properties to modify
- [x] Add "GRADIENT TEXT RULES (HIGHEST PRIORITY)" section
- [x] Include emoji banners for visibility
- [x] Provide concrete examples to SKIP
- [x] Explain WHY preservation is important

### CSS Generators
- [x] Add gradient text preservation comment header
- [x] Exclude gradient classes from all rules
- [x] Protect headings with `:not()` and `:has()` selectors
- [x] Protect links from affecting gradient children
- [x] Protect span/div with gradient classes
- [x] Remove explicit sizing from switches/toggles
- [x] Fix input styling (no forced transparent backgrounds)
- [x] Reduce !important usage on structural properties

### Testing
- [x] TypeScript compilation: `npx tsc --noEmit`
- [x] Test with gradient text elements
- [x] Verify layout remains identical
- [x] Check gradient colors preserved
- [x] Test on multiple websites

---

## Validation Criteria

### Success Metrics
1. **Layout Preservation**: Generated theme looks IDENTICAL to original (except colors)
2. **Gradient Text**: Original gradient colors (moss→rose→indigo) remain unchanged
3. **Readability**: Non-gradient text uses Catppuccin colors properly
4. **No Sizing**: No explicit width/height in switch/toggle/input rules
5. **Color-Only**: Generated CSS only modifies color properties

### Red Flags
- ❌ Layout breaks or elements misalign
- ❌ Gradient text changes to Catppuccin colors
- ❌ Input fields forced transparent
- ❌ Switches with explicit dimensions
- ❌ Too many `!important` on structural properties
- ❌ Border-width or font-size modifications

---

## Debugging Guide

### Issue: Layout Breaks After Theme Application

**Diagnosis:**
1. Check generated CSS for structural properties
2. Look for `width`, `height`, `padding`, `margin` changes
3. Check for `display`, `position`, `transform` modifications

**Fix:**
- Review [userstyle.ts](src/services/generators/userstyle.ts) rules
- Remove explicit sizing from problematic selectors
- Use `:not()` to exclude specific elements

### Issue: Gradient Text Changes Color

**Diagnosis:**
1. Search generated CSS for gradient class selectors
2. Check if gradient elements are being styled
3. Review AI prompt for gradient text rules

**Fix:**
- Add gradient classes to exclusion lists
- Strengthen `:not([class*="bg-clip-text"])` selectors
- Update AI prompts with stronger warnings

### Issue: Invisible Text on Hover

**Diagnosis:**
1. Check for `color: transparent` in hover states
2. Look for gradient text without proper fallbacks
3. Review contrast calculations

**Fix:**
- Never use `color: transparent` outside WebKit-specific blocks
- Ensure solid text colors on hover
- Add contrast-aware fallbacks

---

## Code Locations Reference

### AI Service Files
- OpenRouter prompts: [src/services/ai/openrouter.ts:490-549](src/services/ai/openrouter.ts#L490-L549)
- Chutes prompts: [src/services/ai/chutes.ts:479-538](src/services/ai/chutes.ts#L479-L538)
- Ollama prompts: [src/services/ai/ollama.ts:302-361](src/services/ai/ollama.ts#L302-L361)

### Generator Files
- UserStyle generator: [src/services/generators/userstyle.ts](src/services/generators/userstyle.ts)
  - Gradient preservation: lines 326-355
  - Link protection: lines 371-378
  - Heading protection: lines 464-500
  - Input styling: lines 506-543
  - Switch styling: lines 815-840

### Key Sections
- **Gradient text exclusions**: Lines 326-355 (userstyle.ts)
- **Layout preservation prompts**: Lines 490-549 (openrouter.ts)
- **Heading protection**: Lines 464-500 (userstyle.ts)
- **Input fixes**: Lines 506-543 (userstyle.ts)

---

## Future Enhancements

### Potential Improvements
- [ ] Automated layout preservation testing
- [ ] Visual regression testing (screenshot comparison)
- [ ] Gradient text detection algorithm refinement
- [ ] Per-element layout preservation rules
- [ ] Advanced CSS selector optimization
- [ ] Theme validation/linting tools

### Known Limitations
- Complex CSS animations may need manual review
- Some JavaScript-driven styles may not be captured
- Dynamic content may require additional testing
- Framework-specific components need case-by-case handling

