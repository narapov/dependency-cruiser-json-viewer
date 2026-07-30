import { describe, expect, it } from 'vitest';

import { buildGraphNodes } from './buildGraphNodes';

const noop = () => {};

describe('buildGraphNodes', () => {
  const callbacks = {
    onToggleFolder: noop,
    onExpandRecursive: noop,
    onShowInFileTree: noop,
  };

  it('creates folderGroup nodes for expanded folders', () => {
    const nodeMap = buildGraphNodes({
      visibleNodes: new Map([['src/foo', 'folder']]),
      parentByNode: new Map([['src/foo', null]]),
      expandedFolders: new Set(['src/foo']),
      selectedSet: new Set(['src/foo']),
      childrenIndex: new Map(),
      circularModules: new Set(),
      folderColors: new Map([['src/foo', 'rgba(1, 2, 3, 0.1)']]),
      ...callbacks,
    });

    const node = nodeMap.get('src/foo');
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

  it('creates collapsed folder nodes with circular from descendants', () => {
    const nodeMap = buildGraphNodes({
      visibleNodes: new Map([['src/foo', 'folder']]),
      parentByNode: new Map([['src/foo', null]]),
      expandedFolders: new Set(),
      selectedSet: new Set(['src/foo/a.ts']),
      childrenIndex: new Map([
        [
          'src/foo',
          {
            folders: [],
            files: ['src/foo/a.ts'],
          },
        ],
      ]),
      circularModules: new Set(['src/foo/a.ts']),
      folderColors: new Map(),
      ...callbacks,
    });

    const node = nodeMap.get('src/foo');
    expect(node?.type).toBe('folder');
    expect(node?.data).toMatchObject({
      expanded: false,
      circular: true,
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    });
    expect(node?.width).toBeGreaterThan(0);
    expect(node?.height).toBeGreaterThan(0);
  });

  it('creates file nodes with circular flag and dimensions', () => {
    const nodeMap = buildGraphNodes({
      visibleNodes: new Map([['src/foo/a.ts', 'file']]),
      parentByNode: new Map([['src/foo/a.ts', 'src/foo']]),
      expandedFolders: new Set(['src/foo']),
      selectedSet: new Set(['src/foo/a.ts']),
      childrenIndex: new Map(),
      circularModules: new Set(['src/foo/a.ts']),
      folderColors: new Map(),
      ...callbacks,
    });

    const node = nodeMap.get('src/foo/a.ts');
    expect(node?.type).toBe('file');
    expect(node?.parentId).toBe('src/foo');
    expect(node?.extent).toBe('parent');
    expect(node?.data).toMatchObject({
      label: 'a.ts',
      path: 'src/foo/a.ts',
      circular: true,
    });
    expect(node?.width).toBeGreaterThan(0);
    expect(node?.height).toBeGreaterThan(0);
  });

  it('sets extent to parent when parentId is present', () => {
    const nodeMap = buildGraphNodes({
      visibleNodes: new Map([
        ['src', 'folder'],
        ['src/foo', 'folder'],
      ]),
      parentByNode: new Map([
        ['src', null],
        ['src/foo', 'src'],
      ]),
      expandedFolders: new Set(['src']),
      selectedSet: new Set(['src/foo']),
      childrenIndex: new Map(),
      circularModules: new Set(),
      folderColors: new Map(),
      ...callbacks,
    });

    expect(nodeMap.get('src')?.extent).toBeUndefined();
    expect(nodeMap.get('src/foo')?.parentId).toBe('src');
    expect(nodeMap.get('src/foo')?.extent).toBe('parent');
  });
});
