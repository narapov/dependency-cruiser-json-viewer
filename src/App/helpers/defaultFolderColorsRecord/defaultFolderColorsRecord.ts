import type { CruiseTreeSnapshot, FolderBaseColor } from '@/domain';

import { assignFolderBaseColors, folderBaseColorsToRecord } from '../../partials/DependencyGraph';

/** Default pastel folder colors derived from the cruise tree folders. */
export function defaultFolderColorsRecord(snapshot: CruiseTreeSnapshot): Record<string, FolderBaseColor> {
  return folderBaseColorsToRecord(assignFolderBaseColors(snapshot));
}
