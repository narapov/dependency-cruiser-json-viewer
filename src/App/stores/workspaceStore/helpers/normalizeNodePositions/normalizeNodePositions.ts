import type { WorkspaceState } from '../../types';

type PositionMap = Record<string, Record<string, { x: number; y: number } | undefined>>;

/** Collapse empty position maps to `null`. */
export function normalizeNodePositions(nodePositions: PositionMap | null | undefined): WorkspaceState['nodePositions'] {
  if (nodePositions == null) {
    return null;
  }

  const entries = Object.entries(nodePositions)
    .map(([groupId, children]) => {
      const filteredChildren = Object.fromEntries(Object.entries(children).filter(([, position]) => position != null));
      if (Object.keys(filteredChildren).length === 0) {
        return null;
      }
      return [groupId, filteredChildren] as const;
    })
    .filter((entry): entry is readonly [string, Record<string, { x: number; y: number }>] => entry != null);

  if (entries.length === 0) {
    return null;
  }

  return Object.fromEntries(entries);
}
