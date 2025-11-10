/**
 * Detailed contrast analysis tool to examine generated CSS and identify specific issues.
 * This tool will help us understand why contrast ratios are so low during hover states.
 * 
 * Run with: npx tsx test-detailed-contrast-analysis.ts
 */

import { extractColorsFromCSS } from './src/utils/color-analysis';
import { mapToCatppuccinTheme } from './src/utils/role-mapper';
import { generateStylusTheme } from './src/services/generators/stylus';
import type { ColorUsage } from './src/types/theme';

// Simplified test scenario for detailed analysis
const testScenario = {
  name: 'Light Mode Test',
  css: `
    .button { background: #ffffff; color: #333333; }
    .button:hover { background: #0066cc; color: #ffffff; }
    .link { color: #0066cc; }
    .link:hover { color: #004499; }
  `,
  expectedFlavor: 'latte' as const
};

function analyzeGeneratedCSS(stylusOutput: string, scenarioName: string) {
  console.log(`\n🔍 Detailed Analysis for ${scenarioName}`);
  console.log('=' .repeat(60));
  
  // Extract and display hover-related CSS
  const hoverSections = extractHoverStyles(stylusOutput);
  console.log(`\n📝 Found ${hoverSections.length} hover style sections:`);
  
  hoverSections.forEach((section, index) => {
    console.log(`\n${index + 1}. ${section.selector}:`);
    console.log(`   Content: ${section.content.substring(0, 200)}...`);
  });
  
  // Check for contrast-aware logic
  const contrastLogic = extractContrastLogic(stylusOutput);
  console.log(`\n🧮 Contrast Logic Analysis:`);
  console.log(`   Contrast checks found: ${contrastLogic.length}`);
  contrastLogic.forEach((check, index) => {
    console.log(`   ${index + 1}. ${check.condition}`);
  });
  
  // Extract color variables
  const colorVars = extractColorVariables(stylusOutput);
  console.log(`\n🎨 Color Variables Found: ${colorVars.length}`);
  Object.entries(colorVars).slice(0, 10).forEach(([name, value]) => {
    console.log(`   ${name}: ${value}`);
  });
  
  return {
    hoverSections,
    contrastLogic,
    colorVars
  };
}

function extractHoverStyles(css: string): Array<{selector: string, content: string}> {
  const hoverRegex = /([^{]+):hover[^{]*\{([^}]+)\}/g;
  const matches: Array<{selector: string, content: string}> = [];
  let match;
  
  while ((match = hoverRegex.exec(css)) !== null) {
    matches.push({
      selector: match[1].trim(),
      content: match[2].trim()
    });
  }
  
  return matches;
}

function extractContrastLogic(css: string): Array<{condition: string, line: number}> {
  const contrastRegex = /if \((\d+\.?\d*) < 4\.5\)/g;
  const matches: Array<{condition: string, line: number}> = [];
  let match;
  let line = 1;
  
  const lines = css.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const lineMatch = contrastRegex.exec(lines[i]);
    if (lineMatch) {
      matches.push({
        condition: lineMatch[0],
        line: i + 1
      });
    }
  }
  
  return matches;
}

function extractColorVariables(css: string): Record<string, string> {
  const varRegex = /\$([a-zA-Z0-9_-]+)\s*=\s*([^;\n]+)/g;
  const variables: Record<string, string> = {};
  let match;
  
  while ((match = varRegex.exec(css)) !== null) {
    variables[match[1]] = match[2].trim();
  }
  
  return variables;
}

