import { BUILT_IN_PREFIX, isBuiltInPath } from '../isBuiltInPath';

/**
 * Leaf name under `:buildIn:`: `protocol + cruiseId` when protocol is set, else bare id.
 * Does not invent a default protocol.
 */
export function toBuiltInLeafName(cruiseId: string, protocol?: string): string {
  return protocol ? `${protocol}${cruiseId}` : cruiseId;
}

/**
 * Snapshot path for a core module id (`fs` → `:buildIn:/fs`, with `node:` → `:buildIn:/node:fs`).
 * Idempotent when the path is already under `:buildIn:`.
 */
export function toBuiltInSnapshotPath(cruiseId: string, protocol?: string): string {
  if (isBuiltInPath(cruiseId)) {
    return cruiseId;
  }
  return `${BUILT_IN_PREFIX}${toBuiltInLeafName(cruiseId, protocol)}`;
}
