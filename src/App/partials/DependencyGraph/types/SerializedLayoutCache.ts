/** JSON-friendly child layout (sizes may be omitted when migrating legacy positions). */
export interface SerializedChildLayout {
  id: string;
  position: { x: number; y: number };
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
