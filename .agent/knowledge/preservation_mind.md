# Preservation Mind

## The Golden Rule

**"If it's not a color, don't touch it."**

## Why?

- Users want the _theme_ (colors), not a redesign.
- Changing layout (padding, margins, sizing) breaks functionality and responsiveness.
- Changing fonts or borders alters the site's character too much.

## Implementation Strategies

### 1. Property Whitelist

The generator is strictly limited to modifying specific CSS properties:

- `color`
- `background-color`
- `border-color`
- `box-shadow` (color only)
- `outline-color`
- `fill` / `stroke`

### 2. Property Blacklist (AI Instructions)

Prompts explicitly forbid the AI from generating:

- `width`, `height`
- `padding`, `margin`
- `font-size`, `font-weight`
- `display`, `position`
- `border-width`, `border-radius`

### 3. Gradient Text Protection

Gradient text is often a key brand element (e.g., "AI-powered" in a rainbow gradient).

- **Detection**: Looks for `bg-clip-text`, `text-transparent`, `bg-gradient-*`.
- **Action**:
  - AI is told to ignore these elements.
  - CSS includes `revert !important` rules for these classes to ensure the original style shines through.

### 4. Selector Specificity

- Avoids blanket `* { ... }` rules which cause chaos.
- Uses specific classes discovered during analysis.
- Uses `:not()` pseudo-classes to exclude problematic elements (e.g., `button:not(.gradient-btn)`).
