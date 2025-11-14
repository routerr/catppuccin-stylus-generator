/**
 * SVG Analyzer
 * Extracts and analyzes SVG elements from website content
 */

import type { SVGInfo, SVGColor, ProcessedSVG } from '../../types/deep-analysis';

/**
 * Extract all SVGs from HTML content and CSS stylesheets
 */
export function analyzeSVGs(
  html: string,
  css: string = ''
): SVGInfo[] {
  const svgs: SVGInfo[] = [];

  // Extract inline SVGs from HTML
  svgs.push(...extractInlineSVGs(html));

  // Extract SVGs from CSS background-image
  svgs.push(...extractBackgroundSVGs(css + extractInlineStyles(html)));

  return svgs;
}

/**
 * Extract inline <svg> elements from HTML
 */
function extractInlineSVGs(html: string): SVGInfo[] {
  const svgs: SVGInfo[] = [];
  const svgRegex = /<svg[^>]*>([\s\S]*?)<\/svg>/gi;
  let match;

  while ((match = svgRegex.exec(html)) !== null) {
    const fullSVG = match[0];
    const colors = extractColorsFromSVG(fullSVG);

    // Try to find parent element for selector
    const before = html.substring(Math.max(0, match.index - 500), match.index);
    const classMatch = before.match(/class=["']([^"']+)["'][^<]*$/);
    const selector = classMatch ? `.${classMatch[1].split(' ')[0]}` : 'svg';

    // Extract dimensions
    const widthMatch = fullSVG.match(/width=["']?(\d+)/);
    const heightMatch = fullSVG.match(/height=["']?(\d+)/);

    svgs.push({
      location: 'inline',
      selector,
      svg: fullSVG,
      colors,
      width: widthMatch ? parseInt(widthMatch[1]) : undefined,
      height: heightMatch ? parseInt(heightMatch[1]) : undefined,
    });
  }

  return svgs;
}

/**
 * Extract SVGs from CSS background-image data URIs
 */
function extractBackgroundSVGs(css: string): SVGInfo[] {
  const svgs: SVGInfo[] = [];

  // Match background-image with SVG data URI
  const bgSVGRegex = /([^{]+)\{[^}]*background(?:-image)?\s*:\s*url\(["']?data:image\/svg\+xml,([^"')]+)["']?\)/gi;
  let match;

  while ((match = bgSVGRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    let svgData = match[2];

    // Decode URL-encoded SVG
    try {
      svgData = decodeURIComponent(svgData);
    } catch (e) {
      // If decode fails, try without decoding
    }

    // Handle escaped SVG (from LESS @svg: escape())
    svgData = svgData.replace(/\\"/g, '"');
    svgData = svgData.replace(/\\\\/g, '\\');

    const colors = extractColorsFromSVG(svgData);

    svgs.push({
      location: 'background',
      selector,
      svg: svgData,
      colors,
    });
  }

  return svgs;
}

/**
 * Extract inline styles from HTML
 */
function extractInlineStyles(html: string): string {
  let styles = '';
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;

  while ((match = styleRegex.exec(html)) !== null) {
    styles += match[1] + '\n';
  }

  return styles;
}

/**
 * Extract colors from SVG markup
 */
function extractColorsFromSVG(svg: string): SVGColor[] {
  const colors: SVGColor[] = [];

  // Match fill attributes
  const fillRegex = /fill=["']([^"']+)["']/gi;
  let match;

  while ((match = fillRegex.exec(svg)) !== null) {
    const value = match[1].trim();
    if (isValidColor(value)) {
      colors.push({
        type: 'fill',
        value,
        attribute: 'fill',
        elementPath: 'unknown', // Would need full DOM parsing for exact path
      });
    }
  }

  // Match stroke attributes
  const strokeRegex = /stroke=["']([^"']+)["']/gi;
  while ((match = strokeRegex.exec(svg)) !== null) {
    const value = match[1].trim();
    if (isValidColor(value)) {
      colors.push({
        type: 'stroke',
        value,
        attribute: 'stroke',
        elementPath: 'unknown',
      });
    }
  }

  // Match stop-color (for gradients)
  const stopColorRegex = /stop-color=["']([^"']+)["']/gi;
  while ((match = stopColorRegex.exec(svg)) !== null) {
    const value = match[1].trim();
    if (isValidColor(value)) {
      colors.push({
        type: 'stop-color',
        value,
        attribute: 'stop-color',
        elementPath: 'stop',
      });
    }
  }

  return colors;
}

/**
 * Check if a value is a valid color
 */
function isValidColor(value: string): boolean {
  const cleaned = value.trim().toLowerCase();

  // Skip special values
  if (cleaned === 'none' || cleaned === 'inherit' || cleaned === 'currentcolor') {
    return false;
  }

  // Hex colors
  if (cleaned.match(/^#[0-9a-f]{3,8}$/i)) return true;

  // RGB/RGBA
  if (cleaned.startsWith('rgb')) return true;

  // HSL/HSLA
  if (cleaned.startsWith('hsl')) return true;

  // Named colors (common ones)
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
    'gray', 'grey', 'cyan', 'magenta', 'pink', 'brown', 'silver', 'gold',
  ];

  return namedColors.includes(cleaned);
}

/**
 * Process SVG for LESS template with color placeholders
 */
export function processSVGForLESS(
  svg: SVGInfo,
  colorMap: Map<string, string> // original color -> catppuccin color
): ProcessedSVG {
  let processedSVG = svg.svg;

  // Replace colors with LESS variable placeholders
  svg.colors.forEach(color => {
    const catppuccinColor = colorMap.get(color.value);
    if (catppuccinColor) {
      // Replace with @{colorName} syntax
      const placeholder = `@{${catppuccinColor}}`;

      // Escape the original color for regex
      const escaped = color.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Replace in SVG
      processedSVG = processedSVG.replace(
        new RegExp(`(${color.attribute}=["'])${escaped}(["'])`, 'gi'),
        `$1${placeholder}$2`
      );
    }
  });

  // Determine the appropriate CSS property
  let property = 'background-image';
  if (svg.location === 'inline') {
    property = 'content'; // For ::before/::after pseudo-elements
  }

  return {
    selector: svg.selector,
    lessVariable: '@svg',
    svg: processedSVG,
    property,
  };
}

/**
 * Generate LESS code for SVG replacement
 */
export function generateSVGLESS(
  processed: ProcessedSVG,
  includeSelector: boolean = true
): string {
  const escapedSVG = escapeSVGForLESS(processed.svg);

  let less = '';

  if (includeSelector) {
    less += `${processed.selector} {\n`;
  }

  less += `  @svg: escape('${escapedSVG}');\n`;

  if (processed.property === 'background-image') {
    less += `  background-image: url("data:image/svg+xml,@{svg}") !important;\n`;
  } else if (processed.property === 'content') {
    less += `  content: url("data:image/svg+xml,@{svg}");\n`;
  }

  if (includeSelector) {
    less += `}\n`;
  }

  return less;
}

/**
 * Escape SVG for LESS escape() function
 */
function escapeSVGForLESS(svg: string): string {
  return svg
    .replace(/\\/g, '\\\\')   // Escape backslashes
    .replace(/'/g, "\\'")     // Escape single quotes
    .replace(/\n/g, '')       // Remove newlines
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Get SVG statistics
 */
export function getSVGStats(svgs: SVGInfo[]) {
  const inline = svgs.filter(s => s.location === 'inline').length;
  const background = svgs.filter(s => s.location === 'background').length;

  const allColors = svgs.flatMap(s => s.colors);
  const uniqueColors = new Set(allColors.map(c => c.value));

  const colorsByType = {
    fill: allColors.filter(c => c.type === 'fill').length,
    stroke: allColors.filter(c => c.type === 'stroke').length,
    stopColor: allColors.filter(c => c.type === 'stop-color').length,
  };

  return {
    total: svgs.length,
    inline,
    background,
    uniqueColors: uniqueColors.size,
    totalColors: allColors.length,
    colorsByType,
    averageColorsPerSVG: svgs.length > 0 ? allColors.length / svgs.length : 0,
  };
}

/**
 * Group SVGs by purpose/category (based on selector)
 */
export function groupSVGsByPurpose(svgs: SVGInfo[]): Map<string, SVGInfo[]> {
  const groups = new Map<string, SVGInfo[]>();

  const categories = [
    { name: 'logo', patterns: ['logo', 'brand'] },
    { name: 'icon', patterns: ['icon', 'ico', 'svg'] },
    { name: 'button', patterns: ['btn', 'button'] },
    { name: 'navigation', patterns: ['nav', 'menu', 'header'] },
    { name: 'social', patterns: ['social', 'share', 'facebook', 'twitter', 'linkedin'] },
    { name: 'arrow', patterns: ['arrow', 'chevron', 'caret'] },
    { name: 'other', patterns: [] },
  ];

  svgs.forEach(svg => {
    const selector = svg.selector.toLowerCase();
    let categorized = false;

    for (const category of categories) {
      if (category.patterns.some(pattern => selector.includes(pattern))) {
        if (!groups.has(category.name)) {
          groups.set(category.name, []);
        }
        groups.get(category.name)!.push(svg);
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      if (!groups.has('other')) {
        groups.set('other', []);
      }
      groups.get('other')!.push(svg);
    }
  });

  return groups;
}

/**
 * Find SVGs that need color replacement
 */
export function findColorfulSVGs(
  svgs: SVGInfo[],
  minColors: number = 1
): SVGInfo[] {
  return svgs.filter(svg => svg.colors.length >= minColors);
}

/**
 * Deduplicate similar SVGs (same colors and similar structure)
 */
export function deduplicateSVGs(svgs: SVGInfo[]): SVGInfo[] {
  const seen = new Set<string>();
  const unique: SVGInfo[] = [];

  svgs.forEach(svg => {
    // Create a fingerprint: sorted colors + rough structure
    const colorString = svg.colors
      .map(c => c.value)
      .sort()
      .join(',');

    const structureHash = svg.svg
      .replace(/[0-9.]+/g, 'N') // Replace numbers
      .replace(/\s+/g, '')       // Remove whitespace
      .substring(0, 100);        // First 100 chars

    const fingerprint = `${colorString}|${structureHash}`;

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      unique.push(svg);
    }
  });

  return unique;
}
