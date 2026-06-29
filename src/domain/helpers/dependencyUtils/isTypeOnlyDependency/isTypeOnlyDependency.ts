import type { IModule } from 'dependency-cruiser';

export function isTypeOnlyDependency(dep: IModule['dependencies'][number]): boolean {
  return dep.dependencyTypes?.includes('type-only') ?? false;
}
