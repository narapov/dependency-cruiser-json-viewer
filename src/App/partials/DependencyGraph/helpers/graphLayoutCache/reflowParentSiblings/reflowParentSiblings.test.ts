import { describe, expect, it } from 'vitest';

import { GRID_GAP_Y, GROUP_HEADER, GROUP_PADDING } from '../../buildGraph';
import { LEAF_NODE_HEIGHT, LEAF_NODE_MIN_WIDTH } from '../../getLeafNodeSize';
import { buildGroupFingerprints } from '../buildGroupFingerprints';
import { createTestNode as node } from '../createTestNode';
import { nodesOverlap } from '../nodesOverlap';
import { getNodeSize } from '../resolveGroupSize';
import type { PositionCache } from '../types';
import { collectNodeSizes, compactAfterDrag, reflowForDrag, reflowParentSiblings } from './reflowParentSiblings';

describe('reflowForDrag', () => {
  it('shifts overlapping sibling while keeping dragged node at dropped position', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
    ]);
    const nodes = [
      node('folder-a', { type: 'folderGroup', width: 400, height: 200 }),
      node('file-a', { parentId: 'folder-a', position: { x: 0, y: 50 }, width: 120, height: 32 }),
      node('file-b', { parentId: 'folder-a', position: { x: 130, y: 50 }, width: 120, height: 32 }),
    ];
    const previousSizes = collectNodeSizes(nodes);
    const draggedPosition = { x: 130, y: 50 };

    const result = reflowForDrag(nodes, parentByNode, 'file-a', draggedPosition, previousSizes);

    expect(result.find(n => n.id === 'file-a')?.position).toEqual(draggedPosition);
    const fileB = result.find(n => n.id === 'file-b');
    expect(fileB!.position.x).toBe(130);
    expect(fileB!.position.y).toBeGreaterThanOrEqual(50 + 32 + GRID_GAP_Y);
  });

  it('expands folder group when dragged file moves near edge', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/child', 'parent'],
      ['parent/child/file', 'parent/child'],
    ]);
    const nodes = [
      node('parent', { type: 'folderGroup', width: 200, height: 200 }),
      node('parent/child', {
        type: 'folderGroup',
        parentId: 'parent',
        width: 150,
        height: 150,
        position: { x: 10, y: 50 },
      }),
      node('parent/child/file', {
        parentId: 'parent/child',
        width: 120,
        height: 32,
        position: { x: 10, y: 50 },
      }),
    ];
    const previousSizes = collectNodeSizes(nodes);
    const draggedPosition = { x: 200, y: 100 };

    const result = reflowForDrag(nodes, parentByNode, 'parent/child/file', draggedPosition, previousSizes);

    const inner = result.find(n => n.id === 'parent/child');
    const outer = result.find(n => n.id === 'parent');
    expect(inner!.width!).toBeGreaterThan(150);
    expect(outer!.width!).toBeGreaterThan(200);
    expect(result.find(n => n.id === 'parent/child/file')?.position).toEqual(draggedPosition);
  });

  it('shifts sibling folder group when ancestor grows into it', () => {
    const parentByNode = new Map<string, string | null>([
      ['group-a', null],
      ['group-b', null],
      ['file-a', 'group-a'],
    ]);
    const nodes = [
      node('group-a', { type: 'folderGroup', width: 200, height: 200, position: { x: 0, y: 0 } }),
      node('group-b', { type: 'folderGroup', width: 200, height: 200, position: { x: 210, y: 0 } }),
      node('file-a', { parentId: 'group-a', width: 120, height: 32, position: { x: 10, y: 50 } }),
    ];
    const previousSizes = collectNodeSizes(nodes);
    const draggedPosition = { x: 180, y: 50 };

    const result = reflowForDrag(nodes, parentByNode, 'file-a', draggedPosition, previousSizes);

    const groupA = result.find(n => n.id === 'group-a');
    const groupB = result.find(n => n.id === 'group-b');
    expect(groupA!.width!).toBeGreaterThan(200);
    expect(groupB!.position.y).toBeGreaterThanOrEqual(groupA!.position.y + (groupA!.height ?? 0) + GRID_GAP_Y);
  });
});

