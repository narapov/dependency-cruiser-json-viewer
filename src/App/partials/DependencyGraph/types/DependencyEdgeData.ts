import type { ModuleDependency } from '@/domain';

/** Dependency fields stored on a graph edge for highlights and membership checks. */
export type DependencyEdgeAggregated = Pick<ModuleDependency, 'id' | 'source' | 'target'>;

export interface DependencyEdgeData {
  typeOnly?: boolean;
  valueCircular?: boolean;
  typeOnlyCircular?: boolean;
  couldNotResolve?: boolean;
  severity?: 'error' | 'warn';
  ruleNames?: string[];
  aggregated?: DependencyEdgeAggregated[];
  [key: string]: unknown;
}
