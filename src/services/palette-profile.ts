import type { DerivedScales, RoleKey, RoleMap } from '../types/theme';
import type { AccentColor, CatppuccinColor, CatppuccinFlavor } from '../types/catppuccin';
import { CATPPUCCIN_PALETTES } from '../constants/catppuccin-colors';
import { computeAccentSetFor, nearestAccentByRGB, hexToRgb, ACCENT_NAMES } from '../utils/accent-schemes';
import type { MappingOutput } from '../types/theme';

/**
 * Palette profile input payload.
 */
export interface PaletteProfileInput {
  url: string;
  html: string;
  css?: string;
  detectedMode?: 'light' | 'dark';
  flavor?: CatppuccinFlavor;
}

export type PaletteProfileTokenContext =
  | 'background'
  | 'surface'
  | 'text'
  | 'border'
  | 'button'
  | 'link'
  | 'semantic'
  | 'other';

export interface SourceToken {
  name: string;
  value: string;
  resolvedHex?: string;
  frequency: number;
  occurrences: number;
  contexts: PaletteProfileTokenContext[];
  sources: string[];
}

export interface RoleAssignment {
  token: string;
  confidence: number;
  hints: string[];
}

export interface AccentDistribution {
  primary: AccentColor;
  biAccents: {
    first: AccentColor;
    second: AccentColor;
  };
  weights: {
    primary: number;
    secondary: number;
    tertiary: number;
  };
  seed: string;
}

export interface PaletteDiagnostics {
  cssVariableCount: number;
  inferredRoles: string[];
  unmappedTokens: string[];
  warnings: string[];
}

export interface PaletteProfile {
  url: string;
  hash: string;
  tokens: Record<string, SourceToken>;
  roles: Partial<Record<RoleKey, RoleAssignment>>;
  accents: AccentDistribution;
  diagnostics: PaletteDiagnostics;
}

const VAR_DECL_RE = /(--[a-zA-Z0-9\-_]+)\s*:\s*([^;{}]+)/g;
const INLINE_STYLE_RE = /style="([^"]+)"/g;

const ROLE_RULES: Array<{ role: RoleKey; pattern: RegExp; hint: string }> = [
  { role: 'background.primary', pattern: /(--.*(bg|background).*(page|base|primary)|--theme-col-bg-page)/i, hint: 'Matches background primary variable' },
  { role: 'background.secondary', pattern: /(--.*(bg|background).*(secondary|mantle)|--theme-bg-legacy-home)/i, hint: 'Matches background secondary variable' },
  { role: 'background.tertiary', pattern: /(--.*(bg|background).*(tertiary|crust|alt))/i, hint: 'Matches background tertiary variable' },
  { role: 'surface.0', pattern: /(--.*surface0|--.*surface-?0|--theme-col-bg-card|--surface-0)/i, hint: 'Matches surface level 0' },
  { role: 'surface.1', pattern: /(--.*surface1|--.*surface-?1|--theme-col-bg-ui)/i, hint: 'Matches surface level 1' },
  { role: 'surface.2', pattern: /(--.*surface2|--.*surface-?2|--theme-col-bg-ui-active)/i, hint: 'Matches surface level 2' },
  { role: 'border.subtle', pattern: /(--.*border.*(subtle|light)|--theme-col-border-ui)/i, hint: 'Matches subtle border token' },
  { role: 'border.default', pattern: /(--.*border.*(default|card)|--theme-col-card-inner-border)/i, hint: 'Matches default border token' },
  { role: 'border.strong', pattern: /(--.*border.*(strong|accent)|--color-border-strong)/i, hint: 'Matches strong border token' },
  { role: 'text.primary', pattern: /(--.*text-?(primary|01|base)|--sds-color-text-01)/i, hint: 'Matches primary text token' },
  { role: 'text.secondary', pattern: /(--.*text-?(secondary|02|subtext)|--sds-color-text-02)/i, hint: 'Matches secondary text token' },
  { role: 'text.muted', pattern: /(--.*text.*(muted|subtle|03|subtext1)|--theme-text-muted)/i, hint: 'Matches muted text token' },
  { role: 'text.disabled', pattern: /(--.*text.*(disabled|04|overlay)|--sds-color-text-disabled)/i, hint: 'Matches disabled text token' },
  { role: 'accent.interactive', pattern: /(--.*(accent|link|cta|brand).*(color|main)|--sds-color-text-link)/i, hint: 'Matches interactive accent token' },
  { role: 'accent.selection', pattern: /(--.*selection|--theme-assist-gradient)/i, hint: 'Matches text selection token' },
  { role: 'accent.focus', pattern: /(--.*focus|--theme-button-link-text)/i, hint: 'Matches focus token' },
  { role: 'primary.base', pattern: /(--.*button.*primary|--theme-button-primary-bg)/i, hint: 'Matches primary button background' },
  { role: 'primary.text', pattern: /(--.*button.*primary.*text)/i, hint: 'Matches primary button text' },
  { role: 'secondary.base', pattern: /(--.*button.*secondary|--theme-button-tertiary-txt)/i, hint: 'Matches secondary button background' },
  { role: 'secondary.text', pattern: /(--.*button.*secondary.*text)/i, hint: 'Matches secondary button text' },
  { role: 'success.base', pattern: /(--.*success|--sds-color-text-success|--theme-badge-bg--green)/i, hint: 'Matches success color' },
  { role: 'success.text', pattern: /(--.*success.*text|--theme-badge-fg--green)/i, hint: 'Matches success text' },
  { role: 'warning.base', pattern: /(--.*warning|--theme-badge-bg--yellow)/i, hint: 'Matches warning color' },
  { role: 'warning.text', pattern: /(--.*warning.*text|--theme-badge-fg--yellow)/i, hint: 'Matches warning text' },
  { role: 'danger.base', pattern: /(--.*danger|--sds-color-background-destructive|--theme-browser-comparison-table-cross-bg)/i, hint: 'Matches danger color' },
  { role: 'danger.text', pattern: /(--.*danger.*text|--sds-color-text-destructive)/i, hint: 'Matches danger text' },
  { role: 'info.base', pattern: /(--.*info|--theme-browser-comparison-table-check-bg)/i, hint: 'Matches info color' },
  { role: 'info.text', pattern: /(--.*info.*text)/i, hint: 'Matches info text' },
];

