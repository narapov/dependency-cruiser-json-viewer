import type { CruiseTreeSnapshot } from '../../../types';
import { getCruisePathNode } from '../getCruisePathNode';

/** Module sources under a folder path (or `[path]` for a file); empty when unknown. */
export function getCruiseSourcesUnder(snapshot: CruiseTreeSnapshot, path: string): string[] {
  const node = getCruisePathNode(snapshot, path);
  if (node == null) {
    return [];
  }
  if (!node.isFolder) {
    return node.path === path ? [path] : [];
  }
  return node.descendantModules;
}
