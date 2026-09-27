import type { IDependency, IFlattenedRuleSet, IModule, IViolation } from 'dependency-cruiser';

import type { RuleWithViolations } from '../helpers/cruiseRules';
import type { DistinctCycle } from '../helpers/dependencyUtils';

/** File-level dependency with explicit endpoints for snapshot edges. */
export interface AggregatedDependency extends IDependency {
  /** Canonical `makeDependencyKey(source, target)`. */
  id: string;
  source: string;
  target: string;
}

/** Precomputed dependency edge between paths in the cruise snapshot. */
export interface CruiseEdge {
  path: string;
  aggregated: AggregatedDependency[];
}

/** One file or folder path in the cruise snapshot. */
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

/** Nested path entry in the precomputed cruise hierarchy. */
export interface HierarchicalNode {
  path: string;
  /** Present only for folders. */
  children?: HierarchicalNode[];
}

/** Immutable path index built once from filtered cruise modules. */
export interface CruiseSnapshot {
  nodes: Map<string, CruisePathNode>;
  rootPaths: string[];
  /** Nested path hierarchy (folders + files); built once with the snapshot. */
  tree: HierarchicalNode[];
  /** All file sources in the cruise result. */
  descendantFiles: string[];
  /** Module deps keyed by `makeDependencyKey(source, target)`; shared into file node edges. */
  modulesDependencies: Map<string, AggregatedDependency[]>;
  cycles: DistinctCycle[];
  ruleSetUsed?: IFlattenedRuleSet;
  violations: readonly IViolation[];
}