/**
 * Build a palette profile from HTML (and optional CSS) input.
 */
export function buildPaletteProfile(input: PaletteProfileInput): PaletteProfile {
  const flavor = input.flavor ?? 'mocha';
  const canonical = canonicalizeHtml(input.html);
  const hash = sha256(canonical);
  const cacheKey = `${input.url}|${hash}`;
  const cached = getCachedProfile(cacheKey);
  if (cached) return cached;

  const source = combineSources(canonical, input.css);
  const { tokens, totalOccurrences } = extractTokens(source);
  const roles = inferRoles(tokens);
  const accent = deriveAccentDistribution(tokens, input.url, hash, flavor);
  const diagnostics = buildDiagnostics(tokens, roles, totalOccurrences);

  const profile: PaletteProfile = {
    url: input.url,
    hash,
    tokens,
    roles,
    accents: accent,
    diagnostics,
  };
  cacheProfile(cacheKey, profile);
  return profile;
}

function canonicalizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function combineSources(html: string, css?: string): string {
  if (!css) return html;
  return `${html}\n${css}`;
}

function extractTokens(source: string): { tokens: Record<string, SourceToken>; totalOccurrences: number } {
  const tokenMap: Record<string, SourceToken> = {};
  let total = 0;

  const addMatch = (name: string, value: string, origin: string) => {
    const trimmedName = name.trim();
    const trimmedValue = value.trim();
    const key = trimmedName;
    const contexts = inferContexts(trimmedName);

    if (!tokenMap[key]) {
      tokenMap[key] = {
        name: trimmedName,
        value: trimmedValue,
        frequency: 0,
        occurrences: 0,
        contexts,
        sources: [],
      };
      const resolved = resolveHex(trimmedValue);
      if (resolved) tokenMap[key].resolvedHex = resolved;
    }

    tokenMap[key].occurrences += 1;
    total += 1;
    tokenMap[key].sources.push(origin);
  };

  let match: RegExpExecArray | null;
  while ((match = VAR_DECL_RE.exec(source)) !== null) {
    const [, name, value] = match;
    addMatch(name, value, 'var-declaration');
  }

  while ((match = INLINE_STYLE_RE.exec(source)) !== null) {
    const styleContent = match[1];
    let inlineMatch: RegExpExecArray | null;
    while ((inlineMatch = VAR_DECL_RE.exec(styleContent)) !== null) {
      const [, name, value] = inlineMatch;
      addMatch(name, value, 'inline-style');
    }
  }

  // Update frequency
  Object.values(tokenMap).forEach((token) => {
    token.frequency = total > 0 ? token.occurrences / total : 0;
  });

  return { tokens: tokenMap, totalOccurrences: total };
}

