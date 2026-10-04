import type { CruiseSnapshot } from '@/domain';

/**
 * Union of the given paths with each path's ancestor folders (for PathSearch `allowedPaths`).
 */
export function expandPathsWithAncestors(paths: readonly string[], cruiseSnapshot: CruiseSnapshot): string[] {
  return [
    ...new Set(
      paths.flatMap(path => {
        const ancestors = cruiseSnapshot.nodes.get(path)?.ancestors ?? [];
        return [path, ...ancestors];
      }),
    ),
  ];
}
