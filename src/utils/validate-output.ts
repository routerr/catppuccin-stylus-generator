/**
 * Output Validator
 * Validates generated theme output for syntax, duplicates, and coverage
 */

import type { GeneratedTheme } from '../types/deep-analysis';
import type { CatppuccinColor } from '../types/catppuccin';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  context?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    totalSelectors: number;
    duplicateSelectors: number;
    colorReferences: number;
    invalidColorReferences: number;
    lines: number;
  };
}

const CATPPUCCIN_COLORS = new Set<string>([
  'base',
  'mantle',
  'crust',
  'surface0',
  'surface1',
  'surface2',
  'overlay0',
  'overlay1',
  'overlay2',
  'subtext0',
  'subtext1',
  'text',
  'rosewater',
  'flamingo',
  'pink',
  'mauve',
  'red',
  'maroon',
  'peach',
  'yellow',
  'green',
  'teal',
  'sky',
  'sapphire',
  'blue',
  'lavender',
]);

// CSS at-rules that should not be treated as color references
const CSS_AT_RULES = new Set<string>([
  'media',
  'supports',
  'keyframes',
  'font-face',
  'import',
  'charset',
  'namespace',
  'page',
  'counter-style',
  'font-feature-values',
  'property',
  'layer',
  'container',
  'scope',
  'starting-style',
  // LESS/preprocessor specific
  'moz-document',
  'flavor',
  'catppuccin',
]);

/**
 * Strip comments from LESS code for more reliable parsing
 */
function stripComments(code: string): string {
  // Remove multi-line comments (/* ... */)
  let result = code.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove single-line comments (// ...)
  result = result.replace(/\/\/.*$/gm, '');

  return result;
}

/**
 * Validate generated LESS output
 */
export function validateOutput(theme: GeneratedTheme): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Strip comments before processing to avoid parsing issues
  const cleanCode = stripComments(theme.less);
  const lines = cleanCode.split('\n');

  // Stats tracking
  const stats = {
    totalSelectors: 0,
    duplicateSelectors: 0,
    colorReferences: 0,
    invalidColorReferences: 0,
    lines: theme.less.split('\n').length, // Count original lines including comments
  };

  // Track selectors for duplicate detection
  const selectorMap = new Map<string, number[]>();

  // Parse and validate each line
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed === '') {
      return;
    }

    // Check for selector definitions (ends with {)
    // Use consistent pattern: selectors end with {
    if (trimmed.match(/^[^{}]+\{$/)) {
      const selector = trimmed.replace(/\{$/, '').trim();
      if (selector && !selector.startsWith('@')) {
        stats.totalSelectors++;
        const existing = selectorMap.get(selector) || [];
        selectorMap.set(selector, [...existing, lineNum]);
      }
    }

    // Check for color references @color
    const colorRefs = trimmed.matchAll(/@([a-z0-9-]+)/gi);
    for (const match of colorRefs) {
      const colorName = match[1];

      // Skip CSS at-rules and LESS constructs
      if (CSS_AT_RULES.has(colorName)) {
        continue;
      }

      stats.colorReferences++;

      // Validate it's a valid Catppuccin color
      if (!CATPPUCCIN_COLORS.has(colorName)) {
        stats.invalidColorReferences++;
        issues.push({
          severity: 'error',
          message: `Invalid Catppuccin color reference: @${colorName}`,
          line: lineNum,
          context: trimmed,
        });
      }
    }

    // Check for invalid CSS properties
    if (trimmed.includes(':') && !trimmed.startsWith('@')) {
      const propMatch = trimmed.match(/^([\w-]+):\s*(.+);?$/);
      if (propMatch) {
        const [, property, value] = propMatch;

        // Check for empty values
        if (!value || value.trim() === '') {
          issues.push({
            severity: 'warning',
            message: `Empty value for property: ${property}`,
            line: lineNum,
            context: trimmed,
          });
        }

        // Check for invalid property names
        if (property.includes(' ')) {
          issues.push({
            severity: 'error',
            message: `Invalid property name (contains space): ${property}`,
            line: lineNum,
            context: trimmed,
          });
        }
      }
    }

    // Check for double semicolons
    if (trimmed.includes(';;')) {
      issues.push({
        severity: 'warning',
        message: 'Double semicolon detected',
        line: lineNum,
        context: trimmed,
      });
    }
  });

  // Check for duplicate selectors
  selectorMap.forEach((lineNumbers, selector) => {
    if (lineNumbers.length > 1) {
      stats.duplicateSelectors++;
      issues.push({
        severity: 'warning',
        message: `Duplicate selector: ${selector}`,
        context: `Appears on lines: ${lineNumbers.join(', ')}`,
      });
    }
  });

  // Check brace balance across entire file
  const allBraces = theme.less.match(/[{}]/g) || [];
  let braceBalance = 0;
  allBraces.forEach(brace => {
    braceBalance += brace === '{' ? 1 : -1;
  });

  if (braceBalance !== 0) {
    issues.push({
      severity: 'error',
      message: `Unbalanced braces: ${braceBalance > 0 ? 'unclosed' : 'extra closing'} braces detected`,
      context: `Balance: ${braceBalance}`,
    });
  }

  // Validate coverage
  if (theme.coverage) {
    if (theme.coverage.variableCoverage === 0 && theme.coverage.svgCoverage === 0 && theme.coverage.selectorCoverage === 0) {
      issues.push({
        severity: 'warning',
        message: 'Zero coverage: no variables, SVGs, or selectors mapped',
      });
    }
  }

  // Determine overall validity
  const hasErrors = issues.some(issue => issue.severity === 'error');
  const valid = !hasErrors;

  return {
    valid,
    issues,
    stats,
  };
}

