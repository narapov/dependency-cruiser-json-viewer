import type { IModule } from 'dependency-cruiser';

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
  childFolders: string[];
  childFiles: string[];
  /** Files under this folder; `[path]` for a file node. */
  descendantModules: string[];
  module?: IModule;
  /** File: direct deps; folder: edges that leave the subtree. */
  dependencies: CruiseEdge[];
  /** File: reverse deps; folder: edges that enter the subtree. */
  dependents: CruiseEdge[];
  /** File: self if circular; folder: descendant modules in any cycle. */
  circularPaths: string[];
  /** Rules whose path restrictions apply; folders union descendants. */
  applicableRules: RuleWithViolations[];
}

/** Immutable path index built once from filtered cruise modules. */
export interface CruiseTreeSnapshot {
  nodes: Map<string, CruisePathNode>;
  rootPaths: string[];
  modulePaths: string[];
  cycles: DistinctCycle[];
}
