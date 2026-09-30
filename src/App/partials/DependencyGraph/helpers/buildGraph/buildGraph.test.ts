import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot, getVisibleTree } from '@/domain';

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
  folderColors: Map<string, string>;
}) {
  const { cruiseSnapshot, selectedFilePaths, expandedFolderPaths, folderColors } = input;

  return buildGraphFromVisibleTree({
    cruiseSnapshot,
    selectedFilePaths,
    visibleTree: getVisibleTree(cruiseSnapshot, selectedFilePaths, expandedFolderPaths),
    folderColors,
    options: { debug: false },
  });
}

describe('buildGraph half-checked folders', () => {
  const sources = ['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts', 'lib/y.ts'];

  const modules = sources.map(source => moduleAt(source));

  it('includes half-checked ancestor folders when only a nested file is selected', async () => {
    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src'].map(p => [p, true])),
      folderColors: new Map(),
    });

    const folderIds = nodes.filter(node => node.type === 'folder' || node.type === 'folderGroup').map(node => node.id);

    expect(folderIds).toContain('src');
    expect(folderIds).toContain('src/foo');
    expect(nodes.some(node => node.id === 'src/foo/a.ts')).toBe(false);
  });

  it('shows selected files inside expanded half-checked folders', async () => {
    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      folderColors: new Map(),
    });

    expect(nodes.some(node => node.id === 'src/foo/a.ts' && node.type === 'file')).toBe(true);
    expect(nodes.some(node => node.id === 'src/foo/b.ts')).toBe(false);
  });

  it('keeps fully selected folder behavior', async () => {
    const selectedFilePaths = Object.fromEntries(
      sources.filter(source => source.startsWith('src/')).map(path => [path, true]),
    );

    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths,
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo', 'src/bar'].map(p => [p, true])),
      folderColors: new Map(),
    });

    const nodeIds = nodes.map(node => node.id);
    expect(nodeIds).toContain('src');
    expect(nodeIds).toContain('src/foo/a.ts');
    expect(nodeIds).toContain('src/foo/b.ts');
    expect(nodeIds).toContain('src/bar/c.ts');
    expect(nodeIds).not.toContain('lib/y.ts');
  });

  it('uses separate container roots for unrelated branches', async () => {
    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'lib/y.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo', 'lib'].map(p => [p, true])),
      folderColors: new Map(),
    });

    const folderIds = nodes.filter(node => node.type === 'folder' || node.type === 'folderGroup').map(node => node.id);

    expect(folderIds).toContain('src');
    expect(folderIds).toContain('lib');
    expect(nodes.some(node => node.id === 'src/foo/a.ts' && node.type === 'file')).toBe(true);
    expect(nodes.some(node => node.id === 'lib/y.ts' && node.type === 'file')).toBe(true);
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
      folderColors: new Map(),
    });

    const fileNode = nodes.find(node => node.id === 'src/foo/a.ts');
    expect(fileNode?.data.circular).toBe(true);
  });

  it('marks collapsed folders containing circular files', async () => {
    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src'].map(p => [p, true])),
      folderColors: new Map(),
    });

    const folderNode = nodes.find(node => node.id === 'src/foo' && node.type === 'folder');
    expect(folderNode?.data.circular).toBe(true);
  });

  it('does not mark expanded folder groups as circular', async () => {
    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      folderColors: new Map(),
    });

    const groupNode = nodes.find(node => node.id === 'src/foo' && node.type === 'folderGroup');
    expect(groupNode?.data.circular).toBeUndefined();
  });

  it('marks circular edges in data flags', async () => {
    const { edges } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      folderColors: new Map(),
    });

    const circularEdge = edges.find(edge => edge.source === 'src/foo/a.ts');
    expect(circularEdge?.data?.valueCircular).toBe(true);
    expect(circularEdge?.style).toBeUndefined();
  });
});

describe('buildGraph unresolved modules', () => {
  it('marks file nodes with couldNotResolve', async () => {
    const modules = [
      moduleAt('src/foo/a.ts', [
        {
          resolved: 'missing-module',
          couldNotResolve: true,
        } as IModule['dependencies'][0],
      ]),
      { ...moduleAt('missing-module'), couldNotResolve: true } as IModule,
    ];

    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'missing-module'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      folderColors: new Map(),
    });

    const unresolvedNode = nodes.find(node => node.id === 'missing-module');
    expect(unresolvedNode?.data.couldNotResolve).toBe(true);
    expect(nodes.find(node => node.id === 'src/foo/a.ts')?.data.couldNotResolve).toBe(false);
  });
});

