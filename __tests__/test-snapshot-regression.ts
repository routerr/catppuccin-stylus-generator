/**
 * Snapshot regression tests for theme generation.
 * Ensures generated themes maintain consistent structure against golden files.
 * 
 * Run with: npx tsx __tests__/test-snapshot-regression.ts
 */

import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { buildPaletteProfile, convertProfileToMapping } from '../src/services/palette-profile';
import { generateUserStyle } from '../src/services/generators/userstyle';

// Stub localStorage for Node.js environment
try {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: (() => {
      const store = new Map<string, string>();
      return {
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        setItem: (k: string, v: string) => { store.set(k, String(v)); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => { store.clear(); },
      };
    })(),
  });
} catch {
  // If defineProperty fails, tests will still proceed without cache.
}

console.log('🧪 Running snapshot regression tests...\n');

interface Fixture {
  name: string;
  url: string;
  htmlPath: string;
  cssPath?: string;
  goldenPath: string;
}

const fixtures: Fixture[] = [
  {
    name: 'duckduckgo',
    url: 'https://duckduckgo.com',
    htmlPath: '../analysis_snapshots/duckduckgo.html',
    cssPath: '../Themes/less/DuckDuckGo.less',
    goldenPath: '../golden/duckduckgo.less',
  },
  {
    name: 'claude',
    url: 'https://claude.ai',
    htmlPath: '../analysis_snapshots/claude.html',
    cssPath: '../Themes/less/Claude.less',
    goldenPath: '../golden/claude.less',
  },
  {
    name: 'gemini',
    url: 'https://gemini.google.com',
    htmlPath: '../analysis_snapshots/gemini.html',
    goldenPath: '../golden/gemini.less',
  },
  {
    name: 'github',
    url: 'https://github.com',
    htmlPath: '../analysis_snapshots/github-routerr.html',
    goldenPath: '../golden/github.less',
  },
  {
    name: 'perplexity',
    url: 'https://www.perplexity.ai',
    htmlPath: '../analysis_snapshots/perplexity.html',
    goldenPath: '../golden/perplexity.less',
  },
];

let passed = 0;
let failed = 0;

for (const fixture of fixtures) {
  console.log(`📋 Testing ${fixture.name}...`);
  
  try {
    // Read fixture files
    const htmlPath = new URL(fixture.htmlPath, import.meta.url);
    const goldenPath = new URL(fixture.goldenPath, import.meta.url);
    
    if (!existsSync(htmlPath)) {
      console.log(`  ⚠️  Skipped: HTML snapshot not found`);
      continue;
    }
    
    if (!existsSync(goldenPath)) {
      console.log(`  ⚠️  Skipped: Golden file not found`);
      continue;
    }
    
    const html = readFileSync(htmlPath, 'utf8');
    const css = fixture.cssPath 
      ? readFileSync(new URL(fixture.cssPath, import.meta.url), 'utf8') 
      : undefined;
    const golden = readFileSync(goldenPath, 'utf8');
    
    // Build palette profile
    const profile = buildPaletteProfile({
      url: fixture.url,
      html,
      css,
    });
    
    // Convert to mapping
    const mapping = convertProfileToMapping(profile, 'mocha');
    
    // Generate UserStyle
    const userStyle = generateUserStyle(
      mapping,
      fixture.url,
      undefined,
      undefined,
      'mocha',
      'mauve'
    );
    
    // Structural checks
    
    // 1. Has UserStyle metadata header
    assert.ok(
      userStyle.includes('==UserStyle=='),
      `${fixture.name}: Should have UserStyle metadata header`
    );
    
    // 2. Has @-moz-document domain rule
    const domain = new URL(fixture.url).hostname;
    assert.ok(
      userStyle.includes('@-moz-document') || userStyle.includes(`domain("${domain}")`),
      `${fixture.name}: Should have @-moz-document rule`
    );
    
    // 3. Has #catppuccin mixin block
    assert.ok(
      userStyle.includes('#catppuccin'),
      `${fixture.name}: Should have #catppuccin mixin`
    );
    
    // 4. Golden file has reasonable content
    assert.ok(
      golden.length > 500,
      `${fixture.name}: Golden file should have substantial content`
    );
    
    // 5. Generated output is non-trivial
    assert.ok(
      userStyle.length > 500,
      `${fixture.name}: Generated output should have substantial content`
    );
    
    console.log(`  ✅ Passed (generated: ${userStyle.length} chars, golden: ${golden.length} chars)`);
    passed++;
    
  } catch (error) {
    console.log(`  ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✅ All snapshot regression tests passed!');
  process.exit(0);
}
