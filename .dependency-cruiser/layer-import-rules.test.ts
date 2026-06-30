import type { IForbiddenRuleType } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildLayerImportRules } from './layer-import-rules.mjs';

function re(pattern: string) {
  return new RegExp(pattern);
}

function byName(rules: IForbiddenRuleType[]) {
  return new Map(rules.map(rule => [rule.name, rule]));
}

describe('buildLayerImportRules', () => {
  const rules = buildLayerImportRules();
  const named = byName(rules);

  it('exports exactly three layer rules', () => {
    expect(rules).toHaveLength(3);
    expect(named.has('domain-only-domain')).toBe(true);
    expect(named.has('shared-only-shared-and-domain')).toBe(true);
    expect(named.has('components-only-shared-domain-and-self')).toBe(true);
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
    expect(pathNot.some(pattern => re(pattern as string).test('src/components/FileTree/FileTree.tsx'))).toBe(false);
  });

  it('components-only-shared-domain-and-self allows same feature via $1', () => {
    const rule = named.get('components-only-shared-domain-and-self')!;
    const from = 'src/components/QuickPick/QuickPick.tsx';
    const match = from.match(re(rule.from.path as string));
    expect(match).not.toBeNull();
    const pathNot = (rule.to.pathNot as string[]).map(pattern => pattern.replace('$1', match![1]));
    expect(pathNot.some(pattern => re(pattern).test('src/components/QuickPick/hooks/useQuickPickState.ts'))).toBe(true);
    expect(pathNot.some(pattern => re(pattern).test('src/domain/index.ts'))).toBe(true);
    expect(pathNot.some(pattern => re(pattern).test('src/Shared/index.ts'))).toBe(true);
    expect(pathNot.some(pattern => re(pattern).test('src/components/FileTree/index.ts'))).toBe(false);
    expect(pathNot.some(pattern => re(pattern).test('src/App/App.tsx'))).toBe(false);
  });

  it('all rules exclude external dependency types', () => {
    for (const rule of rules) {
      expect(rule.to.dependencyTypesNot).toEqual(['npm', 'npm-dev', 'core', 'type-only']);
    }
  });
});
