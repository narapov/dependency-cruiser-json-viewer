import { describe, expect, it } from 'vitest';

import type { AvoidRoute } from '../../../types';
import { collectCrossingJumps, routeToSegments } from './collectCrossingJumps';

describe('routeToSegments', () => {
  it('splits an orthogonal polyline into H and V segments', () => {
    const route: AvoidRoute = {
      sourcePoint: { x: 0, y: 0 },
      bendPoints: [
        { x: 10, y: 0 },
        { x: 10, y: 20 },
      ],
      targetPoint: { x: 30, y: 20 },
    };

    expect(routeToSegments('e1', route)).toEqual([
      { edgeId: 'e1', start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, orientation: 'horizontal' },
      { edgeId: 'e1', start: { x: 10, y: 0 }, end: { x: 10, y: 20 }, orientation: 'vertical' },
      { edgeId: 'e1', start: { x: 10, y: 20 }, end: { x: 30, y: 20 }, orientation: 'horizontal' },
    ]);
  });

  it('skips zero-length and diagonal segments', () => {
    const route: AvoidRoute = {
      sourcePoint: { x: 0, y: 0 },
      bendPoints: [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ],
      targetPoint: { x: 10, y: 5 },
    };

    expect(routeToSegments('e1', route)).toEqual([
      { edgeId: 'e1', start: { x: 5, y: 5 }, end: { x: 10, y: 5 }, orientation: 'horizontal' },
    ]);
  });
});

describe('collectCrossingJumps', () => {
  it('assigns a jump to the horizontal edge at an H×V crossing', () => {
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

    const jumps = collectCrossingJumps(
      new Map([
        ['h', horizontal],
        ['v', vertical],
      ]),
    );

    expect(jumps.get('h')).toEqual([{ x: 20, y: 10 }]);
    expect(jumps.has('v')).toBe(false);
  });

  it('ignores endpoint touches that are not proper crossings', () => {
    const horizontal: AvoidRoute = {
      sourcePoint: { x: 0, y: 10 },
      bendPoints: [],
      targetPoint: { x: 20, y: 10 },
    };
    const vertical: AvoidRoute = {
      sourcePoint: { x: 20, y: 10 },
      bendPoints: [],
      targetPoint: { x: 20, y: 30 },
    };

    const jumps = collectCrossingJumps(
      new Map([
        ['h', horizontal],
        ['v', vertical],
      ]),
    );

    expect(jumps.size).toBe(0);
  });

  it('collects multiple crossings on one horizontal edge', () => {
    const horizontal: AvoidRoute = {
      sourcePoint: { x: 0, y: 10 },
      bendPoints: [],
      targetPoint: { x: 50, y: 10 },
    };
    const verticalA: AvoidRoute = {
      sourcePoint: { x: 15, y: 0 },
      bendPoints: [],
      targetPoint: { x: 15, y: 20 },
    };
    const verticalB: AvoidRoute = {
      sourcePoint: { x: 35, y: 0 },
      bendPoints: [],
      targetPoint: { x: 35, y: 20 },
    };

    const jumps = collectCrossingJumps(
      new Map([
        ['h', horizontal],
        ['a', verticalA],
        ['b', verticalB],
      ]),
    );

    expect(jumps.get('h')).toEqual([
      { x: 15, y: 10 },
      { x: 35, y: 10 },
    ]);
  });
});
