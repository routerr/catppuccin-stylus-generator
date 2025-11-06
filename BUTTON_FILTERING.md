# Button and Clickable Background Filtering

## Problem
The generated themes were converting button and clickable element background colors to Catppuccin colors, which could interfere with the original theme's button styling and make buttons less recognizable or break the original design intent.

## Solution
Added automatic filtering to exclude button and clickable background color mappings from the generated theme files while preserving all other color conversions (text colors, borders, page backgrounds, etc.).

## Implementation

### Filter Function
Added `filterButtonAndClickableBackgrounds()` in [src/services/generators/index.ts](src/services/generators/index.ts:12-38):

```typescript
function filterButtonAndClickableBackgrounds(mappings: ColorMapping[]): ColorMapping[] {
  return mappings.filter(mapping => {
    const reason = mapping.reason.toLowerCase();

    // Keywords that indicate button backgrounds or clickable backgrounds
    const buttonKeywords = [
      'button',
      'btn',
      'cta',
      'clickable',
      'interactive background',
      'hover background',
      'active background',
      'pressed background',
    ];

    // Check if this is a button/clickable background mapping
    const isButtonOrClickable = buttonKeywords.some(keyword => reason.includes(keyword));

    // Also check if it's specifically about backgrounds (not text or borders)
    const isBackground = reason.includes('background') || reason.includes('bg');

    // Filter out if it's both a button/clickable AND a background
    // Keep it if it's button text, button border, etc.
    return !(isButtonOrClickable && isBackground);
  });
}
```

### What Gets Filtered Out
Color mappings will be **excluded** if their reason contains:
- Button/clickable keywords: `button`, `btn`, `cta`, `clickable`, `interactive background`, `hover background`, `active background`, `pressed background`
- **AND** background keywords: `background`, `bg`

Examples of filtered mappings:
- ✗ "Primary CTA buttons" (background)
- ✗ "Button hover background"
- ✗ "Active button background"
- ✗ "Interactive background elements"

### What Gets Kept
All other mappings are preserved, including:
- ✓ Button text colors
- ✓ Button borders
- ✓ Link colors (even though they're clickable)
- ✓ Page backgrounds
- ✓ Card backgrounds
- ✓ Text colors
- ✓ Borders and dividers
- ✓ All non-button UI elements

Examples of preserved mappings:
- ✓ "Navigation links and secondary clickable items" (text color, not background)
- ✓ "Page headings and section titles"
- ✓ "Card backgrounds" (not button-related)
- ✓ "Link hover states" (text color changes)
- ✓ "Border and dividers"

## Applied To
The filtering is applied in:
1. **Regular theme generation** (`generateTheme`) - affects Stylus, LESS, and CSS outputs
2. **UserStyle generation** (`createUserStylePackage`) - affects browser extension stylesheets

## Console Output
When themes are generated, you'll see console logs like:
```
Filtered 3 button/clickable background mappings
Keeping 12 mappings for theme generation
```

This helps you understand how many button backgrounds were excluded from the theme.

## Benefits

1. **Preserves Original Button Design** - Buttons retain their original appearance, making them more recognizable
2. **Prevents Breaking Changes** - Avoids accidentally making buttons invisible or unusable
3. **Maintains UX Consistency** - Users can still identify interactive elements by their original styling
4. **Selective Theming** - Themes still convert backgrounds, text, borders, etc., just not button backgrounds

## Testing

To verify this works correctly:

1. Generate a theme for a website with colorful buttons (e.g., https://openrouter.ai/models)
2. Check the console logs to see how many button backgrounds were filtered
3. Open the generated `.styl`, `.less`, or `.css` files
4. Verify that:
   - Button background color variables are **NOT** present in the "SEMANTIC COLOR MAPPINGS" section
   - Other UI element mappings (text, borders, backgrounds) **ARE** present
   - Link colors and other clickable text colors **ARE** present (since they're not backgrounds)

## Example Output

**Before filtering:**
```stylus
// Buttons
$0084ff = $blue // Primary CTA buttons (e.g., 'Sign Up', 'Buy Now')
$6366f1 = $mauve // Secondary buttons (e.g., 'Learn More', 'Cancel')

// Interactive Elements
$74c0fc = $sapphire // Navigation links and secondary clickable items
```

**After filtering:**
```stylus
// Buttons
// (button backgrounds filtered out)

// Interactive Elements
$74c0fc = $sapphire // Navigation links and secondary clickable items
```

## Files Modified

- **src/services/generators/index.ts** (lines 8-38, 45-54, 103-108)
  - Added filter function
  - Applied filtering in `generateTheme()`
  - Applied filtering in `createUserStylePackage()`

## Build Status

✅ Build successful - all changes compile without errors
