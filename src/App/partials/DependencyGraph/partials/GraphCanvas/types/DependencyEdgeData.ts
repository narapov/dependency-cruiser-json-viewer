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

/** EAST (outgoing) or WEST (incoming) attachment side on a node. */
export type EdgePortSide = 'east' | 'west';

/** Node-relative attachment slot for one end of an edge. */
export interface EdgePort {
  side: EdgePortSide;
  index: number;
  /** Node-relative Y from the top of the node (`(index+1)/(count+1)*height`). */
  y: number;
}

/** Frozen source/target ports for one edge (build-time map entry). */
export interface EdgePorts {
  source: EdgePort;
  target: EdgePort;
}

export interface DependencyEdgeData {
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
  [key: string]: unknown;
}