describe('buildGraph type-only dependencies', () => {
  const noopArgs = {
    folderColors: new Map(),
  };

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

  it('marks type-only edges in data', async () => {
    const modules = [moduleAt('src/foo/a.ts', [typeOnlyDep('src/foo/b.ts')]), moduleAt('src/foo/b.ts')];

    const { edges } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      ...noopArgs,
    });

    const edge = edges.find(item => item.source === 'src/foo/a.ts');
    expect(edge?.data?.typeOnly).toBe(true);
    expect(edge?.style).toBeUndefined();
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
      ...noopArgs,
    });

    const edge = edges.find(item => item.source === 'src/foo/a.ts');
    expect(edge?.data?.typeOnly).toBe(false);
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
      ...noopArgs,
    });

    const fileNode = nodes.find(node => node.id === 'src/foo/a.ts');
    expect(fileNode?.data.circular).toBeFalsy();

    const edge = edges.find(item => item.source === 'src/foo/a.ts');
    expect(edge?.data?.typeOnlyCircular).toBe(true);
    expect(edge?.data?.typeOnly).toBe(true);
  });

  it('marks value circular on nodes and edges', async () => {
    const modules = [moduleAt('src/foo/a.ts', [valueDep('src/foo/b.ts', true)]), moduleAt('src/foo/b.ts')];

    const { nodes, edges } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/foo/b.ts'].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      ...noopArgs,
    });

    expect(nodes.find(node => node.id === 'src/foo/a.ts')?.data.circular).toBe(true);
    expect(edges.find(item => item.source === 'src/foo/a.ts')?.data?.valueCircular).toBe(true);
    expect(edges.find(item => item.source === 'src/foo/a.ts')?.data?.typeOnly).toBe(false);
  });
});

describe('buildGraph layout', () => {
  const noopArgs = {
    folderColors: new Map(),
  };

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
      ...noopArgs,
    });

    const fileNodes = nodes.filter(node => node.type === 'file');
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
      ...noopArgs,
    });

    const pos = (id: string) => nodes.find(node => node.id === id)!.position;
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
      ...noopArgs,
    });
    const largeGraph = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(largeModules),
      selectedFilePaths: Object.fromEntries(largeSources.map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      ...noopArgs,
    });

    const mediumGroup = mediumGraph.nodes.find(node => node.id === 'src/foo' && node.type === 'folderGroup');
    const largeGroup = largeGraph.nodes.find(node => node.id === 'src/foo' && node.type === 'folderGroup');
    const mediumArea = (mediumGroup?.style?.width as number) * (mediumGroup?.style?.height as number);
    const largeArea = (largeGroup?.style?.width as number) * (largeGroup?.style?.height as number);

    expect(largeArea).toBeGreaterThan(mediumArea);
  });

  it('assigns explicit width to leaf nodes based on label length', async () => {
    const longPath = 'src/foo/very-long-file-name-that-exceeds-minimum-width.ts';
    const modules = [moduleAt(longPath)];

    const { nodes } = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries([longPath].map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      ...noopArgs,
    });

    const fileNode = nodes.find(node => node.id === longPath && node.type === 'file');
    expect(fileNode?.width).toBeGreaterThan(LEAF_NODE_MIN_WIDTH);
    expect(fileNode?.height).toBe(LEAF_NODE_HEIGHT);
    expect(fileNode?.style?.width).toBe(fileNode?.width);
    expect(fileNode?.style?.height).toBe(fileNode?.height);
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
      ...noopArgs,
    });
    const longGraph = await buildGraph({
      cruiseSnapshot: buildCruiseSnapshot(longModules),
      selectedFilePaths: Object.fromEntries(longSources.map(p => [p, true])),
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
      ...noopArgs,
    });

    const shortGroup = shortGraph.nodes.find(node => node.id === 'src/foo' && node.type === 'folderGroup');
    const longGroup = longGraph.nodes.find(node => node.id === 'src/foo' && node.type === 'folderGroup');

    expect(longGroup?.style?.width).toBeGreaterThan(shortGroup?.style?.width as number);
    expect(longGroup?.width).toBe(longGroup?.style?.width);
    expect(longGroup?.height).toBe(longGroup?.style?.height);
  });

  it('keeps parent sibling position stable when expanding a folder', async () => {
    const depToBar = { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [depToBar]), moduleAt('src/bar/c.ts'), moduleAt('src/baz/e.ts')];
    const graphArgs = {
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/bar/c.ts', 'src/baz/e.ts'].map(p => [p, true])),
      ...noopArgs,
    };

    const collapsed = await buildGraph({
      ...graphArgs,
      expandedFolderPaths: Object.fromEntries(['src'].map(p => [p, true])),
    });
    const expanded = await buildGraph({
      ...graphArgs,
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    const collapsedFoo = collapsed.nodes.find(node => node.id === 'src/foo');
    const expandedFoo = expanded.nodes.find(node => node.id === 'src/foo');

    expect(collapsedFoo?.position).toEqual(expandedFoo?.position);
  });

  it('still changes visual edges when a folder is expanded', async () => {
    const depToBar = { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [depToBar]), moduleAt('src/bar/c.ts')];
    const graphArgs = {
      cruiseSnapshot: buildCruiseSnapshot(modules),
      selectedFilePaths: Object.fromEntries(['src/foo/a.ts', 'src/bar/c.ts'].map(p => [p, true])),
      ...noopArgs,
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
      ...noopArgs,
    };

    const collapsedInner = await buildGraph({
      ...graphArgs,
      expandedFolderPaths: Object.fromEntries(['src', 'src/foo'].map(p => [p, true])),
    });

    expect(collapsedInner.edges.some(edge => edge.source === 'lib' && edge.target === 'src/foo/bar')).toBe(true);
    expect(collapsedInner.edges.some(edge => edge.target === 'src/foo/bar/c.ts')).toBe(false);
  });
});