describe('compactAfterDrag', () => {
  it('shifts children to minimum padding and shrinks folder group', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
    ]);
    const nodes = [
      node('folder-a', { type: 'folderGroup', width: 400, height: 200 }),
      node('file-a', { parentId: 'folder-a', position: { x: 50, y: 80 }, width: 120, height: 32 }),
      node('file-b', { parentId: 'folder-a', position: { x: 200, y: 80 }, width: 120, height: 32 }),
    ];

    const result = compactAfterDrag(nodes, parentByNode, 'file-a');

    expect(result.find(n => n.id === 'file-a')?.position).toEqual({
      x: GROUP_PADDING,
      y: GROUP_HEADER + GROUP_PADDING,
    });
    expect(result.find(n => n.id === 'file-b')?.position).toEqual({
      x: 200 - 50 + GROUP_PADDING,
      y: GROUP_HEADER + GROUP_PADDING,
    });

    const folder = result.find(n => n.id === 'folder-a');
    expect(folder!.width).toBe(200 - 50 + GROUP_PADDING + 120 + GROUP_PADDING);
    expect(folder!.height).toBe(GROUP_HEADER + GROUP_PADDING + 32 + GROUP_PADDING);
  });

  it('compacts ancestor folder groups from innermost to outermost', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/child', 'parent'],
      ['parent/child/file', 'parent/child'],
    ]);
    const nodes = [
      node('parent', { type: 'folderGroup', width: 400, height: 300, position: { x: 0, y: 0 } }),
      node('parent/child', {
        type: 'folderGroup',
        parentId: 'parent',
        width: 300,
        height: 200,
        position: { x: 40, y: 90 },
      }),
      node('parent/child/file', {
        parentId: 'parent/child',
        width: 120,
        height: 32,
        position: { x: 30, y: 70 },
      }),
    ];

    const result = compactAfterDrag(nodes, parentByNode, 'parent/child/file');

    expect(result.find(n => n.id === 'parent/child/file')?.position).toEqual({
      x: GROUP_PADDING,
      y: GROUP_HEADER + GROUP_PADDING,
    });
    expect(result.find(n => n.id === 'parent/child')?.position).toEqual({
      x: GROUP_PADDING,
      y: GROUP_HEADER + GROUP_PADDING,
    });
  });
});

