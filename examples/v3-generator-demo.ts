/**
 * UserStyle V3 Generator - Usage Examples
 *
 * This file demonstrates how to use the new V3 generator
 * with dynamic multi-flavor support and cascading gradients.
 */

import { runDeepAnalysisPipeline } from '../src/services/deep-analysis';
import type { CatppuccinFlavor, CatppuccinAccent } from '../src/types/catppuccin';

// ============================================================================
// Example 1: Basic V3 Usage with Comprehensive Coverage
// ============================================================================

async function example1_BasicV3() {
  console.log('📝 Example 1: Basic V3 Generator with Comprehensive Coverage\n');

  const result = await runDeepAnalysisPipeline({
    url: 'https://duckduckgo.com',
    flavor: 'mocha' as CatppuccinFlavor,      // Default flavor
    mainAccent: 'blue' as CatppuccinAccent,   // Default accent
    useV3Generator: true,                      // 🎯 Enable V3!
    userstyleV3: {
      enableCascadingGradients: true,
      gradientCoverage: 'comprehensive',
    },
    mapper: {
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY || 'sk-test',
      model: 'gpt-4.1-mini',
    },
  });

  console.log('✅ Generated V3 theme:');
  console.log(`   - Variables mapped: ${result.userstyle.coverage.variableCoverage}%`);
  console.log(`   - SVGs processed: ${result.userstyle.coverage.svgCoverage}%`);
  console.log(`   - Selectors covered: ${result.userstyle.coverage.selectorCoverage}%`);
  console.log(`   - Dynamic: ${result.userstyle.metadata.dynamic ? 'Yes ✨' : 'No'}`);
  console.log(`   - Supported flavors: ${result.userstyle.metadata.supportedFlavors?.join(', ')}`);
  console.log(`   - Supported accents: ${result.userstyle.metadata.supportedAccents?.length || 0}`);
  console.log('\n🎨 Users can now change flavor/accent by editing variables in the .user.less file!');

  return result.userstyle.less;
}

// ============================================================================
// Example 2: Minimal Gradient Coverage (Lightweight)
// ============================================================================

async function example2_MinimalCoverage() {
  console.log('\n📝 Example 2: Minimal Gradient Coverage (Lightweight)\n');

  const result = await runDeepAnalysisPipeline({
    url: 'https://example.com',
    flavor: 'frappe' as CatppuccinFlavor,
    mainAccent: 'lavender' as CatppuccinAccent,
    useV3Generator: true,
    userstyleV3: {
      gradientCoverage: 'minimal',  // Only basic hover effects
    },
    mapper: {
      provider: 'ollama',
      model: 'llama3.2',
    },
  });

  console.log('✅ Lightweight V3 theme generated with minimal gradients');
  console.log(`   - Smaller file size, fewer gradient rules`);

  return result.userstyle.less;
}

// ============================================================================
// Example 3: V2 for Comparison (Backwards Compatibility)
// ============================================================================

async function example3_V2Comparison() {
  console.log('\n📝 Example 3: V2 Generator (Backwards Compatible)\n');

  const result = await runDeepAnalysisPipeline({
    url: 'https://example.com',
    flavor: 'mocha' as CatppuccinFlavor,
    mainAccent: 'blue' as CatppuccinAccent,
    useV3Generator: false,  // 🎯 Use V2 (default)
    mapper: {
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY || 'sk-test',
      model: 'gpt-4.1-mini',
    },
  });

  console.log('✅ V2 theme generated (single flavor/accent, baked)');
  console.log(`   - No dynamic switching (requires regeneration to change)`);

  return result.userstyle.less;
}

// ============================================================================
// Example 4: All 14 Accents (Demonstration)
// ============================================================================

