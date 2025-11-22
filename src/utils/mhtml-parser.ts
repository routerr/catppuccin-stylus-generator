import type { CrawlerResult } from "../types/theme";
import { extractColorsFromCSS } from "./color-analysis";

/**
 * Parses an MHTML file and extracts HTML content and colors
 */
export class MHTMLParser {
  /**
   * Parse MHTML file content and return a CrawlerResult
   */
  static async parseFile(file: File): Promise<CrawlerResult> {
    const content = await this.readFileAsText(file);
    return this.parseMHTMLContent(content, file.name);
  }

  /**
   * Read file as text
   */
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  /**
   * Parse MHTML content string
   */
  private static parseMHTMLContent(
    content: string,
    filename: string
  ): CrawlerResult {
    // MHTML format uses MIME multipart structure with boundaries
    const boundaryMatch = content.match(/boundary="([^"]+)"/i);
    if (!boundaryMatch) {
      throw new Error("Invalid MHTML file: No boundary found");
    }

    const boundary = boundaryMatch[1];
    const parts = content.split(
      new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g")
    );

    let htmlContent = "";
    let cssContent = "";
    let title = filename.replace(".mhtml", "");
    let url = "";

    // Parse each MIME part
    for (const part of parts) {
      if (!part.trim() || part.trim() === "--") continue;

      // Extract content type and encoding
      const contentTypeMatch = part.match(/Content-Type:\s*([^\r\n;]+)/i);
      const contentLocationMatch = part.match(
        /Content-Location:\s*([^\r\n]+)/i
      );
      const encodingMatch = part.match(
        /Content-Transfer-Encoding:\s*([^\r\n]+)/i
      );

      if (!contentTypeMatch) continue;

      const contentType = contentTypeMatch[1].toLowerCase().trim();
      const encoding = encodingMatch
        ? encodingMatch[1].toLowerCase().trim()
        : "";

      // Extract the actual content (after headers)
      const contentStart = part.indexOf("\r\n\r\n");
      if (contentStart === -1) continue;

      let partContent = part.substring(contentStart + 4).trim();

      // Decode if needed
      if (encoding === "quoted-printable") {
        partContent = this.decodeQuotedPrintable(partContent);
      } else if (encoding === "base64") {
        try {
          partContent = atob(partContent.replace(/\s/g, ""));
        } catch (e) {
          console.warn("Failed to decode base64 content:", e);
        }
      }

      // Store URL from first part if available
      if (!url) {
        const snapshotLocationMatch = part.match(
          /Snapshot-Content-Location:\s*([^\r\n]+)/i
        );
        if (contentLocationMatch) {
          url = contentLocationMatch[1].trim();
        } else if (snapshotLocationMatch) {
          url = snapshotLocationMatch[1].trim();
        }
      }

      // Extract HTML content
      if (contentType.includes("text/html")) {
        htmlContent += partContent;

        // Extract title from HTML
        const titleMatch = partContent.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }
      }

      // Extract CSS content
      if (contentType.includes("text/css")) {
        cssContent += partContent;
      }
    }

    if (!htmlContent) {
      throw new Error("No HTML content found in MHTML file");
    }

    // Extract inline styles from HTML
    const styleMatches =
      htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    for (const match of styleMatches) {
      const styleContent = match.replace(/<\/?style[^>]*>/gi, "");
      cssContent += "\n" + styleContent;
    }

    // Extract colors from CSS and inline styles
    const colors = this.extractColors(htmlContent, cssContent);

    return {
      url: url || `file://${filename}`,
      title,
      content: htmlContent,
      html: htmlContent,
      colors: [...new Set(colors)], // Remove duplicates
    };
  }

  /**
   * Decode quoted-printable encoding
   */
  private static decodeQuotedPrintable(str: string): string {
    return str
      .replace(/=\r?\n/g, "") // Remove soft line breaks
      .replace(/=([0-9A-F]{2})/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
  }

  /**
   * Extract colors from HTML and CSS content
   */
  private static extractColors(html: string, css: string): string[] {
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
    const colorPropsRegex =
      /(?:color|background|border|fill|stroke):\s*([^;}"'\s]+)/gi;
    while ((match = colorPropsRegex.exec(html)) !== null) {
      const colorValue = match[1].trim();
      if (colorValue.startsWith("#") || colorValue.startsWith("rgb")) {
        colors.push(...extractColorsFromCSS(colorValue));
      }
    }

    return colors.filter((color) => color && color.startsWith("#"));
  }

  /**
   * Validate if a file is an MHTML file
   */
  static isValidMHTMLFile(file: File): boolean {
    const validExtensions = [".mhtml", ".mht"];
    const fileName = file.name.toLowerCase();
    return validExtensions.some((ext) => fileName.endsWith(ext));
  }
}
