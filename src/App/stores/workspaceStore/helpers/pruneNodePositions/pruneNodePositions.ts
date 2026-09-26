import { collectFolderPaths } from '@/domain';

import type { WorkspaceState } from '../../types';
import { normalizeNodePositions } from '../normalizeNodePositions';

/** Drop position entries whose group or child is no longer in the filtered graph. */
export function pruneNodePositions(
  nodePositions: WorkspaceState['nodePositions'],
  sources: readonly string[],
): WorkspaceState['nodePositions'] {
  if (nodePositions == null) {
    return null;
  }

  const validPaths = new Set([...sources, ...collectFolderPaths([...sources])]);
  const filtered = Object.fromEntries(
    Object.entries(nodePositions)
      .map(([groupId, children]) => {
        const groupOk = groupId === '' || validPaths.has(groupId);
        if (!groupOk || children == null) {
          return null;
        }
        const filteredChildren = Object.fromEntries(
          Object.entries(children).filter(([childId, position]) => position != null && validPaths.has(childId)),
        );
        if (Object.keys(filteredChildren).length === 0) {
          return null;
        }
        return [groupId, filteredChildren] as const;
      })
      .filter((entry): entry is readonly [string, Record<string, { x: number; y: number }>] => entry != null),
  );

  return normalizeNodePositions(filtered);
}
