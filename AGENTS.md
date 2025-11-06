# Repository Guidelines

## Code Style
- Prefer clear, descriptive naming and modular functions.
- Keep Stylus, TypeScript, and JavaScript code well-formatted; wrap lines at ~100 characters.
- Maintain consistent indentation: 2 spaces for Stylus/JSON/YAML, 2 spaces for JavaScript/TypeScript, and 4 spaces for Python scripts.

## Tooling & Commands
- Format JS/TS with `npm run format` when available; Stylus files should follow existing spacing conventions.
- Run `npm test` before pushing if tests exist; document skipped tests and reasons.

## Catppuccin Theme Options
- When adjusting theme options, ensure variants (Latte, Frappe, Macchiato, Mocha) remain in sync.
- Keep palette definitions centralized; avoid duplicating hex values—reference shared constants where possible.

## AI Model Selection & API Keys
- Document any new AI model integrations in `docs/` with usage notes.
- Never commit real API keys. Use environment variables (e.g., `CATPPUCCIN_API_KEY`) and placeholder values in examples.
- Update `.env.example` when introducing new required keys.

## Testing & Deployment
- Provide coverage for new features via unit or integration tests when feasible.
- Record manual testing steps for UI changes in PR descriptions.
- Deployment scripts should be idempotent; describe any manual steps clearly in `docs/deployment.md`.

## PR & Messaging Expectations
- Summaries must list user-facing changes and note any refactors or tech debt work.
- Include testing evidence (commands or screenshots) in PR descriptions.
- Reference related issues or discussions with `Closes #<id>` when applicable.
