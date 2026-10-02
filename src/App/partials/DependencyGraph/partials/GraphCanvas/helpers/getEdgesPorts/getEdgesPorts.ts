import { indexTreeByKey, type VisibleTreeEdge } from '@/domain';

import type { EdgePort, EdgePorts, VisibleTreeLayoutedNode } from '../../types';

interface AbsoluteCenter {
  id: string;
  centerY: number;
}

interface PortEdge {
  id: string;
  source: string;
  target: string;
}

/** Relative port Y for slot `index` among `count` ports on a side of height `height`. */
export function edgePortY(index: number, count: number, height: number): number {
  return ((index + 1) / (count + 1)) * height;
}

/** Absolute canvas position from relative geometry + ancestors (nearest → root). */
function absolutePositionFromLayouted(
  node: VisibleTreeLayoutedNode,
  nodeByPath: ReadonlyMap<string, VisibleTreeLayoutedNode>,
): { x: number; y: number } {
  return node.ancestors.reduce(
    (pos, ancestorPath) => {
      const ancestor = nodeByPath.get(ancestorPath);
      return ancestor ? { x: pos.x + ancestor.position.x, y: pos.y + ancestor.position.y } : pos;
    },
    { x: node.position.x, y: node.position.y },
  );
}

/**
 * Assigns port indices so slots run top-to-bottom by the opposite endpoint's absolute center Y.
 * Incoming (WEST) edges sort by source Y; outgoing (EAST) by target Y.
 */
function assignPortIndicesByOppositeY(
  routedEdges: readonly PortEdge[],
  centerById: ReadonlyMap<string, AbsoluteCenter>,
): { eastIndexByEdgeId: Map<string, number>; westIndexByEdgeId: Map<string, number> } {
  const outgoingBySource = new Map<string, PortEdge[]>();
  const incomingByTarget = new Map<string, PortEdge[]>();

  routedEdges.forEach(edge => {
    const outgoing = outgoingBySource.get(edge.source);
    if (outgoing) {
      outgoing.push(edge);
    } else {
      outgoingBySource.set(edge.source, [edge]);
    }

    const incoming = incomingByTarget.get(edge.target);
    if (incoming) {
      incoming.push(edge);
    } else {
      incomingByTarget.set(edge.target, [edge]);
    }
  });

  const eastIndexByEdgeId = new Map<string, number>();
  const westIndexByEdgeId = new Map<string, number>();

  outgoingBySource.forEach(group => {
    group
      .toSorted((a, b) => {
        const aY = centerById.get(a.target)!.centerY;
        const bY = centerById.get(b.target)!.centerY;
        return aY - bY || a.id.localeCompare(b.id);
      })
      .forEach((edge, index) => {
        eastIndexByEdgeId.set(edge.id, index);
      });
  });

  incomingByTarget.forEach(group => {
    group
      .toSorted((a, b) => {
        const aY = centerById.get(a.source)!.centerY;
        const bY = centerById.get(b.source)!.centerY;
        return aY - bY || a.id.localeCompare(b.id);
      })
      .forEach((edge, index) => {
        westIndexByEdgeId.set(edge.id, index);
      });
  });

  return { eastIndexByEdgeId, westIndexByEdgeId };
}

/**
 * Computes frozen EAST/WEST ports for every edge whose endpoints exist in the layouted tree.
 * Slots are ordered top-to-bottom by the opposite node's absolute center Y (via ancestors).
 */
export function getEdgesPorts(
  layoutedTree: readonly VisibleTreeLayoutedNode[],
  edges: readonly VisibleTreeEdge[],
): Map<string, EdgePorts> {
  const nodeByPath = indexTreeByKey(layoutedTree, node => node.path);
  const nodeIds = new Set(nodeByPath.keys());

  const centerById = new Map<string, AbsoluteCenter>();
  nodeByPath.forEach(node => {
    const absolute = absolutePositionFromLayouted(node, nodeByPath);
    centerById.set(node.path, {
      id: node.path,
      centerY: absolute.y + node.height / 2,
    });
  });

  const routedEdges: PortEdge[] = edges
    .filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map(edge => ({
      id: edge.key,
      source: edge.source,
      target: edge.target,
    }));

  const { eastIndexByEdgeId, westIndexByEdgeId } = assignPortIndicesByOppositeY(routedEdges, centerById);

  const eastPortCount = new Map<string, number>();
  const westPortCount = new Map<string, number>();
  routedEdges.forEach(edge => {
    const eastIndex = eastIndexByEdgeId.get(edge.id)!;
    const westIndex = westIndexByEdgeId.get(edge.id)!;
    eastPortCount.set(edge.source, Math.max(eastPortCount.get(edge.source) ?? 0, eastIndex + 1));
    westPortCount.set(edge.target, Math.max(westPortCount.get(edge.target) ?? 0, westIndex + 1));
  });

  const edgesPorts = new Map<string, EdgePorts>();
  routedEdges.forEach(edge => {
    const sourceNode = nodeByPath.get(edge.source)!;
    const targetNode = nodeByPath.get(edge.target)!;
    const eastIndex = eastIndexByEdgeId.get(edge.id)!;
    const westIndex = westIndexByEdgeId.get(edge.id)!;
    const eastCount = eastPortCount.get(edge.source)!;
    const westCount = westPortCount.get(edge.target)!;

    const source: EdgePort = {
      side: 'east',
      index: eastIndex,
      y: edgePortY(eastIndex, eastCount, sourceNode.height),
    };
    const target: EdgePort = {
      side: 'west',
      index: westIndex,
      y: edgePortY(westIndex, westCount, targetNode.height),
    };

    edgesPorts.set(edge.id, { source, target });
  });

  return edgesPorts;
}
