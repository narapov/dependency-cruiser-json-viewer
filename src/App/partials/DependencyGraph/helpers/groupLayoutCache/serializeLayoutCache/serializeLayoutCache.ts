import type { GroupId, GroupLayoutEntry, LayoutCache, SerializedGroupLayout, SerializedLayoutCache } from '../types';

export const ROOT_GROUP_KEY = '';

/** Converts a group id to its JSON key (`null` → `""`). */
export function groupIdToKey(groupId: GroupId): string {
  return groupId ?? ROOT_GROUP_KEY;
}

/** Converts a JSON key to a group id (`""` → `null`). */
export function keyToGroupId(key: string): GroupId {
  return key === ROOT_GROUP_KEY ? null : key;
}

/** Serialize a layout cache to a JSON-friendly record (root group key = ""). */
export function serializeLayoutCache(cache: LayoutCache): SerializedLayoutCache {
  return Object.fromEntries(
    [...cache.entries()].map(([groupId, entry]) => {
      const key = groupIdToKey(groupId);
      const serialized: SerializedGroupLayout = {
        id: key,
        width: entry.width,
        height: entry.height,
        children: Object.fromEntries(
          [...entry.children.entries()].map(([childId, child]) => [
            childId,
            {
              id: child.id,
              position: { ...child.position },
              width: child.width,
              height: child.height,
            },
          ]),
        ),
      };
      return [key, serialized];
    }),
  );
}

/** Deserialize a JSON record into a layout cache (`""` → root null group). */
export function deserializeLayoutCache(record: SerializedLayoutCache): LayoutCache {
  return new Map(
    Object.entries(record).map(([key, serialized]) => {
      const groupId = keyToGroupId(key);
      const entry: GroupLayoutEntry = {
        id: groupId,
        width: serialized.width ?? 0,
        height: serialized.height ?? 0,
        children: new Map(
          Object.entries(serialized.children).map(([childId, child]) => [
            childId,
            {
              id: child.id,
              position: { ...child.position },
              width: child.width ?? 0,
              height: child.height ?? 0,
            },
          ]),
        ),
      };
      return [groupId, entry];
    }),
  );
}
