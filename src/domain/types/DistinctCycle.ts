/** One step in a distinct circular dependency cycle. */
export interface DistinctCycleMember {
  path: string;
  /** True when the path is not among the snapshot's present modules (e.g. ignore-filtered). */
  ignored: boolean;
}

/** Unique circular dependency cycle (path rotations collapse to one entry). */
export interface DistinctCycle {
  members: DistinctCycleMember[];
}