async function example4_AllAccents() {
  console.log('\n📝 Example 4: Generate with Different Accents\n');

  const accents: CatppuccinAccent[] = [
    'blue', 'lavender', 'mauve', 'pink',
    'red', 'maroon', 'peach', 'yellow',
    'green', 'teal', 'sky', 'sapphire',
    'rosewater', 'flamingo',
  ];

  console.log(`🎨 With V3, ONE generated theme supports all ${accents.length} accents!`);
  console.log('   Users just edit @accentColor variable:\n');

  for (const accent of accents) {
    console.log(`   @accentColor: ${accent};`);
  }

  console.log('\n✨ No regeneration needed!');
}

// ============================================================================
// Example 5: Cascading Gradients Demonstration
// ============================================================================

async function example5_CascadingGradients() {
  console.log('\n📝 Example 5: Cascading Gradient System Explained\n');

  console.log('For main-accent = blue:');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│ LEVEL 1: Main-accent elements (70-80%)         │');
  console.log('│   Buttons, Links, CTAs                          │');
  console.log('│   ├─ main: blue                                 │');
  console.log('│   ├─ gradient: blue → sapphire                  │');
  console.log('│   └─ gradient: blue → lavender                  │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log('│ LEVEL 2: Bi-accent-1 elements (variety)        │');
  console.log('│   Badges, Tags (using sapphire as main)        │');
  console.log('│   ├─ main: sapphire                             │');
  console.log('│   ├─ gradient: sapphire → sky                   │');
  console.log('│   └─ gradient: sapphire → blue                  │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log('│ LEVEL 3: Bi-accent-2 elements (variety)        │');
  console.log('│   Chips, Pills (using lavender as main)        │');
  console.log('│   ├─ main: lavender                             │');
  console.log('│   ├─ gradient: lavender → mauve                 │');
  console.log('│   └─ gradient: lavender → pink                  │');
  console.log('└─────────────────────────────────────────────────┘');
  console.log('\n✨ All gradients maintain analogous harmony (±72° hue)');
  console.log('✨ Creates visual hierarchy without chaos');
}

// ============================================================================
// Example 6: Custom Configuration
// ============================================================================

async function example6_CustomConfig() {
  console.log('\n📝 Example 6: Custom V3 Configuration\n');

  const result = await runDeepAnalysisPipeline({
    url: 'https://example.com',
    flavor: 'macchiato' as CatppuccinFlavor,
    mainAccent: 'mauve' as CatppuccinAccent,
    useV3Generator: true,
    userstyleV3: {
      defaultFlavor: 'macchiato',           // Default for light mode
      defaultAccent: 'mauve',                // Default accent
      enableCascadingGradients: true,        // Enable 3-level gradients
      gradientCoverage: 'comprehensive',     // Maximum coverage
      includeComments: true,                 // Helpful for users
      version: 'v3.0.0-custom',              // Custom version tag
    },
    mapper: {
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY || 'sk-test',
      model: 'gpt-4.1-mini',
    },
  });

  console.log('✅ Custom V3 theme generated with full options');
  console.log(`   - Version: ${result.userstyle.metadata.version}`);
  console.log(`   - Comments included: Yes (helps users understand structure)`);

  return result.userstyle.less;
}

// ============================================================================
// Main Demo Runner
// ============================================================================

async function runAllExamples() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   UserStyle V3 Generator - Demo & Examples               ║');
  console.log('║   Dynamic Multi-Flavor + Cascading Gradients              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Example 1: Basic V3 usage
    // await example1_BasicV3();

    // Example 2: Minimal coverage
    // await example2_MinimalCoverage();

    // Example 3: V2 comparison
    // await example3_V2Comparison();

    // Example 4: All accents
    await example4_AllAccents();

    // Example 5: Cascading gradients
    await example5_CascadingGradients();

    // Example 6: Custom config
    // await example6_CustomConfig();

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   ✅ All examples completed successfully!                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('📚 For more information, see: USERSTYLE_V3_GUIDE.md');

  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

// Export for use in other modules
export {
  example1_BasicV3,
  example2_MinimalCoverage,
  example3_V2Comparison,
  example4_AllAccents,
  example5_CascadingGradients,
  example6_CustomConfig,
};
