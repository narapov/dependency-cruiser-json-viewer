import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildVirtualLayoutEdges, getDirectChildOfFolder } from './buildVirtualLayoutEdges';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

describe('getDirectChildOfFolder', () => {
  it('returns root-level child when folderId is null', () => {
    expect(getDirectChildOfFolder('src/foo/a.ts', null)).toBe('src');
    expect(getDirectChildOfFolder('lib/x.ts', null)).toBe('lib');
  });

  it('returns direct child of the given folder', () => {
    expect(getDirectChildOfFolder('src/foo/a.ts', 'src')).toBe('src/foo');
    expect(getDirectChildOfFolder('src/foo/a.ts', 'src/foo')).toBe('src/foo/a.ts');
  });
});

describe('buildVirtualLayoutEdges', () => {
  const depToBar = { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0];
  const depBtoC = { resolved: 'src/foo/c.ts' } as IModule['dependencies'][0];
  const modules = [
    moduleAt('src/foo/a.ts', [depToBar]),
    moduleAt('src/foo/b.ts', [depBtoC]),
    moduleAt('src/bar/c.ts'),
    moduleAt('src/foo/c.ts'),
  ];
  const selectedSet = new Set(['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts', 'src/foo/c.ts']);

  it('lifts cross-folder deps to folder siblings at parent level', () => {
    const edges = buildVirtualLayoutEdges('src', ['src/foo', 'src/bar'], modules, selectedSet);

    expect(edges).toEqual([{ source: 'src/foo', target: 'src/bar', weight: 1 }]);
  });

  it('keeps parent-level virtual edges stable regardless of expand state', () => {
    const childIds = ['src/foo', 'src/bar'];
    const collapsed = buildVirtualLayoutEdges('src', childIds, modules, selectedSet);
    const expanded = buildVirtualLayoutEdges('src', childIds, modules, selectedSet);

    expect(collapsed).toEqual(expanded);
  });

  it('exposes file-level sibling deps inside an expanded folder', () => {
    const edges = buildVirtualLayoutEdges(
      'src/foo',
      ['src/foo/a.ts', 'src/foo/b.ts', 'src/foo/c.ts'],
      modules,
      selectedSet,
    );

    expect(edges).toEqual([{ source: 'src/foo/b.ts', target: 'src/foo/c.ts', weight: 1 }]);
  });

  it('skips self-loops and deps outside the folder children', () => {
    const edges = buildVirtualLayoutEdges('src/foo', ['src/foo/a.ts', 'src/foo/b.ts'], modules, selectedSet);

    expect(edges).toEqual([]);
  });

  it('deduplicates multiple file-level deps between the same folder pair', () => {
    const depToBarB = { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0];
    const withDuplicate = [
      moduleAt('src/foo/a.ts', [depToBar]),
      moduleAt('src/foo/b.ts', [depToBarB]),
      moduleAt('src/bar/c.ts'),
    ];
    const selected = new Set(['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts']);

    const edges = buildVirtualLayoutEdges('src', ['src/foo', 'src/bar'], withDuplicate, selected);

    expect(edges).toEqual([{ source: 'src/foo', target: 'src/bar', weight: 2 }]);
  });
});
