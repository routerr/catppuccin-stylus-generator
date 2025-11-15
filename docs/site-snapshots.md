# Live Site Snapshot Notes

Snapshots stored under `analysis_snapshots/` (captured via `curl` with Safari UA on 2025‑11‑15) serve as raw references while rebuilding the semantic palette engine.

## DuckDuckGo (`analysis_snapshots/duckduckgo.html`)
- Server renders a Next.js shell with heavy reliance on CSS custom properties such as `--sds-color-*` and `--theme-*`. Handcrafted theme (`Themes/less/DuckDuckGo.less`) overrides those variables directly, keeping structure untouched.
- Generated sample (`Example Catppuccin` userstyle) instead floods selectors with `.btn`, `.button`, `.d2l-*`, `.tou-*` etc. None of those exist in the fetched markup (verified via `rg -n "d2l-"` → no matches), proving that the current AI pipeline copies stale class lists from other sites.
- Numerous hashed utility classes (e.g., `styles__HomeLayout-sc-…`) appear only once; rather than hard-coding them, we should map semantic roles to the published `--theme-*` custom properties and fallback structural tags (`body`, `.searchbox`, `.footer`, etc.).
- Action item: palette analyzer must detect when a site already exposes semantic CSS vars and simply remap those to Catppuccin tokens, avoiding brute-force selector generation.

## Gemini (`analysis_snapshots/gemini.html`)
- Landing page is mostly a static marketing site served from `www.gstatic.com`, but the actual app bootstraps via `<script id="__NEXT_DATA__">` and lazy-loads Material components.
- CSS classes are long-form BEM style (e.g., `hero-section__title`) mixed with inline Material tokens like `--md-sys-color-surface`. Need heuristics to prefer overriding Material design theme variables and `.material-symbols`.
- Example userstyle currently uses plain `.btn`/`.badge` selectors, which won't touch Gemini’s scoped class names or CSS custom properties, explaining the limited effect users report.

## Claude (`analysis_snapshots/claude.html`)
- Similar Next.js app with theme provided via Tailwind class tokens (`text-text-000`, `bg-bg-200`, `accent-secondary-*`). Handcrafted `Claude.less` already maps these tokens precisely.
- Generator output should learn to prioritize `div[class*="text-"]` tokens only when they match known semantic prefixes, not by blindly repainting every `button`.

## GitHub Repo Page (`analysis_snapshots/github-routerr.html`)
- GitHub exposes numerous CSS variables (e.g., `--fgColor-default`, `--bgColor-default`) ready for remapping. Handcrafted GitHub themes typically override those variables plus a handful of structural selectors.
- Current generator doesn’t inspect `:root` variable definitions, so it ends up repainting `.btn` again, causing layout flashes and low-contrast segments on dark sections.

## Perplexity (`analysis_snapshots/perplexity.html`)
- SSR shell with design tokens like `data-theme="dark"` and custom properties `--p-color-*`. Many region containers share ARIA attributes; perfect for role-based token mapping.
- Because the current pipeline lacks semantic grouping, the generated CSS repeats `a`/`button` overrides and misses `--p-color-*`, so the UI keeps its original gradients and clashes with Catppuccin backgrounds.

## Implications for Phase 2
1. **Stale Selector Leakage**: The DuckDuckGo sample demonstrates that class lists from one site bleed into another. Palette analyzer must scope collected selectors by URL hash to prevent cross-site pollution.
2. **Prefer Semantic Tokens Over Generic Rules**: Each target exposes CSS custom properties. Mapping those (plus role heuristics like `[data-theme]`, `--*-color-*`) gives far cleaner coverage than enumerating `.btn` clones.
3. **Need Role Detection Pipeline**: Snapshots confirm repeated patterns: search bars, cards, modals, etc. Extracting these via DOM analysis (even from static HTML) will feed the deterministic token assignments we outlined in the Phase 2 requirements.
