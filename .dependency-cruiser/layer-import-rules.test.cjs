const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { buildLayerImportRules } = require('./layer-import-rules.cjs');

/** @param {string} pattern */
function re(pattern) {
  return new RegExp(pattern);
}

/** @param {import('dependency-cruiser').IForbiddenRuleType[]} rules */
function byName(rules) {
  return new Map(rules.map(rule => [rule.name, rule]));
}

describe('buildLayerImportRules', () => {
  const rules = buildLayerImportRules();
  const named = byName(rules);

  it('exports exactly three layer rules', () => {
    assert.equal(rules.length, 3);
    assert.ok(named.has('domain-only-domain'));
    assert.ok(named.has('shared-only-shared-and-domain'));
    assert.ok(named.has('components-only-shared-domain-and-self'));
  });

  it('domain-only-domain allows only src/domain targets', () => {
    const rule = named.get('domain-only-domain');
    assert.ok(re(rule.from.path).test('src/domain/helpers/pathUtils/getParentPath.ts'));
    assert.ok(re(rule.to.pathNot).test('src/domain/types/ModuleRelations.ts'));
    assert.ok(!re(rule.to.pathNot).test('src/Shared/helpers/foo.ts'));
  });

  it('shared-only-shared-and-domain allows Shared and domain', () => {
    const rule = named.get('shared-only-shared-and-domain');
    const pathNot = Array.isArray(rule.to.pathNot) ? rule.to.pathNot : [rule.to.pathNot];
    assert.ok(pathNot.some(pattern => re(pattern).test('src/Shared/hooks/useResizableWidth.ts')));
    assert.ok(pathNot.some(pattern => re(pattern).test('src/domain/helpers/pathUtils.ts')));
    assert.ok(!pathNot.some(pattern => re(pattern).test('src/components/FileTree/FileTree.tsx')));
  });

  it('components-only-shared-domain-and-self allows same feature via $1', () => {
    const rule = named.get('components-only-shared-domain-and-self');
    const from = 'src/components/QuickPick/QuickPick.tsx';
    const match = from.match(re(rule.from.path));
    assert.ok(match);
    const pathNot = rule.to.pathNot.map(pattern => pattern.replace('$1', match[1]));
    assert.ok(pathNot.some(pattern => re(pattern).test('src/components/QuickPick/hooks/useQuickPickState.ts')));
    assert.ok(pathNot.some(pattern => re(pattern).test('src/domain/index.ts')));
    assert.ok(pathNot.some(pattern => re(pattern).test('src/Shared/index.ts')));
    assert.ok(!pathNot.some(pattern => re(pattern).test('src/components/FileTree/index.ts')));
    assert.ok(!pathNot.some(pattern => re(pattern).test('src/App/App.tsx')));
  });

  it('all rules exclude external dependency types', () => {
    for (const rule of rules) {
      assert.deepEqual(rule.to.dependencyTypesNot, ['npm', 'npm-dev', 'core', 'type-only']);
    }
  });
});
