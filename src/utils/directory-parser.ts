/**
 * Directory Parser - Analyzes complete webpage directories
 * Handles "Webpage, complete" format (HTML + assets folder)
 */

import { extractColorsFromCSS } from './color-analysis';

export interface CSSClass {
  className: string;
  properties: CSSProperty[];
  selector: string;
}

export interface CSSProperty {
  property: string;
  value: string;
}

export interface DirectoryAnalysis {
  html: string;
  title: string;
  cssClasses: CSSClass[];
  inlineStyles: string[];
  linkedStyles: string[];
  colors: string[];
  structure: {
    tags: Record<string, number>;
    classUsage: Record<string, number>;
  };
}

/**
 * Parse a directory of files uploaded via webkitdirectory
 */
export async function parseWebpageDirectory(files: FileList): Promise<DirectoryAnalysis> {
  const fileArray = Array.from(files);

  // Find the main HTML file (usually ends with .htm or .html)
  const htmlFiles = fileArray.filter(f =>
    f.name.endsWith('.html') || f.name.endsWith('.htm')
  );

  if (htmlFiles.length === 0) {
    throw new Error('No HTML file found in the directory');
  }

  // Use the first HTML file or the one with shortest path (likely the main one)
  const mainHtml = htmlFiles.sort((a, b) =>
    a.webkitRelativePath.split('/').length - b.webkitRelativePath.split('/').length
  )[0];

  // Read the HTML content
  const htmlContent = await readFileAsText(mainHtml);
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Extract title
  const title = doc.querySelector('title')?.textContent || 'Untitled';

  // Find CSS files in the directory
  const cssFiles = fileArray.filter(f => f.name.endsWith('.css'));

  // Read all CSS content
  const cssContents: string[] = [];
  for (const cssFile of cssFiles) {
    const content = await readFileAsText(cssFile);
    cssContents.push(content);
  }

  // Extract inline styles
  const inlineStyles: string[] = [];
  doc.querySelectorAll('style').forEach(styleTag => {
    if (styleTag.textContent) {
      inlineStyles.push(styleTag.textContent);
    }
  });

  // Extract linked styles (already read from CSS files)
  const linkedStyles = cssContents;

  // Combine all CSS
  const allCSS = [...inlineStyles, ...linkedStyles].join('\n');

  // Parse CSS classes
  const cssClasses = parseCSSClasses(allCSS);

  // Extract colors from HTML and CSS
  const allColors = extractColors(htmlContent, allCSS);

  // Analyze HTML structure
  const structure = analyzeHTMLStructure(doc);

  return {
    html: htmlContent,
    title,
    cssClasses,
    inlineStyles,
    linkedStyles,
    colors: allColors,
    structure,
  };
}

/**
 * Parse CSS to extract class definitions
 */
function parseCSSClasses(css: string): CSSClass[] {
  const classes: CSSClass[] = [];

  // Remove comments
  const cleanCSS = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Match CSS rules (simplified regex)
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cleanCSS)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2].trim();

    // Check if selector contains a class
    if (selector.includes('.')) {
      // Extract class names
      const classMatches = selector.match(/\.[\w-]+/g);
      if (classMatches) {
        classMatches.forEach(className => {
          const cleanClassName = className.substring(1); // Remove the dot

          // Parse properties
          const properties: CSSProperty[] = [];
          declarations.split(';').forEach(decl => {
            const [prop, value] = decl.split(':').map(s => s.trim());
            if (prop && value) {
              properties.push({ property: prop, value });
            }
          });

          classes.push({
            className: cleanClassName,
            selector,
            properties,
          });
        });
      }
    }
  }

  return classes;
}

/**
 * Extract colors from HTML and CSS
 */
function extractColors(html: string, css: string): string[] {
  const colors: string[] = [];

  // Extract from CSS
  colors.push(...extractColorsFromCSS(css));

  // Extract inline style colors from HTML
  const inlineStyleRegex = /style=["']([^"']*?)["']/gi;
  let match;
  while ((match = inlineStyleRegex.exec(html)) !== null) {
    const styleContent = match[1];
    colors.push(...extractColorsFromCSS(styleContent));
  }

  // Extract colors from style attributes in HTML
  const colorPropsRegex = /(?:color|background|border|fill|stroke):\s*([^;}"'\s]+)/gi;
  while ((match = colorPropsRegex.exec(html)) !== null) {
    const colorValue = match[1].trim();
    if (colorValue.startsWith('#') || colorValue.startsWith('rgb')) {
      colors.push(...extractColorsFromCSS(colorValue));
    }
  }

  return [...new Set(colors.filter(color => color && color.startsWith('#')))];
}

/**
 * Analyze HTML structure
 */
function analyzeHTMLStructure(doc: Document): {
  tags: Record<string, number>;
  classUsage: Record<string, number>;
} {
  const tags: Record<string, number> = {};
  const classUsage: Record<string, number> = {};

  // Count tags
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const tagName = el.tagName.toLowerCase();
    tags[tagName] = (tags[tagName] || 0) + 1;

    // Count class usage
    if (el.className && typeof el.className === 'string') {
      el.className.split(/\s+/).forEach(className => {
        if (className) {
          classUsage[className] = (classUsage[className] || 0) + 1;
        }
      });
    }
  });

  return { tags, classUsage };
}

/**
 * Read file as text
 */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Group CSS classes by semantic purpose
 */
export function groupCSSClassesByPurpose(classes: CSSClass[]): {
  buttons: CSSClass[];
  links: CSSClass[];
  backgrounds: CSSClass[];
  text: CSSClass[];
  borders: CSSClass[];
  layouts: CSSClass[];
  other: CSSClass[];
} {
  const groups = {
    buttons: [] as CSSClass[],
    links: [] as CSSClass[],
    backgrounds: [] as CSSClass[],
    text: [] as CSSClass[],
    borders: [] as CSSClass[],
    layouts: [] as CSSClass[],
    other: [] as CSSClass[],
  };

  classes.forEach(cls => {
    const name = cls.className.toLowerCase();
    const hasBackgroundProp = cls.properties.some(p =>
      p.property.includes('background')
    );
    const hasBorderProp = cls.properties.some(p =>
      p.property.includes('border')
    );
    const hasTextProp = cls.properties.some(p =>
      p.property.includes('color') || p.property.includes('font')
    );

    if (name.includes('btn') || name.includes('button')) {
      groups.buttons.push(cls);
    } else if (name.includes('link') || cls.selector.includes('a')) {
      groups.links.push(cls);
    } else if (hasBackgroundProp && !hasBorderProp) {
      groups.backgrounds.push(cls);
    } else if (hasTextProp) {
      groups.text.push(cls);
    } else if (hasBorderProp) {
      groups.borders.push(cls);
    } else if (
      name.includes('container') ||
      name.includes('grid') ||
      name.includes('flex') ||
      name.includes('row') ||
      name.includes('col')
    ) {
      groups.layouts.push(cls);
    } else {
      groups.other.push(cls);
    }
  });

  return groups;
}
