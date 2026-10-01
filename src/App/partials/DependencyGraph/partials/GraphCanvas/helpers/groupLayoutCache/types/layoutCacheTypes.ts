export type GroupId = string | null;

export interface Position2D {
  x: number;
  y: number;
}

export interface ChildLayoutEntry {
  id: string;
  position: Position2D;
  width: number;
  height: number;
}

/** Layout memory for one parent group and its direct children. */
export interface GroupLayoutEntry {
  id: GroupId;
  width: number;
  height: number;
  children: Map<string, ChildLayoutEntry>;
}

/** Cache keyed by group id (`null` = root viewport). */
export type LayoutCache = Map<GroupId, GroupLayoutEntry>;

/** JSON-friendly child layout (sizes may be omitted when migrating legacy positions). */
export interface SerializedChildLayout {
  id: string;
  position: Position2D;
  width?: number;
  height?: number;
}

/** JSON-friendly group layout entry. */
export interface SerializedGroupLayout {
  id: string;
  width?: number;
  height?: number;
  children: Record<string, SerializedChildLayout>;
}

/** JSON-friendly layout cache (`""` = root). */
export type SerializedLayoutCache = Record<string, SerializedGroupLayout>;
