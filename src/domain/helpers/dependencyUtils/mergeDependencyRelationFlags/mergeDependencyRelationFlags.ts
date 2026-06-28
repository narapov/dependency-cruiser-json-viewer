export interface DependencyRelationFlags {
  typeOnly: boolean
  valueCircular: boolean
  typeOnlyCircular: boolean
}

export function createDependencyRelationFlags(
  isTypeOnly: boolean,
  isCircular: boolean,
): DependencyRelationFlags {
  return {
    typeOnly: isTypeOnly,
    valueCircular: isCircular && !isTypeOnly,
    typeOnlyCircular: isCircular && isTypeOnly,
  }
}

export function mergeDependencyRelationFlags(
  flags: DependencyRelationFlags,
  isTypeOnly: boolean,
  isCircular: boolean,
): void {
  flags.typeOnly = flags.typeOnly && isTypeOnly
  if (isCircular && !isTypeOnly) {
    flags.valueCircular = true
  }
  if (isCircular && isTypeOnly) {
    flags.typeOnlyCircular = true
  }
}

export function finalizeDependencyRelationFlags(flags: DependencyRelationFlags): void {
  if (flags.valueCircular) {
    flags.typeOnlyCircular = false
  }
}
