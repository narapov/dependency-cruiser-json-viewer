const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  SUBDIRS_RE,
  MAX_PARTIALS_DEPTH,
  PARTIALS_SCOPE_PREFIXES,
  buildFolderImportRules,
} = require('./folder-import-rules.cjs');

const BASE_RULE_COUNT = 5;
const EXPECTED_RULE_COUNT = BASE_RULE_COUNT + PARTIALS_SCOPE_PREFIXES.length * 2 * (MAX_PARTIALS_DEPTH + 1);

/** @param {string} pattern */
function re(pattern) {
  return new RegExp(pattern);
}

/** @param {import('dependency-cruiser').IForbiddenRuleType[]} rules */
function byName(rules) {
  return new Map(rules.map(rule => [rule.name, rule]));
}

describe('buildFolderImportRules', () => {
  const rules = buildFolderImportRules();
  const named = byName(rules);

  it('exports base rules plus depth-scoped outside partials rules', () => {
    assert.equal(rules.length, EXPECTED_RULE_COUNT);
    assert.ok(named.has('index-no-ancestor'));
    assert.ok(named.has('non-index-no-local-index'));
    assert.ok(named.has('same-dir-no-deep'));
    assert.ok(named.has('ancestor-no-deep-subdir'));
    assert.ok(named.has('ancestor-no-nested-partials'));
    assert.ok(named.has('outside-dir-no-nested-partials-components-d0'));
    assert.ok(named.has(`outside-dir-sibling-then-subdir-app-d${MAX_PARTIALS_DEPTH}`));
  });

  it('includes helpers and api in SUBDIRS_RE', () => {
    assert.match(SUBDIRS_RE, /helpers/);
    assert.match(SUBDIRS_RE, /api/);
  });

  it('index-no-ancestor matches index.ts under src only', () => {
    const rule = named.get('index-no-ancestor');
    assert.ok(re(rule.from.path).test('src/components/QuickPick/index.ts'));
    assert.ok(!re(rule.from.path).test('src/components/QuickPick/QuickPick.tsx'));
    assert.equal(rule.to.ancestor, true);
  });

  it('non-index-no-local-index captures same-folder index target', () => {
    const rule = named.get('non-index-no-local-index');
    const from = 'src/components/QuickPick/QuickPick.tsx';
    const indexPath = 'src/components/QuickPick/index.ts';
    const match = from.match(re(rule.from.path));
    assert.ok(match);
    const pathNotPatterns = Array.isArray(rule.from.pathNot) ? rule.from.pathNot : [rule.from.pathNot];
    assert.ok(pathNotPatterns.some(pattern => re(pattern).test(indexPath)));
    const toPath = rule.to.path.replace('$1', match[1]);
    assert.ok(re(toPath).test(indexPath));
  });

  it('same-dir-no-deep allows subdir child and index but forbids deeper paths', () => {
    const rule = named.get('same-dir-no-deep');
    const dir = 'src/components/QuickPick';
    const pathNot = rule.to.pathNot.map(pattern => pattern.replace('$1', dir));

    assert.ok(re(rule.to.path.replace('$1', dir)).test(`${dir}/hooks/useQuickPick/useQuickPick.ts`));
    assert.ok(pathNot.some(pattern => re(pattern).test(`${dir}/hooks/useQuickPick`)));
    assert.ok(pathNot.some(pattern => re(pattern).test(`${dir}/hooks/useQuickPick/index.ts`)));
    assert.ok(pathNot.some(pattern => re(pattern).test(`${dir}/helpers/searchPaths/index.ts`)));
    assert.ok(!pathNot.some(pattern => re(pattern).test(`${dir}/hooks/useQuickPick/useQuickPick.ts`)));
    assert.ok(re(rule.to.path.replace('$1', dir)).test(`${dir}/partials/A/partials/B/B.tsx`));
  });

  it('ancestor-no-deep-subdir allows subdir child index via ancestor', () => {
    const rule = named.get('ancestor-no-deep-subdir');
    assert.ok(re(rule.to.path).test('hooks/useQuickPick/useQuickPick.ts'));
    assert.ok(re(rule.to.pathNot).test('hooks/useQuickPick/index.ts'));
    assert.ok(!re(rule.to.pathNot).test('hooks/useQuickPick/useQuickPick.ts'));
  });

  it('ancestor-no-nested-partials matches nested partials chains', () => {
    const rule = named.get('ancestor-no-nested-partials');
    assert.ok(re(rule.to.path).test('partials/A/partials/B/'));
    assert.ok(!re(rule.to.path).test('partials/A/index.ts'));
  });

  it('outside-dir rules exclude same-directory imports via $1 pathNot', () => {
    const nestedPartials = named.get('outside-dir-no-nested-partials-components-d1');
    const siblingSubdir = named.get('outside-dir-sibling-then-subdir-components-d1');
    assert.ok(nestedPartials.to.pathNot.includes('^$1/'));
    assert.ok(siblingSubdir.to.pathNot.includes('^$1/'));
    assert.ok(siblingSubdir.to.pathNot.some(pattern => pattern.includes('partials/$2/')));
  });

  it('outside-dir-no-nested-partials catches cross-partial cousin imports', () => {
    const rule = named.get('outside-dir-no-nested-partials-components-d1');
    const badTarget =
      'src/components/QuickPick/partials/QuickPickFileResultsList/partials/QuickPickFileResultsListItem/helpers/computeQuickPickHighlight/index.ts';
    const ownBranchTarget =
      'src/components/QuickPick/partials/QuickPickFileResultsList/partials/QuickPickFileResultsListItem/helpers/highlightBaseStyles/index.ts';

    const nestedPartialsPattern = rule.to.path;
    const ownBranchAllow = rule.to.pathNot.find(pattern => pattern.includes('$2'));

    assert.ok(re(nestedPartialsPattern).test(badTarget));
    assert.ok(re(nestedPartialsPattern).test(ownBranchTarget));
    assert.ok(re(ownBranchAllow.replace('$2', 'QuickPickFileResultsList')).test(ownBranchTarget));
    assert.ok(!re(ownBranchAllow.replace('$2', 'QuickPickCommandResultsList')).test(badTarget));
  });

  it('outside-dir-sibling-then-subdir allows parent helpers within own partials branch', () => {
    const rule = named.get('outside-dir-sibling-then-subdir-components-d2');
    const allowedTarget =
      'src/components/QuickPick/partials/QuickPickFileResultsList/partials/QuickPickFileResultsListItem/helpers/highlightBaseStyles/index.ts';
    const pathNot = rule.to.pathNot.map(pattern => pattern.replace('$2', 'QuickPickFileResultsList'));

    assert.ok(re(rule.to.path).test(allowedTarget));
    assert.ok(pathNot.some(pattern => re(pattern).test(allowedTarget)));
  });

  it('outside-dir-sibling-then-subdir catches direct subdir of foreign partials sibling', () => {
    const rule = named.get('outside-dir-sibling-then-subdir-components-d0');
    const badTarget = 'src/components/QuickPick/partials/QuickPickFileResultsList/helpers/searchPaths/index.ts';
    const allowedTarget = 'src/components/QuickPick/hooks/useQuickPickState/index.ts';

    assert.ok(re(rule.to.path).test(badTarget));
    assert.ok(!re(rule.to.path).test(allowedTarget));
  });

  it('all rules exclude external dependency types', () => {
    for (const rule of rules) {
      assert.deepEqual(rule.to.dependencyTypesNot, ['npm', 'core', 'type-only']);
    }
  });
});
