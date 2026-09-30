import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot, getVisibleTree } from '@/domain';

import type { VisibleTreeLayoutedNode } from '../../types';
import { LEAF_NODE_HEIGHT, LEAF_NODE_MIN_WIDTH } from '../getLeafNodeSize';
import { buildGraph as buildGraphFromVisibleTree } from './buildGraph';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

/** Test helper: derive visibleTree then build the graph. */
function buildGraph(input: {
  cruiseSnapshot: ReturnType<typeof buildCruiseSnapshot>;
  selectedFilePaths: Record<string, boolean | undefined>;
  expandedFolderPaths: Record<string, boolean | undefined>;
}) {
  const { cruiseSnapshot, selectedFilePaths, expandedFolderPaths } = input;

  return buildGraphFromVisibleTree({
    cruiseSnapshot,
    selectedFilePaths,
    visibleTree: getVisibleTree(cruiseSnapshot, selectedFilePaths, expandedFolderPaths),
    options: { debug: false },
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
  return node?.children != null;
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
