# Architecture Mind: Catppuccin Stylus Generator

## Core Philosophy

The project aims to transform any website into a Catppuccin-themed masterpiece while strictly preserving the original layout. It operates on a "Color-Only" modification principle.

## System Architecture

### 1. Deep Analysis Layer (`src/utils/deep-analysis/`)

Responsible for dissecting the target website to understand its structure and style.

- **CSS Variable Extractor**: Parses HTML/CSS to find custom properties, their values, and usage frequency.
- **SVG Analyzer**: Identifies inline and background SVGs, extracting their colors for replacement.
- **Selector Discovery**: Finds and categorizes CSS selectors (buttons, cards, inputs) to enable precision targeting.
- **Design System Detector**: Heuristics to identify frameworks (Tailwind, Bootstrap, Material) to aid mapping.

### 2. Intelligence Layer (`src/services/ai/`)

Connects raw analysis data to the Catppuccin palette.

- **Deep Mapper**: Orchestrates the mapping process.
- **AI Providers**: Interfaces with LLMs (OpenRouter, Chutes, Ollama) to make semantic decisions (e.g., "This #1a73e8 is a primary action color, map it to Blue").
- **Prompts**: Carefully crafted instructions to ensure AI understands context and layout preservation rules.

### 3. Generation Layer (`src/services/generators/`)

Synthesizes the mappings into a usable stylesheet.

- **UserStyle V3**: The current standard. Generates a dynamic LESS file.
- **Dynamic Features**: Supports changing flavors (Latte/Mocha) and accents (Blue/Rosewater) without regenerating the file.
- **Cascading Gradients**: Implements a 3-level gradient system for rich visual depth.

## Data Flow

1. **Input**: URL provided by user.
2. **Fetch**: `fetchWithDeepAnalysis` retrieves HTML and all CSS (handling CORS).
3. **Analyze**: Extract variables, SVGs, selectors.
4. **Map**: AI determines which Catppuccin colors replace original colors.
5. **Generate**: `generateUserstyleV3` builds the LESS file with mixins and logic.
6. **Output**: User installs the generated UserStyle.

## Key Concepts

- **Layout Preservation**: "If it's not a color, don't touch it."
- **Dynamic Theming**: One file, all possibilities (via LESS guards).
- **Bi-Accent System**: Primary accent + analogous colors for harmonious gradients.
