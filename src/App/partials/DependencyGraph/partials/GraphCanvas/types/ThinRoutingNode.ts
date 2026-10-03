import type { EdgePort } from './DependencyEdgeData';

/** Thin layouted-tree node for the libavoid worker wire payload. */
export interface ThinRoutingNode {
  path: string;
  /** Nearest parent → … → root; empty at visible-tree roots. */
  ancestors: string[];
  /** All visible node paths strictly below this node (folders + files). */
  descendants: string[];
  position: { x: number; y: number };
  width: number;
  height: number;
  children?: ThinRoutingNode[];
}

/** Thin edge for libavoid routing (no React Flow edge type). */
export interface ThinRoutingEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: EdgePort;
  targetPort?: EdgePort;
}
