export type FolderColorMode = 'light' | 'dark';

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
  const children = new Map<string, Set<string>>();

  for (const source of sources) {
    const parts = source.split('/');
    for (let i = 0; i < parts.length - 1; i++) {
      const folder = parts.slice(0, i + 1).join('/');
      const parentKey = i === 0 ? '' : parts.slice(0, i).join('/');
      if (!children.has(parentKey)) {
        children.set(parentKey, new Set());
      }
      children.get(parentKey)!.add(folder);
    }
  }

  const result = new Map<string, string[]>();
  for (const [parent, childSet] of children) {
    result.set(
      parent,
      [...childSet].sort((a, b) => a.localeCompare(b)),
    );
  }
  return result;
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

function pickHue(parentHue: number | null, siblingIndex: number, usedHues: number[]): number {
  let candidate = parentHue === null ? (siblingIndex * GOLDEN_ANGLE) % 360 : (parentHue + 60 + siblingIndex * 45) % 360;

  for (let attempt = 0; attempt < 360; attempt++) {
    const okParent = parentHue === null || hueDistance(candidate, parentHue) >= MIN_PARENT_HUE_DELTA;
    const okSiblings = usedHues.every(hue => hueDistance(candidate, hue) >= MIN_SIBLING_HUE_DELTA);
    if (okParent && okSiblings) {
      return candidate;
    }
    candidate = (candidate + MIN_SIBLING_HUE_DELTA) % 360;
  }

  return candidate;
}

function toPastelColor(hue: number, lightnessIndex: number, mode: FolderColorMode): string {
  const { saturation, lightnessOptions } = FOLDER_COLOR_PALETTE[mode];
  const lightness = lightnessOptions[lightnessIndex % lightnessOptions.length];
  return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
}

function assignColorsRecursive(
  parentKey: string,
  parentHue: number | null,
  childrenIndex: Map<string, string[]>,
  colors: Map<string, string>,
  mode: FolderColorMode,
): void {
  const childPaths = childrenIndex.get(parentKey) ?? [];
  const usedHues: number[] = [];

  for (let i = 0; i < childPaths.length; i++) {
    const path = childPaths[i];
    const hue = pickHue(parentHue, i, usedHues);
    usedHues.push(hue);
    colors.set(path, toPastelColor(hue, i, mode));
    assignColorsRecursive(path, hue, childrenIndex, colors, mode);
  }
}

export function assignFolderColors(sources: string[], mode: FolderColorMode = 'light'): ReadonlyMap<string, string> {
  const childrenIndex = buildChildrenIndex(sources);
  const colors = new Map<string, string>();
  assignColorsRecursive('', null, childrenIndex, colors, mode);
  return colors;
}

export function parsePastelHsl(color: string): {
  hue: number;
  saturation: number;
  lightness: number;
} | null {
  const match = /^hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)$/.exec(color);
  if (!match) return null;
  return {
    hue: Number(match[1]),
    saturation: Number(match[2]),
    lightness: Number(match[3]),
  };
}

export function hueDistanceForTest(a: number, b: number): number {
  return hueDistance(a, b);
}
