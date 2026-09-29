import type { CruiseSnapshot, FolderBaseColor } from '@/domain';

import { assignFolderBaseColors, folderBaseColorsToRecord } from '../assignFolderColors';

/** Default pastel folder colors derived from the cruise snapshot folders. */
export function defaultFolderColorsRecord(snapshot: CruiseSnapshot): Record<string, FolderBaseColor> {
  return folderBaseColorsToRecord(assignFolderBaseColors(snapshot));
}
