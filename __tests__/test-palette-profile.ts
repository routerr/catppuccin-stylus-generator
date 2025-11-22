import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { buildPaletteProfile, convertProfileToMapping } from '../src/services/palette-profile';

// Node's built-in localStorage throws without an explicit backing file.
// Stub a safe in-memory version for test runs.
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

type Fixture = {
  name: string;
  url: string;
  htmlPath: string;
  cssPath?: string;
  expectedRoles?: string[];
  minTokens: number;
  goldenPath: string;
};

const fixtures: Fixture[] = [
  {
    name: 'duckduckgo',
    url: 'https://duckduckgo.com',
    htmlPath: '../analysis_snapshots/duckduckgo.html',
    cssPath: '../Themes/less/DuckDuckGo.less',
    expectedRoles: ['text.primary', 'background.primary'],
    goldenPath: '../golden/duckduckgo.less',
    minTokens: 1,
  },
  {
    name: 'claude',
    url: 'https://claude.ai',
    htmlPath: '../analysis_snapshots/claude.html',
    cssPath: '../Themes/less/Claude.less',
    expectedRoles: ['accent.interactive', 'danger.base'],
    goldenPath: '../golden/claude.less',
    minTokens: 1,
  },
  {
    name: 'gemini',
    url: 'https://gemini.google.com',
    htmlPath: '../analysis_snapshots/gemini.html',
    expectedRoles: ['background.tertiary', 'text.disabled'],
    goldenPath: '../golden/gemini.less',
    minTokens: 1,
  },
  {
    name: 'github',
    url: 'https://github.com',
    htmlPath: '../analysis_snapshots/github-routerr.html',
    expectedRoles: [],
    goldenPath: '../golden/github.less',
    minTokens: 1,
  },
  {
    name: 'perplexity',
    url: 'https://www.perplexity.ai',
    htmlPath: '../analysis_snapshots/perplexity.html',
    expectedRoles: [],
    goldenPath: '../golden/perplexity.less',
    minTokens: 0,
  },
];

fixtures.forEach((fixture) => {
  const html = readFileSync(new URL(fixture.htmlPath, import.meta.url), 'utf8');
  const css = fixture.cssPath ? readFileSync(new URL(fixture.cssPath, import.meta.url), 'utf8') : undefined;
  const golden = readFileSync(new URL(fixture.goldenPath, import.meta.url), 'utf8');

  // Ensure golden output exists for reference
  assert.ok(golden.trim().length > 100, `${fixture.name}: golden output should be present and non-empty`);

  const profile = buildPaletteProfile({
    url: fixture.url,
    html,
    css,
  });

  assert.ok(Object.keys(profile.tokens).length >= fixture.minTokens, `${fixture.name}: should extract at least ${fixture.minTokens} tokens`);

  (fixture.expectedRoles || []).forEach((role) => {
    assert.ok(profile.roles[role as keyof typeof profile.roles], `${fixture.name}: should infer role ${role}`);
  });

  const mapping = convertProfileToMapping(profile, 'mocha');
  assert.ok(mapping.roleMap['background.primary'], `${fixture.name}: mapping should include background.primary`);
  assert.ok(mapping.roleMap['text.primary'], `${fixture.name}: mapping should include text.primary`);
  assert.ok(mapping.derivedScales['primary.hover'], `${fixture.name}: derived scales should include primary.hover`);
  assert.equal(mapping.metadata.primaryAccent, profile.accents.primary, `${fixture.name}: accent metadata should propagate`);
});

console.log('Palette profile tests passed for DuckDuckGo, Claude, Gemini, GitHub, and Perplexity.');
