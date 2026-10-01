import type { Edge, Node } from '@xyflow/react';

import type { AvoidRoute } from '../../types';
import { collectOverlappingEdgeIds } from './collectOverlappingEdgeIds';
import { collectRoutingLevels, overlapGroupParentId } from './collectRoutingLevels';
import { ensureLibavoidInit } from './ensureLibavoidInit';
import { LIBAVOID_NEED_PROFILE } from './libavoidNeedProfile';
import { LIBAVOID_ROUTING_OPTIONS, logLibavoidCall } from './libavoidRoutingOptions';
import {
  assignLibavoidPorts,
  buildFlatLibavoidGraph,
  buildHierarchicalLibavoidGraph,
  type LibavoidElkGraph,
  type LibavoidPortAssignment,
} from './nodesToLibavoidGraph';
import { LIBAVOID_EDGE_BATCH_SIZE, routeLibavoidGraph } from './routeLibavoidGraph';
import type { LibavoidRoutingProgress } from './types';

export type { LibavoidRoutingPhase, LibavoidRoutingProgress } from './types';

export interface RouteEdgesWithLibavoidInput {
  nodes: readonly Node[];
  edges: readonly Edge[];
  parentByNode: ReadonlyMap<string, string | null>;
  onProgress?: (progress: LibavoidRoutingProgress) => void;
}

function createLibavoidProfiler(enabled: boolean) {
  const marks = new Map<string, number>();
  const totals = new Map<string, number>();

  return {
    start(label: string) {
      if (!enabled) {
        return;
      }
      marks.set(label, performance.now());
    },
    end(label: string) {
      if (!enabled) {
        return;
      }
      const startedAt = marks.get(label);
      if (startedAt === undefined) {
        return;
      }
      marks.delete(label);
      totals.set(label, (totals.get(label) ?? 0) + (performance.now() - startedAt));
    },
    log(meta: { obstacles: number; routedEdges: number; rfNodes: number; rfEdges: number; batchSize: number }) {
      if (!enabled) {
        return;
      }
      const lines = [...totals.entries()].map(([label, ms]) => `  ${label}: ${ms.toFixed(1)}ms`).join('\n');
      console.log(
        `[libavoid] obstacles=${meta.obstacles} routedEdges=${meta.routedEdges} batchSize=${meta.batchSize} rfNodes=${meta.rfNodes} rfEdges=${meta.rfEdges}\n${lines}`,
      );
    },
  };
}

function toAvoidRoute(route: {
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
  bendPoints: { x: number; y: number }[];
}): AvoidRoute {
  return {
    sourcePoint: { ...route.sourcePoint },
    targetPoint: { ...route.targetPoint },
    bendPoints: route.bendPoints.map(point => ({ ...point })),
  };
}

