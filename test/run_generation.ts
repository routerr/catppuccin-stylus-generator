// Node script to generate Stylus/LESS from stylus_example.less using role-mapper
import fs from 'fs';
import path from 'path';
import { extractColorsFromCSS } from '../src/utils/color-analysis';
import { mapToCatppuccinTheme } from '../src/utils/role-mapper';
import { generateStylusTheme } from '../src/services/generators/stylus';
import { generateLessTheme } from '../src/services/generators/less';
import type { ColorUsage } from '../src/types/theme';

const inputPath = path.resolve('stylus_example.less');
const outDir = path.resolve('out');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const content = fs.readFileSync(inputPath, 'utf8');

// 1) Extract colors using repository utility
const colors = extractColorsFromCSS(content);
if (colors.length === 0) {
  console.error('No colors extracted from stylus_example.less');
  process.exit(2);
}

// 2) Build frequency map from occurrences in file
const freqMap = new Map<string, number>();
for (const hex of colors) {
  const regex = new RegExp(hex, 'ig');
  const matches = (content.match(regex) || []).length;
  freqMap.set(hex, (freqMap.get(hex) || 0) + matches);
}
let total = 0;
for (const v of freqMap.values()) total += v;

// 3) Build sourceColors Map<string, ColorUsage>
const sourceColors = new Map<string, ColorUsage>();
for (const [hex, count] of freqMap.entries()) {
  const usage: ColorUsage = {
    hex,
    frequency: total > 0 ? count / total : 0,
    contexts: ['other'],
    semanticHints: []
  };
  sourceColors.set(hex, usage);
}

// 4) Determine flavor: if file indicates a light theme, use 'latte'
const flavor = content.includes('data-mode="light"') ? 'latte' : 'mocha';

// 5) Call role-mapper
const mappingOutput = mapToCatppuccinTheme({
  sourceColors,
  selectedFlavor: flavor
});

// 6) Generate Stylus and Less outputs via public generator exports
const stylus = generateStylusTheme(flavor, mappingOutput, inputPath);
const less = generateLessTheme(flavor, mappingOutput, inputPath);

// 7) Write outputs
const stylusPath = path.join(outDir, 'stylus_example.generated.styl');
const lessPath = path.join(outDir, 'stylus_example.generated.less');
fs.writeFileSync(stylusPath, stylus, 'utf8');
fs.writeFileSync(lessPath, less, 'utf8');

console.log('Wrote:', stylusPath);
console.log('Wrote:', lessPath);

// 8) Validate outputs for required sections/variables
const checks: Array<{ name: string; ok: boolean; hint?: string }> = [];

checks.push({
  name: 'Level1 token bindings (cp_)',
  ok: stylus.includes('cp_') && less.includes('cp_'),
  hint: 'expected cp_ tokens in both outputs'
});
checks.push({
  name: 'Level2 role assignments (role vars)',
  ok:
    stylus.includes('$primary-base') ||
    stylus.includes('$primary-base') ||
    less.includes('@primary-base') ||
    less.includes('@primary-base'),
  hint: 'expected primary role vars in outputs'
});
checks.push({
  name: 'Derived hover/active present',
  ok:
    (stylus.includes('hover') && stylus.includes('active')) ||
    (less.includes('hover') && less.includes('active')),
  hint: 'expected derived hover/active variables'
});

let failed = false;
console.log('\\nValidation results:');
for (const c of checks) {
  if (c.ok) {
    console.log('✓', c.name);
  } else {
    console.error('✗', c.name, c.hint);
    failed = true;
  }
}

// Print short stylus head for inspection
console.log('\\nStylus head:\\n', stylus.slice(0, 1000));

if (failed) {
  console.error('Validation failed');
  process.exit(3);
} else {
  console.log('Validation passed');
  process.exit(0);
}