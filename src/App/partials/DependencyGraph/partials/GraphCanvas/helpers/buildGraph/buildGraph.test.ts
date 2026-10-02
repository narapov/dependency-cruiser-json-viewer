import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot, getVisibleTree } from '@/domain';

import type { SerializedLayoutCache } from '../../../../types';
import type { VisibleTreeLayoutedNode } from '../../types';
import { LEAF_NODE_HEIGHT, LEAF_NODE_MIN_WIDTH } from '../getLeafNodeSize';
import { buildGraph as buildGraphFromVisibleTree } from './buildGraph';
import { GRID_GAP_Y } from './layoutConstants';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

/** Test helper: derive visibleTree then build the graph. */
function buildGraph(input: {
  cruiseSnapshot: ReturnType<typeof buildCruiseSnapshot>;
  selectedFilePaths: Record<string, boolean | undefined>;
  expandedFolderPaths: Record<string, boolean | undefined>;
  layoutCache?: SerializedLayoutCache;
}) {
  const { cruiseSnapshot, selectedFilePaths, expandedFolderPaths, layoutCache } = input;

  return buildGraphFromVisibleTree({
    cruiseSnapshot,
    selectedFilePaths,
    visibleTree: getVisibleTree(cruiseSnapshot, selectedFilePaths, expandedFolderPaths),
    options: { debug: false },
    layoutCache,
  });
}

function findNode(
  nodes: ReadonlyMap<string, VisibleTreeLayoutedNode>,
  path: string,
): VisibleTreeLayoutedNode | undefined {
  return nodes.get(path);
}

function collectPaths(nodes: ReadonlyMap<string, VisibleTreeLayoutedNode>): string[] {
  return [...nodes.keys()];
}

function isExpandedFolder(node: VisibleTreeLayoutedNode | undefined): boolean {
  return !!node?.children;
}

describe('buildGraph half-checked folders', () => {
  const sources = ['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts', 'lib/y.ts'];

  const modules = sources.map(source => moduleAt(source));

  it('includes half-checked ancestor folders when only a nested file is selected', async () => {
    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src'].map(p => [p, true])),
    });

    expect(collectPaths(nodes)).toEqual(expect.arrayContaining(['src', 'src/foo']));
    expect(findNode(nodes, 'src/foo/a.ts')).toBeUndefined();
    expect(isExpandedFolder(findNode(nodes, 'src'))).toBe(true);
    expect(isExpandedFolder(findNode(nodes, 'src/foo'))).toBe(false);
  });

  it('shows selected files inside expanded half-checked folders', async () => {
    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    expect(findNode(nodes, 'src/foo/a.ts')).toBeDefined();
    expect(findNode(nodes, 'src/foo/b.ts')).toBeUndefined();
  });

  it('keeps fully selected folder behavior', async () => {
    const selectedFilePaths = Object.fromEntries(
      sources.filter(source => source.startsWith('src/')).map(path => [path, true]),
    );

    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths,
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo', 'src/bar'].map(p => [p, true])),
    });

    const paths = collectPaths(nodes);
    expect(paths).toContain('src');
    expect(paths).toContain('src/foo/a.ts');
    expect(paths).toContain('src/foo/b.ts');
    expect(paths).toContain('src/bar/c.ts');
    expect(paths).not.toContain('lib/y.ts');
  });

  it('uses separate container roots for unrelated branches', async () => {
    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'lib/y.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo', 'lib'].map(p => [p, true])),
    });

    expect(collectPaths(nodes)).toEqual(expect.arrayContaining(['src', 'lib', 'src/foo/a.ts', 'lib/y.ts']));
  });

  it('indexes layouted nodes in both tree and flat nodes map with shared refs', async () => {
    const { nodes, tree } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    expect(tree.has('src')).toBe(true);
    expect(nodes.get('src')).toBe(tree.get('src'));
    expect(nodes.get('src/foo')).toBe(tree.get('src')?.children?.find(child => child.path === 'src/foo'));
    expect(nodes.get('src/foo/a.ts')).toBe(
      nodes.get('src/foo')?.children?.find(child => child.path === 'src/foo/a.ts'),
    );
  });

  it('does not mutate the input visible tree and returns new layouted nodes with geometry', async () => {
    const cruiseSnapshot = buildCruiseSnapshot(modules);
    const selectedFilePaths = Object.fromEntries(['src/foo/a.ts'].map(p => [p, true]));
    const expandedFolderPaths = Object.fromEntries(['src', 'src/foo'].map(p => [p, true]));
    const visibleTree = getVisibleTree(cruiseSnapshot, selectedFilePaths, expandedFolderPaths);
    const snapshotBefore = structuredClone(visibleTree);

    const { nodes, tree } = await buildGraphFromVisibleTree({
      cruiseSnapshot,
      selectedFilePaths,
      visibleTree,
      options: { debug: false },
    });

    expect(visibleTree).toEqual(snapshotBefore);
    expect(tree.get('src')).not.toBe(visibleTree[0]);
    expect(nodes.get('src/foo/a.ts')?.ancestors).toBe(visibleTree[0]?.children?.[0]?.children?.[0]?.ancestors);

    [...nodes.values()].forEach(node => {
      expect(Number.isFinite(node.width)).toBe(true);
      expect(Number.isFinite(node.height)).toBe(true);
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
      expect(node.width).toBeGreaterThan(0);
      expect(node.height).toBeGreaterThan(0);
    });
  });
});

