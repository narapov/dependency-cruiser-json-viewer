import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot, getEdgesForVisibleTree, getVisibleTree, makeDependencyKey } from '@/domain';

import { toRoutableEdges } from './toRoutableEdges';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

function selected(...paths: string[]): Record<string, boolean | undefined> {
  return Object.fromEntries(paths.map(path => [path, true]));
}

describe('toRoutableEdges', () => {
  it('maps visible-tree edges to App routable edges with flags', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [
        {
          resolved: 'src/foo/b.ts',
          circular: true,
          typeOnly: true,
          dependencyTypes: ['type-only'],
          rules: [{ name: 'no-circular', severity: 'warn' }],
        } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/b.ts'),
    ];
    const snapshot = buildCruiseSnapshot(modules);
    const selectedFilePaths = selected('src/foo/a.ts', 'src/foo/b.ts');
    const visibleTree = getVisibleTree(snapshot, selectedFilePaths, {
      src: true,
      'src/foo': true,
    });
    const visibleEdges = getEdgesForVisibleTree(snapshot, visibleTree, selectedFilePaths);
    const [edge] = toRoutableEdges(visibleEdges);

    expect(edge).toMatchObject({
      id: makeDependencyKey('src/foo/a.ts', 'src/foo/b.ts'),
      source: 'src/foo/a.ts',
      target: 'src/foo/b.ts',
      typeOnly: true,
      valueCircular: false,
      typeOnlyCircular: true,
      severity: 'warn',
      ruleNames: ['no-circular'],
    });
    expect(edge?.aggregated).toEqual([
      expect.objectContaining({
        id: makeDependencyKey('src/foo/a.ts', 'src/foo/b.ts'),
        source: 'src/foo/a.ts',
        target: 'src/foo/b.ts',
      }),
    ]);
  });

  it('merges source/target port y and side from the port map', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [
        {
          resolved: 'src/foo/b.ts',
          circular: false,
          typeOnly: false,
          dependencyTypes: ['local'],
        } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/b.ts'),
    ];
    const snapshot = buildCruiseSnapshot(modules);
    const selectedFilePaths = selected('src/foo/a.ts', 'src/foo/b.ts');
    const visibleTree = getVisibleTree(snapshot, selectedFilePaths, {
      src: true,
      'src/foo': true,
    });
    const visibleEdges = getEdgesForVisibleTree(snapshot, visibleTree, selectedFilePaths);
    const edgeKey = makeDependencyKey('src/foo/a.ts', 'src/foo/b.ts');
    const [edge] = toRoutableEdges(
      visibleEdges,
      new Map([
        [
          edgeKey,
          {
            source: { side: 'east', index: 0, y: 12 },
            target: { side: 'west', index: 1, y: 24 },
          },
        ],
      ]),
    );

    expect(edge).toMatchObject({
      sourcePort: { side: 'east', index: 0, y: 12 },
      targetPort: { side: 'west', index: 1, y: 24 },
    });
  });
});
