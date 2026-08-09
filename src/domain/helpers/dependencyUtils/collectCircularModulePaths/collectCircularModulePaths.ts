import type { IModule } from 'dependency-cruiser';

/** Collect unique module paths that participate in any circular dependency (value or type-only). */
export function collectCircularModulePaths(modules: readonly IModule[]): string[] {
  return [
    ...new Set(
      modules.flatMap(module => {
        const dependencies = module.dependencies;
        if (!Array.isArray(dependencies)) {
          return [];
        }

        return dependencies
          .filter(dep => dep.circular === true)
          .flatMap(dep => {
            if (typeof dep.resolved === 'string' && dep.resolved.length > 0) {
              return [module.source, dep.resolved];
            }
            return [module.source];
          });
      }),
    ),
  ];
}
