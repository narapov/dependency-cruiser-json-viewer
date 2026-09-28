import type { IDependency, IFlattenedRuleSet, IModule, IViolation } from 'dependency-cruiser';

import type { RuleWithViolations } from '../helpers/cruiseRules';
import type { DistinctCycle } from '../helpers/dependencyUtils';

/** File-level dependency with explicit endpoints for snapshot edges. */
export interface ModuleDependency extends IDependency {
  /** Canonical `makeDependencyKey(source, target)`. */
  id: string;
  source: string;
  sourceAncestors: string[];
  target: string;
  targetAncestors: string[];
}

/** One file or folder path in the cruise snapshot. */
export interface CruisePathNode {
  path: string;
  parent: string | null;
  /** Nearest parent → … → root; e.g. `src/a/b/c.ts` → `["src/a/b","src/a","src"]`. */
  ancestors: string[];
  isFolder: boolean;
  children: Map<string, CruisePathNode>;
  /** File sources under this folder; empty for file nodes. */
  descendantFiles: Set<string>;
  originModule?: IModule;
  /** Edges that stay inside this folder's subtree (empty for files). */
  internalDependencies: Map<string, ModuleDependency[]>;
  /** Edges that leave this path's subtree (file: all deps). */
  externalDependencies: Map<string, ModuleDependency[]>;
  /** Reverse edges that stay inside this folder's subtree (empty for files). */
  internalDependents: Map<string, ModuleDependency[]>;
  /** Reverse edges that enter this path's subtree (file: all dependents). */
  externalDependents: Map<string, ModuleDependency[]>;
  /** Rules whose path restrictions apply; folders union descendants. */
  applicableRules: RuleWithViolations[];
}

/** Immutable path index built once from filtered cruise modules. */
export interface CruiseSnapshot {
  /** Flat path → node index (files + folders). */
  nodes: Map<string, CruisePathNode>;
  /** Root path → node hierarchy. */
  tree: Map<string, CruisePathNode>;
  /** Module dependency indexes from `buildModulesDependencies`. */
  dependencies: {
    byDependencyKey: Map<string, ModuleDependency[]>;
    bySource: Map<string, ModuleDependency[]>;
    byTarget: Map<string, ModuleDependency[]>;
  };
  cycles: DistinctCycle[];
  ruleSetUsed?: IFlattenedRuleSet;
  /** Violations keyed by `makeDependencyKey(from, to)`. */
  violations: Map<string, IViolation[]>;
}
