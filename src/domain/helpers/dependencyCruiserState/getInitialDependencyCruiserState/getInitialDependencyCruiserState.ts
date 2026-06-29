import type { DependencyCruiserState } from '../../../types';
import { getDefaultExpandedKeys } from '../getDefaultExpandedKeys';
import { getDefaultSelectedKeys } from '../getDefaultSelectedKeys';

export function getInitialDependencyCruiserState(sources: string[]): DependencyCruiserState {
  return {
    selectedKeys: getDefaultSelectedKeys(sources),
    expandedKeys: getDefaultExpandedKeys(sources),
  };
}
