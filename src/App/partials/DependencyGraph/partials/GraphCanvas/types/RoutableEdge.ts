import type { AvoidRoute, DependencyEdgeAggregated, EdgePoint, EdgePort } from './DependencyEdgeData';

/**
 * App-owned edge through routing/merge — React Flow projection happens later.
 * No `@xyflow` types.
 */
export interface RoutableEdge {
  id: string;
  source: string;
  target: string;
  typeOnly?: boolean;
  valueCircular?: boolean;
  typeOnlyCircular?: boolean;
  couldNotResolve?: boolean;
  severity?: 'error' | 'warn';
  ruleNames?: string[];
  aggregated?: DependencyEdgeAggregated[];
  /** Build-time EAST port on the source node (relative `y`). */
  sourcePort?: EdgePort;
  /** Build-time WEST port on the target node (relative `y`). */
  targetPort?: EdgePort;
  /** Obstacle-avoiding route from libavoid (absolute canvas coords). */
  avoidRoute?: AvoidRoute;
  /** Points on horizontal avoid segments where a schematic jump arc is drawn. */
  crossingJumps?: EdgePoint[];
  /** Precomputed SVG path without crossing hops (emphasized edges). */
  avoidPath?: string;
  /** Precomputed SVG path with crossing hops (default render). */
  avoidPathWithJumps?: string;
}
