import type { IModule } from 'dependency-cruiser'
import type { ModuleRelation, ModuleRelations } from '../../../types'

export function getModuleRelations(
  path: string,
  modules: IModule[],
  selectedPaths: string[],
): ModuleRelations {
  const selectedSet = new Set(selectedPaths)
  const module = modules.find((m) => m.source === path)

  const dependencies: ModuleRelation[] = []
  if (module && Array.isArray(module.dependencies)) {
    for (const dep of module.dependencies) {
      const resolved = dep.resolved
      if (!resolved || !selectedSet.has(resolved)) continue
      dependencies.push({
        path: resolved,
        circular: dep.circular === true,
      })
    }
  }
  dependencies.sort((a, b) => a.path.localeCompare(b.path))

  const dependents: ModuleRelation[] = []
  for (const other of modules) {
    if (!selectedSet.has(other.source)) continue
    if (!Array.isArray(other.dependencies)) continue

    for (const dep of other.dependencies) {
      if (dep.resolved !== path) continue
      dependents.push({
        path: other.source,
        circular: dep.circular === true,
      })
    }
  }
  dependents.sort((a, b) => a.path.localeCompare(b.path))

  return { dependencies, dependents }
}
