import type { CruiseSnapshot } from '../../../types';
import { isNodeModulesPath } from '../../pathUtils';

/** Default selection: all files whose ancestors are not under `node_modules`. */
export function getDefaultSelectedKeys(cruiseSnapshot: CruiseSnapshot): string[] {
  return [...cruiseSnapshot.nodes.values()]
    .filter(node => !node.isFolder && !node.ancestors.some(isNodeModulesPath))
    .map(node => node.path);
}
