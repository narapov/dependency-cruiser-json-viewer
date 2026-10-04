import type { CruisePathNode } from '../../../types';

/** Resolve folder nodes from snapshot paths; missing and non-folder entries are omitted. */
export function resolveFolderNodes(
  nodes: ReadonlyMap<string, CruisePathNode>,
  paths: readonly string[],
): CruisePathNode[] {
  return paths.map(path => nodes.get(path)).filter((node): node is CruisePathNode => node?.isFolder === true);
}
