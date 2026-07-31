import type { DependencyCruiserState } from '../../../types';
import { getDefaultExpandedKeys } from '../getDefaultExpandedKeys';
import { getDefaultSelectedKeys } from '../getDefaultSelectedKeys';

/** Build the initial selected and expanded keys for a cruise result. */
export function getInitialDependencyCruiserState(sources: string[]): DependencyCruiserState {
  return {
    selectedKeys: getDefaultSelectedKeys(sources),
    expandedKeys: getDefaultExpandedKeys(sources),
  };
}
