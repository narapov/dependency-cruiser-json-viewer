import type { Edge, Node } from '@xyflow/react';

import { getAbsoluteNodePosition, getNodeSize } from '../graphLayoutCache';

export interface LibavoidPort {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LibavoidElkNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ports?: LibavoidPort[];
}

export interface LibavoidElkEdge {
  id: string;
  source: string;
  target: string;
  sourcePort: string;
  targetPort: string;
}

export interface LibavoidElkGraph {
  id: string;
  children: LibavoidElkNode[];
  edges: LibavoidElkEdge[];
}

const PORT_SIZE = 1;

interface SizedChild {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function portY(index: number, count: number, height: number): number {
  return ((index + 1) / (count + 1)) * height;
}

function centerY(child: SizedChild): number {
  return child.y + child.height / 2;
}

/**
 * Assigns port indices so slots run top-to-bottom by the opposite endpoint's center Y.
 * Incoming (WEST) edges sort by source Y; outgoing (EAST) by target Y.
 */
function assignPortIndicesByOppositeY(
  routedEdges: readonly Edge[],
  childById: ReadonlyMap<string, SizedChild>,
): { eastIndexByEdgeId: Map<string, number>; westIndexByEdgeId: Map<string, number> } {
  const outgoingBySource = new Map<string, Edge[]>();
  const incomingByTarget = new Map<string, Edge[]>();

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
        const aY = centerY(childById.get(a.target)!);
        const bY = centerY(childById.get(b.target)!);
        return aY - bY || a.id.localeCompare(b.id);
      })
      .forEach((edge, index) => {
        eastIndexByEdgeId.set(edge.id, index);
      });
  });

  incomingByTarget.forEach(group => {
    group
      .toSorted((a, b) => {
        const aY = centerY(childById.get(a.source)!);
        const bY = centerY(childById.get(b.source)!);
        return aY - bY || a.id.localeCompare(b.id);
      })
      .forEach((edge, index) => {
        westIndexByEdgeId.set(edge.id, index);
      });
  });

  return { eastIndexByEdgeId, westIndexByEdgeId };
}

/**
 * Builds a flat ELK JSON graph for one sibling routing level.
 * Obstacles are the level's direct children (including `folderGroup` rectangles).
 * `allNodes` supplies ancestors for absolute coordinates; defaults to `nodes`.
 * Each edge gets a dedicated EAST source port and WEST target port (layered RIGHT).
 * Port slots are ordered top-to-bottom by the opposite node's center Y.
 */
export function nodesToLibavoidGraph(
  nodes: readonly Node[],
  edges: readonly Edge[],
  parentByNode: ReadonlyMap<string, string | null>,
  allNodes: readonly Node[] = nodes,
): LibavoidElkGraph {
  const nodeById = new Map(allNodes.map(node => [node.id, node]));

  const sizedChildren = nodes.map(node => {
    const size = getNodeSize(node);
    const absolute = getAbsoluteNodePosition(node.id, nodeById, parentByNode);
    return {
      id: node.id,
      x: absolute.x,
      y: absolute.y,
      width: size.width,
      height: size.height,
    } satisfies SizedChild;
  });

  const childById = new Map(sizedChildren.map(child => [child.id, child]));
  const childIds = new Set(childById.keys());
  const routedEdges = edges.filter(edge => childIds.has(edge.source) && childIds.has(edge.target));

  const { eastIndexByEdgeId, westIndexByEdgeId } = assignPortIndicesByOppositeY(routedEdges, childById);

  const eastPortCount = new Map<string, number>();
  const westPortCount = new Map<string, number>();

  const edgesWithPorts = routedEdges.map(edge => {
    const eastIndex = eastIndexByEdgeId.get(edge.id)!;
    const westIndex = westIndexByEdgeId.get(edge.id)!;
    eastPortCount.set(edge.source, Math.max(eastPortCount.get(edge.source) ?? 0, eastIndex + 1));
    westPortCount.set(edge.target, Math.max(westPortCount.get(edge.target) ?? 0, westIndex + 1));
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourcePort: `${edge.source}:E${eastIndex}`,
      targetPort: `${edge.target}:W${westIndex}`,
    };
  });

  const children = sizedChildren.map(child => {
    const eastCount = eastPortCount.get(child.id) ?? 0;
    const westCount = westPortCount.get(child.id) ?? 0;
    const ports = [
      ...Array.from({ length: westCount }, (_, portIndex) => ({
        id: `${child.id}:W${portIndex}`,
        x: 0,
        y: portY(portIndex, westCount, child.height),
        width: PORT_SIZE,
        height: PORT_SIZE,
      })),
      ...Array.from({ length: eastCount }, (_, portIndex) => ({
        id: `${child.id}:E${portIndex}`,
        x: child.width,
        y: portY(portIndex, eastCount, child.height),
        width: PORT_SIZE,
        height: PORT_SIZE,
      })),
    ];

    return {
      ...child,
      ...(ports.length > 0 ? { ports } : {}),
    };
  });

  return {
    id: 'root',
    children,
    edges: edgesWithPorts,
  };
}
