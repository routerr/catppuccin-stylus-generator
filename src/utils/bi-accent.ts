import { CatppuccinColor, AccentColor } from "../types/catppuccin";

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
