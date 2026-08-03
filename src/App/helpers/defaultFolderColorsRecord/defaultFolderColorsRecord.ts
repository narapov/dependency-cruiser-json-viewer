import type { FolderBaseColor } from '@/domain';

import { assignFolderBaseColors, folderBaseColorsToRecord } from '../../partials/DependencyGraph';

/** Default pastel folder colors derived from module source paths. */
export function defaultFolderColorsRecord(sources: string[]): Record<string, FolderBaseColor> {
  return folderBaseColorsToRecord(assignFolderBaseColors(sources));
}