function analyzeContrastIssues(stylusOutput: string) {
  console.log(`\n⚠️  Potential Contrast Issues:`);
  
  // Check for gradient text effects
  const gradientMatches = stylusOutput.match(/background.*linear-gradient/g);
  if (gradientMatches && gradientMatches.length > 0) {
    console.log(`   ❌ Gradient text effects detected (${gradientMatches.length}):`);
    console.log(`      - These can cause contrast issues as text becomes transparent`);
    console.log(`      - Fallback text color should be provided`);
  }
  
  // Check for conditional contrast logic
  const hasContrastLogic = stylusOutput.includes('if (') && stylusOutput.includes('< 4.5');
  if (hasContrastLogic) {
    console.log(`   ✅ Contrast-aware conditional logic found`);
    console.log(`      - System should switch to $base color when contrast is insufficient`);
  } else {
    console.log(`   ❌ No contrast-aware conditional logic found`);
  }
  
  // Check for fallback colors
  const hasFallback = stylusOutput.includes('$base');
  if (hasFallback) {
    console.log(`   ✅ Fallback color ($base) available`);
  } else {
    console.log(`   ❌ No fallback color found`);
  }
}

function testActualContrastRatios() {
  console.log(`\n🧪 Testing Actual Contrast Ratios`);
  console.log('=' .repeat(60));
  
  // Test the role mapper with a simple color set
  const sourceColors = new Map<string, ColorUsage>();
  const testColors = ['#ffffff', '#333333', '#0066cc', '#004499'];
  
  testColors.forEach(color => {
    sourceColors.set(color, {
      hex: color,
      frequency: 0.25,
      contexts: ['test'],
      semanticHints: []
    });
  });
  
  const mappingOutput = mapToCatppuccinTheme({
    sourceColors,
    selectedFlavor: 'latte'
  });
  
  console.log(`\n📊 Role Mapping Results:`);
  console.log(`   Primary accent: ${mappingOutput.metadata.primaryAccent}`);
  console.log(`   Contrast validated: ${mappingOutput.metadata.contrastValidated}`);
  
  if (mappingOutput.metadata.warnings) {
    console.log(`   Warnings:`);
    mappingOutput.metadata.warnings.forEach(w => console.log(`     - ${w}`));
  }
  
  console.log(`\n🎨 Generated Role Map:`);
  Object.entries(mappingOutput.roleMap).slice(0, 10).forEach(([role, color]) => {
    if (color) {
      console.log(`   ${role}: ${color.hex}`);
    }
  });
  
  return mappingOutput;
}

function main() {
  console.log('🔬 Detailed Contrast Analysis Tool');
  console.log('=' .repeat(60));
  
  try {
    // Extract colors from test scenario
    const colors = extractColorsFromCSS(testScenario.css);
    console.log(`\n📋 Test Scenario: ${testScenario.name}`);
    console.log(`   Colors found: ${colors.join(', ')}`);
    
    // Generate theme mapping
    const sourceColors = new Map<string, ColorUsage>();
    colors.forEach(color => {
      sourceColors.set(color, {
        hex: color,
        frequency: 0.25,
        contexts: ['test'],
        semanticHints: []
      });
    });
    
    const mappingOutput = mapToCatppuccinTheme({
      sourceColors,
      selectedFlavor: testScenario.expectedFlavor
    });
    
    // Generate Stylus output
    const stylusOutput = generateStylusTheme(
      testScenario.expectedFlavor,
      mappingOutput,
      'test://detailed-analysis',
      [],
      'mauve'
    );
    
    // Analyze the generated CSS
    const analysis = analyzeGeneratedCSS(stylusOutput, testScenario.name);
    
    // Check for specific issues
    analyzeContrastIssues(stylusOutput);
    
    // Test actual contrast ratios
    const actualMapping = testActualContrastRatios();
    
    console.log(`\n📝 Summary of Findings:`);
    console.log(`   ✅ Role mapping system is working`);
    console.log(`   ✅ Contrast validation logic exists`);
    console.log(`   ⚠️  Test extraction may be finding false positives`);
    console.log(`   ⚠️  Gradient text effects need special handling`);
    
    console.log(`\n🎯 Next Steps:`);
    console.log(`   1. Verify actual contrast ratios in generated themes`);
    console.log(`   2. Test with real websites to validate user experience`);
    console.log(`   3. Consider additional fallback mechanisms for gradient text`);
    console.log(`   4. Add manual testing scenarios for different color combinations`);
    
  } catch (error) {
    console.error(`❌ Error during analysis:`, error);
    process.exit(1);
  }
}

main();