describe('reflowParentSiblings on expand', () => {
  it('keeps expanded group in place and shifts overlapping siblings', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['folder-b', null],
      ['file-1', 'folder-a'],
      ['file-2', 'folder-a'],
    ]);
    const previousNodes = [
      node('folder-a', { type: 'folder', position: { x: 0, y: 50 }, width: 120, height: 40 }),
      node('folder-b', { type: 'folder', position: { x: 150, y: 50 }, width: 120, height: 40 }),
    ];
    const previousSizes = collectNodeSizes(previousNodes);
    const grownNodes = [
      node('folder-a', { type: 'folderGroup', position: { x: 0, y: 50 }, width: 250, height: 200 }),
      node('file-1', { parentId: 'folder-a', position: { x: 16, y: 52 }, width: 120, height: 40 }),
      node('file-2', { parentId: 'folder-a', position: { x: 16, y: 100 }, width: 120, height: 40 }),
      node('folder-b', { type: 'folder', position: { x: 150, y: 50 }, width: 120, height: 40 }),
    ];
    const cache: PositionCache = new Map();
    const currentFingerprints = buildGroupFingerprints(
      new Set(['folder-a', 'file-1', 'file-2', 'folder-b']),
      parentByNode,
    );
    const previousFingerprints = buildGroupFingerprints(new Set(['folder-a', 'folder-b']), parentByNode);

    const result = reflowParentSiblings({
      nodes: grownNodes,
      parentByNode,
      previousSizes,
      cache,
      currentFingerprints,
      previousFingerprints,
      previousNodes,
    });

    const folderA = result.find(n => n.id === 'folder-a');
    const folderB = result.find(n => n.id === 'folder-b');
    expect(folderA?.position).toEqual({ x: 0, y: 50 });
    expect(folderB!.position.y).toBeGreaterThanOrEqual(50 + 200 + GRID_GAP_Y);
  });

  it('shifts sibling that sits to the left of expanded group when it overlaps', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['folder-b', null],
      ['file-1', 'folder-a'],
    ]);
    const previousNodes = [
      node('folder-b', { type: 'folder', position: { x: 0, y: 50 }, width: 120, height: 40 }),
      node('folder-a', { type: 'folder', position: { x: 50, y: 50 }, width: 120, height: 40 }),
    ];
    const previousSizes = collectNodeSizes(previousNodes);
    const grownNodes = [
      node('folder-b', { type: 'folder', position: { x: 0, y: 50 }, width: 120, height: 40 }),
      node('folder-a', { type: 'folderGroup', position: { x: 50, y: 50 }, width: 250, height: 200 }),
      node('file-1', { parentId: 'folder-a', position: { x: 16, y: 52 }, width: 120, height: 40 }),
    ];
    const cache: PositionCache = new Map();
    const currentFingerprints = buildGroupFingerprints(new Set(['folder-a', 'file-1', 'folder-b']), parentByNode);
    const previousFingerprints = buildGroupFingerprints(new Set(['folder-a', 'folder-b']), parentByNode);

    const result = reflowParentSiblings({
      nodes: grownNodes,
      parentByNode,
      previousSizes,
      cache,
      currentFingerprints,
      previousFingerprints,
      previousNodes,
    });

    const folderA = result.find(n => n.id === 'folder-a');
    const folderB = result.find(n => n.id === 'folder-b');
    expect(folderA?.position).toEqual({ x: 50, y: 50 });
    expect(folderB!.position.y).toBeGreaterThanOrEqual(50 + 200 + GRID_GAP_Y);
  });

  it('reflows siblings when multiple nested folders expand during recursive expand', () => {
    const parentByNode = new Map<string, string | null>([
      ['root', null],
      ['root/child-a', 'root'],
      ['root/child-b', 'root'],
      ['root/child-a/file', 'root/child-a'],
      ['root/child-b/file', 'root/child-b'],
    ]);
    const previousNodes = [node('root', { type: 'folder', position: { x: 0, y: 50 }, width: 120, height: 40 })];
    const previousSizes = collectNodeSizes(previousNodes);
    const grownNodes = [
      node('root', { type: 'folderGroup', position: { x: 0, y: 50 }, width: 500, height: 400 }),
      node('root/child-a', {
        type: 'folderGroup',
        parentId: 'root',
        position: { x: 16, y: 52 },
        width: 200,
        height: 150,
      }),
      node('root/child-b', {
        type: 'folderGroup',
        parentId: 'root',
        position: { x: 50, y: 52 },
        width: 200,
        height: 150,
      }),
      node('root/child-a/file', { parentId: 'root/child-a', position: { x: 16, y: 52 }, width: 120, height: 32 }),
      node('root/child-b/file', { parentId: 'root/child-b', position: { x: 16, y: 52 }, width: 120, height: 32 }),
    ];
    const cache: PositionCache = new Map();
    const currentFingerprints = buildGroupFingerprints(
      new Set(['root', 'root/child-a', 'root/child-a/file', 'root/child-b', 'root/child-b/file']),
      parentByNode,
    );
    const previousFingerprints = buildGroupFingerprints(new Set(['root']), parentByNode);

    const result = reflowParentSiblings({
      nodes: grownNodes,
      parentByNode,
      previousSizes,
      cache,
      currentFingerprints,
      previousFingerprints,
      previousNodes,
    });

    const root = result.find(n => n.id === 'root');
    const childA = result.find(n => n.id === 'root/child-a')!;
    const childB = result.find(n => n.id === 'root/child-b')!;
    expect(root?.position).toEqual({ x: 0, y: 50 });
    expect(childB.position.y).toBeGreaterThanOrEqual(childA.position.y + 150 + GRID_GAP_Y);
  });

  it('reflows again after resize grows an expanded folder beyond its prior size', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['folder-b', null],
      ['file-1', 'folder-a'],
      ['file-2', 'folder-a'],
    ]);
    const previousNodes = [
      node('folder-a', { type: 'folder', position: { x: 0, y: 50 }, width: 120, height: 40 }),
      node('folder-b', { type: 'folder', position: { x: 150, y: 50 }, width: 120, height: 40 }),
    ];
    const previousSizes = collectNodeSizes(previousNodes);
    // Declared height 100 is smaller than the children bounding box after layout.
    const grownNodes = [
      node('folder-a', { type: 'folderGroup', position: { x: 0, y: 50 }, width: 200, height: 100 }),
      node('file-1', { parentId: 'folder-a', position: { x: 16, y: 52 }, width: 120, height: 32 }),
      node('file-2', { parentId: 'folder-a', position: { x: 16, y: 100 }, width: 120, height: 32 }),
      node('folder-b', { type: 'folder', position: { x: 150, y: 50 }, width: 120, height: 40 }),
    ];
    const cache: PositionCache = new Map();

    const result = reflowParentSiblings({
      nodes: grownNodes,
      parentByNode,
      previousSizes,
      cache,
      previousNodes,
    });

    const folderA = result.find(n => n.id === 'folder-a')!;
    const folderB = result.find(n => n.id === 'folder-b')!;
    expect(folderA.position).toEqual({ x: 0, y: 50 });
    expect(nodesOverlap(folderA.position, getNodeSize(folderA), folderB.position, getNodeSize(folderB))).toBe(false);
  });

  it('reflows top-level neighbors after nested expand grows an ancestor on resize', () => {
    const parentByNode = new Map<string, string | null>([
      ['outer-a', null],
      ['outer-b', null],
      ['mid', 'outer-a'],
      ['side', 'outer-a'],
      ['file-x', 'mid'],
      ['file-y', 'mid'],
    ]);
    const previousNodes = [
      node('outer-a', { type: 'folder', position: { x: 0, y: 0 }, width: 120, height: 40 }),
      node('outer-b', { type: 'folder', position: { x: 200, y: 0 }, width: 120, height: 40 }),
    ];
    const previousSizes = collectNodeSizes(previousNodes);
    const grownNodes = [
      node('outer-a', { type: 'folderGroup', position: { x: 0, y: 0 }, width: 250, height: 150 }),
      node('mid', {
        type: 'folderGroup',
        parentId: 'outer-a',
        position: { x: 16, y: 52 },
        width: 180,
        height: 80,
      }),
      node('side', { parentId: 'outer-a', position: { x: 50, y: 52 }, width: 120, height: 32 }),
      node('file-x', { parentId: 'mid', position: { x: 16, y: 52 }, width: 120, height: 40 }),
      node('file-y', { parentId: 'mid', position: { x: 16, y: 60 }, width: 120, height: 40 }),
      node('outer-b', { type: 'folder', position: { x: 200, y: 0 }, width: 120, height: 40 }),
    ];
    const cache: PositionCache = new Map();
    const currentFingerprints = buildGroupFingerprints(
      new Set(['outer-a', 'outer-b', 'mid', 'side', 'file-x', 'file-y']),
      parentByNode,
    );
    const previousFingerprints = buildGroupFingerprints(new Set(['outer-a', 'outer-b']), parentByNode);

    const result = reflowParentSiblings({
      nodes: grownNodes,
      parentByNode,
      previousSizes,
      cache,
      currentFingerprints,
      previousFingerprints,
      previousNodes,
    });

    const outerA = result.find(n => n.id === 'outer-a')!;
    const outerB = result.find(n => n.id === 'outer-b')!;
    expect(outerA.position).toEqual({ x: 0, y: 0 });
    expect(nodesOverlap(outerA.position, getNodeSize(outerA), outerB.position, getNodeSize(outerB))).toBe(false);
  });
});

