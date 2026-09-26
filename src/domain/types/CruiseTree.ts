import type { IFlattenedRuleSet, IModule, IViolation } from 'dependency-cruiser';

import type { RuleWithViolations } from '../helpers/cruiseRules';
import type { DistinctCycle } from '../helpers/dependencyUtils';

/** Precomputed dependency edge between paths in the cruise tree snapshot. */
export interface CruiseEdge {
  path: string;
  circular: boolean;
  typeOnly: boolean;
  typeOnlyCircular: boolean;
}

/** One file or folder path in the cruise tree snapshot. */
export interface CruisePathNode {
  path: string;
  name: string;
  /** Nearest parent → … → root; e.g. `src/a/b/c.ts` → `["src/a/b","src/a","src"]`. */
  ancestors: string[];
  isFolder: boolean;
  parentPath: string | null;
  /** Direct child paths: folders first, then files; empty for file nodes. */
  childPaths: string[];
  /** File sources under this folder; empty for file nodes. */
  descendantFiles: string[];
  module?: IModule;
  /** File: direct deps; folder: edges that leave the subtree. */
  dependencies: CruiseEdge[];
  /** File: reverse deps; folder: edges that enter the subtree. */
  dependents: CruiseEdge[];
  /** Descendant files in any cycle; empty for file nodes. */
  circularPaths: string[];
  /** Rules whose path restrictions apply; folders union descendants. */
  applicableRules: RuleWithViolations[];
}

/** Immutable path index built once from filtered cruise modules. */
export interface CruiseTreeSnapshot {
  nodes: Map<string, CruisePathNode>;
  rootPaths: string[];
  /** All file sources in the cruise result. */
  descendantFiles: string[];
  cycles: DistinctCycle[];
  ruleSetUsed?: IFlattenedRuleSet;
  violations: readonly IViolation[];
}
