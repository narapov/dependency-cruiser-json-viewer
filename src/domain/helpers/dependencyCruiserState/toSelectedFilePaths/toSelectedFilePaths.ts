import type { CruiseSnapshot } from '../../../types';

/** Map selected paths to file paths only: folders expand to their descendantFiles. */
export function toSelectedFilePaths(paths: readonly string[], cruiseSnapshot: CruiseSnapshot): string[] {
  const files = new Set<string>();

  paths.forEach(path => {
    const node = cruiseSnapshot.nodes.get(path);
    if (node == null) {
      return;
    }
    if (node.isFolder) {
      node.descendantFiles.forEach(file => {
        files.add(file);
      });
      return;
    }
    files.add(path);
  });

  return [...files];
}
