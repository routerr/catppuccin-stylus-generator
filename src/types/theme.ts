import type { CatppuccinFlavor } from './catppuccin';

// Crawler service types
export type CrawlerService = 'browserbase' | 'exa' | 'firecrawl' | 'brave';

export interface CrawlerConfig {
  service: CrawlerService;
  apiKey: string;
}

export interface CrawlerResult {
  url: string;
  title: string;
  content: string;
  html?: string;
  screenshot?: string;
  colors?: string[];
}

// AI service types
export type AIProvider = 'openrouter' | 'chutes';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  isFree: boolean;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

// Theme output formats
export interface ThemeOutput {
  stylus: string;
  less: string;
  css: string;
}

export interface GeneratedTheme {
  flavor: CatppuccinFlavor;
  output: ThemeOutput;
}

export interface ThemePackage {
  url: string;
  timestamp: string;
  themes?: GeneratedTheme[]; // Old multi-theme format (optional for backward compatibility)
  userStyle?: string; // New single UserStyle format
  metadata: {
    accentColors: string[];
    crawlerUsed: CrawlerService;
    aiModelUsed: string;
  };
}
