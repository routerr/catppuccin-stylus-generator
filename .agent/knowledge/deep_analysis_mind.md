# Deep Analysis Mind

## Purpose

To provide the AI mapper with high-quality, semantic data about the website, enabling precision theming rather than blind color swapping.

## Components

### 1. CSS Variable Extraction (`css-variables.ts`)

- **Goal**: Identify the site's color palette and semantic tokens.
- **Process**:
  - Scans `:root`, `html`, and `body` for `--*` properties.
  - Tracks usage frequency to identify dominant colors.
  - Infers purpose (background, text, accent) based on naming conventions.

### 2. SVG Analysis (`svg-analyzer.ts`)

- **Goal**: Ensure icons match the theme.
- **Process**:
  - Extracts inline `<svg>` and `background-image` data URIs.
  - Identifies `fill`, `stroke`, and `stop-color` attributes.
  - Generates LESS code to replace these colors dynamically using `escape()` and data URI manipulation.

### 3. Selector Discovery (`selector-discovery.ts`)

- **Goal**: Target specific UI components for enhanced styling.
- **Categories**:
  - `button`, `link`, `input`, `card`, `nav`, `badge`, etc.
- **Enrichment**:
  - Calculates specificity.
  - Checks for interactive states (`:hover`).
  - Determines if element has visible background or borders.
- **Output**: Grouped selectors that allow the generator to apply "comprehensive" coverage (e.g., adding gradients to all buttons).

### 4. Design System Detection (`design-system.ts`)

- **Goal**: Provide context to the AI.
- **Method**: Checks for known class patterns (e.g., `MuiButton` for Material, `btn-primary` for Bootstrap) and variable prefixes.

## AI Integration

The analysis results are fed into the `DeepMapper`, which constructs prompts for the LLM.

- **Variable Prompt**: "Map these 50 variables to Catppuccin. `--primary` is used 100 times, likely the main accent."
- **Selector Prompt**: "Here are the button selectors. Map them to the main accent, but preserve layout."
- **SVG Prompt**: "This SVG is a search icon. Map its fill to the appropriate text or accent color."
