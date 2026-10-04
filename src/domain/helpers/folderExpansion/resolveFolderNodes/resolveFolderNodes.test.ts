import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot/buildCruiseSnapshot';
import { resolveFolderNodes } from './resolveFolderNodes';

function snapshotFrom(sources: string[]) {
  return buildCruiseSnapshot(sources.map(source => ({ source, dependencies: [], dependents: [], valid: true })));
}

describe('resolveFolderNodes', () => {
  const snapshot = snapshotFrom(['src/a.ts', 'lib/b.ts']);

  it('resolves folder paths and omits missing and file paths', () => {
    const nodes = resolveFolderNodes(snapshot.nodes, ['src', 'missing', 'src/a.ts', 'lib']);
    expect(nodes.map(node => node.path).toSorted()).toEqual(['lib', 'src']);
  });

  it('returns empty when nothing resolves', () => {
    expect(resolveFolderNodes(snapshot.nodes, ['missing', 'src/a.ts'])).toEqual([]);
  });
});
