import { generateUserstyleV4 } from "../src/services/generators/userstyle-v4";
import { runDeepAnalysisPipeline } from "../src/services/deep-analysis/index";
import { DeepAnalysisResult, MappingResult } from "../src/types/deep-analysis";
import { CatppuccinFlavor, AccentColor } from "../src/types/catppuccin";

// Mock Data
const mockAnalysis: DeepAnalysisResult = {
  url: "https://example.com",
  title: "Example Domain",
  content: "<html><body><h1>Example Domain</h1></body></html>",
  html: "<html><body><h1>Example Domain</h1></body></html>",
  mode: "light",
  designSystem: {
    framework: "unknown",
    confidence: 0,
    variablePrefix: [],
    colorTokens: new Map(),
    componentPatterns: [],
  },
  cssVariables: [],
  svgs: [],
  selectorGroups: [],
  dominantColors: ["#ffffff", "#000000"],
  accentColors: ["#000000"],
  allCSS: "",
  externalStylesheets: [],
  inlineStyles: [],
  analyzedAt: new Date(),
  analysisTime: 0,
  coverage: {
    variables: 0,
    svgs: 0,
    selectors: 0,
  },
};

const mockMappings: MappingResult = {
  variableMappings: [],
  svgMappings: new Map(),
  selectorMappings: [
    {
      selector: "body",
      properties: { backgroundColor: "base", color: "text" },
      specificity: 1,
      important: false,
      isAccent: false,
      reason: "Mock mapping",
    },
    {
      selector: "a",
      properties: { color: "accent" },
      specificity: 1,
      important: false,
      isAccent: true,
      reason: "Mock accent mapping",
    },
  ],
  stats: {
    totalVariables: 0,
    mappedVariables: 0,
    totalSVGs: 0,
    processedSVGs: 0,
    totalSelectors: 2,
    mappedSelectors: 2,
    accentUsage: {
      mainAccent: 1,
      biAccent1: 0,
      biAccent2: 0,
    },
  },
};

async function testV4Generator() {
  console.log("Testing generateUserstyleV4...");
  try {
    const result = generateUserstyleV4(mockAnalysis, mockMappings, {
      url: "https://example.com",
      defaultFlavor: "latte",
      defaultAccent: "blue",
    });

    if (!result.metadata) {
      console.error("Error: Metadata is missing in V4 generator output!");
    } else {
      console.log("Success: Metadata found:", result.metadata);
    }

    const lessOutput = result.less;
    if (
      lessOutput.includes("@homepageURL") &&
      lessOutput.includes("@updateURL") &&
      lessOutput.includes("@supportURL")
    ) {
      console.log("Success: New metadata fields found in LESS output.");
    } else {
      console.error("Error: New metadata fields MISSING in LESS output!");
    }

    console.log("LESS Output Preview:\n", result.less.slice(0, 500));
  } catch (error) {
    console.error("Error in generateUserstyleV4:", error);
  }
}

async function testPipeline() {
  console.log("\nTesting runDeepAnalysisPipeline with V4...");
  try {
    // We need to mock the fetcher and mapper since we can't easily run them in this script without network/AI
    // But runDeepAnalysisPipeline calls them.
    // So we might just test generateUserstyleV4 for now as that's where the logic is.
    // To test the pipeline, we'd need to mock the dependencies.
    console.log(
      "Skipping full pipeline test due to dependencies. Focusing on generator."
    );
  } catch (error) {
    console.error("Error in runDeepAnalysisPipeline:", error);
  }
}

testV4Generator();
testPipeline();
