import type { ModuleDependency } from '@/domain';

/** Dependency fields stored on a graph edge for highlights and membership checks. */
export type DependencyEdgeAggregated = Pick<ModuleDependency, 'id' | 'source' | 'target'>;

export interface EdgePoint {
  x: number;
  y: number;
}

/** Absolute libavoid route in React Flow canvas coordinates. */
export interface AvoidRoute {
  sourcePoint: EdgePoint;
  targetPoint: EdgePoint;
  bendPoints: EdgePoint[];
}

export interface DependencyEdgeData {
  typeOnly?: boolean;
  valueCircular?: boolean;
  typeOnlyCircular?: boolean;
  couldNotResolve?: boolean;
  severity?: 'error' | 'warn';
  ruleNames?: string[];
  aggregated?: DependencyEdgeAggregated[];
  /** Obstacle-avoiding route from libavoid (absolute canvas coords). */
  avoidRoute?: AvoidRoute;
  /** Points on horizontal avoid segments where a schematic jump arc is drawn. */
  crossingJumps?: EdgePoint[];
  /** Precomputed SVG path without crossing hops (emphasized edges). */
  avoidPath?: string;
  /** Precomputed SVG path with crossing hops (default render). */
  avoidPathWithJumps?: string;
  [key: string]: unknown;
}