describe('buildGraph circular dependencies', () => {
  const circularDep = {
    resolved: 'src/foo/b.ts',
    circular: true,
  } as IModule['dependencies'][0];

  const modules = [moduleAt('src/foo/a.ts', [circularDep]), moduleAt('src/foo/b.ts')];

  it('marks file nodes with circular dependencies', async () => {
    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    expect(findNode(nodes, 'src/foo/a.ts')?.valueCircular).toBe(true);
  });

  it('marks collapsed folders containing circular files', async () => {
    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src'].map(p => [p, true])),
    });

    const folderNode = findNode(nodes, 'src/foo');
    expect(isExpandedFolder(folderNode)).toBe(false);
    expect(folderNode?.valueCircular).toBe(true);
  });

  it('keeps expanded folder circular flags from the visible tree', async () => {
    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const groupNode = findNode(nodes, 'src/foo');
    expect(isExpandedFolder(groupNode)).toBe(true);
    expect(groupNode?.valueCircular).toBe(true);
  });

  it('marks circular edges in domain flags', async () => {
    const { edges } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const circularEdge = edges.find(edge => edge.source === 'src/foo/a.ts');
    expect(circularEdge?.valueCircular).toBe(true);
  });

  it('assigns frozen edge ports for sample edges after layout', async () => {
    const { edges, edgesPorts } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    expect(edges.length).toBeGreaterThan(0);
    edges.forEach(edge => {
      const ports = edgesPorts.get(edge.key);
      expect(ports).toBeDefined();
      expect(ports?.source).toMatchObject({ side: 'east', index: expect.any(Number) });
      expect(ports?.target).toMatchObject({ side: 'west', index: expect.any(Number) });
      expect(ports?.source.y).toBeGreaterThan(0);
      expect(ports?.target.y).toBeGreaterThan(0);
    });
  });

  it('keeps ancestors and descendants on layouted nodes for routing', async () => {
    const { tree, nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    expect(tree.size).toBeGreaterThan(0);
    const foo = nodes.get('src/foo');
    expect(foo?.ancestors[0]).toBe('src');
    expect(foo?.descendants).toEqual(expect.arrayContaining(['src/foo/a.ts', 'src/foo/b.ts']));
  });
});

