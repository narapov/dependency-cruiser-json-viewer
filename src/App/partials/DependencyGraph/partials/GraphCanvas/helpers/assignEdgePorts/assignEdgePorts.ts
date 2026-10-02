import type { EdgePort, EdgePorts } from '../../types';
import { getAbsoluteNodePosition } from '../graphLayoutCache/getAbsoluteNodePosition';

/** Node geometry used when assigning build-time edge ports. */
export interface AssignEdgePortsNode {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

/** Edge endpoints used when assigning build-time edge ports. */
export interface AssignEdgePortsEdge {
  id: string;
  source: string;
  target: string;
}

interface AbsoluteCenter {
  id: string;
  centerY: number;
}

/** Relative port Y for slot `index` among `count` ports on a side of height `height`. */
export function edgePortY(index: number, count: number, height: number): number {
  return ((index + 1) / (count + 1)) * height;
}

/**
 * Assigns port indices so slots run top-to-bottom by the opposite endpoint's absolute center Y.
 * Incoming (WEST) edges sort by source Y; outgoing (EAST) by target Y.
 */
function assignPortIndicesByOppositeY(
  routedEdges: readonly AssignEdgePortsEdge[],
  centerById: ReadonlyMap<string, AbsoluteCenter>,
): { eastIndexByEdgeId: Map<string, number>; westIndexByEdgeId: Map<string, number> } {
  const outgoingBySource = new Map<string, AssignEdgePortsEdge[]>();
  const incomingByTarget = new Map<string, AssignEdgePortsEdge[]>();

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
 * Assigns frozen EAST/WEST ports for every edge whose endpoints exist in `nodes`.
 * Slots are ordered top-to-bottom by the opposite node's absolute center Y.
 */
export function assignEdgePorts(input: {
  nodes: readonly AssignEdgePortsNode[];
  edges: readonly AssignEdgePortsEdge[];
  parentByNode: ReadonlyMap<string, string | null>;
}): Map<string, EdgePorts> {
  const { nodes, edges, parentByNode } = input;
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const nodeIds = new Set(nodeById.keys());

  const centerById = new Map<string, AbsoluteCenter>();
  nodes.forEach(node => {
    const absolute = getAbsoluteNodePosition(node.id, nodeById, parentByNode);
    centerById.set(node.id, {
      id: node.id,
      centerY: absolute.y + node.height / 2,
    });
  });

  const routedEdges = edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  const { eastIndexByEdgeId, westIndexByEdgeId } = assignPortIndicesByOppositeY(routedEdges, centerById);

  const eastPortCount = new Map<string, number>();
  const westPortCount = new Map<string, number>();
  routedEdges.forEach(edge => {
    const eastIndex = eastIndexByEdgeId.get(edge.id)!;
    const westIndex = westIndexByEdgeId.get(edge.id)!;
    eastPortCount.set(edge.source, Math.max(eastPortCount.get(edge.source) ?? 0, eastIndex + 1));
    westPortCount.set(edge.target, Math.max(westPortCount.get(edge.target) ?? 0, westIndex + 1));
  });

  const edgePortsById = new Map<string, EdgePorts>();
  routedEdges.forEach(edge => {
    const sourceNode = nodeById.get(edge.source)!;
    const targetNode = nodeById.get(edge.target)!;
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

    edgePortsById.set(edge.id, { source, target });
  });

  return edgePortsById;
}
