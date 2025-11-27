import { generateUserstyleV4 } from "../src/services/generators/userstyle-v4";
import { DeepAnalysisResult, MappingResult } from "../src/types/deep-analysis";
import less from "less";

const mockAnalysis: DeepAnalysisResult = {
  url: "https://example.com",
  title: "Example",
  content: "",
  html: "",
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
  dominantColors: [],
  accentColors: [],
  allCSS: "",
  externalStylesheets: [],
  inlineStyles: [],
  analyzedAt: new Date(),
  analysisTime: 0,
  coverage: { variables: 0, svgs: 0, selectors: 0 },
};

const mockMappings: MappingResult = {
  variableMappings: [],
  svgMappings: new Map(),
  selectorMappings: [
    // Case 1: Primary Button (Background is accent, Text is base)
    {
      selector: ".btn-primary",
      properties: { backgroundColor: "blue", color: "base" },
      specificity: 10,
      important: false,
      isAccent: true, // AI says this is an accent element
      reason: "Primary Button",
    },
    // Case 2: Text Link (Text is accent)
    {
      selector: "a.link",
      properties: { color: "blue" },
      specificity: 10,
      important: false,
      isAccent: true, // AI says this is an accent element
      reason: "Link",
    },
    // Case 3: Non-accent element (Should use fixed colors)
    {
      selector: ".sidebar",
      properties: { backgroundColor: "mantle", color: "text" },
      specificity: 10,
      important: false,
      isAccent: false,
      reason: "Sidebar",
    },
  ],
  processedSVGs: [],
  stats: {
    totalVariables: 0,
    mappedVariables: 0,
    totalSVGs: 0,
    processedSVGs: 0,
    totalSelectors: 3,
    mappedSelectors: 3,
    accentUsage: { mainAccent: 0, biAccent1: 0, biAccent2: 0 },
  },
};

async function debug() {
  console.log("--- Generating V4 Theme with Accent Logic ---");
  // We simulate a config where the default accent is "mauve", but the AI mapped to "blue".
  // If logic is correct, .btn-primary should use @accent (which will be mauve), NOT @blue.
  const result = generateUserstyleV4(mockAnalysis, mockMappings, {
    url: "https://example.com",
    defaultFlavor: "latte",
    defaultAccent: "mauve",
  });

  const lessCode = result.less;

  // Extract the selector blocks for inspection
  const btnBlock = lessCode.match(/\.btn-primary \{([\s\S]*?)\}/)?.[1];
  const linkBlock = lessCode.match(/a\.link \{([\s\S]*?)\}/)?.[1];
  const sidebarBlock = lessCode.match(/\.sidebar \{([\s\S]*?)\}/)?.[1];

  console.log("\n.btn-primary block:");
  console.log(btnBlock?.trim());

  console.log("\na.link block:");
  console.log(linkBlock?.trim());

  console.log("\n.sidebar block:");
  console.log(sidebarBlock?.trim());

  // Verification Logic
  let passed = true;

  // 1. Button Background should be @accent
  if (!btnBlock?.includes("background-color: @accent")) {
    console.error("❌ FAIL: Button background should be @accent");
    passed = false;
  } else {
    console.log("✅ PASS: Button background is @accent");
  }

  // 2. Button Text should be @base (NOT @accent)
  if (!btnBlock?.includes("color: @base")) {
    console.error("❌ FAIL: Button text should be @base");
    passed = false;
  } else {
    console.log("✅ PASS: Button text is @base");
  }

  // 3. Link Text should be @accent
  if (!linkBlock?.includes("color: @accent")) {
    console.error("❌ FAIL: Link text should be @accent");
    passed = false;
  } else {
    console.log("✅ PASS: Link text is @accent");
  }

  if (passed) {
    console.log("\n🎉 All checks passed! Logic is correct.");
  } else {
    console.log("\n💥 Checks failed. Logic needs adjustment.");
  }
}

debug();
