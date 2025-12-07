/**
 * Test: Site Signature generates DIFFERENT outputs for DIFFERENT sites.
 *
 * This is the KEY validation that the new system solves the "all themes look the same" problem.
 *
 * Run with: npx tsx __tests__/test-site-signature.ts
 */

import {
  buildSiteSignature,
  summarizeSignature,
  compareSignatures,
} from "../src/services/analysis";

// ============================================================================
// MOCK CSS DATA FOR 3 VERY DIFFERENT SITES
// ============================================================================

// Mock 1: GitHub-like (blue accent, dark mode)
const GITHUB_CSS = `
:root {
  --color-bg-default: #0d1117;
  --color-bg-secondary: #161b22;
  --color-text-primary: #c9d1d9;
  --color-text-secondary: #8b949e;
  --color-accent-primary: #58a6ff;
  --color-success: #3fb950;
  --color-danger: #f85149;
}

body {
  background-color: #0d1117;
  color: #c9d1d9;
}

.btn-primary {
  background-color: #238636;
  color: #ffffff;
}

a {
  color: #58a6ff;
}

a:hover {
  color: #79c0ff;
}

.header {
  background-color: #161b22;
  border-bottom: 1px solid #30363d;
}

.alert-danger {
  background-color: #f85149;
  color: #ffffff;
}
`;

// Mock 2: Stripe-like (purple/lavender accent, light mode)
const STRIPE_CSS = `
:root {
  --color-bg: #ffffff;
  --color-bg-alt: #f6f9fc;
  --color-text: #425466;
  --color-heading: #0a2540;
  --color-primary: #635bff;
  --color-secondary: #00d4ff;
}

body {
  background-color: #ffffff;
  color: #425466;
}

h1, h2, h3 {
  color: #0a2540;
}

.btn-primary {
  background: linear-gradient(135deg, #635bff, #00d4ff);
  color: #ffffff;
}

a {
  color: #635bff;
}

.card {
  background-color: #f6f9fc;
  border: 1px solid #e6ebf1;
}

.badge-success {
  background-color: #09825d;
  color: #ffffff;
}
`;

// Mock 3: Discord-like (blurple accent, dark mode)
const DISCORD_CSS = `
:root {
  --background-primary: #313338;
  --background-secondary: #2b2d31;
  --background-tertiary: #1e1f22;
  --text-normal: #dbdee1;
  --text-muted: #949ba4;
  --brand-experiment: #5865f2;
  --status-danger: #f23f43;
  --status-positive: #23a559;
  --status-warning: #f0b232;
}

body {
  background-color: #313338;
  color: #dbdee1;
}

.button {
  background-color: #5865f2;
  color: #ffffff;
}

.button:hover {
  background-color: #4752c4;
}

a {
  color: #00a8fc;
}

.sidebar {
  background-color: #2b2d31;
}

.channel-list {
  background-color: #1e1f22;
}

.message-danger {
  color: #f23f43;
}
`;

// ============================================================================
// TEST EXECUTION
// ============================================================================

console.log("=== Site Signature Differentiation Test ===\n");

// Build signatures for each site
const githubSig = buildSiteSignature(GITHUB_CSS, "github.com", "url");
const stripeSig = buildSiteSignature(STRIPE_CSS, "stripe.com", "url");
const discordSig = buildSiteSignature(DISCORD_CSS, "discord.com", "url");

// Print summaries
console.log("--- GitHub Signature ---");
console.log(summarizeSignature(githubSig));
console.log();

console.log("--- Stripe Signature ---");
console.log(summarizeSignature(stripeSig));
console.log();

console.log("--- Discord Signature ---");
console.log(summarizeSignature(discordSig));
console.log();

// Compare signatures
console.log("--- Signature Comparisons ---\n");

const ghVsStripe = compareSignatures(githubSig, stripeSig);
const ghVsDiscord = compareSignatures(githubSig, discordSig);
const stripeVsDiscord = compareSignatures(stripeSig, discordSig);

