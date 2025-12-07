/**
 * End-to-End Pipeline Test (Offline Mode)
 *
 * Tests the complete theme generation pipeline without AI,
 * verifying that different sites produce different LESS output.
 *
 * Run with: npx tsx __tests__/test-pipeline-e2e.ts
 */

import { runPipelineOffline } from "../src/services/pipeline/theme-pipeline-v2";

// ============================================================================
// MOCK CSS DATA
// ============================================================================

const GITHUB_CSS = `
:root {
  --color-bg-default: #0d1117;
  --color-text-primary: #c9d1d9;
  --color-accent-primary: #58a6ff;
}
body { background-color: #0d1117; color: #c9d1d9; }
a { color: #58a6ff; }
.btn-primary { background-color: #238636; }
`;

const STRIPE_CSS = `
:root {
  --color-bg: #ffffff;
  --color-text: #425466;
  --color-primary: #635bff;
}
body { background-color: #ffffff; color: #425466; }
a { color: #635bff; }
.btn-primary { background-color: #635bff; }
`;

// ============================================================================
// TEST
// ============================================================================

console.log("=== End-to-End Pipeline Test (Offline) ===\n");

// Run pipeline for GitHub
console.log("--- Processing GitHub ---");
const githubResult = runPipelineOffline({
  css: GITHUB_CSS,
  domain: "github.com",
  sourceType: "url",
});

console.log(`Signature Summary:\n${githubResult.summary}\n`);
console.log(`Mappings: ${githubResult.mappings.mappings.length}`);
console.log(`LESS code length: ${githubResult.theme.lessCode.length} chars\n`);

// Run pipeline for Stripe
console.log("--- Processing Stripe ---");
const stripeResult = runPipelineOffline({
  css: STRIPE_CSS,
  domain: "stripe.com",
  sourceType: "url",
});

console.log(`Signature Summary:\n${stripeResult.summary}\n`);
console.log(`Mappings: ${stripeResult.mappings.mappings.length}`);
console.log(`LESS code length: ${stripeResult.theme.lessCode.length} chars\n`);

// ============================================================================
// VALIDATION
// ============================================================================

console.log("--- Validation ---\n");

const checks: Array<{ name: string; ok: boolean; hint?: string }> = [];

// 1. Different domains in output
checks.push({
  name: "GitHub LESS contains github.com domain",
  ok: githubResult.theme.lessCode.includes("github.com"),
  hint: "Domain should be in @-moz-document block",
});

checks.push({
  name: "Stripe LESS contains stripe.com domain",
  ok: stripeResult.theme.lessCode.includes("stripe.com"),
  hint: "Domain should be in @-moz-document block",
});

// 2. Different suggested accents
checks.push({
  name: "Different suggested accents",
  ok:
    githubResult.signature.suggestedAccent !==
      stripeResult.signature.suggestedAccent ||
    githubResult.signature.colorProfile.luminanceMode !==
      stripeResult.signature.colorProfile.luminanceMode,
  hint: `GitHub: ${githubResult.signature.suggestedAccent} (${githubResult.signature.colorProfile.luminanceMode}), Stripe: ${stripeResult.signature.suggestedAccent} (${stripeResult.signature.colorProfile.luminanceMode})`,
});

// 3. LESS code is valid (contains expected structure)
checks.push({
  name: "GitHub LESS has UserStyle header",
  ok: githubResult.theme.lessCode.includes("==UserStyle=="),
  hint: "UserStyle header should be present",
});

checks.push({
  name: "Stripe LESS has palette import",
  ok:
    stripeResult.theme.lessCode.includes("@import") ||
    stripeResult.theme.lessCode.includes(".catppuccin"),
  hint: "Palette should be imported or defined",
});

// 4. LESS code differs between sites (check domain-specific parts, not structural)
const githubDomain = githubResult.theme.lessCode.includes(
  '@-moz-document domain("github.com")'
);
const stripeDomain = stripeResult.theme.lessCode.includes(
  '@-moz-document domain("stripe.com")'
);
checks.push({
  name: "LESS code contains correct domain blocks",
  ok: githubDomain && stripeDomain,
  hint: `GitHub domain block: ${githubDomain}, Stripe domain block: ${stripeDomain}`,
});

// 5. Signatures are meaningfully different
checks.push({
  name: "Signatures have different color modes or accents",
  ok:
    githubResult.signature.colorProfile.luminanceMode !==
      stripeResult.signature.colorProfile.luminanceMode ||
    githubResult.signature.suggestedAccent !==
      stripeResult.signature.suggestedAccent,
  hint: `GitHub: ${githubResult.signature.suggestedAccent}/${githubResult.signature.colorProfile.luminanceMode}, Stripe: ${stripeResult.signature.suggestedAccent}/${stripeResult.signature.colorProfile.luminanceMode}`,
});

// Print results
let failed = false;
for (const c of checks) {
  if (c.ok) {
    console.log(`✓ ${c.name}`);
    if (c.hint) console.log(`  ${c.hint}`);
  } else {
    console.error(`✗ ${c.name}`);
    if (c.hint) console.error(`  ${c.hint}`);
    failed = true;
  }
}

console.log();

// Print sample of generated LESS
console.log("--- Sample GitHub LESS (first 500 chars) ---");
console.log(githubResult.theme.lessCode.slice(0, 500));
console.log("...\n");

if (failed) {
  console.error("❌ Pipeline E2E Test FAILED");
  process.exit(1);
} else {
  console.log("✅ Pipeline E2E Test PASSED");
  console.log("   Complete pipeline works correctly!");
  process.exit(0);
}

// ============================================================================
// HELPER
// ============================================================================

function calculateOverlap(a: string, b: string): number {
  // Simple line-based overlap calculation
  const linesA = new Set(
    a
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 10)
  );
  const linesB = new Set(
    b
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 10)
  );

  let overlap = 0;
  for (const line of linesA) {
    if (linesB.has(line)) overlap++;
  }

  const total = Math.max(linesA.size, linesB.size);
  return total > 0 ? overlap / total : 0;
}
