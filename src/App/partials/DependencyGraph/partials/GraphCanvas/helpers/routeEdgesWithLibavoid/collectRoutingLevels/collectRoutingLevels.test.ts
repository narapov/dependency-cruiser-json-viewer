import { describe, expect, it } from 'vitest';

import { indexTreeByKey } from '@/domain';

import type { ThinRoutingEdge, ThinRoutingNode, VisibleTreeLayoutedNode } from '../../../types';
import { toRouteEdgesWorkerRequest } from '../types';
import { collectRoutingLevels, lowestCommonAncestor, overlapGroupParentId } from './collectRoutingLevels';

function fileNode(path: string): VisibleTreeLayoutedNode {
  return {
    path,
    ancestors: [],
    descendants: [],
    position: { x: 0, y: 0 },
    width: 100,
    height: 40,
    valueCircular: false,
    typeOnlyCircular: false,
  };
}

function folderNode(
  path: string,
  children: VisibleTreeLayoutedNode[],
  ancestors: string[] = [],
): VisibleTreeLayoutedNode {
  const childAncestors = [path, ...ancestors];
  const kids = children.map(child => ({ ...child, ancestors: childAncestors }));
  const descendants = kids.flatMap(child => [child.path, ...child.descendants]);

  return {
    path,
    ancestors,
    descendants,
    children: kids,
    position: { x: 0, y: 0 },
    width: 200,
    height: 100,
    valueCircular: false,
    typeOnlyCircular: false,
  };
}

function mapFromRoots(roots: VisibleTreeLayoutedNode[]): Map<string, ThinRoutingNode> {
  return indexTreeByKey(toRouteEdgesWorkerRequest({ tree: roots, edges: [] }).tree, node => node.path);
}

function divergentSubtreesUnderSrc(): VisibleTreeLayoutedNode {
  return folderNode('src', [
    folderNode('src/a', [fileNode('src/a/x.ts')], ['src']),
    folderNode('src/b', [fileNode('src/b/y.ts')], ['src']),
  ]);
}

describe('lowestCommonAncestor', () => {
  it('returns the shared parent for sibling leaves', () => {
    const nodeByPath = mapFromRoots([folderNode('src', [fileNode('src/a.ts'), fileNode('src/b.ts')])]);

    expect(lowestCommonAncestor('src/a.ts', 'src/b.ts', nodeByPath)).toBe('src');
  });

  it('returns null for root-level siblings', () => {
    const nodeByPath = mapFromRoots([fileNode('a.ts'), fileNode('b.ts')]);

    expect(lowestCommonAncestor('a.ts', 'b.ts', nodeByPath)).toBeNull();
  });

  it('returns the folder that parents divergent subtrees', () => {
    const nodeByPath = mapFromRoots([divergentSubtreesUnderSrc()]);

    expect(lowestCommonAncestor('src/a/x.ts', 'src/b/y.ts', nodeByPath)).toBe('src');
  });

  it('keeps virtual root when the first argument is already null', () => {
    const nodeByPath = mapFromRoots([folderNode('src', [fileNode('src/a.ts')])]);

    expect(lowestCommonAncestor(null, 'src/a.ts', nodeByPath)).toBeNull();
  });
});

describe('overlapGroupParentId', () => {
  it('preserves virtual root when a cross-root endpoint is in the group', () => {
    const nodeByPath = mapFromRoots([
      folderNode('src', [fileNode('src/App'), fileNode('src/foo.ts'), fileNode('src/bar.ts')]),
      fileNode('node_modules'),
    ]);
    const edgeById = new Map<string, ThinRoutingEdge>([
      ['src/App->node_modules', { id: 'src/App->node_modules', source: 'src/App', target: 'node_modules' }],
      ['src/foo.ts->src/bar.ts', { id: 'src/foo.ts->src/bar.ts', source: 'src/foo.ts', target: 'src/bar.ts' }],
    ]);

    expect(overlapGroupParentId(['src/App->node_modules', 'src/foo.ts->src/bar.ts'], edgeById, nodeByPath)).toBeNull();
  });

  it('returns the shared folder when all endpoints stay under one parent', () => {
    const nodeByPath = mapFromRoots([
      folderNode('src', [fileNode('src/a.ts'), fileNode('src/b.ts'), fileNode('src/c.ts')]),
    ]);
    const edgeById = new Map<string, ThinRoutingEdge>([
      ['src/a.ts->src/b.ts', { id: 'src/a.ts->src/b.ts', source: 'src/a.ts', target: 'src/b.ts' }],
      ['src/b.ts->src/c.ts', { id: 'src/b.ts->src/c.ts', source: 'src/b.ts', target: 'src/c.ts' }],
    ]);

    expect(overlapGroupParentId(['src/a.ts->src/b.ts', 'src/b.ts->src/c.ts'], edgeById, nodeByPath)).toBe('src');
  });
});

describe('collectRoutingLevels', () => {
  it('puts sibling leaf edges in leafEdges (п2)', () => {
    const nodeByPath = mapFromRoots([folderNode('src', [fileNode('src/a.ts'), fileNode('src/b.ts')])]);
    const edges: ThinRoutingEdge[] = [{ id: 'src/a.ts->src/b.ts', source: 'src/a.ts', target: 'src/b.ts' }];

    const levels = collectRoutingLevels(nodeByPath, edges);
    const srcLevel = levels.find(level => level.parentId === 'src');

    expect(srcLevel?.leafEdges.map(edge => edge.id)).toEqual(['src/a.ts->src/b.ts']);
    expect(srcLevel?.crossFolderEdges).toEqual([]);
  });

  it('puts deep cross-folder edges in crossFolderEdges at the LCA (п3)', () => {
    const nodeByPath = mapFromRoots([divergentSubtreesUnderSrc()]);
    const edges: ThinRoutingEdge[] = [{ id: 'src/a/x.ts->src/b/y.ts', source: 'src/a/x.ts', target: 'src/b/y.ts' }];

    const levels = collectRoutingLevels(nodeByPath, edges);
    const srcLevel = levels.find(level => level.parentId === 'src');

    expect(srcLevel?.leafEdges).toEqual([]);
    expect(srcLevel?.crossFolderEdges.map(edge => edge.id)).toEqual(['src/a/x.ts->src/b/y.ts']);
  });

  it('puts cross-root edges on the virtual root, not the expanded folder level', () => {
    const nodeByPath = mapFromRoots([folderNode('src', [fileNode('src/App')]), fileNode('node_modules')]);
    const edges: ThinRoutingEdge[] = [{ id: 'src/App->node_modules', source: 'src/App', target: 'node_modules' }];

    const levels = collectRoutingLevels(nodeByPath, edges);
    const rootLevel = levels.find(level => level.parentId === null);
    const srcLevel = levels.find(level => level.parentId === 'src');

    expect(rootLevel?.crossFolderEdges.map(edge => edge.id)).toEqual(['src/App->node_modules']);
    expect(rootLevel?.leafEdges).toEqual([]);
    expect(srcLevel?.leafEdges).toEqual([]);
    expect(srcLevel?.crossFolderEdges).toEqual([]);
  });
});
