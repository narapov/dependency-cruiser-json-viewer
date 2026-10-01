import type { Edge, Node } from '@xyflow/react';

import type { DependencyEdgeData } from '../../../types';
import { getAbsoluteNodePosition, getNodeSize } from '../../graphLayoutCache';

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
  children?: LibavoidElkNode[];
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

/** Global EAST/WEST port indices shared across flat, hierarchical, and overlap passes. */
export interface LibavoidPortAssignment {
  eastIndexByEdgeId: Map<string, number>;
  westIndexByEdgeId: Map<string, number>;
  eastPortCount: Map<string, number>;
  westPortCount: Map<string, number>;
}

const PORT_SIZE = 1;

interface AbsoluteCenter {
  id: string;
  centerY: number;
}

function portY(index: number, count: number, height: number): number {
  return ((index + 1) / (count + 1)) * height;
}

/**
 * Assigns port indices so slots run top-to-bottom by the opposite endpoint's absolute center Y.
 * Incoming (WEST) edges sort by source Y; outgoing (EAST) by target Y.
 */
function assignPortIndicesByOppositeY(
  routedEdges: readonly Edge[],
  centerById: ReadonlyMap<string, AbsoluteCenter>,
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

function buildPorts(
  nodeId: string,
  width: number,
  height: number,
  eastCount: number,
  westCount: number,
): LibavoidPort[] {
  return [
    ...Array.from({ length: westCount }, (_, portIndex) => ({
      id: `${nodeId}:W${portIndex}`,
      x: 0,
      y: portY(portIndex, westCount, height),
      width: PORT_SIZE,
      height: PORT_SIZE,
    })),
    ...Array.from({ length: eastCount }, (_, portIndex) => ({
      id: `${nodeId}:E${portIndex}`,
      x: width,
      y: portY(portIndex, eastCount, height),
      width: PORT_SIZE,
      height: PORT_SIZE,
    })),
  ];
}

function buildChildrenByParent(
  nodes: readonly Node[],
  parentByNode: ReadonlyMap<string, string | null>,
): Map<string | null, Node[]> {
  const childrenByParent = new Map<string | null, Node[]>();
  nodes.forEach(node => {
    const parentId = parentByNode.get(node.id) ?? null;
    const siblings = childrenByParent.get(parentId);
    if (siblings) {
      siblings.push(node);
    } else {
      childrenByParent.set(parentId, [node]);
    }
  });
  childrenByParent.forEach(siblings => {
    siblings.sort((a, b) => a.id.localeCompare(b.id));
  });
  return childrenByParent;
}

function collectEdgeEndpoints(edges: readonly Edge[]): Set<string> {
  return new Set(edges.flatMap(edge => [edge.source, edge.target]));
}

/**
 * Memoized: whether `nodeId` or any descendant is an edge endpoint for the current batch.
 * Used to collapse folderGroups whose interiors are irrelevant to routing.
 */
function createSubtreeContainsEndpoint(
  endpoints: ReadonlySet<string>,
  childrenByParent: ReadonlyMap<string | null, Node[]>,
): (nodeId: string) => boolean {
  const cache = new Map<string, boolean>();

  const contains = (nodeId: string): boolean => {
    const cached = cache.get(nodeId);
    if (cached !== undefined) {
      return cached;
    }
    if (endpoints.has(nodeId)) {
      cache.set(nodeId, true);
      return true;
    }
    const result = (childrenByParent.get(nodeId) ?? []).some(child => contains(child.id));
    cache.set(nodeId, result);
    return result;
  };

  return contains;
}

function edgesWithAssignedPorts(edges: readonly Edge[], ports: LibavoidPortAssignment): LibavoidElkEdge[] {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourcePort: `${edge.source}:E${ports.eastIndexByEdgeId.get(edge.id)!}`,
    targetPort: `${edge.target}:W${ports.westIndexByEdgeId.get(edge.id)!}`,
  }));
}

/**
 * Builds a libavoid port assignment from build-time ports on edge data.
 * Returns `null` when any edge is missing source/target ports (caller should re-assign).
 */
export function libavoidPortAssignmentFromEdgeData(edges: readonly Edge[]): LibavoidPortAssignment | null {
  const eastIndexByEdgeId = new Map<string, number>();
  const westIndexByEdgeId = new Map<string, number>();
  const eastPortCount = new Map<string, number>();
  const westPortCount = new Map<string, number>();

  for (const edge of edges) {
    const data = edge.data as DependencyEdgeData | undefined;
    const sourcePort = data?.sourcePort;
    const targetPort = data?.targetPort;
    if (!sourcePort || !targetPort || sourcePort.side !== 'east' || targetPort.side !== 'west') {
      return null;
    }

    eastIndexByEdgeId.set(edge.id, sourcePort.index);
    westIndexByEdgeId.set(edge.id, targetPort.index);
    eastPortCount.set(edge.source, Math.max(eastPortCount.get(edge.source) ?? 0, sourcePort.index + 1));
    westPortCount.set(edge.target, Math.max(westPortCount.get(edge.target) ?? 0, targetPort.index + 1));
  }

  return { eastIndexByEdgeId, westIndexByEdgeId, eastPortCount, westPortCount };
}

/**
 * Assigns global EAST/WEST ports for all routable edges (п1).
 * Port slots are ordered top-to-bottom by the opposite node's absolute center Y.
 */
