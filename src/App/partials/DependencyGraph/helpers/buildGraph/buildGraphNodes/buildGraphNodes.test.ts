import { describe, expect, it } from 'vitest';

import { buildGraphNodes } from './buildGraphNodes';

describe('buildGraphNodes', () => {
  it('creates folderGroup nodes for expanded folders', () => {
    const nodeMap = buildGraphNodes({
      visibleNodes: new Map([['src/foo', 'folder']]),
      parentByNode: new Map([['src/foo', null]]),
      expandedFolders: new Set(['src/foo']),
      circularByPath: new Map(),
      unresolvedModules: new Set(),
      folderColors: new Map([['src/foo', 'rgba(1, 2, 3, 0.1)']]),
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

  it('creates collapsed folder nodes with circular from circularByPath', () => {
    const nodeMap = buildGraphNodes({
      visibleNodes: new Map([['src/foo', 'folder']]),
      parentByNode: new Map([['src/foo', null]]),
      expandedFolders: new Set(),
      circularByPath: new Map([['src/foo', true]]),
      unresolvedModules: new Set(),
      folderColors: new Map(),
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
      circularByPath: new Map([['src/foo/a.ts', true]]),
      unresolvedModules: new Set(),
      folderColors: new Map(),
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

  it('marks unresolved file nodes', () => {
    const nodeMap = buildGraphNodes({
      visibleNodes: new Map([['src/missing.ts', 'file']]),
      parentByNode: new Map([['src/missing.ts', null]]),
      expandedFolders: new Set(),
      circularByPath: new Map(),
      unresolvedModules: new Set(['src/missing.ts']),
      folderColors: new Map(),
    });

    expect(nodeMap.get('src/missing.ts')?.data).toMatchObject({
      couldNotResolve: true,
    });
  });
});
