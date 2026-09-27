import type { IFlattenedRuleSet, IModule, IViolation } from 'dependency-cruiser';

import type {
  AggregatedDependency,
  CruiseEdge,
  CruisePathNode,
  CruiseSnapshot,
  HierarchicalNode,
} from '../../../types';
import { isRuleApplicableToPath, type RuleWithViolations } from '../../cruiseRules';
import { collectCircularModulePaths, collectDistinctCycles } from '../../dependencyUtils';
import { getAncestorKeys, getBaseName, getParentPath, isUnderFolder } from '../../pathUtils';
import { buildModulesDependencies } from '../buildModulesDependencies';

interface NamedRuleEntry {
  name: string;
  severity: RuleWithViolations['severity'];
  rule: NonNullable<RuleWithViolations['rule']>;
}

/** Collect named rules from a flattened rule set in forbidden → allowed → required order. */
function collectNamedRules(ruleSet: IFlattenedRuleSet | undefined): NamedRuleEntry[] {
  if (ruleSet == null) {
    return [];
  }

  return [...(ruleSet.forbidden ?? []), ...(ruleSet.allowed ?? []), ...(ruleSet.required ?? [])].flatMap(rule => {
    const name = 'name' in rule && typeof rule.name === 'string' ? rule.name : undefined;
    if (name == null) {
      return [];
    }
    const severity =
      'severity' in rule && rule.severity != null ? rule.severity : ('warn' as RuleWithViolations['severity']);
    return [{ name, severity, rule }];
  });
}

/** Append a shared AggregatedDependency onto an endpoint → aggregated map (folder rollup). */
function pushAggregatedEntry(
  map: Map<string, AggregatedDependency[]>,
  endpoint: string,
  entry: AggregatedDependency,
): void {
  const existing = map.get(endpoint);
  if (existing) {
    existing.push(entry);
    return;
  }
  map.set(endpoint, [entry]);
}

/** Point an endpoint at a shared modulesDependencies bucket (file-level edges). */
function shareEndpointBucket(
  map: Map<string, AggregatedDependency[]>,
  endpoint: string,
  bucket: AggregatedDependency[],
): void {
  if (!map.has(endpoint)) {
    map.set(endpoint, bucket);
  }
}

