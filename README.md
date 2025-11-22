# Catppuccin Stylus Generator

A powerful, AI-driven tool to generate [Catppuccin](https://github.com/catppuccin/catppuccin) themes for any website.

## Features

- **Deep Analysis Pipeline**: Uses AI to analyze website colors, CSS variables, SVGs, and design systems.
- **Multi-Flavor Support**: Generates themes for all Catppuccin flavors (Latte, Frappé, Macchiato, Mocha).
- **Smart Mapping**: Automatically maps website colors to the most appropriate Catppuccin palette colors.
- **Export Formats**: Generates themes in Stylus (UserCSS), LESS, and CSS formats.
- **AI Providers**: Supports OpenRouter, Chutes AI, and Ollama (Local).

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/catppuccin-stylus-generator.git
   cd catppuccin-stylus-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## Usage

1. **Select AI Provider**: Choose between OpenRouter, Chutes AI, or Ollama.
2. **Enter URL**: Input the URL of the website you want to theme.
3. **Generate**: Click "Generate Theme" to start the analysis.
4. **Preview & Export**: Preview the generated theme and copy the code for Stylus or other userstyle managers.

## Development

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Lint code

## License

MIT