describe('buildGraph type-only dependencies', () => {
  const typeOnlyDep = (resolved: string, circular = false) =>
    ({
      resolved,
      circular,
      dependencyTypes: ['local', 'type-only', 'import'],
    }) as IModule['dependencies'][0];

  const valueDep = (resolved: string, circular = false) =>
    ({
      resolved,
      circular,
      dependencyTypes: ['local', 'import'],
    }) as IModule['dependencies'][0];

  it('marks type-only edges', async () => {
    const modules = [moduleAt('src/foo/a.ts', [typeOnlyDep('src/foo/b.ts')]), moduleAt('src/foo/b.ts')];

    const { edges } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const edge = edges.find(item => item.source === 'src/foo/a.ts');
    expect(edge?.typeOnly).toBe(true);
  });

  it('marks mixed type-only and value imports as not type-only', async () => {
    const modules = [
      moduleAt('src/foo/a.ts', [typeOnlyDep('src/foo/b.ts'), valueDep('src/foo/b.ts')]),
      moduleAt('src/foo/b.ts'),
    ];

    const { edges } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const edge = edges.find(item => item.source === 'src/foo/a.ts');
    expect(edge?.typeOnly).toBe(false);
  });

  it('does not mark nodes circular for type-only circular dependencies', async () => {
    const modules = [
      moduleAt('src/foo/a.ts', [typeOnlyDep('src/foo/b.ts', true)]),
      moduleAt('src/foo/b.ts', [typeOnlyDep('src/foo/a.ts', true)]),
    ];

    const { nodes, edges } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    expect(findNode(nodes, 'src/foo/a.ts')?.valueCircular).toBeFalsy();

    const edge = edges.find(item => item.source === 'src/foo/a.ts');
    expect(edge?.typeOnlyCircular).toBe(true);
    expect(edge?.typeOnly).toBe(true);
  });

  it('marks value circular on nodes and edges', async () => {
    const modules = [moduleAt('src/foo/a.ts', [valueDep('src/foo/b.ts', true)]), moduleAt('src/foo/b.ts')];

    const { nodes, edges } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    expect(findNode(nodes, 'src/foo/a.ts')?.valueCircular).toBe(true);
    expect(edges.find(item => item.source === 'src/foo/a.ts')?.valueCircular).toBe(true);
    expect(edges.find(item => item.source === 'src/foo/a.ts')?.typeOnly).toBe(false);
  });
});

