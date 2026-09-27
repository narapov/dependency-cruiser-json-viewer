import type { CruiseSnapshot } from '../../../types';

/** Module sources under a folder path (or `[path]` for a file); empty when unknown. */
export function getCruiseSourcesUnder(snapshot: CruiseSnapshot, path: string): string[] {
  const node = snapshot.nodes.get(path);
  if (node == null) {
    return [];
  }
  if (!node.isFolder) {
    return node.path === path ? [path] : [];
  }
  return node.descendantFiles;
}
