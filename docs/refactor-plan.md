# Catppuccin Theme Generator • Refactor Blueprint

This document tracks the end-to-end rebuild to improve generated themes across variation, readability, and elegance while preserving layout intent. Each phase lists its goals, concrete deliverables, and documentation checkpoints. Whenever a phase reaches its benchmark or an implementation is about to finish, update this file (and any relevant companion docs) with the outcome.

---

## Project Goals
- **Semantic Variation**: Generated themes must analyze the target site’s palette/roles and distribute Catppuccin tokens so different sites feel distinct.
- **Flavor Fidelity**: Every non-accent token (text, backgrounds, overlays) dynamically binds to the selected flavor rather than fixed hex values.
- **Contrast & Readability**: Automatically enforce WCAG AA contrast using Catppuccin-friendly adjustments; no invisible text or low-contrast states.
- **Layout Integrity**: No strict allowlists, but any layout-affecting declaration must be justified by readability and surfaced with warnings.
- **Elegance & Polish**: Match the quality of the handcrafted masterpieces under `Themes/less`.
- **UX Cleanup**: Remove inactive UI (e.g., “Download Stylus”) until replacement features exist, while noting future enhancements (Stylus import bundles).

### Reference Materials
- Human-made exemplars: `Themes/less/{Claude,DuckDuckGo,Perplexity}.less`
- Stylus multi-import template (future work): `Themes/import.json`
- Accent philosophy: `src/utils/accent-schemes.ts`
- Current pipeline overview: `README.md`, `QUICKSTART.md`

---

## Phase Breakdown

### Phase 1 — Discovery & Baseline Mapping
**Objectives**
- Audit current AI → generator pipeline to see where layout-impacting CSS originates.
- Compare generator output with at least two human LESS themes, cataloging:
  - Semantic token assignments (base/mantle/surface layering, subtext usage, accent rotation)
  - Interaction styling (solid defaults vs. gradient hover)
  - Contrast handling techniques.
- Produce a “site palette profile” requirement spec describing necessary inputs/outputs for later phases.

**Deliverables**
- Baseline notes committed here plus supporting snippets (can link to log sections).
- Checklist of discovered issues prioritized for future phases.

**Benchmark Update Trigger**: Documented comparison matrices + pipeline trace added to this file.

