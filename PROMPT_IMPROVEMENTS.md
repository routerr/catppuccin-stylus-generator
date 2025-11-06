# AI Prompt Improvements for Better Color Variety

## Problem
The generated themes were mapping all clickable elements (buttons, links, etc.) to the same Catppuccin colors, resulting in a monotonous appearance that lacked the elegance of the original theme.

## Solution Implemented

### Enhanced AI Prompt Instructions

Both [src/services/ai/openrouter.ts](src/services/ai/openrouter.ts) and [src/services/ai/chutes.ts](src/services/ai/chutes.ts) have been updated with significantly improved prompts that:

#### 1. **More Granular UI Element Classification**
Expanded from 7 to 8 categories with more specific examples:
- Page backgrounds (main bg, secondary bg, sidebar bg)
- Text colors (headings, body text, muted text, link text, code text)
- Buttons & CTAs (primary action, secondary action, tertiary, danger/delete, success/confirm)
- Cards/Panels (card background, card border, card hover state)
- Interactive elements (link hover, button hover, active states, focus rings, selected items)
- Borders & dividers (subtle separators, emphasis borders)
- Status indicators (success, warning, error, info, neutral)
- UI chrome (navbar, sidebar, footer, badges, tags)

#### 2. **Semantic Color Mapping Guidelines**
Added explicit semantic meaning associations:

```
Primary/Brand Colors → blue or sapphire (main CTAs, primary buttons)
Secondary Actions → mauve or lavender (secondary buttons, less important actions)
Links & Navigation → sapphire or sky (clickable text, navigation items)
Headings & Emphasis → lavender, mauve, or pink (titles, important text)
Success States → green or teal (success messages, checkmarks, confirm buttons)
Warning States → yellow or peach (warnings, caution indicators)
Error States → red or maroon (errors, delete buttons, critical warnings)
Info States → blue or sky (informational messages)
Highlights & Badges → flamingo, pink, or rosewater (tags, badges, highlights)
Special Elements → any unused accent (unique UI elements)
```

#### 3. **Emphasis on Color Variety**
Added explicit instruction to prevent monotony:

> **VARIETY IS KEY**: If the website has multiple shades of blue, map them to DIFFERENT Catppuccin colors:
> - Bright blue button → blue
> - Darker blue link → sapphire
> - Light blue banner → sky
> This prevents everything from looking the same color!

#### 4. **Improved Example JSON Output**
Expanded example mappings from 10 to 15 colors showing diverse use cases:

```json
{
  "mappings": [
    {"originalColor": "#HEX1", "catppuccinColor": "blue", "reason": "Primary CTA buttons (e.g., 'Sign Up', 'Buy Now')"},
    {"originalColor": "#HEX2", "catppuccinColor": "sapphire", "reason": "Navigation links and secondary clickable items"},
    {"originalColor": "#HEX3", "catppuccinColor": "mauve", "reason": "Secondary buttons (e.g., 'Learn More', 'Cancel')"},
    {"originalColor": "#HEX4", "catppuccinColor": "lavender", "reason": "Page headings and section titles"},
    {"originalColor": "#HEX5", "catppuccinColor": "pink", "reason": "Accent badges and tags"},
    // ... and 10 more diverse mappings
  ]
}
```

## Expected Results

After these improvements, the AI should:

1. **Distinguish between different types of interactive elements** rather than treating all buttons/links the same
2. **Use semantic meaning** to guide color choices (e.g., green for success, red for danger)
3. **Create visual hierarchy** by varying accent colors based on importance (primary vs secondary actions)
4. **Maintain elegance** by thoughtfully distributing colors across the Catppuccin palette
5. **Preserve the original theme's character** while adapting to Catppuccin colors

## Testing

To verify these improvements:

1. Generate a theme for a complex website (e.g., https://openrouter.ai/models)
2. Check the generated mappings in the JSON output
3. Verify that:
   - Different button types use different colors
   - Links are distinguished from buttons
   - Status indicators (success/error/warning) use appropriate semantic colors
   - Headings use different colors than body text
   - The theme has visual variety and hierarchy

## Files Modified

- **src/services/ai/openrouter.ts** (lines 386-460)
  - Enhanced prompt with semantic guidelines
  - Expanded example mappings
  - Added variety instructions

- **src/services/ai/chutes.ts** (lines 357-432)
  - Applied identical improvements for consistency
  - Same semantic guidelines and examples

## Build Status

✅ Build successful - all changes compile without errors
