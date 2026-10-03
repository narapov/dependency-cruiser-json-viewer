import { describe, expect, it } from 'vitest';

import type { AvoidRoute, RoutableEdge } from '../../types';
import { mergeAvoidRoutes } from './mergeAvoidRoutes';

describe('mergeAvoidRoutes', () => {
  it('returns a shallow copy when the overlay is empty', () => {
    const edges: RoutableEdge[] = [{ id: 'a->b', source: 'a', target: 'b', typeOnly: true }];

    const result = mergeAvoidRoutes(edges, new Map());

    expect(result).toEqual(edges);
    expect(result).not.toBe(edges);
  });

  it('adds avoidRoute and precomputed paths for matching edge ids without mutating input', () => {
    const edges: RoutableEdge[] = [
      { id: 'a->b', source: 'a', target: 'b' },
      { id: 'c->d', source: 'c', target: 'd' },
    ];
    const avoidRoute: AvoidRoute = {
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 10, y: 10 },
      bendPoints: [{ x: 5, y: 0 }],
    };

    const result = mergeAvoidRoutes(edges, new Map([['a->b', avoidRoute]]));

    expect(result[0]).toEqual({
      id: 'a->b',
      source: 'a',
      target: 'b',
      avoidRoute,
      avoidPath: 'M 0 0 L 2.5 0 Q 5 0 5 2.5 L 10 10',
      avoidPathWithJumps: 'M 0 0 L 2.5 0 Q 5 0 5 2.5 L 10 10',
    });
    expect(result[0]?.avoidPath).toContain('Q ');
    expect(result[1]).toEqual({ id: 'c->d', source: 'c', target: 'd' });
    expect(edges[0]).toEqual({ id: 'a->b', source: 'a', target: 'b' });
  });

  it('attaches crossingJumps and a hopped path on horizontal edges that cross vertical routes', () => {
    const edges: RoutableEdge[] = [
      { id: 'h', source: 'a', target: 'b' },
      { id: 'v', source: 'c', target: 'd' },
    ];
    const horizontal: AvoidRoute = {
      sourcePoint: { x: 0, y: 10 },
      bendPoints: [],
      targetPoint: { x: 40, y: 10 },
    };
    const vertical: AvoidRoute = {
      sourcePoint: { x: 20, y: 0 },
      bendPoints: [],
      targetPoint: { x: 20, y: 30 },
    };

    const result = mergeAvoidRoutes(
      edges,
      new Map([
        ['h', horizontal],
        ['v', vertical],
      ]),
    );

    expect(result[0]).toMatchObject({
      id: 'h',
      avoidRoute: horizontal,
      crossingJumps: [{ x: 20, y: 10 }],
      avoidPath: 'M 0 10 L 40 10',
    });
    expect(result[0]?.avoidPathWithJumps).toContain('A 1.5 1.5 ');
    expect(result[1]).toMatchObject({
      id: 'v',
      avoidRoute: vertical,
      avoidPath: 'M 20 0 L 20 30',
      avoidPathWithJumps: 'M 20 0 L 20 30',
    });
  });
});
