export interface ElkEdgePoint {
  x: number;
  y: number;
}

/** ELK edge section geometry in parent-relative node space (after group padding offset). */
export interface ElkEdgeSection {
  startPoint: ElkEdgePoint;
  endPoint: ElkEdgePoint;
  bendPoints?: ElkEdgePoint[];
}

export interface DependencyEdgeData {
  title: string;
  typeOnly?: boolean;
  circular?: boolean;
  couldNotResolve?: boolean;
  severity?: 'error' | 'warn';
  ruleNames?: string[];
  /** Debug: ELK-routed sections for sibling layout edges. */
  elkSections?: ElkEdgeSection[];
}
