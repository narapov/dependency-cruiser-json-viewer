import { describe, expect, it } from 'vitest';

import type { VisibleTreeLayoutedNode } from '../../../types';
import { GROUP_HEADER, GROUP_PADDING } from '../../buildGraph';
import { buildAncestryIndex } from '../buildAncestryIndex';
import { normalizeGroupContentOrigin } from './normalizeGroupContentOrigin';

const ORIGIN_X = GROUP_PADDING;
const ORIGIN_Y = GROUP_HEADER + GROUP_PADDING;

function makeNode(
  path: string,
  position: { x: number; y: number },
  size: { width: number; height: number } = { width: 80, height: 32 },
  options: { ancestors?: string[]; children?: VisibleTreeLayoutedNode[] } = {},
): VisibleTreeLayoutedNode {
  return {
    path,
    ancestors: options.ancestors ?? [],
    descendants: [],
    valueCircular: false,
    typeOnlyCircular: false,
    position,
    width: size.width,
    height: size.height,
    ...(options.children ? { children: options.children } : {}),
  };
}

describe('normalizeGroupContentOrigin', () => {
  it('shifts children left-overflow to content origin and moves the group left', () => {
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 100, y: 200 }, { width: 200, height: 120 }, { children: [] })],
      ['a', makeNode('a', { x: -20, y: ORIGIN_Y }, undefined, { ancestors: ['src'] })],
      ['b', makeNode('b', { x: 40, y: ORIGIN_Y }, undefined, { ancestors: ['src'] })],
    ]);
    const { childrenByParent } = buildAncestryIndex(nodesByPath);

    const worldA = { x: 100 + -20, y: 200 + ORIGIN_Y };
    const worldB = { x: 100 + 40, y: 200 + ORIGIN_Y };

    expect(normalizeGroupContentOrigin('src', nodesByPath, childrenByParent)).toBe(true);

    expect(nodesByPath.get('a')!.position.x).toBe(ORIGIN_X);
    expect(nodesByPath.get('b')!.position.x).toBe(40 + (ORIGIN_X - -20));
    expect(nodesByPath.get('src')!.position).toEqual({
      x: worldA.x - ORIGIN_X,
      y: 200,
    });
    expect(nodesByPath.get('src')!.position.x + nodesByPath.get('a')!.position.x).toBe(worldA.x);
    expect(nodesByPath.get('src')!.position.x + nodesByPath.get('b')!.position.x).toBe(worldB.x);
  });

  it('shifts children above the header origin and moves the group up', () => {
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 50, y: 80 }, { width: 200, height: 120 }, { children: [] })],
      ['a', makeNode('a', { x: ORIGIN_X, y: 10 }, undefined, { ancestors: ['src'] })],
    ]);
    const { childrenByParent } = buildAncestryIndex(nodesByPath);

    const worldY = 80 + 10;
    expect(normalizeGroupContentOrigin('src', nodesByPath, childrenByParent)).toBe(true);

    expect(nodesByPath.get('a')!.position.y).toBe(ORIGIN_Y);
    expect(nodesByPath.get('src')!.position.y).toBe(worldY - ORIGIN_Y);
    expect(nodesByPath.get('src')!.position.y + nodesByPath.get('a')!.position.y).toBe(worldY);
  });

  it('is a no-op when children already meet the content origin', () => {
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 0, y: 0 }, { width: 200, height: 120 }, { children: [] })],
      ['a', makeNode('a', { x: ORIGIN_X, y: ORIGIN_Y }, undefined, { ancestors: ['src'] })],
    ]);
    const { childrenByParent } = buildAncestryIndex(nodesByPath);

    expect(normalizeGroupContentOrigin('src', nodesByPath, childrenByParent)).toBe(false);
    expect(nodesByPath.get('a')!.position).toEqual({ x: ORIGIN_X, y: ORIGIN_Y });
    expect(nodesByPath.get('src')!.position).toEqual({ x: 0, y: 0 });
  });

  it('pulls leftmost children back to content origin and moves the group right', () => {
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 40, y: 200 }, { width: 200, height: 120 }, { children: [] })],
      ['a', makeNode('a', { x: 80, y: ORIGIN_Y }, undefined, { ancestors: ['src'] })],
      ['b', makeNode('b', { x: 160, y: ORIGIN_Y }, undefined, { ancestors: ['src'] })],
    ]);
    const { childrenByParent } = buildAncestryIndex(nodesByPath);

    const worldA = { x: 40 + 80, y: 200 + ORIGIN_Y };
    const worldB = { x: 40 + 160, y: 200 + ORIGIN_Y };

    expect(normalizeGroupContentOrigin('src', nodesByPath, childrenByParent)).toBe(true);

    expect(nodesByPath.get('a')!.position.x).toBe(ORIGIN_X);
    expect(nodesByPath.get('b')!.position.x).toBe(160 + (ORIGIN_X - 80));
    expect(nodesByPath.get('src')!.position.x).toBe(worldA.x - ORIGIN_X);
    expect(nodesByPath.get('src')!.position.x + nodesByPath.get('a')!.position.x).toBe(worldA.x);
    expect(nodesByPath.get('src')!.position.x + nodesByPath.get('b')!.position.x).toBe(worldB.x);
  });

  it('pulls topmost children back to content origin and moves the group down', () => {
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 50, y: 20 }, { width: 200, height: 120 }, { children: [] })],
      ['a', makeNode('a', { x: ORIGIN_X, y: 100 }, undefined, { ancestors: ['src'] })],
    ]);
    const { childrenByParent } = buildAncestryIndex(nodesByPath);

    const worldY = 20 + 100;
    expect(normalizeGroupContentOrigin('src', nodesByPath, childrenByParent)).toBe(true);

    expect(nodesByPath.get('a')!.position.y).toBe(ORIGIN_Y);
    expect(nodesByPath.get('src')!.position.y).toBe(worldY - ORIGIN_Y);
    expect(nodesByPath.get('src')!.position.y + nodesByPath.get('a')!.position.y).toBe(worldY);
  });

  it('skips the synthetic root group', () => {
    const nodesByPath = new Map([['a', makeNode('a', { x: -10, y: -10 })]]);
    const { childrenByParent } = buildAncestryIndex(nodesByPath);

    expect(normalizeGroupContentOrigin(null, nodesByPath, childrenByParent)).toBe(false);
    expect(nodesByPath.get('a')!.position).toEqual({ x: -10, y: -10 });
  });
});
