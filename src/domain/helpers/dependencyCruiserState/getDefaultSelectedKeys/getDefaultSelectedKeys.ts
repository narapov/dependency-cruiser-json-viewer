import type { CruiseSnapshot } from '../../../types';
import { isBuiltInPath, isNodeModulesPath } from '../../pathUtils';

/** Default selection: all files outside `node_modules` and the synthetic `:buildIn:` namespace. */
export function getDefaultSelectedKeys(cruiseSnapshot: CruiseSnapshot): string[] {
  return cruiseSnapshot.nodes
    .values()
    .filter(
      node =>
        !node.isFolder && !node.ancestors.some(ancestor => isNodeModulesPath(ancestor) || isBuiltInPath(ancestor)),
    )
    .map(node => node.path)
    .toArray();
}
