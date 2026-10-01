import type { IFlattenedRuleSet, IModule, IViolation } from 'dependency-cruiser';

import type { CruisePathNode, CruiseSnapshot, DistinctCycle, ModuleDependency } from '../../../types';
import {
  flattenViolations,
  groupRulesWithViolations,
  isRuleApplicableToPath,
  type RuleWithViolations,
} from '../../cruiseRules';
import { makeDependencyKey } from '../../dependencyKey';
import { collectDistinctCycles } from '../../dependencyUtils';
import { getAncestorKeys, getBaseName, getParentPath } from '../../pathUtils';
import { buildModulesDependencies } from '../buildModulesDependencies';

interface NamedRuleEntry {
  name: string;
  severity: RuleWithViolations['severity'];
  rule: NonNullable<RuleWithViolations['rule']>;
}

/** Collect named rules from a flattened rule set in forbidden → allowed → required order. */
function collectNamedRules(ruleSet: IFlattenedRuleSet | undefined): NamedRuleEntry[] {
  if (!ruleSet) {
    return [];
  }

  return [...(ruleSet.forbidden ?? []), ...(ruleSet.allowed ?? []), ...(ruleSet.required ?? [])].flatMap(rule => {
    const name = 'name' in rule && typeof rule.name === 'string' ? rule.name : undefined;
    if (!name) {
      return [];
    }
    const severity = 'severity' in rule && rule.severity ? rule.severity : ('warn' as RuleWithViolations['severity']);
    return [{ name, severity, rule }];
  });
}

/** Index violations by `makeDependencyKey(from, to)`. */
function indexViolationsByDependencyKey(violations: readonly IViolation[]): Map<string, IViolation[]> {
  const map = new Map<string, IViolation[]>();
  violations.forEach(violation => {
    const key = makeDependencyKey(violation.from, violation.to);
    const existing = map.get(key);
    if (existing) {
      existing.push(violation);
      return;
    }
    map.set(key, [violation]);
  });
  return map;
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

function fillDescendantFiles(tree: Map<string, CruisePathNode>): void {
  const stack = [...tree.values()];
  const nodes: CruisePathNode[] = [];

  while (stack.length > 0) {
    const node = stack.pop()!;

    if (node.isFolder) {
      nodes.push(node);
      stack.push(...node.children.values());
    }
  }

  nodes.reverse().forEach(node => {
    node.children.forEach(child => {
      if (child.isFolder) {
        child.descendantFiles.forEach(filePath => node.descendantFiles.add(filePath));
        return;
      }
      node.descendantFiles.add(child.path);
    });
  });
}

function createTree(
  modules: readonly IModule[],
  modulesDependenciesBySource: ReadonlyMap<string, ModuleDependency[]>,
  modulesDependenciesByTarget: ReadonlyMap<string, ModuleDependency[]>,
  namedRules: readonly NamedRuleEntry[],
  violations: readonly IViolation[],
): Map<string, CruisePathNode> {
  const tree = new Map<string, CruisePathNode>();

  modules.forEach(module => {
    const { source } = module;
    const parent = getParentPath(source);
    const ancestors = getAncestorKeys(source).reverse();

    let current = tree;

    for (let index = 0; index < ancestors.length; index++) {
      const ancestor = ancestors[index]!;

      if (current.has(ancestor)) {
        current = current.get(ancestor)!.children;
      } else {
        const allDependencies = modulesDependenciesBySource.get(ancestor) ?? [];
        const internalDependencies = Map.groupBy(
          allDependencies.filter(d => d.targetAncestors.includes(ancestor)),
          d => d.id,
        );
        const externalDependencies = Map.groupBy(
          allDependencies.filter(d => !d.targetAncestors.includes(ancestor)),
          d => d.id,
        );

        const allDependents = modulesDependenciesByTarget.get(ancestor) ?? [];
        const internalDependents = Map.groupBy(
          allDependents.filter(d => d.sourceAncestors.includes(ancestor)),
          d => d.id,
        );
        const externalDependents = Map.groupBy(
          allDependents.filter(d => !d.sourceAncestors.includes(ancestor)),
          d => d.id,
        );

        current.set(ancestor, {
          path: ancestor,
          parent: ancestors[index - 1] ?? null,
          ancestors: ancestors.slice(0, index).reverse(),
          isFolder: true,
          children: new Map(),
          descendantFiles: new Set(),
          internalDependencies,
          externalDependencies,
          externalDependents,
          internalDependents,
          applicableRules: [],
        });
        current = current.get(ancestor)!.children;
      }
    }

    current.set(source, {
      path: source,
      parent,
      ancestors: getAncestorKeys(source),
      isFolder: false,
      children: new Map(),
      descendantFiles: new Set(),
      originModule: module,
      internalDependencies: new Map(),
      externalDependencies: Map.groupBy(modulesDependenciesBySource.get(source) ?? [], item => item.id),
      internalDependents: new Map(),
      externalDependents: Map.groupBy(modulesDependenciesByTarget.get(source) ?? [], item => item.id),
      applicableRules: buildApplicableRules([source], namedRules, violations),
    });
  });

  fillDescendantFiles(tree);
  sortChildren(tree);

  const stack = [...tree.values()];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.isFolder) {
      node.applicableRules = buildApplicableRules([...node.descendantFiles], namedRules, violations);
      stack.push(...node.children.values());
    }
  }

  return tree;
}

