import type { IViolation } from 'dependency-cruiser';

/** Flatten violations from an array or dependency-key map. */
export function flattenViolations(
  violations: readonly IViolation[] | ReadonlyMap<string, readonly IViolation[]> | undefined,
): readonly IViolation[] {
  if (!violations) {
    return [];
  }
  if (Array.isArray(violations)) {
    return violations;
  }

  const byKey = violations as ReadonlyMap<string, readonly IViolation[]>;
  return [...byKey.values()].flat();
}