describe('reflowParentSiblings', () => {
  it('shifts siblings when a node grows in size', () => {
    const nodes = [
      node('a', { position: { x: 0, y: 0 }, width: 120, height: 32 }),
      node('b', { position: { x: 130, y: 0 }, width: 120, height: 32 }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const previousSizes = collectNodeSizes(nodes);
    const cache: PositionCache = new Map();

    const grownNodes = nodes.map(n => (n.id === 'a' ? { ...n, width: 200, height: 32 } : n));
    const result = reflowParentSiblings({
      nodes: grownNodes,
      parentByNode,
      previousSizes,
      cache,
    });

    const nodeB = result.find(n => n.id === 'b');
    expect(nodeB!.position.y).toBeGreaterThanOrEqual(32 + GRID_GAP_Y);
  });

  it('reflows siblings when cached positions overlap after child reappears', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
      ['file-c', 'folder-a'],
    ]);
    const overlappingNodes = [
      node('folder-a', { type: 'folderGroup', width: 500, height: 200 }),
      node('file-a', { parentId: 'folder-a', position: { x: 0, y: 50 }, width: 120, height: 32 }),
      node('file-b', { parentId: 'folder-a', position: { x: 50, y: 50 }, width: 120, height: 32 }),
      node('file-c', { parentId: 'folder-a', position: { x: 100, y: 50 }, width: 120, height: 32 }),
    ];
    const previousSizes = collectNodeSizes(overlappingNodes);
    const cache: PositionCache = new Map();
    const nodeIds = new Set(['folder-a', 'file-a', 'file-b']);
    const hiddenFingerprints = buildGroupFingerprints(nodeIds, parentByNode);
    const restoredFingerprints = buildGroupFingerprints(
      new Set(['folder-a', 'file-a', 'file-b', 'file-c']),
      parentByNode,
    );

    const result = reflowParentSiblings({
      nodes: overlappingNodes,
      parentByNode,
      previousSizes,
      cache,
      currentFingerprints: restoredFingerprints,
      previousFingerprints: hiddenFingerprints,
    });

    const fileA = result.find(n => n.id === 'file-a')!;
    const fileB = result.find(n => n.id === 'file-b')!;
    const fileC = result.find(n => n.id === 'file-c')!;
    expect(fileB.position.y).toBeGreaterThanOrEqual(fileA.position.y + 32 + GRID_GAP_Y);
    expect(fileC.position.y).toBeGreaterThanOrEqual(fileB.position.y + 32 + GRID_GAP_Y);
  });

  it('reflows siblings when restored cache positions overlap without size change', () => {
    const nodes = [
      node('a', { position: { x: 0, y: 0 }, width: 120, height: 32 }),
      node('b', { position: { x: 50, y: 0 }, width: 120, height: 32 }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const previousSizes = collectNodeSizes(nodes);
    const cache: PositionCache = new Map();
    const fingerprints = buildGroupFingerprints(new Set(['a', 'b']), parentByNode);

    const result = reflowParentSiblings({
      nodes,
      parentByNode,
      previousSizes,
      cache,
      currentFingerprints: fingerprints,
      previousFingerprints: fingerprints,
    });

    const nodeB = result.find(n => n.id === 'b');
    expect(nodeB!.position.y).toBeGreaterThanOrEqual(32 + GRID_GAP_Y);
  });
});

describe('collectNodeSizes', () => {
  it('maps each node id to width and height from the node', () => {
    const sizes = collectNodeSizes([node('a', { width: 140, height: 40 }), node('b', { width: 200, height: 60 })]);

    expect(sizes.get('a')).toEqual({ width: 140, height: 40 });
    expect(sizes.get('b')).toEqual({ width: 200, height: 60 });
  });

  it('falls back via getNodeSize when dimensions are missing', () => {
    const sizes = collectNodeSizes([
      node('styled', {
        width: undefined,
        height: undefined,
        style: { width: 180, height: 50 },
      }),
      node('defaults', {
        width: undefined,
        height: undefined,
        style: undefined,
      }),
    ]);

    expect(sizes.get('styled')).toEqual({ width: 180, height: 50 });
    expect(sizes.get('defaults')).toEqual({ width: LEAF_NODE_MIN_WIDTH, height: LEAF_NODE_HEIGHT });
  });
});
