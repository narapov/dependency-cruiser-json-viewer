import { describe, expect, it } from 'vitest';

import { GROUP_HEADER, GROUP_PADDING } from '../../../layoutConstants';
import { extractElkEdgeSections } from './extractElkEdgeSections';

describe('extractElkEdgeSections', () => {
  it('offsets section points and keys by source->target', () => {
    const result = extractElkEdgeSections([
      {
        sources: ['a'],
        targets: ['b'],
        sections: [
          {
            startPoint: { x: 10, y: 20 },
            endPoint: { x: 30, y: 40 },
            bendPoints: [{ x: 15, y: 25 }],
          },
        ],
      },
    ]);

    expect(result.get('a->b')).toEqual([
      {
        startPoint: { x: 10 + GROUP_PADDING, y: 20 + GROUP_HEADER + GROUP_PADDING },
        endPoint: { x: 30 + GROUP_PADDING, y: 40 + GROUP_HEADER + GROUP_PADDING },
        bendPoints: [{ x: 15 + GROUP_PADDING, y: 25 + GROUP_HEADER + GROUP_PADDING }],
      },
    ]);
  });

  it('strips EAST/WEST port suffixes from keys', () => {
    const result = extractElkEdgeSections([
      {
        sources: ['src/a:E0'],
        targets: ['src/b:W1'],
        sections: [{ startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } }],
      },
    ]);

    expect(result.has('src/a->src/b')).toBe(true);
  });

  it('skips edges without sections or endpoints', () => {
    const result = extractElkEdgeSections([
      { sources: ['a'], targets: ['b'] },
      { sources: [], targets: ['b'], sections: [{ startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } }] },
    ]);

    expect(result.size).toBe(0);
  });
});
