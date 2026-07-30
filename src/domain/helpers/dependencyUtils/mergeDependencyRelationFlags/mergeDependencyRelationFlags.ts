/** Aggregated type-only and circular flags for a dependency relation. */
export interface DependencyRelationFlags {
  typeOnly: boolean;
  valueCircular: boolean;
  typeOnlyCircular: boolean;
}

/** Create relation flags from a single dependency's type-only and circular state. */
export function createDependencyRelationFlags(isTypeOnly: boolean, isCircular: boolean): DependencyRelationFlags {
  return {
    typeOnly: isTypeOnly,
    valueCircular: isCircular && !isTypeOnly,
    typeOnlyCircular: isCircular && isTypeOnly,
  };
}

/** Merge another dependency's flags into an existing relation flags object. */
export function mergeDependencyRelationFlags(
  flags: DependencyRelationFlags,
  isTypeOnly: boolean,
  isCircular: boolean,
): void {
  flags.typeOnly = flags.typeOnly && isTypeOnly;
  if (isCircular && !isTypeOnly) {
    flags.valueCircular = true;
  }
  if (isCircular && isTypeOnly) {
    flags.typeOnlyCircular = true;
  }
}

/** Prefer value circularity over type-only circularity when both were seen. */
export function finalizeDependencyRelationFlags(flags: DependencyRelationFlags): void {
  if (flags.valueCircular) {
    flags.typeOnlyCircular = false;
  }
}
