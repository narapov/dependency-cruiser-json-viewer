import { describe, expect, it } from 'vitest';

import { layoutsToLegacyPositions, legacyPositionsToLayouts } from './layoutStateConverters';

describe('legacyPositionsToLayouts', () => {
  it('returns empty cache for null', () => {
    expect(legacyPositionsToLayouts(null)).toEqual({});
  });

  it('returns empty cache for empty map', () => {
    expect(legacyPositionsToLayouts({})).toEqual({});
  });

  it('maps group children positions and drops undefined entries', () => {
    expect(
      legacyPositionsToLayouts({
        '': {
          'src/a.ts': { x: 1, y: 2 },
          'src/b.ts': undefined,
        },
        src: {
          'src/c.ts': { x: 3, y: 4 },
        },
      }),
    ).toEqual({
      '': {
        id: '',
        children: {
          'src/a.ts': { id: 'src/a.ts', position: { x: 1, y: 2 } },
        },
      },
      src: {
        id: 'src',
        children: {
          'src/c.ts': { id: 'src/c.ts', position: { x: 3, y: 4 } },
        },
      },
    });
  });
});

describe('layoutsToLegacyPositions', () => {
  it('returns empty map for empty cache', () => {
    expect(layoutsToLegacyPositions({})).toEqual({});
  });

  it('flattens child positions and omits sizes', () => {
    expect(
      layoutsToLegacyPositions({
        '': {
          id: '',
          width: 100,
          height: 80,
          children: {
            'src/a.ts': { id: 'src/a.ts', position: { x: 1, y: 2 }, width: 10, height: 20 },
          },
        },
      }),
    ).toEqual({
      '': {
        'src/a.ts': { x: 1, y: 2 },
      },
    });
  });

  it('round-trips position data through legacy maps', () => {
    const legacy = {
      '': {
        'src/a.ts': { x: 5, y: 6 },
      },
    };

    expect(layoutsToLegacyPositions(legacyPositionsToLayouts(legacy))).toEqual(legacy);
  });
});
