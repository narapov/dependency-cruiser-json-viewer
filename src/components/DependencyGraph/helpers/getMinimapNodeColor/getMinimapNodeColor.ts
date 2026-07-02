import type { Node } from '@xyflow/react';

import type { FolderGroupNodeData, FolderNodeData } from '../../types';
import { parsePastelHsl, type FolderColorMode } from '../assignFolderColors';

const MINIMAP_FILE_COLOR = 'var(--mui-palette-background-paper)';

const MINIMAP_FOLDER_SATURATION: Record<FolderColorMode, number> = {
  light: 52,
  dark: 44,
};

const MINIMAP_FOLDER_LIGHTNESS: Record<FolderColorMode, number> = {
  light: 76,
  dark: 32,
};

function getMinimapFolderColor(color: string, mode: FolderColorMode): string {
  const parsed = parsePastelHsl(color);
  if (!parsed) {
    return color;
  }

  return `hsl(${Math.round(parsed.hue)}, ${MINIMAP_FOLDER_SATURATION[mode]}%, ${MINIMAP_FOLDER_LIGHTNESS[mode]}%)`;
}

export function getMinimapNodeColor(node: Node, mode: FolderColorMode): string {
  switch (node.type) {
    case 'folderGroup':
      return getMinimapFolderColor((node.data as FolderGroupNodeData).backgroundColor, mode);
    case 'folder':
      return getMinimapFolderColor((node.data as FolderNodeData).backgroundColor, mode);
    default:
      return MINIMAP_FILE_COLOR;
  }
}
