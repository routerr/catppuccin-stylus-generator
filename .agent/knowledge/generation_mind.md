# Generation Mind (V3)

## Evolution

- **V1/V2**: Static generation. One file = one flavor/accent combo. Required regeneration to change looks.
- **V3**: Dynamic generation. One file = ALL 56 combinations (4 flavors × 14 accents).

## Core Mechanics

### 1. LESS Guards

The magic behind dynamic theming. The generated CSS contains logic to switch variables based on user settings.

```less
#catppuccin-mocha() when (@flavorName = mocha) {
  ...;
}
#accent-scheme(@mainAccent, @flavor)
  when
  (@mainAccent = blue)
  and
  (@flavor = mocha) {
  ...;
}
```

Stylus injects the user's choice (`@lightFlavor`, `@accentColor`), and LESS resolves the correct variables at compile time (in the browser).

### 2. Cascading Gradient System

A sophisticated method to create visual depth using analogous colors.

- **Level 1 (Main)**: Primary elements use `Main Accent` → `Bi-Accent 1`.
- **Level 2 (Secondary)**: Elements using `Bi-Accent 1` → `Bi-Accent 1's Bi-Accents`.
- **Level 3 (Tertiary)**: Elements using `Bi-Accent 2` → `Bi-Accent 2's Bi-Accents`.

**Example (Blue Accent in Mocha):**

- Main: Blue
- Bi-Accents: Sapphire, Lavender
- Button Hover: Gradient(Blue, Sapphire)
- Badge Hover: Gradient(Sapphire, Sky)

### 3. Comprehensive Coverage

The generator applies styles to discovered selectors with increasing levels of aggression:

- **Minimal**: Only explicit hover gradients.
- **Standard**: Buttons, links, inputs.
- **Comprehensive**: Cards, nav items, lists, badges, switches.

### 4. Fallbacks & Guards

- **Gradient Protection**: Explicitly reverts `background-clip: text` and gradient backgrounds to prevent destroying brand identity.
- **Generic Rules**: Applies broad rules (e.g., all `h1-h6` get text color) to catch unmapped elements.
