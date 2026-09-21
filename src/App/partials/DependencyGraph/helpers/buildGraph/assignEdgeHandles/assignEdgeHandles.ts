import type { Edge, Node } from '@xyflow/react';

import { LEAF_NODE_HEIGHT } from '../../getLeafNodeSize';

/** Max source/target handles rendered per node side. */
export const MAX_HANDLES_PER_SIDE = 5;

/** Absolute vertical center of a node, walking parent position offsets. */
function getAbsoluteCenterY(nodeId: string, nodeById: Map<string, Node>): number {
  const node = nodeById.get(nodeId);
  if (!node) {
    return 0;
  }

  let absY = node.position.y;
  let parentId = node.parentId;
  while (parentId) {
    const parent = nodeById.get(parentId);
    if (!parent) {
      break;
    }
    absY += parent.position.y;
    parentId = parent.parentId;
  }

  const height = typeof node.height === 'number' ? node.height : LEAF_NODE_HEIGHT;
  return absY + height / 2;
}

/** Round-robin handle slot in `0..MAX_HANDLES_PER_SIDE-1`. */
function handleSlotIndex(index: number): number {
  return index % MAX_HANDLES_PER_SIDE;
}

/**
 * Assigns dumb index handles after layout: `sourceHandle`/`targetHandle` = `out-i` / `in-j`
 * (capped at {@link MAX_HANDLES_PER_SIDE} via round-robin), and stamps handle counts
 * only on nodes with degree > 0.
 *
 * @example
 * const { nodes, edges } = assignEdgeHandles(layoutedNodes, builtEdges);
 */
export function assignEdgeHandles(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const nodeById = new Map(nodes.map(node => [node.id, node]));

  const outgoingByNode = new Map<string, Edge[]>();
  const incomingByNode = new Map<string, Edge[]>();

  edges.forEach(edge => {
    const outgoing = outgoingByNode.get(edge.source);
    if (outgoing) {
      outgoing.push(edge);
    } else {
      outgoingByNode.set(edge.source, [edge]);
    }

    const incoming = incomingByNode.get(edge.target);
    if (incoming) {
      incoming.push(edge);
    } else {
      incomingByNode.set(edge.target, [edge]);
    }
  });

  const sourceHandleByEdgeId = new Map<string, string>();
  const targetHandleByEdgeId = new Map<string, string>();
  const countsByNodeId = new Map<string, { incomingHandleCount: number; outgoingHandleCount: number }>();

  nodeById.forEach((_, nodeId) => {
    const outgoing = [...(outgoingByNode.get(nodeId) ?? [])].sort(
      (a, b) => getAbsoluteCenterY(a.target, nodeById) - getAbsoluteCenterY(b.target, nodeById),
    );
    const incoming = [...(incomingByNode.get(nodeId) ?? [])].sort(
      (a, b) => getAbsoluteCenterY(a.source, nodeById) - getAbsoluteCenterY(b.source, nodeById),
    );

    if (outgoing.length === 0 && incoming.length === 0) {
      return;
    }

    outgoing.forEach((edge, index) => {
      sourceHandleByEdgeId.set(edge.id, `out-${handleSlotIndex(index)}`);
    });
    incoming.forEach((edge, index) => {
      targetHandleByEdgeId.set(edge.id, `in-${handleSlotIndex(index)}`);
    });

    countsByNodeId.set(nodeId, {
      incomingHandleCount: Math.min(incoming.length, MAX_HANDLES_PER_SIDE),
      outgoingHandleCount: Math.min(outgoing.length, MAX_HANDLES_PER_SIDE),
    });
  });

  const assignedEdges = edges.map(edge => ({
    ...edge,
    sourceHandle: sourceHandleByEdgeId.get(edge.id) ?? 'out-0',
    targetHandle: targetHandleByEdgeId.get(edge.id) ?? 'in-0',
  }));

  const nodesWithHandles = nodes.map(node => {
    const counts = countsByNodeId.get(node.id);
    if (!counts) {
      return node;
    }

    return {
      ...node,
      data: {
        ...node.data,
        ...counts,
      },
    };
  });

  return { nodes: nodesWithHandles, edges: assignedEdges };
}
