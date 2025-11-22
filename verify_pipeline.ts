import { generateUserstyleV3 } from "./src/services/generators/userstyle-v3";
import { DeepAnalysisResult, MappingResult } from "./src/types/deep-analysis";
import less from "less"; // You might need to install this or use built-in fetch if Node 18+

// Mock Data for https://openrouter.ai/models
const mockAnalysis: DeepAnalysisResult = {
  url: "https://openrouter.ai/models",
  title: "OpenRouter Models",
  content: "Mock content",
  html: "<html>...</html>",
  cssVariables: [
    {
      name: "--background",
      value: "#ffffff",
      computedValue: "#ffffff",
      scope: "root",
      selector: ":root",
      usage: [],
      frequency: 1,
    },
    {
      name: "--text",
      value: "#000000",
      computedValue: "#000000",
      scope: "root",
      selector: ":root",
      usage: [],
      frequency: 1,
    },
  ],
  svgs: [],
  designSystem: {
    framework: "custom",
    confidence: 0.8,
    variablePrefix: ["--"],
    colorTokens: new Map(),
    componentPatterns: [],
  },
  selectorGroups: [],
  allCSS: "",
  externalStylesheets: [],
  inlineStyles: [],
  dominantColors: ["#ffffff", "#000000"],
  accentColors: ["#3b82f6"],
  mode: "light",
  analyzedAt: new Date(),
  analysisTime: 100,
  coverage: { variables: 2, svgs: 0, selectors: 0 },
};

const mockMappings: MappingResult = {
  variableMappings: [
    {
      original: "--background",
      catppuccin: "base",
      reason: "Background",
      priority: "high",
      isAccent: false,
    },
    {
      original: "--text",
      catppuccin: "text",
      reason: "Text",
      priority: "high",
      isAccent: false,
    },
  ],
  svgMappings: new Map(),
  selectorMappings: [
    {
      selector: ".btn-primary",
      properties: { backgroundColor: "blue", color: "base" },
      reason: "Primary Button",
      specificity: 10,
      important: false,
      hoverGradient: {
        angle: 45,
        mainColor: "blue",
        biAccent: "teal",
        opacity: 1,
      },
    },
  ],
  processedSVGs: [],
  stats: {
    totalVariables: 2,
    mappedVariables: 2,
    totalSVGs: 0,
    processedSVGs: 0,
    totalSelectors: 1,
    mappedSelectors: 1,
    accentUsage: { mainAccent: 1, biAccent1: 0, biAccent2: 0 },
  },
};

