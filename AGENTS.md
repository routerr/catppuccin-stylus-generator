Agent Working Notes – Hover Readability Plan

Objective
- Eliminate invisible text on hover while preserving Catppuccin harmony.
- Ensure AI-generated class mappings are reflected across UserStyle, LESS, and Stylus.

Constraints
- Color-only changes (no layout/spacing/borders beyond color).
- Keep gradients as progressive enhancement; never at the cost of readability.

Plan
1) Restrict gradient text to safe engines only
   - Use gradient text only when both -webkit-background-clip: text and -webkit-text-fill-color: transparent are supported simultaneously.
   - Remove non-WebKit gradient text fallback that sets color: transparent.

2) Enforce solid, contrast-aware hover text
   - Links: default @accent; on hover, if min contrast across base/surface0/1/2 < 4.5, use @text.
   - Buttons: gradient on background only. Text prefers @ALT_MAIN; fallback to @text if contrast < 4.5.

3) Reflect AI class outputs broadly
   - Expand class-based rules (buttons/links/backgrounds/text/borders) to 100 entries.
   - Remove restrictive link-class filters.
   - Add border color-only overrides plus subtle hover accent.

4) Keep AI mappings intact
   - Do not pre-filter “button/clickable background” mappings before generation. Let generators enforce readability.

5) Sync providers
   - Ensure OpenRouter/Chutes/Ollama prompts emphasize solid text first and include CSS class analysis where available.

Implementation Checklist
- [x] UserStyle: strict WebKit-only gradient text; no color: transparent elsewhere.
- [x] LESS/Stylus: mirror strict support checks and add class-specific rules.
- [x] Generators: pass cssAnalysis to LESS/Stylus; stop pre-filtering AI mappings.
- [x] Prompts: class analysis and clarity rules aligned across providers.

Validation
- Run TypeScript compile for safety (npx tsc -noEmit).
- Spot-check generated UserStyle/LESS/Stylus for absence of color: transparent except inside the safe WebKit block.
- Verify links/buttons hover as solid text on non-WebKit; gradient text only on WebKit.

Rollbacks
- If any site still shows invisible hover text, remove gradient text entirely and keep only solid text on hover.

