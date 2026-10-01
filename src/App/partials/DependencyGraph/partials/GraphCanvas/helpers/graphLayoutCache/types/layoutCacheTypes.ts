export type GroupId = string | null;

export interface Position2D {
  x: number;
  y: number;
}

export interface NodeSize {
  width: number;
  height: number;
}

/** Relative positions of direct children within a group. */
export type GroupPositionCache = Map<string, Position2D>;

/** Cache keyed by group id (null = root viewport). */
export type PositionCache = Map<GroupId, GroupPositionCache>;

/** Fingerprint = sorted direct children ids joined by comma. */
export type GroupFingerprints = Map<GroupId, string>;
