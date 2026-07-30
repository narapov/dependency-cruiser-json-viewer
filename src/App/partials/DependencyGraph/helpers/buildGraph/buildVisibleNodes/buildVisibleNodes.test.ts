import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildVisibleNodes, folderHasCircularDescendant } from './buildVisibleNodes';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

describe('buildVisibleNodes', () => {
  const sources = ['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts', 'lib/y.ts'];
  const modules = sources.map(source => moduleAt(source));

  it('includes half-checked ancestor folders when only a nested file is selected', () => {
    const { visibleNodes } = buildVisibleNodes(modules, ['src/foo/a.ts'], new Set(['src']));

    expect(visibleNodes.get('src')).toBe('folder');
    expect(visibleNodes.get('src/foo')).toBe('folder');
    expect(visibleNodes.has('src/foo/a.ts')).toBe(false);
  });

  it('shows selected files inside expanded half-checked folders', () => {
    const { visibleNodes } = buildVisibleNodes(modules, ['src/foo/a.ts'], new Set(['src', 'src/foo']));

    expect(visibleNodes.get('src/foo/a.ts')).toBe('file');
    expect(visibleNodes.has('src/foo/b.ts')).toBe(false);
  });

  it('sets parentByNode only when parent is visible and expanded', () => {
    const { parentByNode } = buildVisibleNodes(modules, ['src/foo/a.ts'], new Set(['src', 'src/foo']));

    expect(parentByNode.get('src')).toBeNull();
    expect(parentByNode.get('src/foo')).toBe('src');
    expect(parentByNode.get('src/foo/a.ts')).toBe('src/foo');
  });

  it('keeps collapsed children as root-level parents when ancestor is not expanded', () => {
    const { parentByNode } = buildVisibleNodes(modules, ['src/foo/a.ts'], new Set(['src']));

    expect(parentByNode.get('src/foo')).toBe('src');
    expect(parentByNode.has('src/foo/a.ts')).toBe(false);
  });

  it('uses separate container roots for unrelated branches', () => {
    const { parentByNode, visibleNodes } = buildVisibleNodes(
      modules,
      ['src/foo/a.ts', 'lib/y.ts'],
      new Set(['src', 'lib']),
    );

    expect(visibleNodes.get('src')).toBe('folder');
    expect(visibleNodes.get('lib')).toBe('folder');
    expect(parentByNode.get('src')).toBeNull();
    expect(parentByNode.get('lib')).toBeNull();
  });

  it('collects value-circular modules and ignores type-only circular', () => {
    const valueCircular = {
      resolved: 'src/foo/b.ts',
      circular: true,
      dependencyTypes: ['local', 'import'],
    } as IModule['dependencies'][0];
    const typeOnlyCircular = {
      resolved: 'src/bar/d.ts',
      circular: true,
      dependencyTypes: ['local', 'type-only', 'import'],
    } as IModule['dependencies'][0];

    const modulesWithCircular = [
      moduleAt('src/foo/a.ts', [valueCircular]),
      moduleAt('src/foo/b.ts'),
      moduleAt('src/bar/c.ts', [typeOnlyCircular]),
      moduleAt('src/bar/d.ts'),
    ];

    const { circularModules } = buildVisibleNodes(
      modulesWithCircular,
      ['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts', 'src/bar/d.ts'],
      new Set(['src', 'src/foo', 'src/bar']),
    );

    expect(circularModules.has('src/foo/a.ts')).toBe(true);
    expect(circularModules.has('src/bar/c.ts')).toBe(false);
  });
});

describe('folderHasCircularDescendant', () => {
  it('returns true when a selected child file is circular', () => {
    const childrenIndex = new Map([
      [
        'src/foo',
        {
          folders: [] as string[],
          files: ['src/foo/a.ts', 'src/foo/b.ts'],
        },
      ],
    ]);

    expect(
      folderHasCircularDescendant(
        'src/foo',
        new Set(['src/foo/a.ts', 'src/foo/b.ts']),
        childrenIndex,
        new Set(['src/foo/a.ts']),
      ),
    ).toBe(true);
  });

  it('returns false when the circular file is not selected', () => {
    const childrenIndex = new Map([
      [
        'src/foo',
        {
          folders: [] as string[],
          files: ['src/foo/a.ts', 'src/foo/b.ts'],
        },
      ],
    ]);

    expect(
      folderHasCircularDescendant('src/foo', new Set(['src/foo/b.ts']), childrenIndex, new Set(['src/foo/a.ts'])),
    ).toBe(false);
  });

  it('recurses into selected subfolders', () => {
    const childrenIndex = new Map([
      [
        'src',
        {
          folders: ['src/foo'],
          files: [] as string[],
        },
      ],
      [
        'src/foo',
        {
          folders: [] as string[],
          files: ['src/foo/a.ts'],
        },
      ],
    ]);

    expect(
      folderHasCircularDescendant('src', new Set(['src/foo/a.ts']), childrenIndex, new Set(['src/foo/a.ts'])),
    ).toBe(true);
  });
});
