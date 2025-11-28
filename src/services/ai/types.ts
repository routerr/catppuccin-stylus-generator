/**
 * Shared AI service types
 */

import type { WebsiteColorAnalysis, ColorMapping } from '../../types/catppuccin';
import type { CrawlerResult } from '../../types/theme';

/**
 * Extended crawler result with AI analysis metadata
 */
export interface ExtendedCrawlerResult extends CrawlerResult {
  cssAnalysis?: {
    grouped?: {
      buttons: Array<{ className: string }>;
      links: Array<{ className: string }>;
      backgrounds: Array<{ className: string }>;
      text: Array<{ className: string }>;
      borders: Array<{ className: string }>;
    };
    aiRoleGuesses?: Array<{ className: string; role: string; confidence?: number }>;
  };
  detectedMode?: 'dark' | 'light';
}

/**
 * AI analysis response structure
 */
export interface AIAnalysisResponse {
  analysis: WebsiteColorAnalysis;
  mappings: ColorMapping[];
  classRoles?: Array<{ className: string; role: string; confidence?: number }>;
}

/**
 * Color analysis result with detected mode
 */
export interface ColorAnalysisResult {
  analysis: WebsiteColorAnalysis;
  mappings: ColorMapping[];
  mode: 'dark' | 'light';
  classRoles?: Array<{ className: string; role: string; confidence?: number }>;
}

/**
 * Options for JSON extraction
 */
export interface JSONExtractionOptions {
  apiEndpoint: string;
  apiKey: string;
  model: string;
  rawResponse: string;
}
