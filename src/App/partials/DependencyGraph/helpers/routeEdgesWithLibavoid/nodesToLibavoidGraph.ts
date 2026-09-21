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

function nextPortIndex(counts: Map<string, number>, nodeId: string): number {
  const index = counts.get(nodeId) ?? 0;
  counts.set(nodeId, index + 1);
  return index;
}

function portY(index: number, count: number, height: number): number {
  return ((index + 1) / (count + 1)) * height;
}

/**
 * Builds a flat ELK JSON graph for libavoid: absolute leaf obstacles and RF edges.
 * Folder groups are omitted so routes can pass through container interiors.
 * Each edge gets a dedicated EAST source port and WEST target port (layered RIGHT).
 */
export function nodesToLibavoidGraph(
  nodes: readonly Node[],
  edges: readonly Edge[],
  parentByNode: ReadonlyMap<string, string | null>,
): LibavoidElkGraph {
  const nodeById = new Map(nodes.map(node => [node.id, node]));

  const sizedChildren = nodes
    .filter(node => node.type !== 'folderGroup')
    .map(node => {
      const size = getNodeSize(node);
      const absolute = getAbsoluteNodePosition(node.id, nodeById, parentByNode);
      return {
        id: node.id,
        x: absolute.x,
        y: absolute.y,
        width: size.width,
        height: size.height,
      };
    });

  const childIds = new Set(sizedChildren.map(child => child.id));
  const routedEdges = edges.filter(edge => childIds.has(edge.source) && childIds.has(edge.target));

  const eastPortCount = new Map<string, number>();
  const westPortCount = new Map<string, number>();

  const edgesWithPorts = routedEdges.map(edge => {
    const eastIndex = nextPortIndex(eastPortCount, edge.source);
    const westIndex = nextPortIndex(westPortCount, edge.target);
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
