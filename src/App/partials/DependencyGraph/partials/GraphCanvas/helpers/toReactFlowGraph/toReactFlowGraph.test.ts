import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot, getEdgesForVisibleTree, getVisibleTree, makeDependencyKey } from '@/domain';

import type { VisibleTreeLayoutedNode } from '../../types';
import { toReactFlowEdges, toReactFlowNodes } from './toReactFlowGraph';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

function selected(...paths: string[]): Record<string, boolean | undefined> {
  return Object.fromEntries(paths.map(path => [path, true]));
}

/** Flat path → layouted node index (includes nested children). */
function nodesMap(...roots: VisibleTreeLayoutedNode[]): Map<string, VisibleTreeLayoutedNode> {
  const nodes = new Map<string, VisibleTreeLayoutedNode>();
  const visit = (node: VisibleTreeLayoutedNode) => {
    nodes.set(node.path, node);
    node.children?.forEach(visit);
  };
  roots.forEach(visit);
  return nodes;
}

describe('toReactFlowEdges', () => {
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
    const [edge] = toReactFlowEdges(visibleEdges);

    expect(edge).toMatchObject({
      id: makeDependencyKey('src/foo/a.ts', 'src/foo/b.ts'),
      type: 'dependency',
      source: 'src/foo/a.ts',
      target: 'src/foo/b.ts',
      data: {
        typeOnly: true,
        valueCircular: false,
        typeOnlyCircular: true,
        severity: 'warn',
        ruleNames: ['no-circular'],
      },
    });
    expect(edge?.markerEnd).toBeUndefined();
    expect(edge?.style).toBeUndefined();
    expect(edge?.data?.aggregated).toEqual([
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
    const [edge] = toReactFlowEdges(
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

    expect(edge?.data).toMatchObject({
      sourcePort: { side: 'east', index: 0, y: 12 },
      targetPort: { side: 'west', index: 1, y: 24 },
    });
  });
});

describe('toReactFlowNodes', () => {
  it('creates folderGroup nodes for expanded folders', () => {
    const { nodes } = toReactFlowNodes(
      nodesMap({
        path: 'src/foo',
        valueCircular: false,
        typeOnlyCircular: false,
        children: [],
        position: { x: 1, y: 2 },
        width: 200,
        height: 100,
      }),
      buildCruiseSnapshot([moduleAt('src/foo/a.ts')]),
      new Map([['src/foo', 'rgba(1, 2, 3, 0.1)']]),
    );

    const node = nodes.find(item => item.id === 'src/foo');
    expect(node?.type).toBe('folderGroup');
    expect(node?.dragHandle).toBe('.folder-group-header');
    expect(node?.zIndex).toBe(-1);
    expect(node?.data).toMatchObject({
      label: 'foo',
      path: 'src/foo',
      expanded: true,
      backgroundColor: 'rgba(1, 2, 3, 0.1)',
    });
  });

  it('creates collapsed folder nodes with circular from valueCircular', () => {
    const snapshot = buildCruiseSnapshot([moduleAt('src/foo/a.ts')]);
    const { nodes } = toReactFlowNodes(
      nodesMap({
        path: 'src/foo',
        valueCircular: true,
        typeOnlyCircular: false,
        position: { x: 0, y: 0 },
        width: 120,
        height: 32,
      }),
      snapshot,
      new Map(),
    );

    const node = nodes.find(item => item.id === 'src/foo');
    expect(node?.type).toBe('folder');
    expect(node?.data).toMatchObject({
      expanded: false,
      circular: true,
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    });
    expect(node?.width).toBeGreaterThan(0);
    expect(node?.height).toBeGreaterThan(0);
  });

  it('creates file nodes with parent extent and couldNotResolve', () => {
    const modules = [moduleAt('src/foo/a.ts'), { ...moduleAt('missing-module'), couldNotResolve: true } as IModule];
    const snapshot = buildCruiseSnapshot(modules);
    const { nodes, parentByNode } = toReactFlowNodes(
      nodesMap({
        path: 'src/foo',
        valueCircular: false,
        typeOnlyCircular: false,
        children: [
          {
            path: 'src/foo/a.ts',
            valueCircular: true,
            typeOnlyCircular: false,
            position: { x: 10, y: 20 },
            width: 120,
            height: 32,
          },
          {
            path: 'missing-module',
            valueCircular: false,
            typeOnlyCircular: false,
            position: { x: 30, y: 40 },
            width: 120,
            height: 32,
          },
        ],
        position: { x: 0, y: 0 },
        width: 200,
        height: 100,
      }),
      snapshot,
      new Map(),
    );

    const fileNode = nodes.find(item => item.id === 'src/foo/a.ts');
    expect(fileNode?.type).toBe('file');
    expect(fileNode?.parentId).toBe('src/foo');
    expect(fileNode?.extent).toBe('parent');
    expect(fileNode?.data).toMatchObject({
      label: 'a.ts',
      path: 'src/foo/a.ts',
      circular: true,
    });
    expect(parentByNode.get('src/foo/a.ts')).toBe('src/foo');
    expect(nodes.find(item => item.id === 'missing-module')?.data).toMatchObject({
      couldNotResolve: true,
    });
  });
});