function inferRoles(tokens: Record<string, SourceToken>): Partial<Record<RoleKey, RoleAssignment>> {
  const roles: Partial<Record<RoleKey, RoleAssignment>> = {};

  for (const [name, token] of Object.entries(tokens)) {
    for (const rule of ROLE_RULES) {
      if (rule.pattern.test(name)) {
        const existing = roles[rule.role];
        const confidence = Math.min(1, 0.6 + token.frequency * 0.4);
        if (!existing || confidence > existing.confidence) {
          roles[rule.role] = {
            token: name,
            confidence,
            hints: [rule.hint, ...token.contexts],
          };
        }
        break;
      }
    }
  }

  return roles;
}

function inferContexts(name: string): PaletteProfileTokenContext[] {
  const lower = name.toLowerCase();
  const contexts: PaletteProfileTokenContext[] = [];
  if (/bg|background/.test(lower)) contexts.push('background');
  if (/surface|card|panel/.test(lower)) contexts.push('surface');
  if (/text|font/.test(lower)) contexts.push('text');
  if (/border|divider|outline/.test(lower)) contexts.push('border');
  if (/button|cta|primary|secondary/.test(lower)) contexts.push('button');
  if (/link|anchor/.test(lower)) contexts.push('link');
  if (/success|warning|danger|error|info/.test(lower)) contexts.push('semantic');
  if (contexts.length === 0) contexts.push('other');
  return contexts;
}

function deriveAccentDistribution(
  tokens: Record<string, SourceToken>,
  url: string,
  hash: string,
  flavor: CatppuccinFlavor
): AccentDistribution {
  const seed = sha256(`${url}|${hash}|${flavor}`);
  const palette = CATPPUCCIN_PALETTES[flavor];

  const interactiveTokens = Object.values(tokens).filter((token) =>
    token.contexts.includes('button') || token.contexts.includes('link')
  );

  let primary: AccentColor = 'mauve';
  if (interactiveTokens.length > 0) {
    // Attempt to map most frequent interactive token to nearest Catppuccin accent
    const sorted = [...interactiveTokens].sort((a, b) => b.frequency - a.frequency);
    const candidate = sorted[0];
    if (candidate.resolvedHex) {
      const nearest = nearestAccentByRGB(hexToRgb(candidate.resolvedHex), palette);
      primary = nearest;
    }
  }

  // Deterministic selection of accent weights using seed-derived index
  const seedValue = parseInt(seed.slice(0, 8), 16);
  const weightVariants: Array<[number, number, number]> = [
    [0.7, 0.2, 0.1],
    [0.65, 0.25, 0.1],
    [0.6, 0.25, 0.15],
  ];
  const weights = weightVariants[seedValue % weightVariants.length];

  const accentSet = computeAccentSetFor(palette, primary);
  const bi1Set = computeAccentSetFor(palette, accentSet.biAccent1);
  const bi2Set = computeAccentSetFor(palette, accentSet.biAccent2);

  return {
    primary,
    biAccents: {
      first: accentSet.biAccent1 ?? ACCENT_NAMES[seedValue % ACCENT_NAMES.length],
      second: accentSet.biAccent2 ?? ACCENT_NAMES[(seedValue + 3) % ACCENT_NAMES.length],
    },
    weights: {
      primary: weights[0],
      secondary: weights[1],
      tertiary: weights[2],
    },
    seed,
  };
}

const ALL_CAT_COLORS: CatppuccinColor[] = [
  'base','mantle','crust',
  'surface0','surface1','surface2',
  'overlay0','overlay1','overlay2',
  'subtext0','subtext1','text',
  'rosewater','flamingo','pink','mauve','red','maroon','peach','yellow',
  'green','teal','sky','sapphire','blue','lavender'
];

