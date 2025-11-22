# Refactor Progress Log

Documenting milestones, benchmarks, and near-finish states for the Catppuccin theme generator rebuild.

## 2025-11-15 — Planning Baseline Established
- Created `docs/refactor-plan.md` to outline the eight-phase roadmap, tying each phase to concrete deliverables and benchmark triggers.
- Captured requirements from handcrafted themes (`Themes/less`) and Stylus import template (`Themes/import.json`) as reference inputs for later phases.
- Logged future commitment to update Markdown docs at every benchmark to ensure continuous knowledge capture.

## 2025-11-15 — Phase 1 Discovery Notes
- Audited `src/services/generators/userstyle.ts` and `src/services/generators/css.ts`; found blanket color overrides (e.g., forcing `body` backgrounds and `.class` backgrounds to `@surface0 !important`) plus random hover angles, which explain identical-looking themes and unintended layout shifts.
- Compared generated LESS (`out/stylus_example.generated.less`) with handcrafted themes under `Themes/less`. Humans map site-specific CSS variables and keep gradients intact, whereas the generator writes fixed hex values and overrides anchors/buttons universally, causing accent uniformity and flavor desync.
- Identified sources of low contrast (accent gradients over surfaces, hard-coded `#ffffff` fallbacks) and documented requirements for the upcoming “site palette profile” subsystem so future phases can assign Catppuccin tokens semantically and deterministically.

## 2025-11-15 — Phase 2 Inputs Collected
- Downloaded live HTML shells for DuckDuckGo, Gemini, Claude, the GitHub repo, and Perplexity (`analysis_snapshots/…`). Extracted notes into `docs/site-snapshots.md`.
- Confirmed that each target provides semantic CSS variables (e.g., DuckDuckGo `--sds-color-*`, Claude `text-text-*`, GitHub `--fgColor-*`). These will anchor the palette analyzer instead of brute-force `.btn` overrides.
- Verified cross-site selector bleed in the “Example Catppuccin” userstyle: `d2l-`/`tou-` selectors persist despite being absent in the DuckDuckGo snapshot, reinforcing the need for site-scoped analysis caches.

## 2025-11-15 — Palette Profile Parser & Fixture
- Added the new semantic analyzer (`src/services/palette-profile.ts`) plus a CLI helper (`scripts/generate-palette-profile.ts`) that converts HTML/CSS snapshots into structured `PaletteProfile` JSON.
- Documented the module contract in `docs/palette-profile.md` (inputs, outputs, deterministic seeding, diagnostics).
- Generated the first reference profile (`analysis_snapshots/duckduckgo.palette.json`) using DuckDuckGo’s snapshot + the handcrafted LESS theme to validate CSS variable extraction, role heuristics, and accent seeding.

## 2025-11-15 — Profile Integration & Tests
- `createUserStylePackage` now checks `cssAnalysis.paletteProfile`; when supplied, it converts the profile to a `MappingOutput` (via `convertProfileToMapping`) so `generateUserStyle` reuses the role-map pipeline instead of the legacy selector heuristics.
- `convertProfileToMapping` maps detected tokens to Catppuccin colors (nearest-match + deterministic fallbacks) and seeds derived states/metadata so downstream generators have consistent inputs.
- Added `__tests__/test-palette-profile.ts` + `npm run test:palette` to assert that DuckDuckGo’s snapshot yields tokens, roles, and a valid MappingOutput (including derived scales and metadata).

## 2025-11-15 — URL-Only Workflow & Playwright Crawler
- Removed the MHTML and directory upload paths; the UI is now URL-only with clearer messaging and regeneration logic that reuses the cached crawl.
- Added Playwright crawler integration with local storage settings (endpoint + API key) plus a bundled server (`npm run crawler:serve`) so users can capture client-rendered CSS; fetcher falls back to HTTP proxies automatically.
- Updated API Key configuration, InputSelector copy, README, and QUICKSTART to explain the new crawler workflow and setup instructions.

