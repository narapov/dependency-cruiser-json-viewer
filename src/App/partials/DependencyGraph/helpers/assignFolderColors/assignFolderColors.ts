import type { FolderBaseColor } from '@/domain';

/** Theme mode used when picking pastel folder background hues. */
export type FolderColorMode = 'light' | 'dark';

export type { FolderBaseColor };

const FOLDER_COLOR_PALETTE = {
  light: {
    saturation: 48,
    lightnessOptions: [90, 88, 92] as const,
  },
  dark: {
    saturation: 42,
    lightnessOptions: [26, 24, 28] as const,
  },
} as const;

const GOLDEN_ANGLE = 137.508;
const MIN_PARENT_HUE_DELTA = 40;
const MIN_SIBLING_HUE_DELTA = 25;

function buildChildrenIndex(sources: string[]): Map<string, string[]> {
  const children = sources.reduce((acc, source) => {
    const parts = source.split('/');
    return parts.slice(0, -1).reduce((innerAcc, _, i) => {
      const folder = parts.slice(0, i + 1).join('/');
      const parentKey = i === 0 ? '' : parts.slice(0, i).join('/');
      const siblings = innerAcc.get(parentKey) ?? new Set<string>();
      siblings.add(folder);
      innerAcc.set(parentKey, siblings);
      return innerAcc;
    }, acc);
  }, new Map<string, Set<string>>());

  return new Map(
    [...children.entries()].map(([parent, childSet]) => [parent, [...childSet].sort((a, b) => a.localeCompare(b))]),
  );
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

function pickHue(parentHue: number | null, siblingIndex: number, usedHues: number[]): number {
  const initial = parentHue === null ? (siblingIndex * GOLDEN_ANGLE) % 360 : (parentHue + 60 + siblingIndex * 45) % 360;

  return (
    Array.from({ length: 360 }, (_, attempt) => (initial + attempt * MIN_SIBLING_HUE_DELTA) % 360).find(candidate => {
      const okParent = parentHue === null || hueDistance(candidate, parentHue) >= MIN_PARENT_HUE_DELTA;
      const okSiblings = usedHues.every(hue => hueDistance(candidate, hue) >= MIN_SIBLING_HUE_DELTA);
      return okParent && okSiblings;
    }) ?? initial
  );
}

function assignBaseColorsForChildren(
  parentKey: string,
  parentHue: number | null,
  childrenIndex: Map<string, string[]>,
): Map<string, FolderBaseColor> {
  const childPaths = childrenIndex.get(parentKey) ?? [];

  const { colors } = childPaths.reduce<{ colors: Map<string, FolderBaseColor>; usedHues: number[] }>(
    (acc, path, i) => {
      const hue = pickHue(parentHue, i, acc.usedHues);
      acc.colors.set(path, { hue, lightnessIndex: i });
      const nested = assignBaseColorsForChildren(path, hue, childrenIndex);
      return {
        colors: new Map([...acc.colors, ...nested]),
        usedHues: [...acc.usedHues, hue],
      };
    },
    { colors: new Map<string, FolderBaseColor>(), usedHues: [] },
  );

  return colors;
}

/** Assigns theme-independent base colors (hue + lightnessIndex) to each folder path. */
export function assignFolderBaseColors(sources: string[]): ReadonlyMap<string, FolderBaseColor> {
  const childrenIndex = buildChildrenIndex(sources);
  return assignBaseColorsForChildren('', null, childrenIndex);
}

/** Converts a base folder color into a pastel HSL string for the given theme mode. */
export function toThemedFolderColor(base: FolderBaseColor, mode: FolderColorMode): string {
  const { saturation, lightnessOptions } = FOLDER_COLOR_PALETTE[mode];
  const lightness = lightnessOptions[base.lightnessIndex % lightnessOptions.length];
  return `hsl(${Math.round(base.hue)}, ${saturation}%, ${lightness}%)`;
}

/** Maps base folder colors to themed pastel HSL strings. */
export function mapFolderBaseColorsToThemed(
  baseColors: ReadonlyMap<string, FolderBaseColor> | Readonly<Record<string, FolderBaseColor>>,
  mode: FolderColorMode,
): ReadonlyMap<string, string> {
  const entries =
    baseColors instanceof Map
      ? [...baseColors.entries()]
      : Object.entries(baseColors as Record<string, FolderBaseColor>);
  return new Map(entries.map(([path, base]) => [path, toThemedFolderColor(base, mode)]));
}

/** Assigns distinct pastel HSL colors to each folder path in the source tree. */
export function assignFolderColors(sources: string[], mode: FolderColorMode = 'light'): ReadonlyMap<string, string> {
  return mapFolderBaseColorsToThemed(assignFolderBaseColors(sources), mode);
}

/** Parses an `hsl(h, s%, l%)` string into numeric components, or null if invalid. */
export function parsePastelHsl(color: string): {
  hue: number;
  saturation: number;
  lightness: number;
} | null {
  const match = /^hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)$/.exec(color);
  if (!match) {
    return null;
  }
  return {
    hue: Number(match[1]),
    saturation: Number(match[2]),
    lightness: Number(match[3]),
  };
}

/** Serializes a base folder color map to a plain JSON record. */
export function folderBaseColorsToRecord(
  colors: ReadonlyMap<string, FolderBaseColor>,
): Record<string, FolderBaseColor> {
  return Object.fromEntries(colors.entries());
}
