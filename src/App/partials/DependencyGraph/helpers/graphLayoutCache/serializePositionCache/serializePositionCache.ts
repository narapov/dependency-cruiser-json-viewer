import type { PositionCache } from '../types';

const ROOT_GROUP_KEY = '';

/** Serialize a position cache to a JSON-friendly record (root group key = ""). */
export function serializePositionCache(cache: PositionCache): Record<string, Record<string, { x: number; y: number }>> {
  return Object.fromEntries(
    [...cache.entries()].map(([groupId, children]) => [
      groupId ?? ROOT_GROUP_KEY,
      Object.fromEntries(children.entries()),
    ]),
  );
}

/** Deserialize a JSON record into a position cache ("" → root null group). */
export function deserializePositionCache(
  record: Record<string, Record<string, { x: number; y: number }>>,
): PositionCache {
  return new Map(
    Object.entries(record).map(([groupId, children]) => [
      groupId === ROOT_GROUP_KEY ? null : groupId,
      new Map(Object.entries(children)),
    ]),
  );
}
