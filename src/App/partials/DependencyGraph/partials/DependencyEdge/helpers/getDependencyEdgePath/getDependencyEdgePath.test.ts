import { describe, expect, it, vi } from 'vitest';

import { getBezierPath, getSmoothStepPath, getStraightPath, Position } from '@xyflow/react';

import { getDependencyEdgePath } from './getDependencyEdgePath';

vi.mock('@xyflow/react', async importOriginal => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    getBezierPath: vi.fn(() => ['M0,0 C1,0 2,0 3,0', 1.5, 0, 1.5, 0]),
    getSmoothStepPath: vi.fn(() => ['M0,0 L1,0 L1,1 L2,1', 1, 0.5, 1, 0.5]),
    getStraightPath: vi.fn(() => ['M0,0 L3,0', 1.5, 0, 1.5, 0]),
  };
});

const reverseSameY = {
  sourceX: 100,
  sourceY: 50,
  sourcePosition: Position.Right,
  targetX: 20,
  targetY: 50,
  targetPosition: Position.Left,
} as const;

const forwardSameY = {
  sourceX: 20,
  sourceY: 50,
  sourcePosition: Position.Right,
  targetX: 100,
  targetY: 50,
  targetPosition: Position.Left,
} as const;

describe('getDependencyEdgePath', () => {
  it('bulges reverse same-Y edges so the path is not collinear', () => {
    vi.mocked(getBezierPath).mockClear();

    const [path, , labelY] = getDependencyEdgePath(reverseSameY);

    expect(getBezierPath).not.toHaveBeenCalled();
    const controlYs = [...path.matchAll(/C([\d.-]+),([\d.-]+) ([\d.-]+),([\d.-]+)/g)].flatMap(match => [
      Number(match[2]),
      Number(match[4]),
    ]);
    expect(controlYs.every(y => y > 50)).toBe(true);
    expect(labelY).toBeGreaterThan(50);
  });

  it('bulges reverse same-Y edges for straight type', () => {
    vi.mocked(getStraightPath).mockClear();

    const [path, , labelY] = getDependencyEdgePath({ ...reverseSameY, edgesType: 'straight' });

    expect(getStraightPath).not.toHaveBeenCalled();
    const controlYs = [...path.matchAll(/C([\d.-]+),([\d.-]+) ([\d.-]+),([\d.-]+)/g)].flatMap(match => [
      Number(match[2]),
      Number(match[4]),
    ]);
    expect(controlYs.every(y => y > 50)).toBe(true);
    expect(labelY).toBeGreaterThan(50);
  });

  it('does not bulge reverse same-Y edges for simpleOrthogonal type', () => {
    vi.mocked(getSmoothStepPath).mockClear();

    const result = getDependencyEdgePath({ ...reverseSameY, edgesType: 'simpleOrthogonal' });

    expect(getSmoothStepPath).toHaveBeenCalledOnce();
    expect(result[0]).toBe('M0,0 L1,0 L1,1 L2,1');
  });

  it('delegates forward same-Y edges to getBezierPath', () => {
    vi.mocked(getBezierPath).mockClear();

    const result = getDependencyEdgePath(forwardSameY);

    expect(getBezierPath).toHaveBeenCalledOnce();
    expect(result[0]).toBe('M0,0 C1,0 2,0 3,0');
  });

  it('delegates forward same-Y edges to getStraightPath for straight type', () => {
    vi.mocked(getStraightPath).mockClear();

    const result = getDependencyEdgePath({ ...forwardSameY, edgesType: 'straight' });

    expect(getStraightPath).toHaveBeenCalledOnce();
    expect(result[0]).toBe('M0,0 L3,0');
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

  it('delegates different-Y edges to getSmoothStepPath for simpleOrthogonal type', () => {
    vi.mocked(getSmoothStepPath).mockClear();

    getDependencyEdgePath({
      sourceX: 100,
      sourceY: 10,
      sourcePosition: Position.Right,
      targetX: 20,
      targetY: 120,
      targetPosition: Position.Left,
      edgesType: 'simpleOrthogonal',
    });

    expect(getSmoothStepPath).toHaveBeenCalledOnce();
  });
});
