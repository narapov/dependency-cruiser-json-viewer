import type { IModule } from 'dependency-cruiser'
import { CIRCULAR_EDGE_COLOR } from './buildGraph'
import { getRepresentative, isUnderFolder } from './pathUtils'

export { CIRCULAR_EDGE_COLOR as CIRCULAR_COLOR }

export interface ModuleRelation {
  path: string
  circular: boolean
}

export interface ModuleRelations {
  dependencies: ModuleRelation[]
  dependents: ModuleRelation[]
}

function mergeRelation(map: Map<string, boolean>, path: string, circular: boolean): void {
  map.set(path, (map.get(path) ?? false) || circular)
}

function mapToSortedArray(map: Map<string, boolean>): ModuleRelation[] {
  return [...map.entries()]
    .map(([path, circular]) => ({ path, circular }))
    .sort((a, b) => a.path.localeCompare(b.path))
}

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

export function getFolderRelations(
  folderPath: string,
  modules: IModule[],
  selectedPaths: string[],
  expandedFolders: Set<string>,
): ModuleRelations {
  const selectedSet = new Set(selectedPaths)
  const expanded = expandedFolders.has(folderPath)
  const dependencies = new Map<string, boolean>()
  const dependents = new Map<string, boolean>()

  for (const module of modules) {
    if (!selectedSet.has(module.source)) continue
    if (!Array.isArray(module.dependencies)) continue

    const sourceRep = getRepresentative(module.source, selectedSet, expandedFolders)
    const sourceUnder = isUnderFolder(module.source, folderPath)

    for (const dep of module.dependencies) {
      const resolved = dep.resolved
      if (!resolved || !selectedSet.has(resolved)) continue

      const targetRep = getRepresentative(resolved, selectedSet, expandedFolders)
      const targetUnder = isUnderFolder(resolved, folderPath)
      const circular = dep.circular === true

      if (sourceRep === folderPath && targetRep !== folderPath) {
        mergeRelation(dependencies, targetRep, circular)
      }
      if (targetRep === folderPath && sourceRep !== folderPath) {
        mergeRelation(dependents, sourceRep, circular)
      }

      if (expanded) {
        if (sourceUnder && !targetUnder && targetRep !== folderPath) {
          mergeRelation(dependencies, targetRep, circular)
        }
        if (!sourceUnder && targetUnder && sourceRep !== folderPath) {
          mergeRelation(dependents, sourceRep, circular)
        }
      }
    }
  }

  return {
    dependencies: mapToSortedArray(dependencies),
    dependents: mapToSortedArray(dependents),
  }
}

export function getNodeRelations(
  path: string,
  modules: IModule[],
  selectedPaths: string[],
  expandedFolders: Set<string>,
): ModuleRelations {
  const isFile = modules.some((m) => m.source === path)
  if (isFile) {
    return getModuleRelations(path, modules, selectedPaths)
  }
  return getFolderRelations(path, modules, selectedPaths, expandedFolders)
}
