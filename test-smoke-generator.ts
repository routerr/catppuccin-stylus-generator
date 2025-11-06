/**
 * Smoke test: invoke generateStylusTheme with MappingOutput and verify
 * two-level variables (Level 1 cp_* bindings and Level 2 role vars) are present.
 *
 * Run with: npx tsx test-smoke-generator.ts
 */

import { generateStylusTheme } from './src/services/generators/stylus';
import type { MappingOutput } from './src/types/theme';

const mappingOutput: MappingOutput = {
  roleMap: {
    'primary.base': {
      hex: '#ff0000',
      rgb: { r: 255, g: 0, b: 0 },
      hsl: { h: 0, s: 100, l: 50 }
    },
    'primary.text': {
      hex: '#ffffff',
      rgb: { r: 255, g: 255, b: 255 },
      hsl: { h: 0, s: 0, l: 100 }
    }
  },
  derivedScales: {
    'primary.hover': {
      hex: '#ee0000',
      rgb: { r: 238, g: 0, b: 0 },
      hsl: { h: 0, s: 100, l: 46 }
    },
    'primary.active': {
      hex: '#cc0000',
      rgb: { r: 204, g: 0, b: 0 },
      hsl: { h: 0, s: 100, l: 40 }
    }
  },
  metadata: {
    flavor: 'mocha',
    primaryAccent: 'mauve',
    secondaryAccent: 'sapphire',
    contrastValidated: true,
    warnings: []
  }
};

const output = generateStylusTheme('mocha', mappingOutput, 'https://example.com');

// Basic checks for two-level system
const checks: Array<{ name: string; ok: boolean; hint?: string }> = [];

checks.push({
  name: 'Level1 cp_ binding (primary.base)',
  ok: output.includes('$cp_primary_base'),
  hint: 'expected $cp_primary_base present'
});
checks.push({
  name: 'Level2 role var (primary-base)',
  ok: output.includes('$primary-base'),
  hint: 'expected $primary-base present'
});
checks.push({
  name: 'Derived cp_ binding (primary.hover)',
  ok: output.includes('$cp_primary_hover'),
  hint: 'expected $cp_primary_hover present'
});
checks.push({
  name: 'Derived role var (primary-hover)',
  ok: output.includes('$primary-hover'),
  hint: 'expected $primary-hover present'
});

// Print output and results
console.log('--- Generated Stylus Snippet ---\n');
console.log(output.slice(0, 2000)); // print head for inspection
console.log('\n--- Smoke Test Results ---\n');

let failed = false;
for (const c of checks) {
  if (c.ok) {
    console.log(`✓ ${c.name}`);
  } else {
    console.error(`✗ ${c.name} (${c.hint})`);
    failed = true;
  }
}

if (failed) {
  console.error('\nSmoke test FAILED');
  process.exit(1);
} else {
  console.log('\nSmoke test PASSED');
  process.exit(0);
}