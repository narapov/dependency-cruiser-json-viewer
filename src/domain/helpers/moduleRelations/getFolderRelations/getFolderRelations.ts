import type { IModule } from 'dependency-cruiser'
import type { ModuleRelation, ModuleRelations } from '../../../types'
import { getRepresentative, isUnderFolder } from '../../pathUtils'

function mergeRelation(map: Map<string, boolean>, path: string, circular: boolean): void {
  map.set(path, (map.get(path) ?? false) || circular)
}

function mapToSortedArray(map: Map<string, boolean>): ModuleRelation[] {
  return [...map.entries()]
    .map(([path, circular]) => ({ path, circular }))
    .sort((a, b) => a.path.localeCompare(b.path))
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
