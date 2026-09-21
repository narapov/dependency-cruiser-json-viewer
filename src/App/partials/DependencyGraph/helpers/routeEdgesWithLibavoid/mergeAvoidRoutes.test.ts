import { describe, expect, it } from 'vitest';

import type { Edge } from '@xyflow/react';

import type { AvoidRoute } from '../../types';
import { mergeAvoidRoutes } from './mergeAvoidRoutes';

describe('mergeAvoidRoutes', () => {
  it('returns a shallow copy when the overlay is empty', () => {
    const edges: Edge[] = [{ id: 'a->b', source: 'a', target: 'b', data: { title: 'a → b' } }];

    const result = mergeAvoidRoutes(edges, new Map());

    expect(result).toEqual(edges);
    expect(result).not.toBe(edges);
  });

  it('adds avoidRoute only for matching edge ids without mutating input', () => {
    const edges: Edge[] = [
      { id: 'a->b', source: 'a', target: 'b', data: { title: 'a → b' } },
      { id: 'c->d', source: 'c', target: 'd', data: { title: 'c → d' } },
    ];
    const avoidRoute: AvoidRoute = {
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 10, y: 10 },
      bendPoints: [{ x: 5, y: 0 }],
    };

    const result = mergeAvoidRoutes(edges, new Map([['a->b', avoidRoute]]));

    expect(result[0]?.data).toEqual({ title: 'a → b', avoidRoute });
    expect(result[1]?.data).toEqual({ title: 'c → d' });
    expect(edges[0]?.data).toEqual({ title: 'a → b' });
  });
});
