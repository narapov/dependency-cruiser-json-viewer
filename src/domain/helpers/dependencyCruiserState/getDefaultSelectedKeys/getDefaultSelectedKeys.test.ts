import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot';
import { getDefaultSelectedKeys } from './getDefaultSelectedKeys';

function treeFrom(...sources: string[]) {
  return buildCruiseSnapshot(sources.map(source => ({ source, dependencies: [], dependents: [], valid: true })));
}

describe('getDefaultSelectedKeys', () => {
  it('selects all files under each top-level folder', () => {
    const selected = getDefaultSelectedKeys(treeFrom('src/foo/a.ts', 'src/bar/b.ts', 'lib/x.ts'));

    expect(selected).toEqual(expect.arrayContaining(['src/foo/a.ts', 'src/bar/b.ts', 'lib/x.ts']));
    expect(selected).not.toContain('src');
    expect(selected).not.toContain('src/foo');
    expect(selected).not.toContain('lib');
    expect(selected).toHaveLength(3);
  });

  it('selects root-level files when there are no folders', () => {
    expect(getDefaultSelectedKeys(treeFrom('index.ts'))).toEqual(['index.ts']);
  });

  it('excludes root node_modules and its descendants', () => {
    const selected = getDefaultSelectedKeys(treeFrom('node_modules/pkg/index.js'));

    expect(selected).toEqual([]);
  });

  it('excludes node_modules when mixed with other top-level folders', () => {
    const selected = getDefaultSelectedKeys(treeFrom('src/a.ts', 'node_modules/b/index.js'));

    expect(selected).toEqual(['src/a.ts']);
    expect(selected).not.toContain('node_modules');
    expect(selected).not.toContain('node_modules/b/index.js');
  });

  it('excludes nested node_modules under other top-level folders', () => {
    const selected = getDefaultSelectedKeys(
      treeFrom('packages/app/node_modules/bar/index.js', 'packages/app/src/x.ts'),
    );

    expect(selected).toEqual(['packages/app/src/x.ts']);
    expect(selected).not.toContain('packages');
    expect(selected).not.toContain('packages/app/node_modules/bar/index.js');
  });
});
