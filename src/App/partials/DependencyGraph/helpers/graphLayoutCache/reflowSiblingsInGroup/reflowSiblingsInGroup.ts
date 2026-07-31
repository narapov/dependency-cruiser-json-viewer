import type { Node } from '@xyflow/react';

import { getDirectChildren, GRID_GAP_X, GRID_GAP_Y } from '../../buildGraph';
import { nodesOverlap } from '../nodesOverlap';
import { getNodeSize } from '../resolveGroupSize';
import type { GroupId, NodeSize } from '../types';

function getFixedChildIdsInGroup(
  groupId: GroupId,
  parentByNode: ReadonlyMap<string, string | null>,
  fixedNodeIds?: ReadonlySet<string>,
): ReadonlySet<string> | undefined {
  if (!fixedNodeIds || fixedNodeIds.size === 0) {
    return undefined;
  }

  const childFixed = new Set([...fixedNodeIds].filter(id => (parentByNode.get(id) ?? null) === groupId));

  return childFixed.size > 0 ? childFixed : undefined;
}

function pushAwayFromFixedNodes(
  siblings: Node[],
  nodeById: Map<string, Node>,
  fixedNodeIds: ReadonlySet<string>,
): boolean {
  let changed = false;

  siblings.forEach((current, i) => {
    if (fixedNodeIds.has(current.id)) {
      return;
    }

    const currentSize = getNodeSize(current);
    const verticallyPushed = siblings.reduce(
      (position, fixed) => {
        if (!fixedNodeIds.has(fixed.id)) {
          return position;
        }

        const fixedSize = getNodeSize(fixed);
        return nodesOverlap(position, currentSize, fixed.position, fixedSize)
          ? {
              x: position.x,
              y: fixed.position.y + fixedSize.height + GRID_GAP_Y,
              changed: true,
            }
          : position;
      },
      { ...current.position, changed: false },
    );
    const pushed = siblings.reduce((position, fixed) => {
      if (!fixedNodeIds.has(fixed.id)) {
        return position;
      }

      const fixedSize = getNodeSize(fixed);
      return nodesOverlap(position, currentSize, fixed.position, fixedSize)
        ? {
            x: fixed.position.x + fixedSize.width + GRID_GAP_X,
            y: Math.max(position.y, fixed.position.y),
            changed: true,
          }
        : position;
    }, verticallyPushed);
    const { x, y } = pushed;

    if (x !== current.position.x || y !== current.position.y) {
      nodeById.set(current.id, { ...current, position: { x, y } });
      siblings[i] = nodeById.get(current.id)!;
      changed = true;
      return;
    }

    changed = changed || pushed.changed;
  });

  return changed;
}

function checkHorizontalOverlapWithFixedNodes(
  fixedNodeIds: ReadonlySet<string> | undefined,
  siblings: Node[],
  index: number,
  nodeById: Map<string, Node>,
  x: number,
  y: number,
  size: NodeSize,
): { x: number; y: number; changed: boolean } {
  if (!fixedNodeIds || fixedNodeIds.size === 0) {
    return { x, y, changed: false };
  }

  return [...fixedNodeIds].reduce<{ x: number; y: number; changed: boolean }>(
    (result, fixedNodeId) => {
      const fixedIndex = siblings.findIndex(sibling => sibling.id === fixedNodeId);
      if (fixedIndex < 0 || fixedIndex < index) {
        return result;
      }

      const fixed = nodeById.get(fixedNodeId);
      if (!fixed) {
        return result;
      }

      const fixedSize = getNodeSize(fixed);
      return nodesOverlap(result, size, fixed.position, fixedSize)
        ? {
            x: fixed.position.x + fixedSize.width + GRID_GAP_X,
            y: Math.max(result.y, fixed.position.y),
            changed: true,
          }
        : result;
    },
    { x, y, changed: false },
  );
}

