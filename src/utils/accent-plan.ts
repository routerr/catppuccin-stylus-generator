import type { PaletteProfile } from '../services/palette-profile';
import type { AccentColor, CatppuccinFlavor } from '../types/catppuccin';
import { PRECOMPUTED_ACCENTS } from './accent-schemes';

export interface AccentPlan {
  seed: number;
  buttonVariant: 'alt1' | 'alt2';
  classColorCycle: string[];
  hoverAngles: {
    buttons: number;
    links: number;
    cards: number;
    badges: number;
    general: number;
  };
}

export function createAccentPlan(
  profile: PaletteProfile | undefined,
  flavor: CatppuccinFlavor,
  defaultAccent: AccentColor
): AccentPlan {
  const hash = profile?.hash || `${flavor}-${defaultAccent}`;
  const seed = seedFromHash(hash);
  const buttonVariant: 'alt1' | 'alt2' = seed % 2 === 0 ? 'alt1' : 'alt2';
  const baseCycle = ['@accent', '@bi-accent1', '@bi-accent2'];
  const classColorCycle = shuffle(baseCycle, seed);

  const hoverAngles = {
    buttons: deterministicAngle(seed, 0),
    links: deterministicAngle(seed, 1),
    cards: deterministicAngle(seed, 2),
    badges: deterministicAngle(seed, 3),
    general: deterministicAngle(seed, 4),
  };

  return {
    seed,
    buttonVariant,
    classColorCycle,
    hoverAngles,
  };
}

function seedFromHash(hash: string): number {
  const chunk = hash.slice(0, 8);
  const value = parseInt(chunk, 16);
  if (!Number.isFinite(value)) {
    return hash.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  }
  return value;
}

function shuffle(values: string[], seed: number): string[] {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function deterministicAngle(seed: number, offset: number): number {
  const rotated = ((seed >>> (offset * 4)) ^ (seed << (offset + 1))) >>> 0;
  return rotated % 360;
}