function yieldToMain(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

async function routeGraphBatch(
  graph: LibavoidElkGraph,
  profiler: ReturnType<typeof createLibavoidProfiler>,
  label: string,
): Promise<Map<string, AvoidRoute>> {
  if (graph.children.length === 0 || graph.edges.length === 0) {
    return new Map();
  }

  profiler.start(label);
  logLibavoidCall('routeEdges', graph, LIBAVOID_ROUTING_OPTIONS);
  const routes = await routeLibavoidGraph(graph, LIBAVOID_ROUTING_OPTIONS);
  profiler.end(label);

  const result = new Map<string, AvoidRoute>();
  routes.forEach((route, edgeId) => {
    result.set(edgeId, toAvoidRoute(route));
  });
  return result;
}

function mergeRoutesInto(target: Map<string, AvoidRoute>, source: Map<string, AvoidRoute>): void {
  source.forEach((route, edgeId) => {
    target.set(edgeId, route);
  });
}

function reportProgress(
  onProgress: ((progress: LibavoidRoutingProgress) => void) | undefined,
  progress: LibavoidRoutingProgress,
): void {
  onProgress?.(progress);
}

async function routeFlatLevels(input: {
  levels: ReturnType<typeof collectRoutingLevels>;
  nodes: readonly Node[];
  parentByNode: ReadonlyMap<string, string | null>;
  ports: LibavoidPortAssignment;
  profiler: ReturnType<typeof createLibavoidProfiler>;
  primaryTotal: number;
  completedRef: { value: number };
  onProgress?: (progress: LibavoidRoutingProgress) => void;
}): Promise<Map<string, AvoidRoute>> {
  const { levels, nodes, parentByNode, ports, profiler, primaryTotal, completedRef, onProgress } = input;
  const result = new Map<string, AvoidRoute>();
  let isFirst = true;

  for (const level of levels) {
    if (level.leafEdges.length === 0) {
      continue;
    }
    if (!isFirst) {
      await yieldToMain();
    }
    isFirst = false;

    const graph = buildFlatLibavoidGraph({
      parentId: level.parentId,
      nodes,
      edges: level.leafEdges,
      parentByNode,
      ports,
    });
    const batchRoutes = await routeGraphBatch(graph, profiler, 'flatRoute');
    mergeRoutesInto(result, batchRoutes);
    completedRef.value += batchRoutes.size;
    reportProgress(onProgress, { phase: 'primary', completed: completedRef.value, total: primaryTotal });
  }

  return result;
}

async function routeHierarchicalLevels(input: {
  levels: ReturnType<typeof collectRoutingLevels>;
  nodes: readonly Node[];
  parentByNode: ReadonlyMap<string, string | null>;
  ports: LibavoidPortAssignment;
  profiler: ReturnType<typeof createLibavoidProfiler>;
  primaryTotal: number;
  completedRef: { value: number };
  onProgress?: (progress: LibavoidRoutingProgress) => void;
}): Promise<Map<string, AvoidRoute>> {
  const { levels, nodes, parentByNode, ports, profiler, primaryTotal, completedRef, onProgress } = input;
  const result = new Map<string, AvoidRoute>();
  let isFirst = true;

  for (const level of levels) {
    const { crossFolderEdges, parentId } = level;
    if (crossFolderEdges.length === 0) {
      continue;
    }

    for (let offset = 0; offset < crossFolderEdges.length; offset += LIBAVOID_EDGE_BATCH_SIZE) {
      if (!isFirst) {
        await yieldToMain();
      }
      isFirst = false;

      const batch = crossFolderEdges.slice(offset, offset + LIBAVOID_EDGE_BATCH_SIZE);
      const graph = buildHierarchicalLibavoidGraph({
        parentId,
        nodes,
        edges: batch,
        parentByNode,
        ports,
      });
      const batchRoutes = await routeGraphBatch(graph, profiler, 'hierarchicalRoute');
      mergeRoutesInto(result, batchRoutes);
      completedRef.value += batchRoutes.size;
      reportProgress(onProgress, { phase: 'primary', completed: completedRef.value, total: primaryTotal });
    }
  }

  return result;
}

async function routeOverlapGroups(input: {
  routes: Map<string, AvoidRoute>;
  edges: readonly Edge[];
  nodes: readonly Node[];
  parentByNode: ReadonlyMap<string, string | null>;
  ports: LibavoidPortAssignment;
  profiler: ReturnType<typeof createLibavoidProfiler>;
  onProgress?: (progress: LibavoidRoutingProgress) => void;
}): Promise<void> {
  const { routes, edges, nodes, parentByNode, ports, profiler, onProgress } = input;
  const edgeById = new Map(edges.map(edge => [edge.id, edge]));
  const groups = collectOverlappingEdgeIds(routes);
  const overlapEdges = groups.flatMap(group =>
    group.flatMap(edgeId => {
      const edge = edgeById.get(edgeId);
      return edge ? [edge] : [];
    }),
  );
  const overlapTotal = overlapEdges.length;
  if (overlapTotal === 0) {
    return;
  }

  reportProgress(onProgress, { phase: 'overlap', completed: 0, total: overlapTotal });

  let completed = 0;
  let isFirst = true;

  for (const group of groups) {
    const groupEdges = group.flatMap(edgeId => {
      const edge = edgeById.get(edgeId);
      return edge ? [edge] : [];
    });
    if (groupEdges.length === 0) {
      continue;
    }

    for (let offset = 0; offset < groupEdges.length; offset += LIBAVOID_EDGE_BATCH_SIZE) {
      if (!isFirst) {
        await yieldToMain();
      }
      isFirst = false;

      const batch = groupEdges.slice(offset, offset + LIBAVOID_EDGE_BATCH_SIZE);
      const batchIds = batch.map(edge => edge.id);
      const parentId = overlapGroupParentId(batchIds, edgeById, parentByNode);
      const graph = buildHierarchicalLibavoidGraph({
        parentId,
        nodes,
        edges: batch,
        parentByNode,
        ports,
      });
      const batchRoutes = await routeGraphBatch(graph, profiler, 'overlapRoute');
      mergeRoutesInto(routes, batchRoutes);
      completed += batch.length;
      reportProgress(onProgress, { phase: 'overlap', completed, total: overlapTotal });
    }
  }
}

/**
 * Routes RF edges with the optimized multi-pass algorithm:
 * global ports → flat leaf edges per folder → hierarchical cross-folder per folder →
 * overlap-group hierarchical re-route. Reports primary then overlap progress phases.
 * Returns absolute canvas routes keyed by edge id.
 */
export async function routeEdgesWithLibavoid(input: RouteEdgesWithLibavoidInput): Promise<Map<string, AvoidRoute>> {
  const { nodes, edges, parentByNode, onProgress } = input;
  const profiler = createLibavoidProfiler(LIBAVOID_NEED_PROFILE);
  profiler.start('total');

  if (nodes.length === 0 || edges.length === 0) {
    profiler.end('total');
    profiler.log({
      obstacles: 0,
      routedEdges: 0,
      rfNodes: nodes.length,
      rfEdges: edges.length,
      batchSize: LIBAVOID_EDGE_BATCH_SIZE,
    });
    return new Map();
  }

  profiler.start('collectLevels');
  const levels = collectRoutingLevels(nodes, edges, parentByNode);
  profiler.end('collectLevels');

  const primaryTotal = levels.reduce(
    (count, level) => count + level.leafEdges.length + level.crossFolderEdges.length,
    0,
  );
  if (primaryTotal === 0) {
    profiler.end('total');
    profiler.log({
      obstacles: nodes.length,
      routedEdges: 0,
      rfNodes: nodes.length,
      rfEdges: edges.length,
      batchSize: LIBAVOID_EDGE_BATCH_SIZE,
    });
    return new Map();
  }

  profiler.start('assignPorts');
  const ports = assignLibavoidPorts(nodes, edges, parentByNode);
  profiler.end('assignPorts');

  profiler.start('init');
  await ensureLibavoidInit();
  profiler.end('init');

  const completedRef = { value: 0 };
  reportProgress(onProgress, { phase: 'primary', completed: 0, total: primaryTotal });

  const result = new Map<string, AvoidRoute>();

  mergeRoutesInto(
    result,
    await routeFlatLevels({
      levels,
      nodes,
      parentByNode,
      ports,
      profiler,
      primaryTotal,
      completedRef,
      onProgress,
    }),
  );
  mergeRoutesInto(
    result,
    await routeHierarchicalLevels({
      levels,
      nodes,
      parentByNode,
      ports,
      profiler,
      primaryTotal,
      completedRef,
      onProgress,
    }),
  );

  profiler.start('overlapPass');
  await routeOverlapGroups({ routes: result, edges, nodes, parentByNode, ports, profiler, onProgress });
  profiler.end('overlapPass');

  profiler.end('total');
  profiler.log({
    obstacles: nodes.length,
    routedEdges: result.size,
    rfNodes: nodes.length,
    rfEdges: edges.length,
    batchSize: LIBAVOID_EDGE_BATCH_SIZE,
  });

  return result;
}
