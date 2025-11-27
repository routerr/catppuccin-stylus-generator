import { generateUserstyleV4 } from "../src/services/generators/userstyle-v4";
import { generateUserstyleV3 } from "../src/services/generators/userstyle-v3";
import { DeepAnalysisResult, MappingResult } from "../src/types/deep-analysis";
import less from "less";

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
    {
      selector: "div:not(.valid",
      properties: { color: "text" },
      specificity: 1,
      important: false,
      isAccent: false,
      reason: "Invalid selector mapping",
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
    accentUsage: {
      mainAccent: 1,
      biAccent1: 0,
      biAccent2: 0,
    },
  },
};

async function verify() {
  console.log("--- Verifying V4 Generator ---");
  const v4Result = generateUserstyleV4(mockAnalysis, mockMappings, {
    url: "https://example.com",
    defaultFlavor: "mocha",
    defaultAccent: "blue",
  });

  console.log("V4 Output Length:", v4Result.less.length);
  // console.log(v4Result.less);

  try {
    // Mock the import since we can't fetch remote in this test easily without setup
    // or we can just try to parse it.
    // The import might fail, so let's comment it out for syntax check
    const lessCode = v4Result.less.replace(
      '@import "https://userstyles.catppuccin.com/lib/lib.less";',
      "// @import mock"
    );

    const mockVars = `
      @lightFlavor: latte;
      @darkFlavor: mocha;
      @accentColor: blue;
      @flavor: mocha;
      @mochaFlavor: mocha;
      @latteFlavor: latte;
      @frappeFlavor: frappe;
      @macchiatoFlavor: macchiato;
      @rosewater: #f5e0dc;
      @flamingo: #f2cdcd;
      @pink: #f5c2e7;
      @mauve: #cba6f7;
      @red: #f38ba8;
      @maroon: #eba0ac;
      @peach: #fab387;
      @yellow: #f9e2af;
      @green: #a6e3a1;
      @teal: #94e2d5;
      @sky: #89dceb;
      @sapphire: #74c7ec;
      @blue: #89b4fa;
      @lavender: #b4befe;
      @text: #cdd6f4;
      @subtext1: #bac2de;
      @subtext0: #a6adc8;
      @overlay2: #9399b2;
      @overlay1: #7f849c;
      @overlay0: #6c7086;
      @surface2: #585b70;
      @surface1: #45475a;
      @surface0: #313244;
      @base: #1e1e2e;
      @mantle: #181825;
      @crust: #11111b;
    `;

    // We need to mock the mixins that come from the lib
    const dummyLib = `
      #catppuccin(@flavor) {}
      #lib() {
        .palette() {}
        .defaults() {}
      }
    `;

    await less.render(mockVars + dummyLib + lessCode);
    console.log("✅ V4 LESS compiled successfully (syntax is valid)");
  } catch (e: any) {
    console.error("❌ V4 LESS Compilation Failed:");
    console.error(e.message);
    if (e.line) console.error(`Line ${e.line}, Column ${e.column}`);
    const lines = v4Result.less.split("\n");
    console.log(`V4 Total Lines: ${lines.length}`);
    if (lines.length >= 152) {
      console.log(`V4 Line 152: "${lines[151]}"`);
      console.log(`V4 Line 152 Context:`);
      console.log(`${151}: ${lines[150]}`);
      console.log(`${152}: ${lines[151]}`);
      console.log(`${153}: ${lines[152]}`);
    } else {
      console.log("V4 output is shorter than 152 lines.");
    }

    if (e.line) {
      console.log("Context:");
      console.log(`${e.line - 1}: ${lines[e.line - 2]}`);
      console.log(`${e.line}: ${lines[e.line - 1]}`);
      console.log(`${e.line + 1}: ${lines[e.line]}`);
    }
  }

  console.log("\n--- Verifying V3 Generator ---");
  const v3Result = generateUserstyleV3(mockAnalysis, mockMappings, {
    url: "https://example.com",
    defaultFlavor: "mocha",
    defaultAccent: "blue",
  });

  console.log("V3 Output Length:", v3Result.less.length);

  try {
    const lessCode = v3Result.less.replace(
      '@import "https://userstyles.catppuccin.com/lib/lib.less";',
      "// @import mock"
    );
    const mockVars = `
      @lightFlavor: latte;
      @darkFlavor: mocha;
      @accentColor: blue;
      @flavor: mocha;
      @mochaFlavor: mocha;
      @latteFlavor: latte;
      @frappeFlavor: frappe;
      @macchiatoFlavor: macchiato;
      @rosewater: #f5e0dc;
      @flamingo: #f2cdcd;
      @pink: #f5c2e7;
      @mauve: #cba6f7;
      @red: #f38ba8;
      @maroon: #eba0ac;
      @peach: #fab387;
      @yellow: #f9e2af;
      @green: #a6e3a1;
      @teal: #94e2d5;
      @sky: #89dceb;
      @sapphire: #74c7ec;
      @blue: #89b4fa;
      @lavender: #b4befe;
      @text: #cdd6f4;
      @subtext1: #bac2de;
      @subtext0: #a6adc8;
      @overlay2: #9399b2;
      @overlay1: #7f849c;
      @overlay0: #6c7086;
      @surface2: #585b70;
      @surface1: #45475a;
      @surface0: #313244;
      @base: #1e1e2e;
      @mantle: #181825;
      @crust: #11111b;
    `;
    const dummyLib = `
      #catppuccin(@flavor) {}
      #lib() {
        .palette() {}
        .defaults() {}
      }
    `;
    await less.render(mockVars + dummyLib + lessCode);
    console.log("✅ V3 LESS compiled successfully (syntax is valid)");
  } catch (e: any) {
    console.error("❌ V3 LESS Compilation Failed:");
    console.error(e.message);
    if (e.line) console.error(`Line ${e.line}, Column ${e.column}`);
    // Print context
    const lines = v3Result.less.split("\n");
    const adjustedLine = e.line ? e.line - 35 : 0;
    if (adjustedLine > 0 && adjustedLine < lines.length) {
      console.log("Context (Approx):");
      console.log(`${adjustedLine - 1}: ${lines[adjustedLine - 2]}`);
      console.log(`${adjustedLine}: ${lines[adjustedLine - 1]}`);
      console.log(`${adjustedLine + 1}: ${lines[adjustedLine]}`);
    }
  }
}

verify();
