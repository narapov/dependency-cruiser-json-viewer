import { init, routeEdges } from '@mr_mint/elkjs-libavoid';
import type { Edge, Node } from '@xyflow/react';

import { NEED_PROFILE } from '@/Shared';

import type { AvoidRoute } from '../../types';
import { nodesToLibavoidGraph } from './nodesToLibavoidGraph';

export interface RouteEdgesWithLibavoidInput {
  nodes: readonly Node[];
  edges: readonly Edge[];
  parentByNode: ReadonlyMap<string, string | null>;
}

let initPromise: Promise<void> | null = null;

function ensureLibavoidInit(): Promise<void> {
  if (!initPromise) {
    const wasmPath =
      typeof import.meta.env?.BASE_URL === 'string' ? `${import.meta.env.BASE_URL}libavoid.wasm` : undefined;
    initPromise = init(wasmPath);
  }
  return initPromise;
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
    log(meta: { obstacles: number; routedEdges: number; rfNodes: number; rfEdges: number }) {
      if (!enabled) {
        return;
      }
      const lines = [...totals.entries()].map(([label, ms]) => `  ${label}: ${ms.toFixed(1)}ms`).join('\n');
      console.log(
        `[libavoid] obstacles=${meta.obstacles} routedEdges=${meta.routedEdges} rfNodes=${meta.rfNodes} rfEdges=${meta.rfEdges}\n${lines}`,
      );
    },
  };
}

/**
 * Routes all RF edges with libavoid using current node positions as fixed obstacles.
 * Returns absolute canvas routes keyed by edge id.
 */
export async function routeEdgesWithLibavoid(input: RouteEdgesWithLibavoidInput): Promise<Map<string, AvoidRoute>> {
  const { nodes, edges, parentByNode } = input;
  const profiler = createLibavoidProfiler(NEED_PROFILE);
  profiler.start('total');

  if (nodes.length === 0 || edges.length === 0) {
    profiler.end('total');
    profiler.log({ obstacles: 0, routedEdges: 0, rfNodes: nodes.length, rfEdges: edges.length });
    return new Map();
  }

  profiler.start('buildGraph');
  const graph = nodesToLibavoidGraph(nodes, edges, parentByNode);
  profiler.end('buildGraph');

  if (graph.children.length === 0 || graph.edges.length === 0) {
    profiler.end('total');
    profiler.log({
      obstacles: graph.children.length,
      routedEdges: graph.edges.length,
      rfNodes: nodes.length,
      rfEdges: edges.length,
    });
    return new Map();
  }

  profiler.start('init');
  await ensureLibavoidInit();
  profiler.end('init');

  profiler.start('routeEdges');
  const routes = await routeEdges(graph, {
    routingType: 'orthogonal',
    shapeBufferDistance: 8,
  });
  profiler.end('routeEdges');

  profiler.start('mapResult');
  const result = [...routes.entries()].reduce((acc, [edgeId, route]) => {
    acc.set(edgeId, {
      sourcePoint: { ...route.sourcePoint },
      targetPoint: { ...route.targetPoint },
      bendPoints: route.bendPoints.map(point => ({ ...point })),
    });
    return acc;
  }, new Map<string, AvoidRoute>());
  profiler.end('mapResult');

  profiler.end('total');
  profiler.log({
    obstacles: graph.children.length,
    routedEdges: graph.edges.length,
    rfNodes: nodes.length,
    rfEdges: edges.length,
  });

  return result;
}
