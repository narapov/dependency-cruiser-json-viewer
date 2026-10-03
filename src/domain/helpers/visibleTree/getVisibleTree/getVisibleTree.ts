import type { CruisePathNode, CruiseSnapshot, ModuleDependency } from '../../../types';
import { deriveRelationFlagsFromAggregated } from '../../dependencyUtils';

/** One node in the selection/expansion-driven visible tree. */
export interface VisibleTreeNode {
  path: string;
  /** Nearest parent → … → root from {@link CruiseSnapshot.nodes} (FS ancestry). */
  ancestors: string[];
  /** Visible node paths strictly below this node (folders + files). */
  descendants: string[];
  children?: VisibleTreeNode[];
  valueCircular: boolean;
  typeOnlyCircular: boolean;
}

function isVisibleTreeNode(treeNode: CruisePathNode, selectedFilePaths: Record<string, boolean | undefined>): boolean {
  return treeNode.isFolder
    ? [...treeNode.descendantFiles].some(filePath => selectedFilePaths[filePath])
    : Boolean(selectedFilePaths[treeNode.path]);
}

/** Derive circular flags from selected deps/dependents (external + internal). */
function getNodeCircularFlags(
  node: CruisePathNode,
  selectedFilePaths: Record<string, boolean | undefined>,
): Pick<VisibleTreeNode, 'valueCircular' | 'typeOnlyCircular'> {
  const collectSelected = (buckets: ReadonlyMap<string, ModuleDependency[]>): ModuleDependency[] =>
    [...buckets.values()].flatMap(aggregated =>
      aggregated.filter(dep => selectedFilePaths[dep.source] && selectedFilePaths[dep.target]),
    );

  const selectedDeps = [
    ...collectSelected(node.externalDependencies),
    ...collectSelected(node.internalDependencies),
    ...collectSelected(node.externalDependents),
    ...collectSelected(node.internalDependents),
  ];

  const { valueCircular, typeOnlyCircular } = deriveRelationFlagsFromAggregated(selectedDeps);
  return { valueCircular, typeOnlyCircular };
}

function buildVisibleNode(
  cruiseSnapshot: CruiseSnapshot,
  cruiseNode: CruisePathNode,
  selectedFilePaths: Record<string, boolean | undefined>,
  expandedFolderPaths: Record<string, boolean | undefined>,
): VisibleTreeNode | null {
  if (!isVisibleTreeNode(cruiseNode, selectedFilePaths)) {
    return null;
  }

  const circularFlags = getNodeCircularFlags(cruiseNode, selectedFilePaths);
  const ancestors = cruiseSnapshot.nodes.get(cruiseNode.path)!.ancestors;

  if (cruiseNode.isFolder && expandedFolderPaths[cruiseNode.path]) {
    const children = [...cruiseNode.children.values()]
      .map(child => buildVisibleNode(cruiseSnapshot, child, selectedFilePaths, expandedFolderPaths))
      .filter((node): node is VisibleTreeNode => node !== null);
    const descendants = children.flatMap(child => [child.path, ...child.descendants]);

    return {
      path: cruiseNode.path,
      ancestors,
      descendants,
      children,
      ...circularFlags,
    };
  }

  return {
    path: cruiseNode.path,
    ancestors,
    descendants: [],
    ...circularFlags,
  };
}

/** Build the visible tree for the current selection and folder expansion. */
export function getVisibleTree(
  cruiseSnapshot: CruiseSnapshot,
  selectedFilePaths: Record<string, boolean | undefined>,
  expandedFolderPaths: Record<string, boolean | undefined>,
): VisibleTreeNode[] {
  return [...cruiseSnapshot.tree.values()]
    .map(node => buildVisibleNode(cruiseSnapshot, node, selectedFilePaths, expandedFolderPaths))
    .filter((node): node is VisibleTreeNode => node !== null);
}
