import { useMemo } from 'react';

import type { FolderBaseColor } from '@/domain';

import { mapFolderBaseColorsToThemed, type FolderColorMode } from '../../helpers/assignFolderColors';

/** Converts base folder colors to themed pastel HSL for the current color scheme. */
export function useThemedFolderColors(
  baseColors: ReadonlyMap<string, FolderBaseColor> | Readonly<Record<string, FolderBaseColor>>,
  colorMode: FolderColorMode,
): ReadonlyMap<string, string> {
  return useMemo(() => mapFolderBaseColorsToThemed(baseColors, colorMode), [baseColors, colorMode]);
}
