import type { CruisePathNode, CruiseSnapshot, ModuleDependency } from '../../../types';
import { deriveRelationFlagsFromAggregated } from '../../dependencyUtils';

/** One node in the selection/expansion-driven visible tree. */
export interface VisibleTreeNode {
  path: string;
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

/** Build the visible tree for the current selection and folder expansion. */
export function getVisibleTree(
  cruiseSnapshot: CruiseSnapshot,
  selectedFilePaths: Record<string, boolean | undefined>,
  expandedFolderPaths: Record<string, boolean | undefined>,
): VisibleTreeNode[] {
  const roots: VisibleTreeNode[] = [];
  const stack: {
    node: CruisePathNode;
    parentChildren: VisibleTreeNode[];
  }[] = cruiseSnapshot.tree
    .values()
    .map(node => ({
      node,
      parentChildren: roots,
    }))
    .toArray();

  while (stack.length > 0) {
    const { node, parentChildren } = stack.pop()!;
    if (isVisibleTreeNode(node, selectedFilePaths)) {
      const circularFlags = getNodeCircularFlags(node, selectedFilePaths);
      if (node.isFolder && expandedFolderPaths[node.path]) {
        const children: VisibleTreeNode[] = [];
        parentChildren.push({ path: node.path, children, ...circularFlags });
        node.children.forEach(child => {
          stack.push({ node: child, parentChildren: children });
        });
      } else {
        parentChildren.push({ path: node.path, ...circularFlags });
      }
    }
  }

  return roots;
}
