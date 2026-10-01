import type { IModule } from 'dependency-cruiser';

import type { DistinctCycle } from '../../../types';

/** Canonical key for a cycle path so rotations of the same cycle collapse to one entry. */
function canonicalizeCycleKey(paths: string[]): string {
  if (paths.length === 0) {
    return '';
  }

  return paths.map((_, index) => [...paths.slice(index), ...paths.slice(0, index)].join('\0')).sort()[0]!;
}

/**
 * Collect unique circular dependency cycles from module edges (value and type-only).
 * Members absent from `presentSources` (default: sources of `modules`) are marked `ignored`.
 */
export function collectDistinctCycles(
  modules: readonly IModule[],
  presentSources?: ReadonlySet<string>,
): DistinctCycle[] {
  const present = presentSources ?? new Set(modules.map(module => module.source));
  const byCanon = new Map<string, string[]>();

  modules.forEach(module => {
    const dependencies = module.dependencies;
    if (!Array.isArray(dependencies)) {
      return;
    }

    dependencies.forEach(dep => {
      if (dep.circular !== true || !Array.isArray(dep.cycle) || dep.cycle.length === 0) {
        return;
      }

      const paths = dep.cycle.map(step => step.name);
      const key = canonicalizeCycleKey(paths);
      if (!byCanon.has(key)) {
        byCanon.set(key, paths);
      }
    });
  });

  return [...byCanon.values()].map(paths => ({
    members: paths.map(path => ({
      path,
      ignored: !present.has(path),
    })),
  }));
}