async function verify() {
  console.log("--- Starting Verification ---");

  // 1. Generate Userstyle
  console.log("Generating userstyle...");
  const theme = generateUserstyleV3(mockAnalysis, mockMappings, {
    url: "https://openrouter.ai/models",
    defaultFlavor: "mocha",
    defaultAccent: "blue",
  });

  console.log("Userstyle generated. Length:", theme.less.length);

  // 2. Fetch Library Content
  // console.log('Fetching Catppuccin library...');
  // const libUrl = 'https://userstyles.catppuccin.com/lib/lib.less';
  // We use a mock fetch here or just hardcode the content we know works if fetch fails,
  // but let's try to actually fetch it if possible, or use the content we just read.
  // Since we don't have node-fetch, we'll use a hardcoded string based on what we read.
  // const libContent = `
  // /* Catppuccin Library */
  // @catppuccin: {
  //   @latte: { rosewater: #dc8a78; flamingo: #dd7878; pink: #ea76cb; mauve: #8839ef; red: #d20f39; maroon: #e64553; peach: #fe640b; yellow: #df8e1d; green: #40a02b; teal: #179299; sky: #04a5e5; sapphire: #209fb5; blue: #1e66f5; lavender: #7287fd; text: #4c4f69; subtext1: #5c5f77; subtext0: #6c6f85; overlay2: #7c7f93; overlay1: #8c8fa1; overlay0: #9ca0b0; surface2: #acb0be; surface1: #bcc0cc; surface0: #ccd0da; base: #eff1f5; mantle: #e6e9ef; crust: #dce0e8; };
  //   @frappe: { rosewater: #f2d5cf; flamingo: #eebebe; pink: #f4b8e4; mauve: #ca9ee6; red: #e78284; maroon: #ea999c; peach: #ef9f76; yellow: #e5c890; green: #a6d189; teal: #81c8be; sky: #99d1db; sapphire: #85c1dc; blue: #8caaee; lavender: #babbf1; text: #c6d0f5; subtext1: #b5bfe2; subtext0: #a5adce; overlay2: #949cbb; overlay1: #838ba7; overlay0: #737994; surface2: #626880; surface1: #51576d; surface0: #414559; base: #303446; mantle: #292c3c; crust: #232634; };
  //   @macchiato: { rosewater: #f4dbd6; flamingo: #f0c6c6; pink: #f5bde6; mauve: #c6a0f6; red: #ed8796; maroon: #ee99a0; peach: #f5a97f; yellow: #eed49f; green: #a6da95; teal: #8bd5ca; sky: #91d7e3; sapphire: #7dc4e4; blue: #8aadf4; lavender: #b7bdf8; text: #cad3f5; subtext1: #b8c0e0; subtext0: #a5adcb; overlay2: #939ab7; overlay1: #8087a2; overlay0: #6e738d; surface2: #5b6078; surface1: #494d64; surface0: #363a4f; base: #24273a; mantle: #1e2030; crust: #181926; };
  //   @mocha: { rosewater: #f5e0dc; flamingo: #f2cdcd; pink: #f5c2e7; mauve: #cba6f7; red: #f38ba8; maroon: #eba0ac; peach: #fab387; yellow: #f9e2af; green: #a6e3a1; teal: #94e2d5; sky: #89dceb; sapphire: #74c7ec; blue: #89b4fa; lavender: #b4befe; text: #cdd6f4; subtext1: #bac2de; subtext0: #a6adc8; overlay2: #9399b2; overlay1: #7f849c; overlay0: #6c7086; surface2: #585b70; surface1: #45475a; surface0: #313244; base: #1e1e2e; mantle: #181825; crust: #11111b; };
  // };

  // #lib {
  //   .palette() {
  //     @rosewater: @catppuccin[@@flavor][@rosewater];
  //     @flamingo: @catppuccin[@@flavor][@flamingo];
  //     @pink: @catppuccin[@@flavor][@pink];
  //     @mauve: @catppuccin[@@flavor][@mauve];
  //     @red: @catppuccin[@@flavor][@red];
  //     @maroon: @catppuccin[@@flavor][@maroon];
  //     @peach: @catppuccin[@@flavor][@peach];
  //     @yellow: @catppuccin[@@flavor][@yellow];
  //     @green: @catppuccin[@@flavor][@green];
  //     @teal: @catppuccin[@@flavor][@teal];
  //     @sky: @catppuccin[@@flavor][@sky];
  //     @sapphire: @catppuccin[@@flavor][@sapphire];
  //     @blue: @catppuccin[@@flavor][@blue];
  //     @lavender: @catppuccin[@@flavor][@lavender];
  //     @text: @catppuccin[@@flavor][@text];
  //     @subtext1: @catppuccin[@@flavor][@subtext1];
  //     @subtext0: @catppuccin[@@flavor][@subtext0];
  //     @overlay2: @catppuccin[@@flavor][@overlay2];
  //     @overlay1: @catppuccin[@@flavor][@overlay1];
  //     @overlay0: @catppuccin[@@flavor][@overlay0];
  //     @surface2: @catppuccin[@@flavor][@surface2];
  //     @surface1: @catppuccin[@@flavor][@surface1];
  //     @surface0: @catppuccin[@@flavor][@surface0];
  //     @base: @catppuccin[@@flavor][@base];
  //     @mantle: @catppuccin[@@flavor][@mantle];
  //     @crust: @catppuccin[@@flavor][@crust];
  //     @accent: @catppuccin[@@flavor][@@accentColor];
  //   }
  //   .defaults() {
  //     color-scheme: if(@flavor = latte, light, dark);
  //     ::selection { background-color: fade(@accent, 30%); }
  //   }
  // }
  // `;
  // console.log("Library mocked.");

  // 3. Prepare LESS for compilation
  // Replace @import with actual content to avoid resolver issues in simple script
  // let lessInput = theme.less.replace(`@import "${libUrl}";`, libContent);
  let lessInput = theme.less;

  // Inject Stylus variables that are normally provided by the extension
  const stylusVariables = `
    @lightFlavor: mocha;
    @darkFlavor: mocha;
    @accentColor: blue;
  `;
  lessInput = stylusVariables + lessInput;

  // Also need to handle the fact that the library content is a variable definition @catppuccin: { ... };
  // And our code uses it.

  console.log("Compiling LESS...");
  try {
    const output = await less.render(lessInput);
    console.log("✅ LESS Compilation Successful!");
    console.log("CSS Output Length:", output.css.length);

    // Write debug output
    const fs = await import("fs");
    fs.writeFileSync("debug_output.less", lessInput);
    console.log("Saved generated LESS to debug_output.less");
  } catch (error: any) {
    console.error("❌ LESS Compilation Failed!");
    console.error("Error:", error.message);

    // Write debug output
    const fs = await import("fs");
    fs.writeFileSync("debug_output.less", lessInput);
    console.log("Saved generated LESS to debug_output.less");

    if (error.line) {
      console.error(`Line ${error.line}, Column ${error.column}`);
      const lines = lessInput.split("\n");
      console.error("Context:");
      console.error(`${error.line - 2}: ${lines[error.line - 3]}`);
      console.error(`${error.line - 1}: ${lines[error.line - 2]}`);
      console.error(`${error.line}: ${lines[error.line - 1]}`);
    }
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
