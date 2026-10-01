import type { CruiseSnapshot, DependencyCruiserState } from '../../../types';
import { getDefaultExpandedKeys } from '../getDefaultExpandedKeys';
import { getDefaultSelectedKeys } from '../getDefaultSelectedKeys';

/** Build the initial selected and expanded keys for a cruise snapshot. */
export function getInitialDependencyCruiserState(cruiseSnapshot: CruiseSnapshot): DependencyCruiserState {
  return {
    selectedKeys: getDefaultSelectedKeys(cruiseSnapshot),
    expandedKeys: getDefaultExpandedKeys(cruiseSnapshot),
  };
}
