/** Minimal geometry needed to walk parent-relative positions to absolute canvas coords. */
export interface PositionedNode {
  position: { x: number; y: number };
}

/** Absolute canvas position for a node from stored relative positions. */
export function getAbsoluteNodePosition(
  nodeId: string,
  nodeById: ReadonlyMap<string, PositionedNode>,
  parentByNode: ReadonlyMap<string, string | null>,
): { x: number; y: number } {
  const node = nodeById.get(nodeId);
  if (!node) {
    return { x: 0, y: 0 };
  }

  const parentId = parentByNode.get(nodeId) ?? null;
  if (parentId === null) {
    return { ...node.position };
  }

  const parentAbs = getAbsoluteNodePosition(parentId, nodeById, parentByNode);
  return {
    x: parentAbs.x + node.position.x,
    y: parentAbs.y + node.position.y,
  };
}
