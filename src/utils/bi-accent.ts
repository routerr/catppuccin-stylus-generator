import { AccentColor } from "../types/catppuccin";

// Order of accents on the color wheel (approximate)
const ACCENT_WHEEL: AccentColor[] = [
  "red",
  "maroon",
  "peach",
  "yellow",
  "green",
  "teal",
  "sky",
  "sapphire",
  "blue",
  "lavender",
  "mauve",
  "pink",
  "flamingo",
  "rosewater",
];

/**
 * Get the bi-accents for a given main accent.
 * Bi-accents are approximately 72 degrees apart on the color wheel.
 * Since we have 14 accents, 72 degrees is roughly 14 * (72/360) ~= 2.8 steps.
 * We'll round to 3 steps.
 */
export function getBiAccents(
  mainAccent: AccentColor
): [AccentColor, AccentColor] {
  const index = ACCENT_WHEEL.indexOf(mainAccent);
  if (index === -1) {
    // Fallback if not found (shouldn't happen for valid accents)
    return ["blue", "green"];
  }

  const step = 3; // ~77 degrees
  const len = ACCENT_WHEEL.length;

  const bi1Index = (index + step) % len;
  const bi2Index = (index - step + len) % len;

  return [ACCENT_WHEEL[bi1Index], ACCENT_WHEEL[bi2Index]];
}

/**
 * Get the "sub-bi-accents" for a given accent (recursive application).
 */
export function getCascadingAccents(mainAccent: AccentColor) {
  const [bi1, bi2] = getBiAccents(mainAccent);
  const [bi1_sub1, bi1_sub2] = getBiAccents(bi1);
  const [bi2_sub1, bi2_sub2] = getBiAccents(bi2);

  return {
    main: mainAccent,
    bi1,
    bi2,
    bi1_subs: [bi1_sub1, bi1_sub2],
    bi2_subs: [bi2_sub1, bi2_sub2],
  };
}

/**
 * Accent distribution scheme for 60/20/20 ratio.
 * - Primary accent: 60% of colored vision area (links, primary buttons, focus)
 * - Secondary bi-accent: 20% (secondary buttons, badges, labels)
 * - Tertiary bi-accent: 20% (hover states, card accents, borders)
 */
export interface AccentDistribution {
  primary: { accent: AccentColor; ratio: number };
  secondary: { accent: AccentColor; ratio: number };
  tertiary: { accent: AccentColor; ratio: number };
}

/**
 * Get accent distribution scheme with 60/20/20 ratio.
 */
export function getAccentDistributionScheme(
  mainAccent: AccentColor
): AccentDistribution {
  const [bi1, bi2] = getBiAccents(mainAccent);
  return {
    primary: { accent: mainAccent, ratio: 0.6 }, // 60% - main accent
    secondary: { accent: bi1, ratio: 0.2 }, // 20% - clockwise bi-accent
    tertiary: { accent: bi2, ratio: 0.2 }, // 20% - counter-clockwise bi-accent
  };
}

/**
 * Get tokens for hover gradient effect on accent elements.
 * Returns [mainAccent, nearestBiAccent] for gradient from main to bi-accent.
 */
export function getHoverGradientTokens(
  mainAccent: AccentColor
): [AccentColor, AccentColor] {
  const [bi1, _bi2] = getBiAccents(mainAccent);
  return [mainAccent, bi1]; // Gradient from main to nearest bi-accent
}
