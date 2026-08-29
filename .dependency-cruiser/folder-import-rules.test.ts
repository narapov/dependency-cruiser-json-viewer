import type { IRegularForbiddenRuleType } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import {
  buildFolderImportRules,
  FIXTURES_PATH_NOT,
  MAX_PARTIALS_DEPTH,
  PARTIALS_SCOPE_PREFIXES,
  SUBDIRS_RE,
} from './folder-import-rules.mjs';

const BASE_RULE_COUNT = 5;
const EXPECTED_RULE_COUNT = BASE_RULE_COUNT + PARTIALS_SCOPE_PREFIXES.length * 2 * (MAX_PARTIALS_DEPTH + 1);

function re(pattern: string) {
  return new RegExp(pattern);
}

function byName(rules: IRegularForbiddenRuleType[]) {
  return new Map(rules.map(rule => [rule.name, rule]));
}

describe('buildFolderImportRules', () => {
  const rules = buildFolderImportRules();
  const named = byName(rules);

  it('exports base rules plus depth-scoped outside partials rules', () => {
    expect(rules).toHaveLength(EXPECTED_RULE_COUNT);
    expect(named.has('index-no-ancestor')).toBe(true);
    expect(named.has('non-index-no-local-index')).toBe(true);
    expect(named.has('same-dir-no-deep')).toBe(true);
    expect(named.has('no-deep-subdir')).toBe(true);
    expect(named.has('ancestor-no-nested-partials')).toBe(true);
    expect(named.has('outside-dir-no-nested-partials-app-d0')).toBe(true);
    expect(named.has('outside-dir-no-nested-partials-shared-d0')).toBe(true);
    expect(named.has('outside-dir-no-nested-partials-domain-d0')).toBe(true);
    expect(named.has(`outside-dir-sibling-then-subdir-app-d${MAX_PARTIALS_DEPTH}`)).toBe(true);
  });

  it('includes helpers and api in SUBDIRS_RE', () => {
    expect(SUBDIRS_RE).toMatch(/helpers/);
    expect(SUBDIRS_RE).toMatch(/api/);
  });

  it('index-no-ancestor matches index.ts under src only', () => {
    const rule = named.get('index-no-ancestor')!;
    expect(re(rule.from.path as string).test('src/App/partials/QuickPick/index.ts')).toBe(true);
    expect(re(rule.from.path as string).test('src/App/partials/QuickPick/QuickPick.tsx')).toBe(false);
    expect(rule.to.ancestor).toBe(true);
  });

  it('non-index-no-local-index captures same-folder index target', () => {
    const rule = named.get('non-index-no-local-index')!;
    const from = 'src/App/partials/QuickPick/QuickPick.tsx';
    const indexPath = 'src/App/partials/QuickPick/index.ts';
    const match = from.match(re(rule.from.path as string));
    expect(match).not.toBeNull();
    const pathNotPatterns = Array.isArray(rule.from.pathNot) ? rule.from.pathNot : [rule.from.pathNot];
    expect(pathNotPatterns.some(pattern => re(pattern as string).test(indexPath))).toBe(true);
    const toPath = (rule.to.path as string).replace('$1', match![1]);
    expect(re(toPath).test(indexPath)).toBe(true);
  });

  it('same-dir-no-deep allows subdir child and index but forbids deeper paths', () => {
    const rule = named.get('same-dir-no-deep')!;
    const dir = 'src/App/partials/QuickPick';
    const pathNot = (rule.to.pathNot as string[]).map(pattern => pattern.replace('$1', dir));

    expect(re((rule.to.path as string).replace('$1', dir)).test(`${dir}/hooks/useQuickPick/useQuickPick.ts`)).toBe(
      true,
    );
    expect(pathNot.some(pattern => re(pattern).test(`${dir}/hooks/useQuickPick`))).toBe(true);
    expect(pathNot.some(pattern => re(pattern).test(`${dir}/hooks/useQuickPick/index.ts`))).toBe(true);
    expect(pathNot.some(pattern => re(pattern).test(`${dir}/helpers/searchPaths/index.ts`))).toBe(true);
    expect(pathNot.some(pattern => re(pattern).test(`${dir}/hooks/useQuickPick/useQuickPick.ts`))).toBe(false);
    expect(re((rule.to.path as string).replace('$1', dir)).test(`${dir}/partials/A/partials/B/B.tsx`)).toBe(true);
  });

  it('no-deep-subdir forbids subdir/child/file but allows subdir/child/index', () => {
    const rule = named.get('no-deep-subdir')!;
    expect(rule.to.ancestor).toBeUndefined();

    const deepPartial = 'src/App/partials/DependencyGraph/partials/EdgeHighlightSubmenu/EdgeHighlightSubmenu.tsx';
    const partialIndex = 'src/App/partials/DependencyGraph/partials/EdgeHighlightSubmenu/index.ts';
    const sameDirFrom = 'src/Shared/helpers/formatShortcut/formatShortcut.test.ts';
    const sameDirTarget = 'src/Shared/helpers/formatShortcut/formatShortcut.ts';
    const fromMatch = sameDirFrom.match(re(rule.from.path as string));
    expect(re(rule.to.path as string).test('hooks/useQuickPick/useQuickPick.ts')).toBe(true);
    expect(re(rule.to.path as string).test(deepPartial)).toBe(true);
    expect(re((rule.to.pathNot as string[]).find(p => p.includes('index'))!).test(partialIndex)).toBe(true);
    expect(
      re((rule.to.pathNot as string[]).find(p => p === '^$1/')!.replace('$1', fromMatch![1])).test(sameDirTarget),
    ).toBe(true);
    expect(re((rule.to.pathNot as string[]).find(p => p.includes('index'))!).test(deepPartial)).toBe(false);
  });

  it('no-deep-subdir allows __fixtures__ deep imports but forbids other deep paths', () => {
    const rule = named.get('no-deep-subdir')!;
    const fixturesPath =
      'src/App/partials/DependencyGraph/contexts/GraphActionsContext/__fixtures__/mockGraphActions.ts';
    const deepMock = 'src/App/partials/DependencyGraph/contexts/GraphActionsContext/mockGraphActions.ts';

    expect(re(rule.to.path as string).test('contexts/GraphActionsContext/__fixtures__/mockGraphActions.ts')).toBe(true);
    expect(re(FIXTURES_PATH_NOT).test(fixturesPath)).toBe(true);
    expect((rule.to.pathNot as string[]).some(pattern => re(pattern).test(fixturesPath))).toBe(true);
    expect((rule.to.pathNot as string[]).some(pattern => re(pattern).test(deepMock))).toBe(false);
  });

  it('no-deep-subdir exempts __fixtures__ importers', () => {
    const rule = named.get('no-deep-subdir')!;
    const fixturesImporter =
      'src/App/partials/DependencyGraph/contexts/GraphActionsContext/__fixtures__/mockGraphActions.ts';
    const regularImporter = 'src/App/partials/DependencyGraph/partials/FileNode/FileNode.test.tsx';
    const fromPathNot = Array.isArray(rule.from.pathNot) ? rule.from.pathNot : [rule.from.pathNot];

    expect(fromPathNot.some(pattern => re(pattern as string).test(fixturesImporter))).toBe(true);
    expect(fromPathNot.some(pattern => re(pattern as string).test(regularImporter))).toBe(false);
  });

  it('same-dir-no-deep allows ./contexts/…/__fixtures__/… imports', () => {
    const rule = named.get('same-dir-no-deep')!;
    const dir = 'src/App/partials/DependencyGraph';
    const fixturesTarget = `${dir}/contexts/GraphActionsContext/__fixtures__/mockGraphActions.ts`;
    const pathNot = (rule.to.pathNot as string[]).map(pattern => pattern.replace('$1', dir));

    expect(re((rule.to.path as string).replace('$1', dir)).test(fixturesTarget)).toBe(true);
    expect(pathNot.some(pattern => re(pattern).test(fixturesTarget))).toBe(true);
  });

  it('ancestor-no-nested-partials matches nested partials chains', () => {
    const rule = named.get('ancestor-no-nested-partials')!;
    expect(re(rule.to.path as string).test('partials/A/partials/B/')).toBe(true);
    expect(re(rule.to.path as string).test('partials/A/index.ts')).toBe(false);
  });

  it('outside-dir rules exclude same-directory imports via $1 pathNot', () => {
    const nestedPartials = named.get('outside-dir-no-nested-partials-app-d1')!;
    const siblingSubdir = named.get('outside-dir-sibling-then-subdir-app-d1')!;
    expect(nestedPartials.to.pathNot).toContain('^$1/');
    expect(siblingSubdir.to.pathNot).toContain('^$1/');
    expect((siblingSubdir.to.pathNot as string[]).some(pattern => pattern.includes('partials/$2/'))).toBe(true);
  });

  it('outside-dir-no-nested-partials catches cross-partial cousin imports', () => {
    const rule = named.get('outside-dir-no-nested-partials-app-d1')!;
    const badTarget =
      'src/App/partials/QuickPick/partials/QuickPickFileResultsList/partials/QuickPickFileResultsListItem/helpers/computeQuickPickHighlight/index.ts';
    const ownBranchTarget =
      'src/App/partials/QuickPick/partials/QuickPickFileResultsList/partials/QuickPickFileResultsListItem/helpers/highlightBaseStyles/index.ts';

    const nestedPartialsPattern = rule.to.path as string;
    const ownBranchAllow = (rule.to.pathNot as string[]).find(pattern => pattern.includes('$2'))!;

    expect(re(nestedPartialsPattern).test(badTarget)).toBe(true);
    expect(re(nestedPartialsPattern).test(ownBranchTarget)).toBe(true);
    expect(re(ownBranchAllow.replace('$2', 'QuickPickFileResultsList')).test(ownBranchTarget)).toBe(true);
    expect(re(ownBranchAllow.replace('$2', 'QuickPickCommandResultsList')).test(badTarget)).toBe(false);
  });

  it('outside-dir-sibling-then-subdir allows parent helpers within own partials branch', () => {
    const rule = named.get('outside-dir-sibling-then-subdir-app-d2')!;
    const allowedTarget =
      'src/App/partials/QuickPick/partials/QuickPickFileResultsList/partials/QuickPickFileResultsListItem/helpers/highlightBaseStyles/index.ts';
    const pathNot = (rule.to.pathNot as string[]).map(pattern => pattern.replace('$2', 'QuickPickFileResultsList'));

    expect(re(rule.to.path as string).test(allowedTarget)).toBe(true);
    expect(pathNot.some(pattern => re(pattern).test(allowedTarget))).toBe(true);
  });

  it('outside-dir-sibling-then-subdir catches direct subdir of foreign partials sibling', () => {
    const rule = named.get('outside-dir-sibling-then-subdir-app-d0')!;
    const badTarget = 'src/App/partials/QuickPick/partials/QuickPickFileResultsList/helpers/searchPaths/index.ts';
    const allowedTarget = 'src/App/partials/QuickPick/QuickPick.tsx';

    expect(re(rule.to.path as string).test(badTarget)).toBe(true);
    expect(re(rule.to.path as string).test(allowedTarget)).toBe(false);
  });

  it('outside-dir rules apply to all feature roots', () => {
    expect(named.has('outside-dir-no-nested-partials-shared-d0')).toBe(true);
    expect(named.has('outside-dir-sibling-then-subdir-domain-d0')).toBe(true);

    const sharedRule = named.get('outside-dir-no-nested-partials-shared-d0')!;
    expect(re(sharedRule.from.path as string).test('src/Shared/partials/Foo/Foo.tsx')).toBe(true);
    expect(re(sharedRule.from.path as string).test('src/App/partials/QuickPick/QuickPick.tsx')).toBe(false);
  });

  it('all rules exclude external dependency types', () => {
    for (const rule of rules) {
      expect(rule.to.dependencyTypesNot).toEqual(['npm', 'core']);
    }
  });
});
