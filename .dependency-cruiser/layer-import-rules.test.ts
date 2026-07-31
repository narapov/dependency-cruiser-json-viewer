import type { IRegularForbiddenRuleType } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildLayerImportRules } from './layer-import-rules.mjs';

function re(pattern: string) {
  return new RegExp(pattern);
}

function byName(rules: IRegularForbiddenRuleType[]) {
  return new Map(rules.map(rule => [rule.name, rule]));
}

describe('buildLayerImportRules', () => {
  const rules = buildLayerImportRules();
  const named = byName(rules);

  it('exports all layer rules', () => {
    expect(rules).toHaveLength(5);
    expect(named.has('domain-only-domain')).toBe(true);
    expect(named.has('shared-only-shared-and-domain')).toBe(true);
    expect(named.has('shared-feature-partials-only-shared-domain-and-self')).toBe(true);
    expect(named.has('domain-feature-partials-only-domain-and-self')).toBe(true);
    expect(named.has('app-root-only-shared-domain-and-partial-barrels')).toBe(true);
  });

  it('domain-only-domain allows only src/domain targets', () => {
    const rule = named.get('domain-only-domain')!;
    expect(re(rule.from.path as string).test('src/domain/helpers/pathUtils/getParentPath.ts')).toBe(true);
    expect(re(rule.to.pathNot as string).test('src/domain/types/ModuleRelations.ts')).toBe(true);
    expect(re(rule.to.pathNot as string).test('src/Shared/helpers/foo.ts')).toBe(false);
  });

  it('shared-only-shared-and-domain allows Shared and domain', () => {
    const rule = named.get('shared-only-shared-and-domain')!;
    const pathNot = Array.isArray(rule.to.pathNot) ? rule.to.pathNot : [rule.to.pathNot];
    expect(pathNot.some(pattern => re(pattern as string).test('src/Shared/hooks/useResizableWidth.ts'))).toBe(true);
    expect(pathNot.some(pattern => re(pattern as string).test('src/domain/helpers/pathUtils.ts'))).toBe(true);
    expect(pathNot.some(pattern => re(pattern as string).test('src/App/partials/FileTree/FileTree.tsx'))).toBe(false);
    expect(
      re(rule.from.pathNot as string).test(
        'src/Shared/components/ErrorBoundaryFallback/ErrorBoundaryFallback.test.tsx',
      ),
    ).toBe(true);
  });

  it('app-root-only-shared-domain-and-partial-barrels allows intra-App and forbids deep partials', () => {
    const rule = named.get('app-root-only-shared-domain-and-partial-barrels')!;
    const from = 'src/App/hooks/useAppOrchestration/useAppOrchestration.ts';
    expect(re(rule.from.path as string).test(from)).toBe(true);
    expect(re(rule.from.pathNot as string).test('src/App/partials/QuickPick/QuickPick.tsx')).toBe(true);

    expect(re(rule.to.path as string).test('src/App/partials/FileTree/helpers/treeIndex')).toBe(true);
    expect(re(rule.to.path as string).test('src/App/partials/FileTree/FileTree.tsx')).toBe(true);
    expect(re(rule.to.path as string).test('src/App/partials/FileTree/index.ts')).toBe(false);
    expect(re(rule.to.path as string).test('src/App/hooks/useAppCommands/index.ts')).toBe(false);
  });

  it('all rules exclude external dependency types', () => {
    for (const rule of rules) {
      expect(rule.to.dependencyTypesNot).toEqual(['npm', 'npm-dev', 'core']);
    }
  });
});
