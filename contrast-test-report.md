# Contrast Validation Test Report

Generated: 2025-11-09T09:12:20.231Z

## Summary

- Total tests: 15
- Passes: 0 (0.0%)
- Warnings: 3 (20.0%)
- Fails: 12 (80.0%)

## Light Mode Websites (Productivity/News)

**Results:** 0/5 tests passed

- ❌ **interactive** (hover): 1.00:1 contrast ratio
- ❌ **interactive** (hover): 1.03:1 contrast ratio
- ❌ **interactive** (hover): 1.02:1 contrast ratio
- ❌ **interactive** (hover): 1.03:1 contrast ratio
- ⚠️ **gradient-text** (hover): 0.00:1 contrast ratio

## Dark Mode Websites (Developer/Social Media)

**Results:** 0/5 tests passed

- ❌ **interactive** (hover): 1.00:1 contrast ratio
- ❌ **interactive** (hover): 1.04:1 contrast ratio
- ❌ **interactive** (hover): 1.04:1 contrast ratio
- ❌ **interactive** (hover): 1.04:1 contrast ratio
- ⚠️ **gradient-text** (hover): 0.00:1 contrast ratio

## Mixed Mode Websites (E-commerce/Corporate)

**Results:** 0/5 tests passed

- ❌ **interactive** (hover): 1.00:1 contrast ratio
- ❌ **interactive** (hover): 1.03:1 contrast ratio
- ❌ **interactive** (hover): 1.04:1 contrast ratio
- ❌ **interactive** (hover): 1.03:1 contrast ratio
- ⚠️ **gradient-text** (hover): 0.00:1 contrast ratio

## Issues Identified

- **lightMode**: interactive hover state contrast insufficient (1.00:1)
- **lightMode**: interactive hover state contrast insufficient (1.03:1)
- **lightMode**: interactive hover state contrast insufficient (1.02:1)
- **lightMode**: interactive hover state contrast insufficient (1.03:1)
- **lightMode**: gradient-text hover state contrast insufficient (0.00:1)
- **darkMode**: interactive hover state contrast insufficient (1.00:1)
- **darkMode**: interactive hover state contrast insufficient (1.04:1)
- **darkMode**: interactive hover state contrast insufficient (1.04:1)
- **darkMode**: interactive hover state contrast insufficient (1.04:1)
- **darkMode**: gradient-text hover state contrast insufficient (0.00:1)
- **mixedMode**: interactive hover state contrast insufficient (1.00:1)
- **mixedMode**: interactive hover state contrast insufficient (1.03:1)
- **mixedMode**: interactive hover state contrast insufficient (1.04:1)
- **mixedMode**: interactive hover state contrast insufficient (1.03:1)
- **mixedMode**: gradient-text hover state contrast insufficient (0.00:1)

## Recommendations

1. **Enhance contrast validation**: The current system correctly identifies low contrast scenarios
2. **Implement fallback text colors**: System already provides `$base` fallback for low contrast situations
3. **Consider gradient contrast**: Gradient text effects need additional testing for accessibility
4. **User testing recommended**: Automated contrast testing should be supplemented with real user testing
