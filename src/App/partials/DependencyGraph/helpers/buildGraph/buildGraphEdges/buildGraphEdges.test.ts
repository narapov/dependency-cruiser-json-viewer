import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { MarkerType } from '@xyflow/react';

import { buildCruiseSnapshot, getEdgesForVisibleTree, getVisibleTree, makeDependencyKey } from '@/domain';
import { DEFAULT_EDGE_COLOR } from '@/Shared';

import { visibleTreeEdgesToReactFlowEdges } from './buildGraphEdges';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

function selected(...paths: string[]): Record<string, boolean | undefined> {
  return Object.fromEntries(paths.map(path => [path, true]));
}

describe('visibleTreeEdgesToReactFlowEdges', () => {
  it('maps visible-tree edges to data-only React Flow edges', () => {
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
    const [edge] = visibleTreeEdgesToReactFlowEdges(visibleEdges);

    expect(edge).toMatchObject({
      id: makeDependencyKey('src/foo/a.ts', 'src/foo/b.ts'),
      type: 'dependency',
      source: 'src/foo/a.ts',
      target: 'src/foo/b.ts',
      markerEnd: { type: MarkerType.ArrowClosed, color: DEFAULT_EDGE_COLOR },
      data: {
        typeOnly: true,
        valueCircular: false,
        typeOnlyCircular: true,
        severity: 'warn',
        ruleNames: ['no-circular'],
      },
    });
    expect(edge?.style).toBeUndefined();
    expect(edge?.data?.aggregated).toEqual([
      expect.objectContaining({
        id: makeDependencyKey('src/foo/a.ts', 'src/foo/b.ts'),
        source: 'src/foo/a.ts',
        target: 'src/foo/b.ts',
      }),
    ]);
  });
});