describe('buildGraph layout', () => {
  function manySiblingSources(count: number) {
    return Array.from({ length: count }, (_, index) => `src/foo/f${index}.ts`);
  }

  it('many siblings without edges spread across columns', async () => {
    const sources = manySiblingSources(8);
    const modules = sources.map(source => moduleAt(source));

    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(sources.map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const fileNodes = sources.map(path => findNode(nodes, path)!);
    const xValues = new Set(fileNodes.map(node => node.position.x));
    expect(fileNodes).toHaveLength(8);
    expect(xValues.size).toBeGreaterThan(1);
  });

  it('connected siblings keep elk layout', async () => {
    const depB = { resolved: 'src/foo/b.ts' } as IModule['dependencies'][0];
    const depC = { resolved: 'src/foo/c.ts' } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [depB]), moduleAt('src/foo/b.ts', [depC]), moduleAt('src/foo/c.ts')];

    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts', 'src/foo/c.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const pos = (id: string) => findNode(nodes, id)!.position;
    expect(pos('src/foo/a.ts').x).toBeLessThan(pos('src/foo/b.ts').x);
    expect(pos('src/foo/b.ts').x).toBeLessThan(pos('src/foo/c.ts').x);
  });

  it('group size grows with child count', async () => {
    const mediumSources = manySiblingSources(6);
    const largeSources = manySiblingSources(12);
    const mediumModules = mediumSources.map(source => moduleAt(source));
    const largeModules = largeSources.map(source => moduleAt(source));

    const mediumGraph = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(mediumModules),
      selectedFilePaths: Object.fromEntries(mediumSources.map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });
    const largeGraph = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(largeModules),
      selectedFilePaths: Object.fromEntries(largeSources.map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const mediumGroup = findNode(mediumGraph.nodes, 'src/foo')!;
    const largeGroup = findNode(largeGraph.nodes, 'src/foo')!;
    const mediumArea = mediumGroup.width * mediumGroup.height;
    const largeArea = largeGroup.width * largeGroup.height;

    expect(largeArea).toBeGreaterThan(mediumArea);
  });

  it('assigns explicit width to leaf nodes based on label length', async () => {
    const longPath = 'src/foo/very-long-file-name-that-exceeds-minimum-width.ts';
    const modules = [moduleAt(longPath)];

    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries([longPath].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const fileNode = findNode(nodes, longPath);
    expect(fileNode?.width).toBeGreaterThan(LEAF_NODE_MIN_WIDTH);
    expect(fileNode?.height).toBe(LEAF_NODE_HEIGHT);
  });

  it('group size grows when children have longer names', async () => {
    const shortSources = ['src/foo/a.ts', 'src/foo/b.ts'];
    const longSources = [
      'src/foo/very-long-file-name-that-exceeds-minimum-width-a.ts',
      'src/foo/very-long-file-name-that-exceeds-minimum-width-b.ts',
    ];
    const shortModules = shortSources.map(source => moduleAt(source));
    const longModules = longSources.map(source => moduleAt(source));

    const shortGraph = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(shortModules),
      selectedFilePaths: Object.fromEntries(shortSources.map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });
    const longGraph = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(longModules),
      selectedFilePaths: Object.fromEntries(longSources.map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const shortGroup = findNode(shortGraph.nodes, 'src/foo')!;
    const longGroup = findNode(longGraph.nodes, 'src/foo')!;

    expect(longGroup.width).toBeGreaterThan(shortGroup.width);
  });

  it('keeps parent sibling position stable when expanding a folder', async () => {
    const depToBar = { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [depToBar]), moduleAt('src/bar/c.ts'), moduleAt('src/baz/e.ts')];
    const graphArgs = {
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/bar/c.ts', 'src/baz/e.ts'].map(p => [p, true])),
    };

    const collapsed = await buildGraph({
      ...graphArgs,
      expandedFolderPaths: Object.fromEntries(['src'].map(p => [p, true])),
    });
    const expanded = await buildGraph({
      ...graphArgs,
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    expect(findNode(collapsed.nodes, 'src/foo')?.position).toEqual(findNode(expanded.nodes, 'src/foo')?.position);
  });

  it('still changes visual edges when a folder is expanded', async () => {
    const depToBar = { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [depToBar]), moduleAt('src/bar/c.ts')];
    const graphArgs = {
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/bar/c.ts'].map(p => [p, true])),
    };

    const collapsed = await buildGraph({
      ...graphArgs,
      expandedFolderPaths: Object.fromEntries(['src', 'src/bar'].map(p => [p, true])),
    });
    const expanded = await buildGraph({
      ...graphArgs,
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo', 'src/bar'].map(p => [p, true])),
    });

    expect(collapsed.edges.some(edge => edge.source === 'src/foo' && edge.target === 'src/bar/c.ts')).toBe(true);
    expect(expanded.edges.some(edge => edge.source === 'src/foo/a.ts' && edge.target === 'src/bar/c.ts')).toBe(true);
    expect(expanded.edges.some(edge => edge.source === 'src/foo' && edge.target === 'src/bar/c.ts')).toBe(false);
  });

  it('keeps visual edges on collapsed inner folders for half-checked file selections', async () => {
    const depToBar = { resolved: 'src/foo/bar/c.ts' } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/bar/c.ts'), moduleAt('lib/x.ts', [depToBar])];
    const graphArgs = {
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['lib/x.ts', 'src/foo/bar/c.ts'].map(p => [p, true])),
    };

    const collapsedInner = await buildGraph({
      ...graphArgs,
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    expect(collapsedInner.edges.some(edge => edge.source === 'lib' && edge.target === 'src/foo/bar')).toBe(true);
    expect(collapsedInner.edges.some(edge => edge.target === 'src/foo/bar/c.ts')).toBe(false);
  });
});

describe('buildGraph layout cache', () => {
  it('restores child positions from cache when membership matches on re-expand', async () => {
    const modules = [moduleAt('src/foo/a.ts'), moduleAt('src/foo/b.ts')];
    const cruiseSnapshot = buildCruiseSnapshot(modules);
    const selectedFilePaths = Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true]));

    const expanded = await buildGraph({
      cruiseSnapshot,
      selectedFilePaths,
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const fooEntry = expanded.visibleGroupLayouts['src/foo'];
    expect(fooEntry).toBeDefined();
    const cachedA = fooEntry.children['src/foo/a.ts'];
    const cachedB = fooEntry.children['src/foo/b.ts'];
    expect(cachedB).toBeDefined();
    // Place A far from B so restore is not altered by overlap settle.
    const movedCache = {
      ...expanded.visibleGroupLayouts,
      'src/foo': {
        ...fooEntry,
        children: {
          ...fooEntry.children,
          'src/foo/a.ts': {
            ...cachedA,
            position: { x: 99, y: cachedB.position.y + cachedB.height! + 200 },
          },
        },
      },
    };

    const restored = await buildGraph({
      cruiseSnapshot,
      selectedFilePaths,
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      layoutCache: movedCache,
    });

    expect(findNode(restored.nodes, 'src/foo/a.ts')?.position).toEqual({
      x: 99,
      y: cachedB.position.y + cachedB.height! + 200,
    });
  });

  it('cold-layouts when membership changes and still returns visible group layouts', async () => {
    const modules = [moduleAt('src/foo/a.ts'), moduleAt('src/foo/b.ts')];
    const cruiseSnapshot = buildCruiseSnapshot(modules);

    const withBoth = await buildGraph({
      cruiseSnapshot,
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const onlyA = await buildGraph({
      cruiseSnapshot,
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      layoutCache: withBoth.visibleGroupLayouts,
    });

    expect(findNode(onlyA.nodes, 'src/foo/a.ts')).toBeDefined();
    expect(findNode(onlyA.nodes, 'src/foo/b.ts')).toBeUndefined();
    expect(onlyA.visibleGroupLayouts['src/foo']?.children['src/foo/a.ts']).toBeDefined();
    expect(onlyA.visibleGroupLayouts['src/foo']?.children['src/foo/b.ts']).toBeUndefined();
  });

  it('merge of visible layouts leaves unrelated cache keys for the caller to preserve', async () => {
    const modules = [moduleAt('src/a.ts')];
    const result = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries([['src/a.ts', true]]),
      expandedFolderPaths: Object.fromEntries([['src', true]]),
    });

    expect(result.visibleGroupLayouts['']).toBeDefined();
    expect(result.visibleGroupLayouts['src']).toBeDefined();
    expect(result.visibleGroupLayouts['src/hidden']).toBeUndefined();
  });

  it('settles siblings after cache apply when an expanded folder grows into a neighbor', async () => {
    const modules = [moduleAt('src/foo/a.ts'), moduleAt('src/foo/b.ts'), moduleAt('src/bar/c.ts')];
    const cruiseSnapshot = buildCruiseSnapshot(modules);
    const selectedFilePaths = Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts'].map(p => [p, true]));

    const collapsed = await buildGraph({
      cruiseSnapshot,
      selectedFilePaths,
      expandedFolderPaths: Object.fromEntries([['src', true]]),
    });

    const srcEntry = collapsed.visibleGroupLayouts['src'];
    expect(srcEntry).toBeDefined();
    const fooCached = srcEntry.children['src/foo'];
    const barCached = srcEntry.children['src/bar'];
    expect(fooCached).toBeDefined();
    expect(barCached).toBeDefined();

    const tightCache: SerializedLayoutCache = {
      ...collapsed.visibleGroupLayouts,
      src: {
        ...srcEntry,
        children: {
          ...srcEntry.children,
          'src/foo': {
            ...fooCached,
            position: { x: 16, y: 52 },
          },
          'src/bar': {
            ...barCached,
            position: { x: 16, y: 80 },
          },
        },
      },
    };

    const expanded = await buildGraph({
      cruiseSnapshot,
      selectedFilePaths,
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      layoutCache: tightCache,
    });

    const foo = findNode(expanded.nodes, 'src/foo')!;
    const bar = findNode(expanded.nodes, 'src/bar')!;
    expect(foo).toBeDefined();
    expect(bar).toBeDefined();
    expect(bar.position.y).toBeGreaterThanOrEqual(foo.position.y + foo.height + GRID_GAP_Y);
  });
});
