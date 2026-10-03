import type { ThinRoutingEdge, ThinRoutingNode } from '../../../types';

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

/** Absolute canvas position from relative geometry + ancestors (nearest → root). */
export function absolutePositionFromThin(
  node: ThinRoutingNode,
  nodeByPath: ReadonlyMap<string, ThinRoutingNode>,
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
  routedEdges: readonly ThinRoutingEdge[],
  centerById: ReadonlyMap<string, AbsoluteCenter>,
): { eastIndexByEdgeId: Map<string, number>; westIndexByEdgeId: Map<string, number> } {
  const outgoingBySource = new Map<string, ThinRoutingEdge[]>();
  const incomingByTarget = new Map<string, ThinRoutingEdge[]>();

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

/** Build children-by-parent index from enriched ancestors (session-local). */
export function buildChildrenByParentFromThin(
  nodeByPath: ReadonlyMap<string, ThinRoutingNode>,
): Map<string | null, ThinRoutingNode[]> {
  const childrenByParent = new Map<string | null, ThinRoutingNode[]>();

  nodeByPath.forEach(node => {
    const parentId = node.ancestors[0] ?? null;
    const siblings = childrenByParent.get(parentId);
    if (siblings) {
      siblings.push(node);
    } else {
      childrenByParent.set(parentId, [node]);
    }
  });

  childrenByParent.forEach(siblings => {
    siblings.sort((a, b) => a.path.localeCompare(b.path));
  });

  return childrenByParent;
}

function collectEdgeEndpoints(edges: readonly ThinRoutingEdge[]): Set<string> {
  return new Set(edges.flatMap(edge => [edge.source, edge.target]));
}

/** Whether this folder path or any descendant is an edge endpoint (uses precomputed descendants). */
function subtreeContainsEndpoint(node: ThinRoutingNode, endpoints: ReadonlySet<string>): boolean {
  if (endpoints.has(node.path)) {
    return true;
  }
  return node.descendants.some(path => endpoints.has(path));
}

function edgesWithAssignedPorts(edges: readonly ThinRoutingEdge[], ports: LibavoidPortAssignment): LibavoidElkEdge[] {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourcePort: `${edge.source}:E${ports.eastIndexByEdgeId.get(edge.id)!}`,
    targetPort: `${edge.target}:W${ports.westIndexByEdgeId.get(edge.id)!}`,
  }));
}

/**
 * Builds a libavoid port assignment from frozen ports on thin edges.
 * Returns `null` when any edge is missing source/target ports (caller should re-assign).
 */
export function libavoidPortAssignmentFromEdgeData(edges: readonly ThinRoutingEdge[]): LibavoidPortAssignment | null {
  const eastIndexByEdgeId = new Map<string, number>();
  const westIndexByEdgeId = new Map<string, number>();
  const eastPortCount = new Map<string, number>();
  const westPortCount = new Map<string, number>();

  for (const edge of edges) {
    const sourcePort = edge.sourcePort;
    const targetPort = edge.targetPort;
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
  nodeByPath: ReadonlyMap<string, ThinRoutingNode>,
  edges: readonly ThinRoutingEdge[],
): LibavoidPortAssignment {
  const centerById = new Map<string, AbsoluteCenter>();
  nodeByPath.forEach(node => {
    const absolute = absolutePositionFromThin(node, nodeByPath);
    centerById.set(node.path, {
      id: node.path,
      centerY: absolute.y + node.height / 2,
    });
  });

  const routedEdges = edges.filter(edge => nodeByPath.has(edge.source) && nodeByPath.has(edge.target));
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
 * Prefers frozen thin-edge ports when every edge carries them; otherwise assigns at route time.
 */
export function resolveLibavoidPortAssignment(
  nodeByPath: ReadonlyMap<string, ThinRoutingNode>,
  edges: readonly ThinRoutingEdge[],
): LibavoidPortAssignment {
  return libavoidPortAssignmentFromEdgeData(edges) ?? assignLibavoidPorts(nodeByPath, edges);
}

/**
 * Flat one-level graph for a folder: direct children as opaque boxes.
 * Positions are absolute canvas coords so returned routes match RF space.
 */
export function buildFlatLibavoidGraph(input: {
  parentId: string | null;
  nodeByPath: ReadonlyMap<string, ThinRoutingNode>;
  childrenByParent: ReadonlyMap<string | null, ThinRoutingNode[]>;
  edges: readonly ThinRoutingEdge[];
  ports: LibavoidPortAssignment;
}): LibavoidElkGraph {
  const { parentId, nodeByPath, childrenByParent, edges, ports } = input;
  const children = childrenByParent.get(parentId) ?? [];

  const elkChildren = children.map(node => {
    const absolute = absolutePositionFromThin(node, nodeByPath);
    const eastCount = ports.eastPortCount.get(node.path) ?? 0;
    const westCount = ports.westPortCount.get(node.path) ?? 0;
    const nodePorts = buildPorts(node.path, node.width, node.height, eastCount, westCount);

    return {
      id: node.path,
      x: absolute.x,
      y: absolute.y,
      width: node.width,
      height: node.height,
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
 * Nested folders keep relative child coords; the subtree root uses absolute position.
 *
 * Folders whose descendants contain no endpoint of `edges` are opaque boxes.
 */
export function buildHierarchicalLibavoidGraph(input: {
  parentId: string | null;
  nodeByPath: ReadonlyMap<string, ThinRoutingNode>;
  childrenByParent: ReadonlyMap<string | null, ThinRoutingNode[]>;
  edges: readonly ThinRoutingEdge[];
  ports: LibavoidPortAssignment;
}): LibavoidElkGraph {
  const { parentId, nodeByPath, childrenByParent, edges, ports } = input;
  const endpoints = collectEdgeEndpoints(edges);

  const buildElkNode = (node: ThinRoutingNode, absoluteTopLevel: boolean): LibavoidElkNode => {
    const eastCount = ports.eastPortCount.get(node.path) ?? 0;
    const westCount = ports.westPortCount.get(node.path) ?? 0;
    const nodePorts = buildPorts(node.path, node.width, node.height, eastCount, westCount);
    const childNodes = childrenByParent.get(node.path) ?? [];
    const expandChildren = childNodes.some(child => subtreeContainsEndpoint(child, endpoints));
    const nestedChildren = expandChildren ? childNodes.map(child => buildElkNode(child, false)) : [];
    const position = absoluteTopLevel
      ? absolutePositionFromThin(node, nodeByPath)
      : { x: node.position.x, y: node.position.y };

    return {
      id: node.path,
      x: position.x,
      y: position.y,
      width: node.width,
      height: node.height,
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
 * Builds a hierarchical ELK JSON graph for whole-graph libavoid routing from an enriched Map.
 */
export function nodesToLibavoidGraph(
  nodeByPath: ReadonlyMap<string, ThinRoutingNode>,
  edges: readonly ThinRoutingEdge[],
): LibavoidElkGraph {
  const routedEdges = edges.filter(edge => nodeByPath.has(edge.source) && nodeByPath.has(edge.target));
  const ports = resolveLibavoidPortAssignment(nodeByPath, routedEdges);
  const childrenByParent = buildChildrenByParentFromThin(nodeByPath);
  return buildHierarchicalLibavoidGraph({
    parentId: null,
    nodeByPath,
    childrenByParent,
    edges: routedEdges,
    ports,
  });
}