**Status — 2025-11-15**
- **Pipeline trace**: `src/services/generators/userstyle.ts` applies broad rules such as forcing `body` backgrounds (`background-color: @base; color: @text;`) and overriding every analyzed background class with `@surface0 !important`, which homogenizes layouts and explains issue #2. A similar blanket rule sets every anchor to `position: relative` and Catppuccin gradients, creating uniform visuals and occasional layout shifts.
- **Variation gap vs. handcrafted LESS**: Human themes (`Themes/less/DuckDuckGo.less`, `Themes/less/Claude.less`) only override semantic CSS variables or carefully scoped selectors. In contrast, `generateClassSpecificRules()` cycles accents by index and randomly assigns hover angles (Math.random) independent of site palette or role semantics, which is why separate sites look nearly identical (issue #1).
- **Flavor fidelity problems**: Generated LESS emits fixed hex constants, plus `generateCssTheme()` hard-codes fallbacks to `#ffffff`/`filter: brightness` rather than flavor tokens, so text colors stop following the selected flavor (issue #3). Handcrafted themes exclusively use `@base/@text/@surface*` tokens.
- **Contrast/invisibility observations**: `generateClassSpecificRules()` paints entire classes with `@surface0` and `@text` using `!important`, yet hover gradients always pull saturated accents, so text on accent backgrounds frequently drops below AA contrast (issue #4). Human themes rely on Catppuccin’s surface/subtext hierarchy and adjust saturation rather than forcing gradients.
- **Elegance gap**: Masterpiece themes mix subtle fades, keep typography untouched, and let brand gradients remain via explicit allowlists. Generated CSS frequently reverts gradient classes wholesale and applies the same gradient recipe to every button/link, leading to the “not elegant” feedback (issue #5).
- **UI debt**: Confirmed “Download Stylus” still exists without functionality, aligning with issue #6; removal scheduled in Phase 7.

**Site Palette Profile Requirements (derived from analysis)**
1. **Inputs**
   - Parsed CSS tokens: colors, gradients, and CSS variable references grouped by role (background, surface, text, interactive, alerts).
   - Frequency/importance scores (e.g., how often a color appears in buttons vs. backgrounds).
   - Semantic hints: class/id names, pseudo-classes, data attributes (to align with human themes’ targeted selectors).
2. **Outputs**
   - Role-to-token map: `body`, `panel`, `card`, `toolbar`, `primary-button`, `secondary-button`, `link`, `badge`, `success/warning/danger`, `chip`, `data-surface`.
   - Accent distribution weights (70/20/10) seeded by site palette so multiple sites don’t reuse the same arrangement.
   - Contrast metadata per role (text hex, background hex, current ratio) so Phase 5 can auto-correct intelligently.
3. **Rules**
   - Always express colors via Catppuccin flavor tokens (no raw hex) to keep flavor switching functional.
   - Preserve site-defined gradients/brand elements by default; provide opt-out lists to avoid blanket reverts.
   - Emit deterministic data keyed by site URL + hash of CSS snapshot to keep generation reproducible.

---

### Phase 2 — Semantic Palette Engine
**Objectives**
- Build an analyzer that inspects fetched CSS to infer semantic roles (body, panels, headings, interactive, alerts, etc.) and source palettes.
- Map each role to Catppuccin tokens using flavor-specific `@base`, `@mantle`, `@surface*`, `@text`, `@subtext*`, `@overlay*`.
- Provide hooks so generators can request tokens per role (e.g., `paletteRoles.get('primary-button')`).

**Deliverables**
- New `src/services/palette-profile` module (or similar) with deterministic outputs (seeded per-site for reproducible variation).
- Unit tests covering flavor binding and role coverage.

**Benchmark Update Trigger**: First role-to-token mappings generated end-to-end from sample CSS.

**Status — Inputs Ready (2025-11-15)**
- Live HTML snapshots saved under `analysis_snapshots/` for DuckDuckGo, Gemini, Claude, GitHub, and Perplexity (see `docs/site-snapshots.md`).
- Each site exposes semantic CSS tokens (e.g., DuckDuckGo `--sds-color-*`, Claude `text-*` Tailwind tokens, GitHub `--fgColor-*`), giving concrete anchors for palette inference.
- The “Example Catppuccin” output still references `d2l-*`/`tou-*` classes that do not exist in `analysis_snapshots/duckduckgo.html`, confirming cross-site selector leakage. Phase 2 must scope collected selectors per URL hash and concentrate on semantic variables rather than generic `.btn` overrides.
- Parser scaffolding implemented in `src/services/palette-profile.ts`, producing deterministic `PaletteProfile` objects (see API spec in `docs/palette-profile.md`). A helper script (`scripts/generate-palette-profile.ts`) now generates fixtures by combining HTML + optional CSS.
- First fixture stored at `analysis_snapshots/duckduckgo.palette.json`, built from the DuckDuckGo snapshot plus the handcrafted LESS file to validate variable extraction and role heuristics.
- `convertProfileToMapping()` converts any profile into a `MappingOutput`, letting all generators reuse the existing RoleMap pipeline. `createUserStylePackage()` now prefers `cssAnalysis.paletteProfile` (when present), enabling profile-driven theming without legacy `ColorMapping[]`.
- Added automated coverage via `npm run test:palette` (`__tests__/test-palette-profile.ts`) to guard token extraction, role inference, and MappingOutput metadata.
- Additional fixtures generated for Gemini, Claude, GitHub, and Perplexity (`analysis_snapshots/*.palette.json`) to cover multiple frameworks. The Playwright crawler (via `fetchWebsiteContent`) now builds a palette profile automatically, feeding diagnostics, seeds, and role maps to all generators (Stylus/LESS/CSS/UserStyle). Diagnostics are surfaced in the UI, and the palette-profile tests now assert cross-site heuristics.
- Palette profiles are cached in `localStorage` keyed by URL + hash so repeat crawls skip recomputation when the HTML hasn’t changed.

---

### Phase 3 — Accent Variation & Gradient Logic
**Objectives**
- Extend `accent-schemes` usage so each semantic role can pull from `[main, biAccent1, biAccent2]` using deterministic variety (avoid identical visuals across sites).
- Cascade gradients per the Catppuccin guideline: solid default state, gradients only on hover/focus/active with 8–12% opacity companions.
- Allow role-specific gradient angles/patterns inspired by human themes (e.g., 135° for CTAs, 45° for links).

**Deliverables**
- Accent assignment engine + gradient composer utilities.
- Configurable knobs (per-site seed, role weighting) exposed to UI for expert overrides.

**Benchmark Update Trigger**: Sample theme showing distinct accent distribution vs. baseline recorded here.

**Status — Accent Plan (2025-11-15)**
- Added `createAccentPlan` utility that derives deterministic accent cycles and gradient angles from each palette profile’s hash, ensuring per-site variety while respecting Catppuccin’s main/bi-accent hierarchy.
- Buttons, links, backgrounds, and text classes now consume the accent plan, so hover/active gradients and accent rotations are stable for a given site (no more `Math.random()` differences between runs).
- Gradient angles default to the accent plan’s seeded values, but still honor AI-provided hints when present. This matches the “solid default, gradient on interaction” guideline from the handcrafted themes.
- Next step: allow an optional “AI-assisted mapping” toggle that prompts the selected AI model to classify selectors (CTA, alert, badge) on demand and feed that metadata into the accent plan for even smarter distribution.

**Phase 3 Tail — Planned Tasks**
- Per-site caching UX: add “Re-run with same crawl” to reuse palette profiles and class-role guesses while switching models or the AI-mapping toggle (no refetch).
- Diagnostics upgrades: show “how to improve mapping” tips when warnings exist and offer a palette profile JSON download.
- Playwright status: display a small “Connected / Fallback” badge near the crawler endpoint with last test time.
- Guardrails: wrap AI calls with a single retry on 429/503 and surface clearer parse-error toasts.
- Style polish: extend accent-plan coverage to alerts/notifications and add UI toggles for badge/card/table accent coverage.

---

### Phase 4 — Readability-First Guardrails (Soft Enforcement)
**Objectives**
- Before emitting CSS, scan declarations:
  - **Color-centric** props pass silently.
  - **Potential layout modifiers** (display, width, position, spacing, transforms) trigger warnings with context (selector, property, reason).
  - Allow overrides when the change demonstrably improves readability.
- Surface warnings in the UI console/log panel rather than blocking output.

**Deliverables**
- Guardrail module returning diagnostic metadata consumed by UI.
- Documentation of heuristics used to evaluate “readability justification.”

**Benchmark Update Trigger**: Guardrail warnings visible in the app for known problematic selectors.

---

### Phase 5 — Contrast Enforcement Engine
**Objectives**
- Run WCAG AA contrast calculations for every (text, background) pair, including hover/active/disabled states and gradient overlays.
- When a pair fails, adjust using Catppuccin-friendly strategies:
  - Swap to alternate surface/subtext tokens from the same flavor.
  - Apply safe opacity tweaks without introducing non-Catppuccin colors.
  - Fall back to `@text` on `@base`/`@mantle` when necessary.

**Deliverables**
- Contrast validator with automated tests covering flavor variations.
- Report summarizing adjustments applied per generation (for transparency).

**Benchmark Update Trigger**: Recorded case where the engine auto-corrects a failing pair and logs it.

---

### Phase 6 — Elegance Patterns & Archetypes
**Objectives**
- Define archetypes (e.g., “dashboard,” “editorial,” “chat”) derived from site analysis to guide token distribution ratios and subtle decorative choices.
- Incorporate tasteful Catppuccin-aligned patterns (fine dividers, soft glows) that do not alter layout metrics.
- Ensure gradients, shadows, and borders echo the finesse seen in `Themes/less`.

**Deliverables**
- Archetype definitions + selection heuristics.
- Snapshot examples per archetype documented here with before/after comparison.

**Benchmark Update Trigger**: At least one archetype fully styled with screenshots/notes referenced in this doc.

---

### Phase 7 — UI/UX Cleanup
**Objectives**
- Remove the dormant “Download Stylus” control until export tooling exists.
- Enhance the log/insight panel to display: palette summary, accent usage, guardrail warnings, contrast fixes.
- Update README/QUICKSTART to reflect the new workflow and safeguards.

**Deliverables**
- Updated UI + documentation PR-ready.
- Note in roadmap/to-do referencing future Stylus multi-import/export using `Themes/import.json`.

**Benchmark Update Trigger**: GUI with cleaned controls + doc updates merged locally.

**Status — Docs & Tips Updated (2025-11-15)**
- README/QUICKSTART/Cloud Playwright refreshed for optional crawler, env vars (CRAWLER_PORT/KEY/TIMEOUT), and HTTP vs Playwright guidance.
- Palette diagnostics panel now surfaces remediation tips when warnings appear.
- Guardrail retries partially added (429/503 for mode detection + Ollama); full guardrail pass still pending.
- Contrast warnings now emitted from the palette mapping pipeline; text will fallback to safer palette tokens when ratios fail, and warnings surface in diagnostics. Class colors prioritize AI role guesses and class-name hints to spread accent/bi-accent coverage.

---

### Phase 8 — Verification & Rollout
**Objectives**
- Add snapshot tests comparing generated CSS for representative site fixtures ensuring:
  - No forbidden properties slip through silently.
  - Contrast warnings exist for any manual overrides.
  - Flavor switching rebinds all tokens.
- Perform manual QA vs. human themes for subjective elegance.
- Record outstanding backlog items (e.g., Stylus import feature) here with owner & status.

**Deliverables**
- Test suite additions + QA checklist results.
- Final recap entry summarizing refactor outcomes and remaining work.

**Benchmark Update Trigger**: Tests + QA checklist complete; summary appended.

---

## Future Backlog (post-refactor)
- **Stylus Multi-Import/Export**: Leverage `Themes/import.json` to generate bundles ready for Stylus’ “Import” feature (multiple themes at once). Begin once Phase 8 stabilizes.
- **Advanced Distribution Controls**: UI sliders to adjust accent distribution per archetype, exposing the deterministic seed.
- **Browser Extension Integration**: Optional direct install via Stylus-compatible endpoints.

Keep this section updated as priorities evolve.
