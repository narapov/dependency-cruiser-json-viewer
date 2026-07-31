import type { IModule } from 'dependency-cruiser';

/** Whether a dependency-cruiser edge is marked type-only. */
export function isTypeOnlyDependency(dep: IModule['dependencies'][number]): boolean {
  return dep.dependencyTypes?.includes('type-only') ?? false;
}
