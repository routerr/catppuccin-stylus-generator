/**
 * Deep Analysis Engine - Entry Point
 *
 * This module provides the main API for analyzing websites
 * and generating site-specific theme data.
 */

export {
  extractColors,
  getTopColors,
  getSaturatedColors,
  getColorsByProperty,
  normalizeToHex,
} from "./color-extractor";
export {
  classifyColor,
  classifyAllColors,
  groupByRole,
  getBestClassifications,
} from "./semantic-classifier";
export {
  buildSiteSignature,
  summarizeSignature,
  compareSignatures,
} from "./site-signature";

// Re-export types
export type {
  ColorOccurrence,
  AggregatedColor,
  ColorExtractionResult,
  SemanticRole,
  SemanticClassification,
  SiteSignature,
  SaturationLevel,
  ColorMapping,
  MappingResult,
  GenerationConfig,
  GeneratedThemeOutput,
} from "../../types/analysis";
