# Catppuccin Stylus Generator Project Plan

## Vision & Goals
- **Primary Objective**: Deliver a responsive React 19 + Rite 6 web application that allows users to generate, preview, and export Catppuccin-inspired Stylus themes tailored to any website.
- **Key Outcomes**:
  - Seamless UI flow for selecting source sites, customizing palettes, and previewing themes.
  - Reliable content-scraping pipeline to capture target site structure and color variables.
  - AI-assisted theme generation leveraging Catppuccin palette variations and user preferences.
  - Packaged deployment for both web and browser extension delivery channels.

## Product Milestones & Deliverables
1. **Foundations (Milestone M1)**
   - Project scaffolding with React 19, Vite, and Rite 6 server functions.
   - Shared UI component library with theming tokens.
   - Baseline documentation and developer environment setup.
2. **Interactive UI Flow (Milestone M2)**
   - Complete multi-step UI: site input, scraping status, theme preview, export options.
   - State management and routing (React Router).
   - Client-side validation and error handling.
3. **Scraper Integration (Milestone M3)**
   - Rite 6 server endpoints for initiating and monitoring scraping jobs.
   - Puppeteer-based scraping worker deployed as serverless task.
   - Normalized site metadata persisted for reuse.
4. **AI Theme Generation (Milestone M4)**
   - Prompt templates and API integration for AI palette recommendations.
   - Mapping AI output to CSS variables + Catppuccin shades.
   - Feedback loop for user adjustments with live preview.
5. **Packaging & Deployment (Milestone M5)**
   - Web build pipeline (Vite) with CI integration.
   - Browser extension packaging for Stylus (.user.css) export.
   - Production deployment to Rite 6 (serverless) and static hosting (e.g., Cloudflare Pages).
6. **Launch Readiness (Milestone M6)**
   - Comprehensive documentation, tutorials, and demo videos.
   - Monitoring, analytics, and support setup.
   - Final QA and release sign-off.

## Requirement Breakdown & Subtasks

### UI Flow
- UX wireframes, component map, and design tokens.
- React Router routing for multi-step process.
- Form state management with React Hook Form + Zod validation.
- Live preview panel rendering generated CSS using `<style>` injection.
- Accessibility + responsive design QA.

### Scraper Integration
- Rite 6 serverless function to accept URL submissions and enqueue scrape jobs.
- Headless browser worker (Puppeteer) extracting DOM structure, dominant colors, CSS selectors.
- Storage (Supabase Postgres) for cached scrape results and metadata.
- Status polling API and client integration.

### AI Theme Generation
- Prompt engineering for Catppuccin palette transformations.
- Integration with OpenAI's GPT-4.1 or Anthropic Claude 3 Haiku via Rite 6 connectors.
- Cost guardrails: enforce max tokens, caching recommendations.
- Mapping AI output to CSS variables and generating Stylus-compatible files.

### Packaging
- Build scripts for `.user.css` output + JSON metadata.
- CLI utility (Rite function) for batch generation.
- Browser extension manifest and packaging automation.

### Deployment
- CI/CD with GitHub Actions (test, lint, build, deploy to Rite 6 + Cloudflare Pages).
- Environment configuration management (Dotenv, Rite secrets).
- Monitoring (Sentry) and analytics (Plausible).

## Libraries & Services

