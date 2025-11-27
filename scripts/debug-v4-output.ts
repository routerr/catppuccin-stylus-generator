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
    {
      selector: "body",
      properties: { backgroundColor: "base", color: "text" },
      specificity: 1,
      important: false,
      isAccent: false,
      reason: "Body",
    },
    {
      selector: ".btn-primary",
      properties: { backgroundColor: "blue", color: "base" },
      specificity: 10,
      important: false,
      isAccent: true,
      reason: "Button",
    },
  ],
  processedSVGs: [],
  stats: {
    totalVariables: 0,
    mappedVariables: 0,
    totalSVGs: 0,
    processedSVGs: 0,
    totalSelectors: 2,
    mappedSelectors: 2,
    accentUsage: { mainAccent: 0, biAccent1: 0, biAccent2: 0 },
  },
};

const mockLib = `
#catppuccin(@flavor) {}
#lib() {
  .palette() {
    @base: #eff1f5;
    @text: #4c4f69;
    @blue: #1e66f5;
    @surface1: #bcc0cc;
  }
  .defaults() {}
}
`;

async function debug() {
  console.log("--- Generating V4 Theme ---");
  const result = generateUserstyleV4(mockAnalysis, mockMappings, {
    url: "https://example.com",
    defaultFlavor: "latte",
    defaultAccent: "blue",
  });

  console.log("--- Generated LESS (Snippet) ---");
  const lessCode = result.less;
  console.log(lessCode.slice(0, 1000) + "\n...\n" + lessCode.slice(-500));

  console.log("\n--- Compiling to CSS ---");
  try {
    // Replace remote import with mock lib for local testing
    const codeToCompile =
      mockLib +
      lessCode.replace(
        '@import "https://userstyles.catppuccin.com/lib/lib.less";',
        "// @import mock"
      );

    // Add mock variables that would usually come from the userstyle header/metadata
    const mockVars = `
      @lightFlavor: latte;
      @darkFlavor: mocha;
      @accentColor: blue;
      @latteFlavor: latte;
      @mochaFlavor: mocha;
      @rosewater: #dc8a78;
      @flamingo: #dd7878;
      @pink: #ea76cb;
      @mauve: #8839ef;
      @red: #d20f39;
      @maroon: #e64553;
      @peach: #fe640b;
      @yellow: #df8e1d;
      @green: #40a02b;
      @teal: #179299;
      @sky: #04a5e5;
      @sapphire: #209fb5;
      @blue: #1e66f5;
      @lavender: #7287fd;
      @subtext0: #6c6f85;
    `;

    const output = await less.render(mockVars + codeToCompile);
    console.log(output.css);
  } catch (e: any) {
    console.error("❌ Compilation Failed:", e.message);
  }
}

debug();
