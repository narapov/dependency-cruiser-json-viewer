import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildGraph } from '../buildGraph';
import { buildEdgeDependencyKeyMap, getEdgeDependencyKeys, makeDependencyKey } from './getEdgeDependencyKeys';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

const noopToggle = () => {};
const noopShowInFileTree = () => {};
const noopExpandRecursive = () => {};

const graphArgs = {
  folderColors: new Map(),
  onToggleFolder: noopToggle,
  onExpandRecursive: noopExpandRecursive,
  onShowInFileTree: noopShowInFileTree,
};

describe('getEdgeDependencyKeys', () => {
  const modules = [
    moduleAt('src/foo/a.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
    moduleAt('src/foo/b.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
    moduleAt('src/bar/c.ts'),
  ];

  const selectedPaths = ['src/foo', 'src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts'];

  it('returns stable file-level keys regardless of expanded folders', async () => {
    const collapsedFolders = new Set(['src', 'src/bar']);
    const expandedFolders = new Set(['src', 'src/foo', 'src/bar']);
    const collapsedGraph = await buildGraph({
      modules,
      selectedPaths,
      expandedFolders: collapsedFolders,
      ...graphArgs,
    });
    const expandedGraph = await buildGraph({
      modules,
      selectedPaths,
      expandedFolders,
      ...graphArgs,
    });

    const collapsedKeys = getEdgeDependencyKeys(
      modules,
      selectedPaths,
      collapsedFolders,
      collapsedGraph.visibleNodeIds,
      'src/foo',
      'src/bar/c.ts',
    );
    const expandedKeysA = getEdgeDependencyKeys(
      modules,
      selectedPaths,
      expandedFolders,
      expandedGraph.visibleNodeIds,
      'src/foo/a.ts',
      'src/bar/c.ts',
    );
    const expandedKeysB = getEdgeDependencyKeys(
      modules,
      selectedPaths,
      expandedFolders,
      expandedGraph.visibleNodeIds,
      'src/foo/b.ts',
      'src/bar/c.ts',
    );

    expect(collapsedKeys).toEqual([
      makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts'),
      makeDependencyKey('src/foo/b.ts', 'src/bar/c.ts'),
    ]);
    expect(expandedKeysA).toEqual([makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts')]);
    expect(expandedKeysB).toEqual([makeDependencyKey('src/foo/b.ts', 'src/bar/c.ts')]);
  });

  it('aggregates multiple file-level pairs into one visual edge', async () => {
    const expandedFolders = new Set(['src', 'src/bar']);
    const { edges, visibleNodeIds } = await buildGraph({
      modules,
      selectedPaths,
      expandedFolders,
      ...graphArgs,
    });

    const edge = edges.find(item => item.source === 'src/foo' && item.target === 'src/bar/c.ts');
    expect(edge).toBeDefined();

    const keys = getEdgeDependencyKeys(
      modules,
      selectedPaths,
      expandedFolders,
      visibleNodeIds,
      edge!.source,
      edge!.target,
    );

    expect(keys).toHaveLength(2);
    expect(keys).toContain(makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts'));
    expect(keys).toContain(makeDependencyKey('src/foo/b.ts', 'src/bar/c.ts'));
  });

  it('builds a map from visual edge ids to dependency keys', async () => {
    const expandedFolders = new Set(['src', 'src/foo', 'src/bar']);
    const { edges, visibleNodeIds } = await buildGraph({
      modules,
      selectedPaths,
      expandedFolders,
      ...graphArgs,
    });

    const map = buildEdgeDependencyKeyMap(modules, selectedPaths, expandedFolders, visibleNodeIds, edges);
    const edgeA = edges.find(item => item.source === 'src/foo/a.ts');
    const edgeB = edges.find(item => item.source === 'src/foo/b.ts');

    expect(map.get(edgeA!.id)).toEqual([makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts')]);
    expect(map.get(edgeB!.id)).toEqual([makeDependencyKey('src/foo/b.ts', 'src/bar/c.ts')]);
  });
});
