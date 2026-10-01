/** Priority tiers that boost or demote path search ranking. */
export const PathSearchTier = {
  Src: 0,
  Lib: 1,
  Other: 2,
  NodeModules: 3,
} as const;

/** Numeric value of a path search ranking tier. */
export type PathSearchTier = (typeof PathSearchTier)[keyof typeof PathSearchTier];

function pathHasFolderSegment(path: string, ancestors: readonly string[], segment: string): boolean {
  if (path === segment) {
    return true;
  }
  return ancestors.some(ancestor => ancestor === segment || ancestor.endsWith(`/${segment}`));
}

/** Maps a path and its ancestors to a ranking tier from snapshot topology. */
export function getPathSearchTier(path: string, ancestors: readonly string[]): PathSearchTier {
  if (pathHasFolderSegment(path, ancestors, 'node_modules')) {
    return PathSearchTier.NodeModules;
  }
  if (pathHasFolderSegment(path, ancestors, 'src')) {
    return PathSearchTier.Src;
  }
  if (pathHasFolderSegment(path, ancestors, 'lib')) {
    return PathSearchTier.Lib;
  }
  return PathSearchTier.Other;
}