const ROLE_FALLBACKS: Partial<Record<RoleKey, CatppuccinColor>> = {
  'background.primary': 'base',
  'background.secondary': 'mantle',
  'background.tertiary': 'crust',
  'surface.0': 'surface0',
  'surface.1': 'surface1',
  'surface.2': 'surface2',
  'border.subtle': 'overlay0',
  'border.default': 'overlay1',
  'border.strong': 'overlay2',
  'text.primary': 'text',
  'text.secondary': 'subtext0',
  'text.muted': 'subtext1',
  'text.disabled': 'overlay1',
  'interactive.link': 'mauve',
  'interactive.selection': 'sky',
  'interactive.focus': 'lavender',
  'semantic.success': 'green',
  'semantic.warning': 'yellow',
  'semantic.danger': 'red',
  'semantic.info': 'sapphire',
  'semantic.primary': 'mauve',
  'semantic.secondary': 'sky',
  'primary.base': 'mauve',
  'primary.text': 'base',
  'secondary.base': 'sapphire',
  'secondary.text': 'base',
  'success.base': 'green',
  'success.text': 'base',
  'warning.base': 'yellow',
  'warning.text': 'text',
  'danger.base': 'red',
  'danger.text': 'base',
  'info.base': 'blue',
  'info.text': 'base',
  'accent.interactive': 'mauve',
  'accent.selection': 'sky',
  'accent.focus': 'lavender',
};

function buildDiagnostics(
  tokens: Record<string, SourceToken>,
  roles: Partial<Record<RoleKey, RoleAssignment>>,
  totalOccurrences: number
): PaletteDiagnostics {
  const inferredRoles = Object.keys(roles);
  const cssVariableCount = Object.keys(tokens).length;
  const unmapped = Object.keys(tokens).filter((name) => !Object.values(roles).some((assignment) => assignment?.token === name));
  const warnings: string[] = [];

  if (cssVariableCount === 0) {
    warnings.push('No CSS custom properties detected in source.');
  }
  if (totalOccurrences === 0) {
    warnings.push('No inline styles or CSS variables found to analyze.');
  }

  return {
    cssVariableCount,
    inferredRoles,
    unmappedTokens: unmapped.slice(0, 25),
    warnings,
  };
}