/** Convert aggregated maps to sorted CruiseEdge lists. */
function aggregatedMapsToEdges(map: Map<string, AggregatedDependency[]>): CruiseEdge[] {
  return [...map.entries()]
    .map(([path, aggregated]) => ({ path, aggregated }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** Rules applicable to any of the target module paths, with matching violations. */
function buildApplicableRules(
  targetPaths: readonly string[],
  namedRules: readonly NamedRuleEntry[],
  violations: readonly IViolation[],
): RuleWithViolations[] {
  if (targetPaths.length === 0) {
    return [];
  }

  const targetSet = new Set(targetPaths);
  const violationsByName = new Map<string, IViolation[]>();
  violations
    .filter(violation => targetSet.has(violation.from))
    .forEach(violation => {
      const name = violation.rule.name;
      const existing = violationsByName.get(name);
      if (existing) {
        existing.push(violation);
      } else {
        violationsByName.set(name, [violation]);
      }
    });

  return namedRules
    .filter(entry => targetPaths.some(target => isRuleApplicableToPath(entry.rule, target)))
    .map(entry => ({
      name: entry.name,
      severity: entry.severity,
      rule: entry.rule,
      violations: violationsByName.get(entry.name) ?? [],
    }));
}

/** Compare path basenames for sibling ordering. */
function compareByBaseName(a: string, b: string): number {
  return getBaseName(a).localeCompare(getBaseName(b));
}

/**
 * Build an immutable path index (files + folders) from filtered cruise modules.
 * Computed once after load / ignore filtering; consumers look up paths instead of rescanning modules.
 */
export function buildCruiseSnapshot(
  modules: readonly IModule[],
  ruleSetUsed?: IFlattenedRuleSet,
  violations?: readonly IViolation[],
): CruiseSnapshot {
  const modulePaths = modules.map(module => module.source);
  const moduleBySource = new Map(modules.map(module => [module.source, module]));
  const modulePathSet = new Set(modulePaths);

  const allPaths = new Set<string>();
  modulePaths.forEach(source => {
    allPaths.add(source);
    getAncestorKeys(source).forEach(ancestor => allPaths.add(ancestor));
  });

  const childFoldersByParent = new Map<string, string[]>();
  const childFilesByParent = new Map<string, string[]>();
  const rootPaths: string[] = [];

  allPaths.forEach(path => {
    const parent = getParentPath(path);
    const isFolder = !modulePathSet.has(path);
    if (parent == null || !allPaths.has(parent)) {
      rootPaths.push(path);
      return;
    }
    if (isFolder) {
      const siblings = childFoldersByParent.get(parent) ?? [];
      siblings.push(path);
      childFoldersByParent.set(parent, siblings);
      return;
    }
    const siblings = childFilesByParent.get(parent) ?? [];
    siblings.push(path);
    childFilesByParent.set(parent, siblings);
  });

  rootPaths.sort(compareByBaseName);
  childFoldersByParent.forEach(siblings => siblings.sort(compareByBaseName));
  childFilesByParent.forEach(siblings => siblings.sort(compareByBaseName));

  const descendantFilesByPath = new Map<string, string[]>();
  allPaths.forEach(path => {
    if (modulePathSet.has(path)) {
      descendantFilesByPath.set(path, []);
      return;
    }
    descendantFilesByPath.set(
      path,
      modulePaths.filter(source => isUnderFolder(source, path) && source !== path),
    );
  });

  const modulesDependencies = buildModulesDependencies(modules);
  const dependencyAggregated = new Map<string, Map<string, AggregatedDependency[]>>();
  const dependentAggregated = new Map<string, Map<string, AggregatedDependency[]>>();

  const ensureEndpointMap = (owner: Map<string, Map<string, AggregatedDependency[]>>, path: string) => {
    const existing = owner.get(path);
    if (existing) {
      return existing;
    }
    const created = new Map<string, AggregatedDependency[]>();
    owner.set(path, created);
    return created;
  };

  modulesDependencies.forEach(bucket => {
    const source = bucket[0]?.source;
    const targetPath = bucket[0]?.target;
    if (source == null || targetPath == null) {
      return;
    }

    const isInternalTarget = modulePathSet.has(targetPath) || allPaths.has(targetPath);

    // File-level deps (internal + external): share modulesDependencies bucket
    shareEndpointBucket(ensureEndpointMap(dependencyAggregated, source), targetPath, bucket);

    if (isInternalTarget) {
      shareEndpointBucket(ensureEndpointMap(dependentAggregated, targetPath), source, bucket);
    }

    bucket.forEach(entry => {
      getAncestorKeys(source).forEach(folder => {
        if (!isUnderFolder(targetPath, folder)) {
          pushAggregatedEntry(ensureEndpointMap(dependencyAggregated, folder), targetPath, entry);
        }
      });

      if (isInternalTarget) {
        getAncestorKeys(targetPath).forEach(folder => {
          if (!isUnderFolder(source, folder)) {
            pushAggregatedEntry(ensureEndpointMap(dependentAggregated, folder), source, entry);
          }
        });
      }
    });
  });

  const circularModuleSet = new Set(collectCircularModulePaths(modules));
  const namedRules = collectNamedRules(ruleSetUsed);
  const allViolations = violations ?? [];

  const nodes = new Map<string, CruisePathNode>();
  allPaths.forEach(path => {
    const isFolder = !modulePathSet.has(path);
    const ancestors = getAncestorKeys(path);
    const descendantFiles = descendantFilesByPath.get(path) ?? [];
    const circularPaths = isFolder ? descendantFiles.filter(modulePath => circularModuleSet.has(modulePath)) : [];

    nodes.set(path, {
      path,
      name: getBaseName(path),
      ancestors,
      isFolder,
      parentPath: getParentPath(path),
      childPaths: [...(childFoldersByParent.get(path) ?? []), ...(childFilesByParent.get(path) ?? [])],
      descendantFiles,
      module: moduleBySource.get(path),
      dependencies: aggregatedMapsToEdges(dependencyAggregated.get(path) ?? new Map()),
      dependents: aggregatedMapsToEdges(dependentAggregated.get(path) ?? new Map()),
      circularPaths,
      applicableRules: buildApplicableRules(isFolder ? descendantFiles : [path], namedRules, allViolations),
    });
  });

  const sortedRoots = [...rootPaths].sort((a, b) => {
    const aFolder = !modulePathSet.has(a);
    const bFolder = !modulePathSet.has(b);
    if (aFolder !== bFolder) {
      return aFolder ? -1 : 1;
    }
    return compareByBaseName(a, b);
  });

  const buildHierarchy = (paths: readonly string[]): HierarchicalNode[] =>
    paths.map(path => {
      const node = nodes.get(path);
      if (node == null || !node.isFolder) {
        return { path };
      }
      return {
        path,
        children: buildHierarchy(node.childPaths),
      };
    });

  return {
    nodes,
    rootPaths: sortedRoots,
    tree: buildHierarchy(sortedRoots),
    descendantFiles: modulePaths,
    modulesDependencies,
    cycles: collectDistinctCycles(modules),
    ruleSetUsed,
    violations: allViolations,
  };
}
