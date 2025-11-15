import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { buildPaletteProfile, convertProfileToMapping } from '../src/services/palette-profile';

const duckHtmlPath = new URL('../analysis_snapshots/duckduckgo.html', import.meta.url);
const duckCssPath = new URL('../Themes/less/DuckDuckGo.less', import.meta.url);

const duckHtml = readFileSync(duckHtmlPath, 'utf8');
const duckCss = readFileSync(duckCssPath, 'utf8');

const duckProfile = buildPaletteProfile({
  url: 'https://duckduckgo.com',
  html: duckHtml,
  css: duckCss,
});

assert.ok(Object.keys(duckProfile.tokens).length > 0, 'duckduckgo: should extract CSS variables from source');
assert.ok(duckProfile.roles['text.primary'], 'duckduckgo: should infer text.primary role');

const duckMapping = convertProfileToMapping(duckProfile, 'mocha');
assert.ok(duckMapping.roleMap['background.primary'], 'duckduckgo: role map should include background primary');
assert.ok(duckMapping.derivedScales['primary.hover'], 'duckduckgo: derived scales should include primary hover');
assert.equal(duckMapping.metadata.primaryAccent, duckProfile.accents.primary, 'duckduckgo: should propagate accent metadata');

const claudeHtmlPath = new URL('../analysis_snapshots/claude.html', import.meta.url);
const claudeCssPath = new URL('../Themes/less/Claude.less', import.meta.url);

const claudeHtml = readFileSync(claudeHtmlPath, 'utf8');
const claudeCss = readFileSync(claudeCssPath, 'utf8');

const claudeProfile = buildPaletteProfile({
  url: 'https://claude.ai',
  html: claudeHtml,
  css: claudeCss,
});

assert.ok(claudeProfile.roles['accent.interactive'], 'claude: should detect interactive accents');
assert.ok(claudeProfile.roles['danger.base'], 'claude: should detect danger state');
const claudeMapping = convertProfileToMapping(claudeProfile, 'mocha');
assert.ok(claudeMapping.roleMap['accent.interactive'], 'claude: should map accent interactive');
assert.ok(claudeMapping.metadata.warnings?.length === claudeProfile.diagnostics.warnings.length, 'claude: warnings propagated');

console.log('Palette profile tests passed.');
