import { describe, expect, it } from 'vitest';

import { GRID_GAP_Y } from '../../buildGraph/layoutConstants';
import { settleOverlapsTopDown, type OverlapSettleItem } from './settleOverlapsTopDown';

function item(id: string, y: number, height: number, x = 0, width = 100): OverlapSettleItem {
  return { id, position: { x, y }, width, height };
}

describe('settleOverlapsTopDown', () => {
  it('cascades a > b > c when a grows into b without teleporting b under c', () => {
    const a = item('a', 0, 120);
    const b = item('b', 80, 40);
    const c = item('c', 160, 40);
    const items = [a, b, c];

    settleOverlapsTopDown(items);

    expect(a.position.y).toBe(0);
    expect(b.position.y).toBe(120 + GRID_GAP_Y);
    expect(c.position.y).toBe(b.position.y + b.height + GRID_GAP_Y);
    expect(b.position.y).toBeLessThan(c.position.y);
  });

  it('keeps non-overlapping siblings in place', () => {
    const items = [item('a', 0, 40), item('b', 100, 40)];

    settleOverlapsTopDown(items);

    expect(items[0].position.y).toBe(0);
    expect(items[1].position.y).toBe(100);
  });

  it('keeps fixed id in place and cascades movable siblings below it', () => {
    const a = item('a', 0, 100);
    const b = item('b', 40, 40);
    const c = item('c', 120, 40);
    const items = [a, b, c];

    settleOverlapsTopDown(items, new Set(['a']));

    expect(a.position.y).toBe(0);
    expect(b.position.y).toBe(100 + GRID_GAP_Y);
    expect(c.position.y).toBe(b.position.y + b.height + GRID_GAP_Y);
  });

  it('does not change x', () => {
    const items = [item('a', 0, 80, 10), item('b', 40, 40, 10)];

    settleOverlapsTopDown(items);

    expect(items[0].position.x).toBe(10);
    expect(items[1].position.x).toBe(10);
  });
});
