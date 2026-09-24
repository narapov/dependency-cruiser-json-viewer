import type { CruiseTreeSnapshot } from '../../../types';
import { getCruisePathNode } from '../getCruisePathNode';

/** Whether `path` is a folder node in the snapshot. */
export function isCruiseFolderPath(snapshot: CruiseTreeSnapshot, path: string): boolean {
  return getCruisePathNode(snapshot, path)?.isFolder === true;
}
