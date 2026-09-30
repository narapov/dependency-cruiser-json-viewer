import type { CruiseSnapshot, ModuleDependency } from '../../../types';
import { makeDependencyKey } from '../../dependencyKey';
import {
  createDependencyViolationFlags,
  deriveRelationFlagsFromAggregated,
  mergeDependencyViolationFlags,
  type DependencyViolationFlags,
} from '../../dependencyUtils';

/** Edge between two node paths (visible leaves or folder siblings), with aggregated deps. */
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

/** Build edges among an explicit set of node paths using each node's externalDependencies. */
export function getEdgesAmongNodePaths(
  cruiseSnapshot: CruiseSnapshot,
  nodePaths: readonly string[],
  selectedFilePaths: Record<string, boolean | undefined>,
): VisibleTreeEdge[] {
  const aggregatedEdgesMap = new Map<string, ModuleDependency[]>();
  const edgesMap = new Map<string, { source: string; target: string }>();

  nodePaths.forEach(nodePath => {
    const node = cruiseSnapshot.nodes.get(nodePath);
    if (!node) {
      return;
    }
    const otherNodePaths = nodePaths.filter(otherPath => otherPath !== nodePath);

    node.externalDependencies
      .values()
      .flatMap(aggregated => aggregated.filter(dep => selectedFilePaths[dep.target]))
      .forEach(dep => {
        otherNodePaths.forEach(otherNodePath => {
          if (otherNodePath === dep.target || dep.targetAncestors.includes(otherNodePath)) {
            const key = makeDependencyKey(nodePath, otherNodePath);
            edgesMap.set(key, {
              source: nodePath,
              target: otherNodePath,
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
