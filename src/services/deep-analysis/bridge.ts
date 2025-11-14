/**
 * Bridge Module: Deep Analysis to ThemePackage Converter
 *
 * Converts the output of the deep analysis pipeline (DeepAnalysisPipelineResult)
 * into the legacy ThemePackage format used by the UI.
 */

import type { ThemePackage, FetcherService } from '../../types/theme';
import type { DeepAnalysisPipelineResult } from './index';

/**
 * Converts deep analysis pipeline result to ThemePackage format
 *
 * @param result - Output from runDeepAnalysisPipeline
 * @param fetcherUsed - Source of content (direct-fetch, mhtml-upload, directory-upload)
 * @param aiModelUsed - AI model identifier
 * @returns ThemePackage compatible with existing UI
 */
export function convertToThemePackage(
  result: DeepAnalysisPipelineResult,
  fetcherUsed: FetcherService,
  aiModelUsed: string,
): ThemePackage {
  const { analysis, mappings, userstyle } = result;

  // Extract dominant colors for accent color metadata
  // Use first 3 dominant colors or fallback to detected accent colors
  const accentColors = analysis.dominantColors.slice(0, 3);

  return {
    url: analysis.url,
    timestamp: new Date().toISOString(),

    // New UserStyle format - single LESS file with all 4 flavors
    userStyle: userstyle.less,

    // Metadata for display and tracking
    metadata: {
      accentColors,
      crawlerUsed: fetcherUsed,
      aiModelUsed,

      // Enhanced metadata for deep analysis (optional extension)
      deepAnalysis: {
        designSystem: analysis.designSystem.framework,
        designSystemConfidence: analysis.designSystem.confidence,
        detectedMode: analysis.mode,

        // Coverage statistics
        coverage: {
          variables: userstyle.coverage.variableCoverage,
          svgs: userstyle.coverage.svgCoverage,
          selectors: userstyle.coverage.selectorCoverage,
          total: userstyle.coverage.totalCoverage,
        },

        // Mapping statistics
        mappingStats: {
          variablesMapped: mappings.stats.variables.mapped,
          variablesTotal: mappings.stats.variables.total,
          svgsMapped: mappings.stats.svgs.mapped,
          svgsTotal: mappings.stats.svgs.total,
          selectorsMapped: mappings.stats.selectors.mapped,
          selectorsTotal: mappings.stats.selectors.total,
        },

        // Accent distribution
        accentDistribution: mappings.stats.accentDistribution,
      },
    },
  };
}

/**
 * Type guard to check if a ThemePackage contains deep analysis metadata
 */
export function hasDeepAnalysis(
  pkg: ThemePackage,
): pkg is ThemePackage & {
  metadata: { deepAnalysis: NonNullable<ThemePackage['metadata']>['deepAnalysis'] };
} {
  return 'deepAnalysis' in pkg.metadata;
}

/**
 * Extract summary statistics from a deep analysis ThemePackage
 */
export function extractDeepAnalysisSummary(pkg: ThemePackage): string {
  if (!hasDeepAnalysis(pkg)) {
    return 'Generated with generic theme analysis';
  }

  const { deepAnalysis } = pkg.metadata;
  const { designSystem, coverage, mappingStats } = deepAnalysis;

  const lines: string[] = [
    `🎨 Deep Analysis Complete`,
    ``,
    `Design System: ${designSystem} (${(deepAnalysis.designSystemConfidence * 100).toFixed(0)}% confidence)`,
    `Mode: ${deepAnalysis.detectedMode}`,
    ``,
    `📊 Coverage:`,
    `  • CSS Variables: ${mappingStats.variablesMapped}/${mappingStats.variablesTotal}`,
    `  • SVG Icons: ${mappingStats.svgsMapped}/${mappingStats.svgsTotal}`,
    `  • Selectors: ${mappingStats.selectorsMapped}/${mappingStats.selectorsTotal}`,
    `  • Total Coverage: ${coverage.total} elements`,
    ``,
    `🎨 Accent Distribution:`,
    `  • Main: ${deepAnalysis.accentDistribution.main}`,
    `  • Bi-accent 1: ${deepAnalysis.accentDistribution.biAccent1}`,
    `  • Bi-accent 2: ${deepAnalysis.accentDistribution.biAccent2}`,
  ];

  return lines.join('\n');
}