/**
 * Quick syntax check for LESS
 */
export function validateSyntax(lessCode: string): { valid: boolean; error?: string } {
  try {
    // Basic syntax checks
    const lines = lessCode.split('\n');
    let braceCount = 0;
    let inComment = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Track multi-line comments
      if (line.startsWith('/*')) inComment = true;
      if (line.endsWith('*/')) inComment = false;
      if (inComment) continue;

      // Skip single-line comments
      if (line.startsWith('//')) continue;

      // Count braces
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      // Negative brace count means extra closing brace
      if (braceCount < 0) {
        return {
          valid: false,
          error: `Extra closing brace at line ${lineNum}`,
        };
      }
    }

    // Final brace balance
    if (braceCount !== 0) {
      return {
        valid: false,
        error: `Unbalanced braces: ${braceCount} ${braceCount > 0 ? 'unclosed' : 'extra'}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Syntax validation failed',
    };
  }
}

/**
 * Check for selector duplicates
 */
export function findDuplicateSelectors(lessCode: string): Map<string, number[]> {
  const duplicates = new Map<string, number[]>();
  const selectorMap = new Map<string, number[]>();

  // Strip comments for consistent parsing
  const cleanCode = stripComments(lessCode);
  const lines = cleanCode.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Match selector definitions (consistent pattern: ends with {)
    if (trimmed.match(/^[^{}]+\{$/)) {
      const selector = trimmed.replace(/\{$/, '').trim();
      if (selector && !selector.startsWith('@')) {
        const existing = selectorMap.get(selector) || [];
        selectorMap.set(selector, [...existing, index + 1]);
      }
    }
  });

  // Find duplicates
  selectorMap.forEach((lineNumbers, selector) => {
    if (lineNumbers.length > 1) {
      duplicates.set(selector, lineNumbers);
    }
  });

  return duplicates;
}

/**
 * Validate color references
 */
export function validateColorReferences(lessCode: string): { valid: boolean; invalidRefs: string[] } {
  const invalidRefs: string[] = [];
  const colorRefs = lessCode.matchAll(/@([a-z0-9-]+)/gi);

  for (const match of colorRefs) {
    const colorName = match[1];

    // Skip CSS at-rules and LESS constructs
    if (CSS_AT_RULES.has(colorName)) {
      continue;
    }

    // Check if it's a valid Catppuccin color
    if (!CATPPUCCIN_COLORS.has(colorName)) {
      invalidRefs.push(`@${colorName}`);
    }
  }

  return {
    valid: invalidRefs.length === 0,
    invalidRefs: [...new Set(invalidRefs)], // Deduplicate
  };
}

/**
 * Compute coverage metrics
 */
export function computeCoverageMetrics(theme: GeneratedTheme): {
  variableCoverage: number;
  svgCoverage: number;
  selectorCoverage: number;
  totalCoverage: number;
  averageCoverage: number;
} {
  const coverage = theme.coverage || { variableCoverage: 0, svgCoverage: 0, selectorCoverage: 0 };
  const totalCoverage = coverage.variableCoverage + coverage.svgCoverage + coverage.selectorCoverage;
  const averageCoverage = Math.round(totalCoverage / 3);

  return {
    variableCoverage: coverage.variableCoverage,
    svgCoverage: coverage.svgCoverage,
    selectorCoverage: coverage.selectorCoverage,
    totalCoverage,
    averageCoverage,
  };
}

/**
 * Generate validation report
 */
export function generateValidationReport(theme: GeneratedTheme): string {
  const validation = validateOutput(theme);
  const coverage = computeCoverageMetrics(theme);

  const lines: string[] = [];
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('                 VALIDATION REPORT                        ');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');

  // Overall status
  lines.push(`Status: ${validation.valid ? '✅ VALID' : '❌ INVALID'}`);
  lines.push('');

  // Stats
  lines.push('Statistics:');
  lines.push(`  Total lines: ${validation.stats.lines}`);
  lines.push(`  Total selectors: ${validation.stats.totalSelectors}`);
  lines.push(`  Duplicate selectors: ${validation.stats.duplicateSelectors}`);
  lines.push(`  Color references: ${validation.stats.colorReferences}`);
  lines.push(`  Invalid references: ${validation.stats.invalidColorReferences}`);
  lines.push('');

  // Coverage
  lines.push('Coverage:');
  lines.push(`  CSS Variables: ${coverage.variableCoverage}%`);
  lines.push(`  SVG Icons: ${coverage.svgCoverage}%`);
  lines.push(`  Selectors: ${coverage.selectorCoverage}%`);
  lines.push(`  Total: ${coverage.totalCoverage} (Average: ${coverage.averageCoverage}%)`);
  lines.push('');

  // Issues
  if (validation.issues.length > 0) {
    lines.push('Issues:');

    const errors = validation.issues.filter(i => i.severity === 'error');
    const warnings = validation.issues.filter(i => i.severity === 'warning');
    const info = validation.issues.filter(i => i.severity === 'info');

    if (errors.length > 0) {
      lines.push(`  ❌ Errors (${errors.length}):`);
      errors.forEach(issue => {
        lines.push(`     - ${issue.message}`);
        if (issue.line) lines.push(`       Line: ${issue.line}`);
        if (issue.context) lines.push(`       Context: ${issue.context}`);
      });
    }

    if (warnings.length > 0) {
      lines.push(`  ⚠️  Warnings (${warnings.length}):`);
      warnings.slice(0, 10).forEach(issue => {
        lines.push(`     - ${issue.message}`);
        if (issue.context) lines.push(`       ${issue.context}`);
      });
      if (warnings.length > 10) {
        lines.push(`     ... and ${warnings.length - 10} more warnings`);
      }
    }

    if (info.length > 0) {
      lines.push(`  ℹ️  Info (${info.length}):`);
      info.forEach(issue => {
        lines.push(`     - ${issue.message}`);
      });
    }
  } else {
    lines.push('✅ No issues found!');
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}
