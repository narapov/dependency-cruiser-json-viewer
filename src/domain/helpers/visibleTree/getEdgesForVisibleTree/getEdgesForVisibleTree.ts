import type { CruiseSnapshot, ModuleDependency } from '../../../types';
import { makeDependencyKey } from '../../dependencyKey';
import {
  createDependencyViolationFlags,
  deriveRelationFlagsFromAggregated,
  mergeDependencyViolationFlags,
  type DependencyViolationFlags,
} from '../../dependencyUtils';
import type { VisibleTreeNode } from '../getVisibleTree';
import { getVisibleTreeLeafNodePaths } from '../getVisibleTreeLeafNodePaths';

/** Leaf-to-leaf edge derived from a visible tree. */
export interface VisibleTreeEdge {
  source: string;
  target: string;
  key: string;
  aggregated: ModuleDependency[];
  typeOnly: boolean;
  valueCircular: boolean;
  typeOnlyCircular: boolean;
  violations: DependencyViolationFlags;
}

/** Build leaf-to-leaf edges for a visible tree among selected modules. */
export function getEdgesForVisibleTree(
  cruiseSnapshot: CruiseSnapshot,
  visibleTree: readonly VisibleTreeNode[],
  selectedFilePaths: Record<string, boolean | undefined>,
): VisibleTreeEdge[] {
  const aggregatedEdgesMap = new Map<string, ModuleDependency[]>();
  const edgesMap = new Map<string, { source: string; target: string }>();

  const leafNodePaths = getVisibleTreeLeafNodePaths(visibleTree);

  leafNodePaths.forEach(leafNodePath => {
    const leafNode = cruiseSnapshot.nodes.get(leafNodePath);
    if (!leafNode) {
      return;
    }
    const otherLeafNodePaths = leafNodePaths.filter(otherPath => otherPath !== leafNodePath);

    leafNode.externalDependencies
      .values()
      .flatMap(aggregated => aggregated.filter(dep => selectedFilePaths[dep.target]))
      .forEach(dep => {
        otherLeafNodePaths.forEach(otherLeafPath => {
          if (otherLeafPath === dep.target || dep.targetAncestors.includes(otherLeafPath)) {
            const key = makeDependencyKey(leafNodePath, otherLeafPath);
            edgesMap.set(key, {
              source: leafNodePath,
              target: otherLeafPath,
            });
            if (aggregatedEdgesMap.has(key)) {
              aggregatedEdgesMap.get(key)!.push(dep);
              return;
            }
            aggregatedEdgesMap.set(key, [dep]);
          }
        });
      });
  });

  return edgesMap
    .entries()
    .map(([key, value]) => {
      const aggregated = aggregatedEdgesMap.get(key) ?? [];
      const { typeOnly, valueCircular, typeOnlyCircular } = deriveRelationFlagsFromAggregated(aggregated);
      const violations = createDependencyViolationFlags({ couldNotResolve: false, rules: [] });
      aggregated.forEach(dep => {
        mergeDependencyViolationFlags(violations, createDependencyViolationFlags(dep));
      });

      return {
        ...value,
        key,
        aggregated,
        typeOnly,
        valueCircular,
        typeOnlyCircular,
        violations,
      };
    })
    .toArray();
}
