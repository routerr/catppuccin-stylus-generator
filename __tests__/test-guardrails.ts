/**
 * Unit tests for guardrails module.
 * Run with: npx tsx __tests__/test-guardrails.ts
 */

import assert from 'node:assert/strict';
import {
  scanDeclarations,
  hexToRgb,
  relativeLuminance,
  contrastRatio,
  meetsWCAG_AA,
  meetsWCAG_AAA,
  ContrastValidator,
} from '../src/services/guardrails';

console.log('🧪 Running guardrails tests...\n');

// ============================================================================
// Layout Property Detection Tests
// ============================================================================

console.log('📐 Testing layout property detection...');

{
  // Should detect layout properties
  const css = `
    .button { width: 100px; color: red; }
    .card { padding: 20px; background: blue; }
  `;
  const warnings = scanDeclarations(css);
  
  assert.ok(warnings.length === 2, 'Should detect 2 layout warnings (width, padding)');
  assert.ok(warnings.some(w => w.property === 'width'), 'Should detect width');
  assert.ok(warnings.some(w => w.property === 'padding'), 'Should detect padding');
  console.log('  ✅ Detects layout properties');
}

{
  // Should not warn on safe properties
  const css = `
    .text { color: #ffffff; background-color: #000000; }
    .border { border-color: red; box-shadow: 0 0 5px black; }
  `;
  const warnings = scanDeclarations(css);
  
  assert.ok(warnings.length === 0, 'Should not warn on color-only properties');
  console.log('  ✅ Ignores safe color-only properties');
}

{
  // Should detect multiple properties in one rule
  const css = `
    .layout { 
      display: flex; 
      justify-content: center; 
      margin: 10px;
      color: white;
    }
  `;
  const warnings = scanDeclarations(css);
  
  assert.ok(warnings.length === 3, 'Should detect display, justify-content, margin');
  console.log('  ✅ Detects multiple layout properties per rule');
}

// ============================================================================
// Color Conversion Tests
// ============================================================================

console.log('\n🎨 Testing color conversion...');

{
  const rgb = hexToRgb('#ffffff');
  assert.deepEqual(rgb, [255, 255, 255], 'White should be [255, 255, 255]');
  console.log('  ✅ hexToRgb converts white correctly');
}

{
  const rgb = hexToRgb('#000000');
  assert.deepEqual(rgb, [0, 0, 0], 'Black should be [0, 0, 0]');
  console.log('  ✅ hexToRgb converts black correctly');
}

{
  const rgb = hexToRgb('#f00');
  assert.deepEqual(rgb, [255, 0, 0], 'Short hex red should work');
  console.log('  ✅ hexToRgb handles short hex');
}

// ============================================================================
// Luminance Tests
// ============================================================================

console.log('\n💡 Testing luminance calculation...');

{
  const lum = relativeLuminance([255, 255, 255]);
  assert.ok(Math.abs(lum - 1) < 0.001, 'White luminance should be ~1');
  console.log('  ✅ White has luminance ~1');
}

{
  const lum = relativeLuminance([0, 0, 0]);
  assert.ok(Math.abs(lum - 0) < 0.001, 'Black luminance should be ~0');
  console.log('  ✅ Black has luminance ~0');
}

// ============================================================================
// Contrast Ratio Tests
// ============================================================================

console.log('\n📊 Testing contrast ratio...');

{
  const ratio = contrastRatio('#ffffff', '#000000');
  assert.ok(Math.abs(ratio - 21) < 0.1, 'White/black contrast should be ~21:1');
  console.log('  ✅ White on black: ~21:1');
}

{
  const ratio = contrastRatio('#ffffff', '#ffffff');
  assert.ok(Math.abs(ratio - 1) < 0.1, 'Same color contrast should be 1:1');
  console.log('  ✅ Same color: 1:1');
}

{
  // Catppuccin Mocha: text (#cdd6f4) on base (#1e1e2e)
  const ratio = contrastRatio('#cdd6f4', '#1e1e2e');
  assert.ok(ratio > 4.5, 'Mocha text on base should meet AA');
  console.log(`  ✅ Mocha text/base: ${ratio.toFixed(2)}:1 (meets AA)`);
}

// ============================================================================
// WCAG Tests
// ============================================================================

console.log('\n♿ Testing WCAG compliance checks...');

{
  assert.ok(meetsWCAG_AA(4.5), '4.5:1 meets AA for normal text');
  assert.ok(!meetsWCAG_AA(4.4), '4.4:1 fails AA for normal text');
  assert.ok(meetsWCAG_AA(3.0, true), '3:1 meets AA for large text');
  console.log('  ✅ WCAG AA checks work correctly');
}

{
  assert.ok(meetsWCAG_AAA(7.0), '7:1 meets AAA for normal text');
  assert.ok(!meetsWCAG_AAA(6.9), '6.9:1 fails AAA for normal text');
  assert.ok(meetsWCAG_AAA(4.5, true), '4.5:1 meets AAA for large text');
  console.log('  ✅ WCAG AAA checks work correctly');
}

// ============================================================================
// ContrastValidator Tests
// ============================================================================

console.log('\n🔧 Testing ContrastValidator...');

{
  const validator = new ContrastValidator('mocha');
  const result = validator.validate('#cdd6f4', '#1e1e2e');
  
  assert.ok(result.meetsAA, 'Mocha text/base should meet AA');
  assert.ok(result.ratio > 4.5, 'Ratio should be > 4.5');
  console.log('  ✅ Validator correctly validates Mocha palette');
}

{
  const validator = new ContrastValidator('mocha');
  
  // Low contrast pair
  const corrected = validator.autoCorrectContrast('#45475a', '#1e1e2e');
  const newRatio = contrastRatio(corrected, '#1e1e2e');
  
  assert.ok(newRatio >= 4.5, 'Auto-corrected should meet AA');
  console.log(`  ✅ Auto-correction works: ${corrected} gives ${newRatio.toFixed(2)}:1`);
}

{
  const validator = new ContrastValidator('latte');
  const safeText = validator.findSafeTextColor('#eff1f5'); // Latte base
  const ratio = contrastRatio(safeText, '#eff1f5');
  
  assert.ok(ratio >= 4.5, 'Safe text should meet AA against latte base');
  console.log(`  ✅ findSafeTextColor finds ${safeText} (${ratio.toFixed(2)}:1)`);
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n✅ All guardrails tests passed!\n');
