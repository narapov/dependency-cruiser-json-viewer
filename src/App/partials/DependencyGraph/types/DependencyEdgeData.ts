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
  title: string;
  typeOnly?: boolean;
  circular?: boolean;
  couldNotResolve?: boolean;
  severity?: 'error' | 'warn';
  ruleNames?: string[];
  /** Obstacle-avoiding route from libavoid (absolute canvas coords). */
  avoidRoute?: AvoidRoute;
  /** Points on horizontal avoid segments where a schematic jump arc is drawn. */
  crossingJumps?: EdgePoint[];
}
