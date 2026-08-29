import { describe, expect, it, vi } from 'vitest';

import { getBezierPath, Position } from '@xyflow/react';

import { getDependencyEdgePath } from './getDependencyEdgePath';

vi.mock('@xyflow/react', async importOriginal => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    getBezierPath: vi.fn(() => ['M0,0 C1,0 2,0 3,0', 1.5, 0, 1.5, 0]),
  };
});

describe('getDependencyEdgePath', () => {
  it('bulges reverse same-Y edges so the path is not collinear', () => {
    vi.mocked(getBezierPath).mockClear();

    const [path, , labelY] = getDependencyEdgePath({
      sourceX: 100,
      sourceY: 50,
      sourcePosition: Position.Right,
      targetX: 20,
      targetY: 50,
      targetPosition: Position.Left,
    });

    expect(getBezierPath).not.toHaveBeenCalled();
    const controlYs = [...path.matchAll(/C([\d.-]+),([\d.-]+) ([\d.-]+),([\d.-]+)/g)].flatMap(match => [
      Number(match[2]),
      Number(match[4]),
    ]);
    expect(controlYs.every(y => y > 50)).toBe(true);
    expect(labelY).toBeGreaterThan(50);
  });

  it('delegates forward same-Y edges to getBezierPath', () => {
    vi.mocked(getBezierPath).mockClear();

    const result = getDependencyEdgePath({
      sourceX: 20,
      sourceY: 50,
      sourcePosition: Position.Right,
      targetX: 100,
      targetY: 50,
      targetPosition: Position.Left,
    });

    expect(getBezierPath).toHaveBeenCalledOnce();
    expect(result[0]).toBe('M0,0 C1,0 2,0 3,0');
  });

  it('delegates different-Y edges to getBezierPath', () => {
    vi.mocked(getBezierPath).mockClear();

    getDependencyEdgePath({
      sourceX: 100,
      sourceY: 10,
      sourcePosition: Position.Right,
      targetX: 20,
      targetY: 120,
      targetPosition: Position.Left,
    });

    expect(getBezierPath).toHaveBeenCalledOnce();
  });
});