/** Sort each node's children: folders first, then basename. Also reorder top-level roots. */
function sortChildren(tree: Map<string, CruisePathNode>): void {
  const sortNodes = (nodes: CruisePathNode[]): CruisePathNode[] =>
    [...nodes].sort((a, b) => {
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      return getBaseName(a.path).localeCompare(getBaseName(b.path));
    });

  const stack = [...tree.values()];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.children.size > 0) {
      const sorted = sortNodes([...node.children.values()]);
      node.children.clear();
      sorted.forEach(child => node.children.set(child.path, child));
      stack.push(...sorted);
    }
  }

  const sortedRoots = sortNodes([...tree.values()]);
  tree.clear();
  sortedRoots.forEach(root => tree.set(root.path, root));
}

function createFlatTree(tree: ReadonlyMap<string, CruisePathNode>): Map<string, CruisePathNode> {
  const stack = [...tree.values()];
  const flatTree = new Map<string, CruisePathNode>();

  while (stack.length > 0) {
    const node = stack.pop()!;
    flatTree.set(node.path, node);
    stack.push(...node.children.values());
  }

  return flatTree;
}

/**
 * Build an immutable path index (files + folders) from filtered cruise modules.
 * Computed once after load / ignore filtering; consumers look up paths instead of rescanning modules.
 * Pass `cycles` to attach a precomputed catalog (e.g. from unfiltered modules); otherwise collect from `modules`.
 */
export function buildCruiseSnapshot(
  modules: readonly IModule[],
  ruleSetUsed?: IFlattenedRuleSet,
  violations?: readonly IViolation[] | ReadonlyMap<string, readonly IViolation[]>,
  cycles?: readonly DistinctCycle[],
): CruiseSnapshot {
  const { modulesDependenciesByDependencyKey, modulesDependenciesBySource, modulesDependenciesByTarget } =
    buildModulesDependencies(modules);
  const namedRules = collectNamedRules(ruleSetUsed);
  const moduleSources = new Set(modules.map(module => module.source));
  const scopedViolations = flattenViolations(violations).filter(violation => moduleSources.has(violation.from));
  const tree = createTree(
    modules,
    modulesDependenciesBySource,
    modulesDependenciesByTarget,
    namedRules,
    scopedViolations,
  );
  const nodes = createFlatTree(tree);

  return {
    nodes,
    tree,
    dependencies: {
      byDependencyKey: modulesDependenciesByDependencyKey as Map<string, ModuleDependency[]>,
      bySource: modulesDependenciesBySource as Map<string, ModuleDependency[]>,
      byTarget: modulesDependenciesByTarget as Map<string, ModuleDependency[]>,
    },
    cycles: cycles ? [...cycles] : collectDistinctCycles(modules),
    rules: groupRulesWithViolations(ruleSetUsed, scopedViolations),
    ruleSetUsed,
    violations: indexViolationsByDependencyKey(scopedViolations),
  };
}