function checkVerticalOverlapWithFixedNodes(
  fixedNodeIds: ReadonlySet<string> | undefined,
  siblings: Node[],
  index: number,
  nodeById: Map<string, Node>,
  x: number,
  y: number,
  size: NodeSize,
): { y: number; changed: boolean } {
  if (!fixedNodeIds || fixedNodeIds.size === 0) {
    return { y, changed: false };
  }

  return [...fixedNodeIds].reduce<{ y: number; changed: boolean }>(
    (result, fixedNodeId) => {
      const fixedIndex = siblings.findIndex(sibling => sibling.id === fixedNodeId);
      if (fixedIndex < 0 || fixedIndex < index) {
        return result;
      }

      const fixed = nodeById.get(fixedNodeId);
      if (!fixed) {
        return result;
      }

      const fixedSize = getNodeSize(fixed);
      return nodesOverlap({ x, y: result.y }, size, fixed.position, fixedSize)
        ? {
            y: fixed.position.y + fixedSize.height + GRID_GAP_Y,
            changed: true,
          }
        : result;
    },
    { y, changed: false },
  );
}

/** Pushes non-fixed siblings apart within a group until overlaps are resolved. */
export function reflowSiblingsInGroup(
  groupId: GroupId,
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
  fixedNodeIds?: ReadonlySet<string>,
): boolean {
  const nodeIds = new Set(nodeById.keys());
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
  if (childIds.length <= 1) {
    return false;
  }

  const childFixedIds = getFixedChildIdsInGroup(groupId, parentByNode, fixedNodeIds);

  const siblings = childIds
    .map(id => nodeById.get(id)!)
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

  let changed = childFixedIds ? pushAwayFromFixedNodes(siblings, nodeById, childFixedIds) : false;

  // First pass: push down when siblings overlap.
  siblings.forEach((current, i) => {
    if (childFixedIds?.has(current.id)) {
      return;
    }

    const currentSize = getNodeSize(current);
    const { x } = current.position;
    const verticalResult = siblings.slice(0, i).reduce(
      (result, other) => {
        const otherSize = getNodeSize(other);
        return nodesOverlap({ x, y: result.y }, currentSize, other.position, otherSize)
          ? { y: other.position.y + otherSize.height + GRID_GAP_Y, changed: true }
          : result;
      },
      { y: current.position.y, changed: false },
    );

    const fixedCheck = checkVerticalOverlapWithFixedNodes(
      childFixedIds,
      siblings,
      i,
      nodeById,
      x,
      verticalResult.y,
      currentSize,
    );
    const y = fixedCheck.y;

    if (y !== current.position.y) {
      nodeById.set(current.id, {
        ...current,
        position: { x, y },
      });
      siblings[i] = nodeById.get(current.id)!;
      changed = true;
      return;
    }
    changed = changed || verticalResult.changed || fixedCheck.changed;
  });

  // Second pass: push right when vertical overflow still causes overlap.
  siblings.forEach((current, i) => {
    if (childFixedIds?.has(current.id)) {
      return;
    }

    const currentSize = getNodeSize(current);
    const horizontalResult = siblings.slice(0, i).reduce(
      (result, other) => {
        const otherSize = getNodeSize(other);
        return nodesOverlap(result, currentSize, other.position, otherSize)
          ? {
              x: other.position.x + otherSize.width + GRID_GAP_X,
              y: Math.max(result.y, other.position.y),
              changed: true,
            }
          : result;
      },
      { ...current.position, changed: false },
    );

    const fixedCheck = checkHorizontalOverlapWithFixedNodes(
      childFixedIds,
      siblings,
      i,
      nodeById,
      horizontalResult.x,
      horizontalResult.y,
      currentSize,
    );
    const { x, y } = fixedCheck;

    if (x !== current.position.x || y !== current.position.y) {
      nodeById.set(current.id, {
        ...current,
        position: { x, y },
      });
      siblings[i] = nodeById.get(current.id)!;
      changed = true;
      return;
    }
    changed = changed || horizontalResult.changed || fixedCheck.changed;
  });

  return changed;
}
