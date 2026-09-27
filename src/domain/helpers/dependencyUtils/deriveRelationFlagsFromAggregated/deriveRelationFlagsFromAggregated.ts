import type { AggregatedDependency } from '../../../types';
import { isTypeOnlyDependency } from '../isTypeOnlyDependency';
import {
  createDependencyRelationFlags,
  finalizeDependencyRelationFlags,
  mergeDependencyRelationFlags,
  type DependencyRelationFlags,
} from '../mergeDependencyRelationFlags';

/** Derive relation flags from the aggregated file-level dependencies on an edge. */
export function deriveRelationFlagsFromAggregated(
  aggregated: readonly AggregatedDependency[],
): DependencyRelationFlags {
  if (aggregated.length === 0) {
    return createDependencyRelationFlags(false, false);
  }

  const [first, ...rest] = aggregated;
  const flags = createDependencyRelationFlags(isTypeOnlyDependency(first), first.circular === true);
  rest.forEach(dep => {
    mergeDependencyRelationFlags(flags, isTypeOnlyDependency(dep), dep.circular === true);
  });
  finalizeDependencyRelationFlags(flags);
  return flags;
}