| Subsystem | Libraries / Services | Rationale | Cost Considerations |
|-----------|---------------------|-----------|---------------------|
| UI Layer | React 19, Vite 5, TypeScript, Tailwind CSS, Radix UI, React Router, React Hook Form, Zod | Modern, fast dev experience; strong typing; accessible primitives; form validation | OSS (free). Tailwind UI components optional paid addon (not required). |
| State Management | Zustand or Redux Toolkit | Lightweight global state; good developer ergonomics | OSS (free). |
| Styling & Theming | Tailwind CSS + CSS Variables | Rapid prototyping; dynamic theming support | OSS (free). |
| Scraping | Puppeteer, Rite 6 serverless functions, Supabase Postgres | Reliable headless browser; Rite 6 allows JS serverless runtime; Supabase offers managed Postgres + auth | Puppeteer OSS (free). Rite 6 pay-per-invocation; estimate <$20/month in dev. Supabase free tier sufficient initially. |
| AI Theme Generation | OpenAI GPT-4.1 or Anthropic Claude 3 Haiku via Rite connectors | High-quality generative suggestions for color schemes | Usage-based (~$5-10 per 1k requests depending on model). Employ caching, small prompts to control costs. |
| Packaging | Vite build pipeline, Rite CLI, Node scripts | Automated bundling; integrates with deployment targets | OSS (free). |
| Deployment | GitHub Actions, Rite 6, Cloudflare Pages | CI/CD automation; scalable hosting; global CDN | GitHub Actions free for OSS; Rite 6 usage-based; Cloudflare Pages free tier sufficient. |
| Monitoring | Sentry, Plausible Analytics | Error tracking and privacy-friendly analytics | Sentry free tier for small usage; Plausible ~$9/month (consider self-hosting). |

## Sequencing & Dependencies

1. **Project Setup (Week 1)**
   - Initialize repo with Vite + React 19 + TypeScript.
   - Configure Tailwind, ESLint, Prettier, testing (Vitest + Testing Library).
   - Establish Rite 6 project, Supabase instance, and environment secrets handling.
   - Dependency: none.

2. **Design & UI Scaffolding (Weeks 1-2)**
   - Produce wireframes and component inventory.
   - Build base layout, navigation, theme tokens, global state store.
   - Implement form steps with placeholder data.
   - Dependency: Project setup.

3. **Scraper API Prototype (Weeks 2-3)**
   - Implement Rite serverless endpoint stub returning mock data.
   - Add Supabase schema for site metadata.
   - Develop Puppeteer worker with controlled sandbox URLs.
   - Dependency: Setup (env config, Supabase).

4. **Client-Scraper Integration (Week 3)**
   - Connect UI flow to scraping endpoint; show progress, handle errors.
   - Add polling and caching logic with Zustand.
   - Dependency: UI scaffolding + Scraper prototype.

5. **AI Theme Generation MVP (Weeks 3-4)**
   - Design prompts, integrate AI API through Rite connector.
   - Parse responses into CSS variable sets; display preview.
   - Implement token usage logging + cost guardrails.
   - Dependency: Scraper metadata (colors/selectors) + UI flow.

6. **Export & Packaging (Week 4)**
   - Generate Stylus `.user.css` files and zipped packages.
   - Create CLI script for batch exports.
   - Prepare browser extension structure and manifest.
   - Dependency: Theme generation output.

7. **Deployment Pipeline (Week 4-5)**
   - Configure GitHub Actions for lint/test/build/deploy.
   - Set up Rite 6 deployment scripts and Cloudflare Pages hosting.
   - Dependency: Build scripts ready.

8. **QA & Launch Prep (Week 5)**
   - Write integration tests, manual QA checklist.
   - Add monitoring hooks (Sentry), analytics (Plausible).
   - Prepare documentation and tutorials.
   - Dependency: All feature-complete modules.

## Risk & Mitigation Notes
- **Scraping Reliability**: Some sites block bots; include user-agent rotation and fallback manual CSS editing.
- **AI Cost Overruns**: Implement caching, limit requests per user session, add usage dashboard.
- **Browser Extension Compliance**: Validate manifest, permissions, and cross-browser compatibility early.
- **Performance**: Lazy-load heavy modules (Puppeteer interactions via API, not client) and memoize theme computations.

## Contributor Guidance
- Follow the milestone sequence; each task should branch off `main` and merge via PR with tests.
- Prefer TypeScript strict mode and consistent lint rules (ESLint + Prettier).
- Maintain documentation updates within `docs/` for future iterations.
