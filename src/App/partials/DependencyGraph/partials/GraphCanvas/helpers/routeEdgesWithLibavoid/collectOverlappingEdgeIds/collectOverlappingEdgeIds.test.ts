import { describe, expect, it } from 'vitest';

import type { AvoidRoute } from '../../../types';
import { collectOverlappingEdgeIds } from './collectOverlappingEdgeIds';

describe('collectOverlappingEdgeIds', () => {
  it('groups edges that share a coincident horizontal segment', () => {
    const a: AvoidRoute = {
      sourcePoint: { x: 0, y: 10 },
      bendPoints: [],
      targetPoint: { x: 40, y: 10 },
    };
    const b: AvoidRoute = {
      sourcePoint: { x: 10, y: 10 },
      bendPoints: [],
      targetPoint: { x: 50, y: 10 },
    };
    const c: AvoidRoute = {
      sourcePoint: { x: 0, y: 30 },
      bendPoints: [],
      targetPoint: { x: 40, y: 30 },
    };

    expect(
      collectOverlappingEdgeIds(
        new Map([
          ['a', a],
          ['b', b],
          ['c', c],
        ]),
      ),
    ).toEqual([['a', 'b']]);
  });

  it('returns empty when routes only cross orthogonally', () => {
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

    expect(
      collectOverlappingEdgeIds(
        new Map([
          ['h', horizontal],
          ['v', vertical],
        ]),
      ),
    ).toEqual([]);
  });
});