console.log("GitHub vs Stripe:");
console.log(`  Hue Difference: ${ghVsStripe.hueDifference}°`);
console.log(`  Mode Match: ${ghVsStripe.modeMatch}`);
console.log(`  Saturation Match: ${ghVsStripe.saturationMatch}`);
console.log();

console.log("GitHub vs Discord:");
console.log(`  Hue Difference: ${ghVsDiscord.hueDifference}°`);
console.log(`  Mode Match: ${ghVsDiscord.modeMatch}`);
console.log(`  Saturation Match: ${ghVsDiscord.saturationMatch}`);
console.log();

console.log("Stripe vs Discord:");
console.log(`  Hue Difference: ${stripeVsDiscord.hueDifference}°`);
console.log(`  Mode Match: ${stripeVsDiscord.modeMatch}`);
console.log(`  Saturation Match: ${stripeVsDiscord.saturationMatch}`);
console.log();

// ============================================================================
// VALIDATION
// ============================================================================

console.log("--- Validation ---\n");

const checks: Array<{ name: string; ok: boolean; hint?: string }> = [];

// 1. Check that suggested accents are different
const accents = [
  githubSig.suggestedAccent,
  stripeSig.suggestedAccent,
  discordSig.suggestedAccent,
];
const uniqueAccents = new Set(accents);
checks.push({
  name: "Different suggested accents for different sites",
  ok: uniqueAccents.size >= 2, // At least 2 different accents
  hint: `Accents: ${accents.join(", ")}, unique: ${uniqueAccents.size}`,
});

// 2. Check that GitHub and Stripe have different modes (dark vs light)
checks.push({
  name: "GitHub (dark) vs Stripe (light) mode difference",
  ok:
    githubSig.colorProfile.luminanceMode !==
    stripeSig.colorProfile.luminanceMode,
  hint: `GitHub: ${githubSig.colorProfile.luminanceMode}, Stripe: ${stripeSig.colorProfile.luminanceMode}`,
});

// 3. Check that dominant hues are different
const hues = [
  githubSig.colorProfile.dominantHue,
  stripeSig.colorProfile.dominantHue,
  discordSig.colorProfile.dominantHue,
];
const hueSpread = Math.max(...hues) - Math.min(...hues);
checks.push({
  name: "Dominant hues vary across sites",
  ok: hueSpread >= 20, // At least 20 degrees difference
  hint: `Hues: ${hues.join("°, ")}°, spread: ${hueSpread}°`,
});

// 4. Check that brand colors are detected
checks.push({
  name: "GitHub has brand colors",
  ok: githubSig.colorProfile.brandColors.length > 0,
  hint: `Brand colors: ${
    githubSig.colorProfile.brandColors.join(", ") || "none"
  }`,
});

checks.push({
  name: "Stripe has brand colors",
  ok: stripeSig.colorProfile.brandColors.length > 0,
  hint: `Brand colors: ${
    stripeSig.colorProfile.brandColors.join(", ") || "none"
  }`,
});

checks.push({
  name: "Discord has brand colors",
  ok: discordSig.colorProfile.brandColors.length > 0,
  hint: `Brand colors: ${
    discordSig.colorProfile.brandColors.join(", ") || "none"
  }`,
});

// 5. Check semantic roles are assigned
checks.push({
  name: "GitHub has background role assigned",
  ok: githubSig.semanticRoles.has("background.primary"),
  hint: `Roles: ${[...githubSig.semanticRoles.keys()].join(", ")}`,
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

if (failed) {
  console.error("❌ Site Signature Test FAILED");
  console.error("   Different sites should produce different signatures!");
  process.exit(1);
} else {
  console.log("✅ Site Signature Test PASSED");
  console.log("   Different sites produce meaningfully different signatures!");
  process.exit(0);
}
