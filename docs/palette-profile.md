# Palette Profile Module Design

Phase 2 introduces a deterministic “palette profile” service that inspects raw site artifacts (HTML + inline CSS + extracted variables) and produces the semantic data needed by the generators. This document defines the inputs, outputs, and algorithms so implementation can proceed incrementally.

## Goals
1. **Semantic mapping, not brute-force selectors**: Convert the source design’s color system (CSS custom properties, Tailwind tokens, design tokens) into structured roles (backgrounds, surfaces, text, etc.).
2. **Deterministic variation**: Use a reproducible seed (URL + snapshot hash) when distributing accents or choosing among equivalent roles so that repeated generations for the same site stay stable.
3. **Source transparency**: Preserve references back to the original CSS variable or selector, so guardrails and UI logs can explain every choice.

## Inputs
```ts
interface PaletteProfileInput {
  url: string;
  html: string;   // raw HTML snapshot (SSR shell acceptable)
  css?: string;   // optional aggregated CSS (inline + fetched)
  detectedMode?: 'light' | 'dark'; // hints from crawler
}
```

The crawler already attaches CSS analysis objects (`CrawlerResult.cssAnalysis`). Phase 2 will initially operate on saved HTML snapshots (see `analysis_snapshots/`) and later integrate directly with the crawler responses.

## Outputs
```ts
interface PaletteProfile {
  url: string;
  hash: string; // sha256 of canonicalized HTML (used for deterministic seeds)
  tokens: Record<string, SourceToken>;
  roles: Partial<Record<RoleKey, RoleAssignment>>;
  accents: AccentDistribution;
  diagnostics: PaletteDiagnostics;
}

interface SourceToken {
  value: string;             // hex, rgb(), hsl(), or var(...)
  resolvedHex?: string;      // resolved Catppuccin hex during mapping
  frequency: number;         // heuristic frequency (0..1)
  sources: string[];         // CSS variable or selector origins
  contexts: Array<'background'|'text'|'border'|'button'|'link'|'other'>;
}

interface RoleAssignment {
  token: string;             // reference into tokens key
  confidence: number;        // 0..1
  hints: string[];           // free-form notes (“matched --theme-col-bg-page”)
}

interface AccentDistribution {
  primary: import('../src/types/catppuccin').AccentColor;
  biAccents: { first: import('../src/types/catppuccin').AccentColor; second: import('../src/types/catppuccin').AccentColor; };
  weights: { primary: number; secondary: number; tertiary: number }; // sums to 1
  seed: string;              // url-hash + optional flavor
}

interface PaletteDiagnostics {
  cssVariableCount: number;
  inferredRoles: string[];
  unmappedTokens: string[];
  warnings: string[];
}
```

## Processing Pipeline
1. **Canonicalize HTML**  
   - Strip scripts & inline event handlers.  
   - Compute SHA-256 hash for deterministic seeds.  
   - Extract `<style>` blocks and inline `style` attributes.

2. **Token Extraction**  
   - Gather CSS custom properties (`--foo-bar`) and categorize them.  
   - Detect framework-specific naming (Tailwind `text-text-100`, GitHub `--fgColor-default`, DuckDuckGo `--sds-color-*`).  
   - Normalize color strings (hex, rgb, hsl) into hex values when possible.

3. **Role Heuristics**  
   - Apply regex-based rules and heuristics:  
     - `--*-bg-*`, `--theme-bg-*` → `background.*`.  
     - `--text-*`, `.text-*` → `text.*`.  
     - `--border-*` → `border.*`.  
     - `--color-success`, `--sds-color-text-success` → `success.*`.  
   - Use usage contexts (gathered from class names or inline styles) to increase confidence.

4. **Accent Discovery**  
   - Detect interactive tokens (links/buttons).  
   - Compute hue clustering to pick the best Catppuccin accent candidate.  
   - Seed accent distribution using `seed = sha256(url + hash + flavor)`, ensuring reproducible multi-accent rotations across roles.

5. **Diagnostics**  
   - Record unmatched tokens, suspicious contexts (e.g., color identical to background), potential contrast issues flagged for Phase 5.

## Interfaces for Generators
- `getPaletteProfile(url: string): Promise<PaletteProfile>` — returns cached profile if hash matches; otherwise parses HTML/CSS to build a new one.
- `resolveRole(role: RoleKey, flavor: CatppuccinFlavor): CatppuccinColor` — helper that maps the role assignment to actual Catppuccin hex via flavor palette (with fallback logic).
- `listDiagnostics(url: string): PaletteDiagnostics` — used to surface warnings in the UI.

## Deterministic Seeding
```ts
const hash = sha256(canonicalHtml);
const seed = sha256(`${url}|${hash}|${flavor}`);
```
Use the seed for:
- Accent distribution (primary vs bi accents per role).
- Role tie-breaking when multiple tokens share the same confidence.
- Random-looking but repeatable variation so each site feels unique.

## Implementation Plan
1. **Parser scaffolding**: implement `packages/palette-profile/index.ts` exporting `buildPaletteProfile` that takes `PaletteProfileInput` and returns `PaletteProfile`.
2. **DuckDuckGo fixture**: create `fixtures/palette/duckduckgo.json` by running the parser on `analysis_snapshots/duckduckgo.html`. Use it to validate token extraction.
3. **Unit tests**: using Vitest, assert that DuckDuckGo’s `--theme-col-bg-page` maps to `background.primary`, `--sds-color-text-01` maps to `text.primary`, etc.
4. **Integration hook**: update `generateUserStyle` to prefer `paletteProfile.roles` when present, falling back to legacy heuristics otherwise.
5. **Diagnostics UI**: expose `PaletteDiagnostics` via existing logging panel so users can see why certain colors were picked.

This document should be updated as heuristics evolve or new frameworks are detected (e.g., Material Design tokens like `--md-sys-color-*`). Add sample mappings and edge cases in future iterations.