function resolveHex(value: string): string | undefined {
  const hexMatch = value.match(/#([0-9a-f]{3,8})/i);
  if (hexMatch) {
    const hex = hexMatch[0];
    if (hex.length === 4) {
      const r = hex[1];
      const g = hex[2];
      const b = hex[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    if (hex.length === 7 || hex.length === 9) {
      return hex.slice(0, 7);
    }
  }
  const rgbMatch = value.match(/rgb\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((part) => parseInt(part.trim(), 10)).slice(0, 3);
    if (parts.length === 3 && parts.every((p) => Number.isFinite(p))) {
      return (
        '#' +
        parts
          .map((p) => Math.max(0, Math.min(255, p)).toString(16).padStart(2, '0'))
          .join('')
      );
    }
  }
  return undefined;
}

function sha256(input: string): string {
  // Lightweight FNV-1a based hash (not cryptographic, but deterministic and fast)
  const prime = 0x01000193;
  const seed = 0x811c9dc5;
  const acc: number[] = [seed, seed, seed, seed];

  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    const idx = i % acc.length;
    acc[idx] ^= ch;
    acc[idx] = Math.imul(acc[idx], prime);
  }

  return acc
    .map((val) => (val >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

function rgbDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function nearestPaletteColor(hex: string, flavor: CatppuccinFlavor): CatppuccinColor {
  const palette = CATPPUCCIN_PALETTES[flavor];
  const target = hexToRgb(hex);
  let best: { name: CatppuccinColor; dist: number } | null = null;
  for (const name of ALL_CAT_COLORS) {
    const value = palette[name];
    if (!value) continue;
    const dist = rgbDistance(target, value.rgb);
    if (!best || dist < best.dist) {
      best = { name, dist };
    }
  }
  return best?.name ?? 'mauve';
}

function getCachedProfile(key: string): PaletteProfile | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const cache = localStorage.getItem('catppuccin-palette-cache');
    if (!cache) return null;
    const data = JSON.parse(cache);
    const entry = data[key];
    if (!entry) return null;
    return entry as PaletteProfile;
  } catch {
    return null;
  }
}

function cacheProfile(key: string, profile: PaletteProfile): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const cache = localStorage.getItem('catppuccin-palette-cache');
    const data = cache ? JSON.parse(cache) : {};
    data[key] = profile;
    localStorage.setItem('catppuccin-palette-cache', JSON.stringify(data));
  } catch {
    // ignore write errors
  }
}

function ensureRole(roleMap: RoleMap, role: RoleKey, color: CatppuccinColor, flavor: CatppuccinFlavor) {
  if (!roleMap[role]) {
    roleMap[role] = CATPPUCCIN_PALETTES[flavor][color];
  }
}

function buildDerivedScales(accent: AccentDistribution, flavor: CatppuccinFlavor): DerivedScales {
  const palette = CATPPUCCIN_PALETTES[flavor];
  const derived: DerivedScales = {};
  const assign = (key: keyof DerivedScales, color: CatppuccinColor) => {
    derived[key as string] = palette[color];
  };

  assign('primary.hover', accent.biAccents.first);
  assign('primary.active', accent.biAccents.second);
  assign('secondary.hover', accent.primary);
  assign('secondary.active', accent.biAccents.second);
  assign('success.hover', 'green');
  assign('success.active', 'teal');
  assign('warning.hover', 'yellow');
  assign('warning.active', 'peach');
  assign('danger.hover', 'red');
  assign('danger.active', 'maroon');
  assign('info.hover', 'blue');
  assign('info.active', 'sapphire');
  assign('focus.ring', accent.primary);
  assign('selection.bg', accent.biAccents.first);

  return derived;
}

/**
 * Converts a PaletteProfile into MappingOutput so generators can reuse role-map code paths.
 */
export function convertProfileToMapping(profile: PaletteProfile, flavor: CatppuccinFlavor): MappingOutput {
  const roleMap: RoleMap = {};

  for (const [roleKey, assignment] of Object.entries(profile.roles)) {
    const token = profile.tokens[assignment?.token ?? ''];
    let catColor: CatppuccinColor | undefined;
    if (token?.resolvedHex) {
      catColor = nearestPaletteColor(token.resolvedHex, flavor);
    }
    if (!catColor) {
      catColor = ROLE_FALLBACKS[roleKey as RoleKey];
    }
    if (catColor) {
      roleMap[roleKey] = CATPPUCCIN_PALETTES[flavor][catColor];
    }
  }

  // Ensure critical roles exist with sensible defaults
  ensureRole(roleMap, 'background.primary', 'base', flavor);
  ensureRole(roleMap, 'background.secondary', 'mantle', flavor);
  ensureRole(roleMap, 'background.tertiary', 'crust', flavor);
  ensureRole(roleMap, 'surface.0', 'surface0', flavor);
  ensureRole(roleMap, 'surface.1', 'surface1', flavor);
  ensureRole(roleMap, 'surface.2', 'surface2', flavor);
  ensureRole(roleMap, 'text.primary', 'text', flavor);
  ensureRole(roleMap, 'text.secondary', 'subtext0', flavor);
  ensureRole(roleMap, 'text.muted', 'subtext1', flavor);
  ensureRole(roleMap, 'text.disabled', 'overlay1', flavor);
  ensureRole(roleMap, 'border.default', 'overlay1', flavor);

  // Accent-driven roles
  const accentPrimary = profile.accents.primary;
  roleMap['accent.interactive'] = CATPPUCCIN_PALETTES[flavor][accentPrimary];
  roleMap['accent.selection'] = CATPPUCCIN_PALETTES[flavor][profile.accents.biAccents.first];
  roleMap['accent.focus'] = CATPPUCCIN_PALETTES[flavor][profile.accents.biAccents.second];
  roleMap['primary.base'] = CATPPUCCIN_PALETTES[flavor][accentPrimary];
  roleMap['primary.text'] = CATPPUCCIN_PALETTES[flavor].base;
  roleMap['secondary.base'] = CATPPUCCIN_PALETTES[flavor][profile.accents.biAccents.first];
  roleMap['secondary.text'] = CATPPUCCIN_PALETTES[flavor].base;

  const derivedScales = buildDerivedScales(profile.accents, flavor);

  return {
    roleMap,
    derivedScales,
    metadata: {
      flavor,
      primaryAccent: accentPrimary,
      secondaryAccent: profile.accents.biAccents.first,
      contrastValidated: false,
      warnings: profile.diagnostics.warnings,
    },
  };
}
