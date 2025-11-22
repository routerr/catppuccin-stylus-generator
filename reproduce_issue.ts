import { generateUserstyleV3 } from "./src/services/generators/userstyle-v3";
import { generateUserstyleV2 } from "./src/services/generators/userstyle-v2";

// Mock data for directory upload
const mockAnalysis = {
  mode: "dark",
  designSystem: { framework: "unknown" },
  url: "https://my-local-site.local", // Simulated URL from directory parser
} as any;

const mockMappings = {
  variableMappings: [
    {
      original: "--bg-color",
      catppuccin: "base",
      isAccent: false,
      reason: "Background",
    },
  ],
  svgMappings: new Map(),
  selectorMappings: [
    {
      selector: ".btn",
      properties: { backgroundColor: "blue" },
      reason: "Button",
      hoverGradient: {
        angle: 45,
        mainColor: "blue",
        biAccent: "teal",
        opacity: 1,
      },
    },
    // Add many selectors to increase file length
    ...Array.from({ length: 50 }).map((_, i) => ({
      selector: `.element-${i}`,
      properties: { color: "red", backgroundColor: "white" },
      reason: `Element ${i}`,
      hoverGradient:
        i % 2 === 0
          ? { angle: 90, mainColor: "red", biAccent: "pink", opacity: 1 }
          : undefined,
    })),
  ],
  processedSVGs: [],
  stats: {
    totalVariables: 1,
    mappedVariables: 1,
    totalSVGs: 0,
    processedSVGs: 0,
    totalSelectors: 1,
    mappedSelectors: 1,
  },
} as any;

console.log("\n--- Generator V3 Directory Upload Check ---");
const v3Output = generateUserstyleV3(mockAnalysis, mockMappings, {
  url: "https://my-local-site.local",
  defaultFlavor: "mocha",
  defaultAccent: "blue",
});

const v3Lines = v3Output.less.split("\n");
console.log(`Total Lines: ${v3Lines.length}`);

// Check for domain line
const v3DomainLine = v3Lines.find((l) => l.includes("@-moz-document"));
console.log(`V3 Domain Line: ${v3DomainLine}`);

// Check for @lookup error context
const lookupLineIndex = v3Lines.findIndex((l) => l.includes("@lookup"));
if (lookupLineIndex !== -1) {
  console.log(
    `Found @lookup at line ${lookupLineIndex + 1}: ${v3Lines[lookupLineIndex]}`
  );
} else {
  console.log("No @lookup found (Good!)");
}

// Print the last 50 lines to check for closing braces
console.log("\n--- Last 50 Lines ---");
console.log(v3Lines.slice(-50).join("\n"));

// Print lines around where the error might be (if long enough)
if (v3Lines.length > 1100) {
  console.log("\n--- Lines around 1167 ---");
  const start = Math.max(0, 1160);
  const end = Math.min(v3Lines.length, 1180);
  for (let i = start; i < end; i++) {
    console.log(`${i + 1}: ${v3Lines[i]}`);
  }
}