export function assignLibavoidPorts(
  nodes: readonly Node[],
  edges: readonly Edge[],
  parentByNode: ReadonlyMap<string, string | null>,
): LibavoidPortAssignment {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const nodeIds = new Set(nodeById.keys());

  const centerById = new Map<string, AbsoluteCenter>();
  nodes.forEach(node => {
    const size = getNodeSize(node);
    const absolute = getAbsoluteNodePosition(node.id, nodeById, parentByNode);
    centerById.set(node.id, {
      id: node.id,
      centerY: absolute.y + size.height / 2,
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

  return { eastIndexByEdgeId, westIndexByEdgeId, eastPortCount, westPortCount };
}

/**
 * Prefers build-time edge ports when every edge carries them; otherwise assigns at route time.
 */
export function resolveLibavoidPortAssignment(
  nodes: readonly Node[],
  edges: readonly Edge[],
  parentByNode: ReadonlyMap<string, string | null>,
): LibavoidPortAssignment {
  return libavoidPortAssignmentFromEdgeData(edges) ?? assignLibavoidPorts(nodes, edges, parentByNode);
}

/**
 * Flat one-level graph for a folder: direct children as opaque boxes (folderGroup without nested children).
 * Positions are absolute canvas coords so returned routes match RF space.
 */
export function buildFlatLibavoidGraph(input: {
  parentId: string | null;
  nodes: readonly Node[];
  edges: readonly Edge[];
  parentByNode: ReadonlyMap<string, string | null>;
  ports: LibavoidPortAssignment;
}): LibavoidElkGraph {
  const { parentId, nodes, edges, parentByNode, ports } = input;
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const children = nodes.filter(node => (parentByNode.get(node.id) ?? null) === parentId);

  const elkChildren = children.map(node => {
    const size = getNodeSize(node);
    const absolute = getAbsoluteNodePosition(node.id, nodeById, parentByNode);
    const eastCount = ports.eastPortCount.get(node.id) ?? 0;
    const westCount = ports.westPortCount.get(node.id) ?? 0;
    const nodePorts = buildPorts(node.id, size.width, size.height, eastCount, westCount);

    return {
      id: node.id,
      x: absolute.x,
      y: absolute.y,
      width: size.width,
      height: size.height,
      ...(nodePorts.length > 0 ? { ports: nodePorts } : {}),
    };
  });

  return {
    id: parentId === null ? 'root' : `flat:${parentId}`,
    children: elkChildren,
    edges: edgesWithAssignedPorts(edges, ports),
  };
}

/**
 * Hierarchical subgraph for a folder (or whole canvas when `parentId` is null).
 * Nested folderGroups keep RF-relative child coords; the subtree root uses absolute position.
 *
 * FolderGroups whose subtree contains no endpoint of `edges` are emitted as opaque boxes
 * (no children) so libavoid does not search inside irrelevant expanded folders.
 */
export function buildHierarchicalLibavoidGraph(input: {
  parentId: string | null;
  nodes: readonly Node[];
  edges: readonly Edge[];
  parentByNode: ReadonlyMap<string, string | null>;
  ports: LibavoidPortAssignment;
}): LibavoidElkGraph {
  const { parentId, nodes, edges, parentByNode, ports } = input;
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const childrenByParent = buildChildrenByParent(nodes, parentByNode);
  const endpoints = collectEdgeEndpoints(edges);
  const subtreeContainsEndpoint = createSubtreeContainsEndpoint(endpoints, childrenByParent);

  const buildElkNode = (node: Node, absoluteTopLevel: boolean): LibavoidElkNode => {
    const size = getNodeSize(node);
    const eastCount = ports.eastPortCount.get(node.id) ?? 0;
    const westCount = ports.westPortCount.get(node.id) ?? 0;
    const nodePorts = buildPorts(node.id, size.width, size.height, eastCount, westCount);
    const childNodes = childrenByParent.get(node.id) ?? [];
    // Expand only when a child subtree holds an endpoint; otherwise keep an opaque folder box.
    const expandChildren = childNodes.some(child => subtreeContainsEndpoint(child.id));
    const nestedChildren = expandChildren ? childNodes.map(child => buildElkNode(child, false)) : [];
    const position = absoluteTopLevel
      ? getAbsoluteNodePosition(node.id, nodeById, parentByNode)
      : { x: node.position.x, y: node.position.y };

    return {
      id: node.id,
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      ...(nodePorts.length > 0 ? { ports: nodePorts } : {}),
      ...(nestedChildren.length > 0 ? { children: nestedChildren } : {}),
    };
  };

  const topLevel = (childrenByParent.get(parentId) ?? []).map(node => buildElkNode(node, true));

  return {
    id: parentId === null ? 'root' : `hier:${parentId}`,
    children: topLevel,
    edges: edgesWithAssignedPorts(edges, ports),
  };
}

/**
 * Builds a hierarchical ELK JSON graph for whole-graph libavoid routing.
 * Expanded `folderGroup` nodes become containers (children nested with RF-relative coords).
 * All edges hang on the root; EAST/WEST ports come from edge data when present.
 */
export function nodesToLibavoidGraph(
  nodes: readonly Node[],
  edges: readonly Edge[],
  parentByNode: ReadonlyMap<string, string | null>,
): LibavoidElkGraph {
  const nodeIds = new Set(nodes.map(node => node.id));
  const routedEdges = edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  const ports = resolveLibavoidPortAssignment(nodes, routedEdges, parentByNode);
  return buildHierarchicalLibavoidGraph({
    parentId: null,
    nodes,
    edges: routedEdges,
    parentByNode,
    ports,
  });
}
