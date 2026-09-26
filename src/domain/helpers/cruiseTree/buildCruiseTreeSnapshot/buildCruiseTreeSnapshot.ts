import type { IFlattenedRuleSet, IModule, IViolation } from 'dependency-cruiser';

import type { CruiseEdge, CruisePathNode, CruiseTreeSnapshot } from '../../../types';
import { isRuleApplicableToPath, type RuleWithViolations } from '../../cruiseRules';
import {
  collectCircularModulePaths,
  collectDistinctCycles,
  createDependencyRelationFlags,
  finalizeDependencyRelationFlags,
  isTypeOnlyDependency,
  mergeDependencyRelationFlags,
  type DependencyRelationFlags,
} from '../../dependencyUtils';
import { getAncestorKeys, getBaseName, getParentPath, isUnderFolder } from '../../pathUtils';

type ModuleDep = IModule['dependencies'][number];

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

/** Merge a dependency into a path → flags map. */
function mergeEdgeFlags(map: Map<string, DependencyRelationFlags>, path: string, dep: ModuleDep): void {
  const isTypeOnly = isTypeOnlyDependency(dep);
  const isCircular = dep.circular === true;
  const existing = map.get(path);
  if (!existing) {
    map.set(path, createDependencyRelationFlags(isTypeOnly, isCircular));
    return;
  }
  mergeDependencyRelationFlags(existing, isTypeOnly, isCircular);
}

/** Convert flags maps to sorted CruiseEdge lists. */
function flagsMapsToEdges(map: Map<string, DependencyRelationFlags>): CruiseEdge[] {
  return [...map.entries()]
    .map(([path, flags]) => {
      finalizeDependencyRelationFlags(flags);
      return {
        path,
        circular: flags.valueCircular,
        typeOnly: flags.typeOnly,
        typeOnlyCircular: flags.typeOnlyCircular,
      };
    })
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
export function buildCruiseTreeSnapshot(
  modules: readonly IModule[],
  ruleSetUsed?: IFlattenedRuleSet,
  violations?: readonly IViolation[],
): CruiseTreeSnapshot {
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

  const dependencyFlags = new Map<string, Map<string, DependencyRelationFlags>>();
  const dependentFlags = new Map<string, Map<string, DependencyRelationFlags>>();

  const ensureFlagsMap = (owner: Map<string, Map<string, DependencyRelationFlags>>, path: string) => {
    const existing = owner.get(path);
    if (existing) {
      return existing;
    }
    const created = new Map<string, DependencyRelationFlags>();
    owner.set(path, created);
    return created;
  };

  modules.forEach(module => {
    if (!Array.isArray(module.dependencies)) {
      return;
    }

    module.dependencies
      .filter((dep): dep is ModuleDep & { resolved: string } => Boolean(dep.resolved))
      .forEach(dep => {
        if (!allPaths.has(dep.resolved) && !modulePathSet.has(dep.resolved)) {
          // Still record file→resolved if resolved is a known module; skip unknown externals for folder roll-up only
        }

        if (modulePathSet.has(dep.resolved) || allPaths.has(dep.resolved)) {
          mergeEdgeFlags(ensureFlagsMap(dependencyFlags, module.source), dep.resolved, dep);
          mergeEdgeFlags(ensureFlagsMap(dependentFlags, dep.resolved), module.source, dep);
        } else if (typeof dep.resolved === 'string' && dep.resolved.length > 0) {
          // External / filtered-out targets: keep on the file node only
          mergeEdgeFlags(ensureFlagsMap(dependencyFlags, module.source), dep.resolved, dep);
        }

        const sourceAncestors = getAncestorKeys(module.source);
        const targetPath = dep.resolved;

        sourceAncestors.forEach(folder => {
          if (!isUnderFolder(targetPath, folder)) {
            mergeEdgeFlags(ensureFlagsMap(dependencyFlags, folder), targetPath, dep);
          }
        });

        if (modulePathSet.has(targetPath) || allPaths.has(targetPath)) {
          getAncestorKeys(targetPath).forEach(folder => {
            if (!isUnderFolder(module.source, folder)) {
              mergeEdgeFlags(ensureFlagsMap(dependentFlags, folder), module.source, dep);
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
      dependencies: flagsMapsToEdges(dependencyFlags.get(path) ?? new Map()),
      dependents: flagsMapsToEdges(dependentFlags.get(path) ?? new Map()),
      circularPaths,
      applicableRules: buildApplicableRules(isFolder ? descendantFiles : [path], namedRules, allViolations),
    });
  });

  // Root entries that are files need sorting folders-first at consumer; rootPaths mixes both
  const sortedRoots = [...rootPaths].sort((a, b) => {
    const aFolder = !modulePathSet.has(a);
    const bFolder = !modulePathSet.has(b);
    if (aFolder !== bFolder) {
      return aFolder ? -1 : 1;
    }
    return compareByBaseName(a, b);
  });

  return {
    nodes,
    rootPaths: sortedRoots,
    descendantFiles: modulePaths,
    cycles: collectDistinctCycles(modules),
    ruleSetUsed,
    violations: allViolations,
  };
}
