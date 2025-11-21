/**
 * Validation Utility for Deep Analysis Mappings
 *
 * Checks generated mappings for consistency, validity, and completeness.
 */

import type {
  MappingResult,
  VariableMapping,
  SVGColorMapping,
  SelectorMapping,
} from "../../types/deep-analysis";
import { ACCENT_NAMES } from "../../utils/accent-schemes";

export interface ValidationIssue {
  type: "error" | "warning";
  message: string;
  item?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  stats: {
    variables: number;
    svgs: number;
    selectors: number;
  };
}

/**
 * Validate all mappings from the deep analysis pipeline
 */
export function validateMappings(mappings: MappingResult): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Validate CSS Variables
  mappings.variableMappings.forEach((mapping) => {
    if (!isValidCatppuccinColor(mapping.catppuccin)) {
      issues.push({
        type: "error",
        message: `Invalid Catppuccin color: ${mapping.catppuccin}`,
        item: `Variable: ${mapping.original}`,
      });
    }
  });

  // Validate SVGs
  mappings.svgMappings.forEach((mapping, key) => {
    if (!isValidCatppuccinColor(mapping.catppuccinColor)) {
      issues.push({
        type: "error",
        message: `Invalid Catppuccin color: ${mapping.catppuccinColor}`,
        item: `SVG: ${key}`,
      });
    }
  });

  // Validate Selectors
  const seenSelectors = new Set<string>();
  mappings.selectorMappings.forEach((mapping) => {
    // Check for duplicates
    if (seenSelectors.has(mapping.selector)) {
      issues.push({
        type: "warning",
        message: `Duplicate selector mapping found`,
        item: `Selector: ${mapping.selector}`,
      });
    }
    seenSelectors.add(mapping.selector);

    // Check properties
    Object.entries(mapping.properties).forEach(([prop, color]) => {
      if (!isValidCatppuccinColor(color)) {
        issues.push({
          type: "error",
          message: `Invalid color in property ${prop}: ${color}`,
          item: `Selector: ${mapping.selector}`,
        });
      }
    });

    // Check gradient
    if (mapping.hoverGradient) {
      if (!isValidCatppuccinColor(mapping.hoverGradient.mainColor)) {
        issues.push({
          type: "error",
          message: `Invalid gradient main color: ${mapping.hoverGradient.mainColor}`,
          item: `Selector: ${mapping.selector}`,
        });
      }
      if (!isValidCatppuccinColor(mapping.hoverGradient.biAccent)) {
        issues.push({
          type: "error",
          message: `Invalid gradient bi-accent: ${mapping.hoverGradient.biAccent}`,
          item: `Selector: ${mapping.selector}`,
        });
      }
    }
  });

  return {
    isValid: issues.filter((i) => i.type === "error").length === 0,
    issues,
    stats: {
      variables: mappings.variableMappings.length,
      svgs: mappings.svgMappings.size,
      selectors: mappings.selectorMappings.length,
    },
  };
}

function isValidCatppuccinColor(color: string): boolean {
  const validColors = [
    "base",
    "mantle",
    "crust",
    "surface0",
    "surface1",
    "surface2",
    "overlay0",
    "overlay1",
    "overlay2",
    "subtext0",
    "subtext1",
    "text",
    "rosewater",
    "flamingo",
    "pink",
    "mauve",
    "red",
    "maroon",
    "peach",
    "yellow",
    "green",
    "teal",
    "sky",
    "sapphire",
    "blue",
    "lavender",
  ];
  return validColors.includes(color);
}
