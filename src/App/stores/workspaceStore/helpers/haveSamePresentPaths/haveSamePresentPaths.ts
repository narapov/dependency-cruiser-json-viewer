import { presenceRecordToPaths } from '../presenceRecordToPaths';

/** Whether two presence records mark the same paths as present (`true`). */
export function haveSamePresentPaths(
  left: Record<string, boolean | undefined>,
  right: Record<string, boolean | undefined>,
): boolean {
  const leftPresent = new Set(presenceRecordToPaths(left));
  const rightPresent = new Set(presenceRecordToPaths(right));
  return leftPresent.symmetricDifference(rightPresent).size === 0;
}
