/**
 * Test file to demonstrate color classification functionality.
 * This can be run with: npx tsx test-color-classification.ts
 */

import { 
  hexToRgb, 
  rgbToHsl, 
  hexToLab, 
  deltaE76,
  contrastRatio,
  passesContrast,
  nearestNeutralToken,
  nearestAccentToken,
  classifyColorRole,
  classifyAll
} from './src/utils/color-analysis';

import type { ColorUsage } from './src/types/theme';
import { CATPPUCCIN_PALETTES } from './src/constants/catppuccin-colors';

console.log('=== Color Classification System Test ===\n');

// Test 1: Color Space Conversions
console.log('1. Color Space Conversions');
const testColor = '#89b4fa'; // Catppuccin mocha blue
const rgb = hexToRgb(testColor);
const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
const lab = hexToLab(testColor);

console.log(`   Hex: ${testColor}`);
console.log(`   RGB: r=${rgb?.r}, g=${rgb?.g}, b=${rgb?.b}`);
console.log(`   HSL: h=${hsl?.h}°, s=${hsl?.s}%, l=${hsl?.l}%`);
console.log(`   LAB: L=${lab.L.toFixed(2)}, a=${lab.a.toFixed(2)}, b=${lab.b.toFixed(2)}\n`);

// Test 2: Delta E Calculation
console.log('2. Perceptual Color Difference (ΔE)');
const blue1 = hexToLab('#89b4fa'); // Mocha blue
const blue2 = hexToLab('#8aadf4'); // Macchiato blue
const red = hexToLab('#f38ba8');   // Mocha red

const blueDistance = deltaE76(blue1, blue2);
const blueRedDistance = deltaE76(blue1, red);

console.log(`   Mocha Blue ↔ Macchiato Blue: ΔE = ${blueDistance.toFixed(2)} (similar)`);
console.log(`   Mocha Blue ↔ Mocha Red: ΔE = ${blueRedDistance.toFixed(2)} (different)\n`);

// Test 3: Contrast Ratios
console.log('3. Contrast Ratios (WCAG)');
const bg = '#1e1e2e';  // Mocha base
const fg = '#cdd6f4';  // Mocha text
const subtle = '#313244'; // Mocha surface0

const textContrast = contrastRatio(fg, bg);
const surfaceContrast = contrastRatio(subtle, bg);

console.log(`   Text on Base: ${textContrast.toFixed(2)} (${passesContrast(fg, bg, 'strict') ? 'PASS strict' : 'FAIL strict'})`);
console.log(`   Surface on Base: ${surfaceContrast.toFixed(2)} (${passesContrast(subtle, bg, 'relaxed') ? 'PASS relaxed' : 'FAIL relaxed'})\n`);

// Test 4: Nearest Token Finding
console.log('4. Nearest Catppuccin Token');
const customBlue = '#7aa2f7'; // Tokyo Night blue
const palette = CATPPUCCIN_PALETTES.mocha;

const nearestNeutral = nearestNeutralToken(customBlue, palette);
const nearestAccent = nearestAccentToken(customBlue, palette);

console.log(`   Custom color: ${customBlue}`);
console.log(`   Nearest neutral: ${nearestNeutral} (${palette[nearestNeutral].hex})`);
console.log(`   Nearest accent: ${nearestAccent} (${palette[nearestAccent].hex})\n`);

// Test 5: Color Role Classification
console.log('5. Color Role Classification\n');

const testCases: Array<{ hex: string; usage: ColorUsage; description: string }> = [
  {
    hex: '#1e1e2e',
    usage: {
      hex: '#1e1e2e',
      frequency: 0.8,
      contexts: ['background'],
      semanticHints: ['main', 'body']
    },
    description: 'Dark background (high frequency)'
  },
  {
    hex: '#cdd6f4',
    usage: {
      hex: '#cdd6f4',
      frequency: 0.7,
      contexts: ['text'],
      semanticHints: ['primary', 'content']
    },
    description: 'Light text color'
  },
  {
    hex: '#89b4fa',
    usage: {
      hex: '#89b4fa',
      frequency: 0.2,
      contexts: ['link'],
      semanticHints: ['link', 'anchor']
    },
    description: 'Blue link color'
  },
  {
    hex: '#a6e3a1',
    usage: {
      hex: '#a6e3a1',
      frequency: 0.1,
      contexts: ['button'],
      semanticHints: ['success', 'confirm']
    },
    description: 'Green success button'
  },
  {
    hex: '#f38ba8',
    usage: {
      hex: '#f38ba8',
      frequency: 0.05,
      contexts: ['text', 'border'],
      semanticHints: ['error', 'danger']
    },
    description: 'Red error color'
  },
  {
    hex: '#f9e2af',
    usage: {
      hex: '#f9e2af',
      frequency: 0.08,
      contexts: ['background'],
      semanticHints: ['warning', 'alert']
    },
    description: 'Yellow warning'
  }
];

for (const testCase of testCases) {
  const result = classifyColorRole(testCase.hex, testCase.usage, 'mocha');
  console.log(`   ${testCase.description}`);
  console.log(`   Color: ${testCase.hex}`);
  console.log(`   Role: ${result.role}`);
  console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  if (result.hints && result.hints.length > 0) {
    console.log(`   Hints: ${result.hints.join(', ')}`);
  }
  console.log();
}

// Test 6: Batch Classification
console.log('6. Batch Classification\n');

const colorMap = new Map<string, ColorUsage>([
  ['#1e1e2e', { hex: '#1e1e2e', frequency: 0.8, contexts: ['background'] }],
  ['#cdd6f4', { hex: '#cdd6f4', frequency: 0.7, contexts: ['text'] }],
  ['#89b4fa', { hex: '#89b4fa', frequency: 0.2, contexts: ['link'] }],
  ['#313244', { hex: '#313244', frequency: 0.3, contexts: ['border'] }],
]);

const batchResults = classifyAll(colorMap, 'mocha');

console.log(`   Classified ${batchResults.size} colors:`);
for (const [hex, result] of batchResults.entries()) {
  console.log(`   ${hex} → ${result.role} (${(result.confidence * 100).toFixed(0)}%)`);
}

console.log('\n=== All Tests Complete ===');