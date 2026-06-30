import type { IForbiddenRuleType } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import {
  buildFolderImportRules,
  MAX_PARTIALS_DEPTH,
  PARTIALS_SCOPE_PREFIXES,
  SUBDIRS_RE,
} from './folder-import-rules.mjs';

const BASE_RULE_COUNT = 5;
const EXPECTED_RULE_COUNT = BASE_RULE_COUNT + PARTIALS_SCOPE_PREFIXES.length * 2 * (MAX_PARTIALS_DEPTH + 1);

function re(pattern: string) {
  return new RegExp(pattern);
}

function byName(rules: IForbiddenRuleType[]) {
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
    expect(named.has('ancestor-no-deep-subdir')).toBe(true);
    expect(named.has('ancestor-no-nested-partials')).toBe(true);
    expect(named.has('outside-dir-no-nested-partials-components-d0')).toBe(true);
    expect(named.has(`outside-dir-sibling-then-subdir-app-d${MAX_PARTIALS_DEPTH}`)).toBe(true);
  });

  it('includes helpers and api in SUBDIRS_RE', () => {
    expect(SUBDIRS_RE).toMatch(/helpers/);
    expect(SUBDIRS_RE).toMatch(/api/);
  });

  it('index-no-ancestor matches index.ts under src only', () => {
    const rule = named.get('index-no-ancestor')!;
    expect(re(rule.from.path as string).test('src/components/QuickPick/index.ts')).toBe(true);
    expect(re(rule.from.path as string).test('src/components/QuickPick/QuickPick.tsx')).toBe(false);
    expect(rule.to.ancestor).toBe(true);
  });

  it('non-index-no-local-index captures same-folder index target', () => {
    const rule = named.get('non-index-no-local-index')!;
    const from = 'src/components/QuickPick/QuickPick.tsx';
    const indexPath = 'src/components/QuickPick/index.ts';
    const match = from.match(re(rule.from.path as string));
    expect(match).not.toBeNull();
    const pathNotPatterns = Array.isArray(rule.from.pathNot) ? rule.from.pathNot : [rule.from.pathNot];
    expect(pathNotPatterns.some(pattern => re(pattern as string).test(indexPath))).toBe(true);
    const toPath = (rule.to.path as string).replace('$1', match![1]);
    expect(re(toPath).test(indexPath)).toBe(true);
  });

  it('same-dir-no-deep allows subdir child and index but forbids deeper paths', () => {
    const rule = named.get('same-dir-no-deep')!;
    const dir = 'src/components/QuickPick';
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

  it('ancestor-no-deep-subdir allows subdir child index via ancestor', () => {
    const rule = named.get('ancestor-no-deep-subdir')!;
    expect(re(rule.to.path as string).test('hooks/useQuickPick/useQuickPick.ts')).toBe(true);
    expect(re(rule.to.pathNot as string).test('hooks/useQuickPick/index.ts')).toBe(true);
    expect(re(rule.to.pathNot as string).test('hooks/useQuickPick/useQuickPick.ts')).toBe(false);
  });

  it('ancestor-no-nested-partials matches nested partials chains', () => {
    const rule = named.get('ancestor-no-nested-partials')!;
    expect(re(rule.to.path as string).test('partials/A/partials/B/')).toBe(true);
    expect(re(rule.to.path as string).test('partials/A/index.ts')).toBe(false);
  });

  it('outside-dir rules exclude same-directory imports via $1 pathNot', () => {
    const nestedPartials = named.get('outside-dir-no-nested-partials-components-d1')!;
    const siblingSubdir = named.get('outside-dir-sibling-then-subdir-components-d1')!;
    expect(nestedPartials.to.pathNot).toContain('^$1/');
    expect(siblingSubdir.to.pathNot).toContain('^$1/');
    expect((siblingSubdir.to.pathNot as string[]).some(pattern => pattern.includes('partials/$2/'))).toBe(true);
  });

  it('outside-dir-no-nested-partials catches cross-partial cousin imports', () => {
    const rule = named.get('outside-dir-no-nested-partials-components-d1')!;
    const badTarget =
      'src/components/QuickPick/partials/QuickPickFileResultsList/partials/QuickPickFileResultsListItem/helpers/computeQuickPickHighlight/index.ts';
    const ownBranchTarget =
      'src/components/QuickPick/partials/QuickPickFileResultsList/partials/QuickPickFileResultsListItem/helpers/highlightBaseStyles/index.ts';

    const nestedPartialsPattern = rule.to.path as string;
    const ownBranchAllow = (rule.to.pathNot as string[]).find(pattern => pattern.includes('$2'))!;

    expect(re(nestedPartialsPattern).test(badTarget)).toBe(true);
    expect(re(nestedPartialsPattern).test(ownBranchTarget)).toBe(true);
    expect(re(ownBranchAllow.replace('$2', 'QuickPickFileResultsList')).test(ownBranchTarget)).toBe(true);
    expect(re(ownBranchAllow.replace('$2', 'QuickPickCommandResultsList')).test(badTarget)).toBe(false);
  });

  it('outside-dir-sibling-then-subdir allows parent helpers within own partials branch', () => {
    const rule = named.get('outside-dir-sibling-then-subdir-components-d2')!;
    const allowedTarget =
      'src/components/QuickPick/partials/QuickPickFileResultsList/partials/QuickPickFileResultsListItem/helpers/highlightBaseStyles/index.ts';
    const pathNot = (rule.to.pathNot as string[]).map(pattern => pattern.replace('$2', 'QuickPickFileResultsList'));

    expect(re(rule.to.path as string).test(allowedTarget)).toBe(true);
    expect(pathNot.some(pattern => re(pattern).test(allowedTarget))).toBe(true);
  });

  it('outside-dir-sibling-then-subdir catches direct subdir of foreign partials sibling', () => {
    const rule = named.get('outside-dir-sibling-then-subdir-components-d0')!;
    const badTarget = 'src/components/QuickPick/partials/QuickPickFileResultsList/helpers/searchPaths/index.ts';
    const allowedTarget = 'src/components/QuickPick/hooks/useQuickPickState/index.ts';

    expect(re(rule.to.path as string).test(badTarget)).toBe(true);
    expect(re(rule.to.path as string).test(allowedTarget)).toBe(false);
  });

  it('all rules exclude external dependency types', () => {
    for (const rule of rules) {
      expect(rule.to.dependencyTypesNot).toEqual(['npm', 'core', 'type-only']);
    }
  });
});
