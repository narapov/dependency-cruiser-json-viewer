import type { GraphLayoutState, SerializedLayoutCache } from '../../../../types';

/**
 * Converts legacy position-only maps into a serialized layout cache.
 */
export function legacyPositionsToLayouts(
  nodePositions: Record<string, Record<string, { x: number; y: number } | undefined>> | null,
): SerializedLayoutCache {
  if (!nodePositions) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(nodePositions).map(([groupId, children]) => [
      groupId,
      {
        id: groupId,
        children: Object.fromEntries(
          Object.entries(children)
            .filter((entry): entry is [string, { x: number; y: number }] => entry[1] != null)
            .map(([childId, position]) => [childId, { id: childId, position }]),
        ),
      },
    ]),
  );
}

/**
 * Flattens group layouts back to legacy position maps for workspace persistence.
 */
export function layoutsToLegacyPositions(nodeLayouts: SerializedLayoutCache): GraphLayoutState['nodePositions'] {
  return Object.fromEntries(
    Object.entries(nodeLayouts).map(([groupId, entry]) => [
      groupId,
      Object.fromEntries(Object.entries(entry.children).map(([childId, child]) => [childId, { ...child.position }])),
    ]),
  );
}
