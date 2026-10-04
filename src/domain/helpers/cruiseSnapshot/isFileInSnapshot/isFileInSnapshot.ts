import type { CruiseSnapshot } from '../../../types';

/** Whether `path` is a non-folder node in the cruise snapshot. */
export function isFileInSnapshot(cruiseSnapshot: CruiseSnapshot, path: string): boolean {
  const node = cruiseSnapshot.nodes.get(path);
  return !!node && !node.isFolder;
}
