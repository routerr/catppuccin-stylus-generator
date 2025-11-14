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

/**
 * Validate generated LESS output
 */
export function validateOutput(theme: GeneratedTheme): ValidationResult {
  const issues: ValidationIssue[] = [];
  const lines = theme.less.split('\n');

  // Stats tracking
  const stats = {
    totalSelectors: 0,
    duplicateSelectors: 0,
    colorReferences: 0,
    invalidColorReferences: 0,
    lines: lines.length,
  };

  // Track selectors for duplicate detection
  const selectorMap = new Map<string, number[]>();

  // Parse and validate each line
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed === '') {
      return;
    }

    // Check for selector definitions (ends with { or :)
    if (trimmed.match(/^[^{}]+[{:]$/)) {
      const selector = trimmed.replace(/[{:]$/, '').trim();
      if (selector && !selector.startsWith('@')) {
        stats.totalSelectors++;
        const existing = selectorMap.get(selector) || [];
        selectorMap.set(selector, [...existing, lineNum]);
      }
    }

    // Check for color references @color
    const colorRefs = trimmed.matchAll(/@([a-z0-9]+)/gi);
    for (const match of colorRefs) {
      const colorName = match[1];

      // Skip LESS variables and mixins
      if (colorName === 'flavor' || colorName === 'catppuccin' || colorName === 'import') {
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

    // Check for unclosed braces
    const openBraces = (trimmed.match(/{/g) || []).length;
    const closeBraces = (trimmed.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      // This is a multi-line construct, skip
    }

    // Check for invalid CSS properties
    if (trimmed.includes(':') && !trimmed.startsWith('@') && !trimmed.includes('//')) {
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
    if (theme.coverage.variables === 0 && theme.coverage.svgs === 0 && theme.coverage.selectors === 0) {
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

  const lines = lessCode.split('\n');
  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Match selector definitions
    if (trimmed.match(/^[^{}]+\s*{$/)) {
      const selector = trimmed.replace(/\s*{$/, '').trim();
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
  const colorRefs = lessCode.matchAll(/@([a-z0-9]+)/gi);

  for (const match of colorRefs) {
    const colorName = match[1];

    // Skip LESS keywords
    if (['flavor', 'catppuccin', 'import', 'moz-document'].includes(colorName)) {
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
  variables: number;
  svgs: number;
  selectors: number;
  total: number;
  percentage: number;
} {
  const coverage = theme.coverage || { variables: 0, svgs: 0, selectors: 0 };
  const total = coverage.variables + coverage.svgs + coverage.selectors;
  const percentage = total > 0 ? Math.round((total / (total + 1)) * 100) : 0;

  return {
    ...coverage,
    total,
    percentage,
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
  lines.push(`  CSS Variables: ${coverage.variables}`);
  lines.push(`  SVG Icons: ${coverage.svgs}`);
  lines.push(`  Selectors: ${coverage.selectors}`);
  lines.push(`  Total: ${coverage.total} (${coverage.percentage}%)`);
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