## 2025-11-15 — Palette Fixtures, Diagnostics & Generator Unification
- Generated palette profiles for Gemini, Claude, GitHub, and Perplexity (`analysis_snapshots/*.palette.json`). The fetcher now invokes `buildPaletteProfile` for both HTTP and Playwright crawls and stores the result in `cssAnalysis`.
- `generateTheme` (Stylus/LESS/CSS) now respects palette profiles just like the UserStyle path, ensuring every output format shares the same semantic RoleMap when available.
- Added palette diagnostics to the UI (right column) so users see variable counts, inferred roles, and warnings per crawl; stored seeds/hashes in `cssAnalysis` for downstream variation logic.
- Extended `__tests__/test-palette-profile.ts` to cover Claude in addition to DuckDuckGo, improving regression coverage for the new fixtures.
- Palette profiles are cached in the browser so repeated crawls for the same HTML hash reuse prior computations, speeding up iterative theming.

## 2025-11-15 — Accent Plan & Deterministic Gradients
- Implemented the Phase 3 accent plan (`createAccentPlan`) to derive accent rotations and gradient angles from each palette profile hash, removing `Math.random()` from generators and keeping themes deterministic per site.
- UserStyle class rules now consume the accent plan so button/link/badge colors cycle through `@accent`, `@bi-accent1`, and `@bi-accent2` in a predictable way, while hover/active gradients leverage the seeded companions.

## 2025-11-15 — UX Polish & Guardrails
- Palette Diagnostics panel elevated above the AI “Thinking” steps for quicker visibility; caching now persists AI class-role guesses across regenerations and toggle changes.
- Fetcher surfaces crawler warnings (e.g., Playwright offline → HTTP fallback) and UI shows them inline; Playwright endpoint defaults to `http://localhost:8787/crawl`.
- Added AI call timeouts (30s) across OpenRouter/Chutes/Ollama; accent plan coverage extended to badges/cards/tables with deterministic gradients.
- Playwright crawler now returns helpful errors (e.g., missing Chromium install) and README documents running `npx playwright install chromium`.

## 2025-11-15 — Upcoming Tasks (Phase 3 Tail)
- Per-site caching UX: add “Re-run with same crawl” to reuse palette profiles/class-role guesses while swapping models or mapping toggle.
- Diagnostics improvements: tips when warnings appear and a palette profile JSON download.
- Playwright status badge near the crawler endpoint with last test time.
- Guardrails: single retry on 429/503 and clearer parse-error toast for AI calls.
- Style polish: extend accent-plan coverage to alerts/notifications and make badge/card/table accents toggleable in the UI.

## Later Steps (queued)
- Guardrails & retries: wrap AI calls with one retry on 429/503 and expand parse-error warnings in UI.
- Accent coverage polish: finer control for alerts/notifications and badge/card/table toggles.
- Contrast engine (Phase 5): WCAG-AA validation + auto-adjustments for text/background pairs.
- Docs cleanup: README/Quickstart/Cloud Playwright updated for optional crawler, env `CRAWLER_TIMEOUT`, and tips on when to prefer HTTP fetch for richer CSS/class discovery.

## 2025-11-15 — Guardrail Retry + Docs Refresh
- Added single-retry/backoff for 429/503 in mode detection and Ollama requests (OpenRouter/Chutes already retried).
- Prevented badge/card/table/alert accent defaults from overriding when explicit class grouping exists (UserStyle generator).
- Palette diagnostics panel now shows remediation tips.
- Updated README/QUICKSTART/Cloud Playwright for optional crawler, `CRAWLER_PORT/KEY/TIMEOUT`, and HTTP vs Playwright guidance for CSS/class coverage.

## 2025-11-15 — Contrast Warnings & Role-Aware Accents
- Mapping pipeline now emits contrast warnings (text vs backgrounds, accent vs surfaces) and will fallback to palette text when ratios fail; warnings surface in diagnostics.
- UserStyle class colors now prioritize AI role guesses and class-name hints (CTA → accent, nav/link → bi-accent1, badge/tag → bi-accent2; status roles map to Catppuccin greens/yellows/reds/sapphires). Cycle fallback remains for variety.
- Playwright badge shows last test time and RTT; last error surfaced when falling back to HTTP.
