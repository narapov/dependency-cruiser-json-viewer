import { describe, expect, it } from 'vitest';

import { elkSectionsToPath } from './elkSectionsToPath';

describe('elkSectionsToPath', () => {
  it('builds a quadratic segment when two routing points remain', () => {
    const path = elkSectionsToPath(
      [
        {
          startPoint: { x: 1, y: 2 },
          bendPoints: [{ x: 3, y: 4 }],
          endPoint: { x: 5, y: 6 },
        },
      ],
      { x: 10, y: 20 },
    );

    expect(path).toBe('M 11 22 Q 13 24 15 26');
  });

  it('builds cubic segments when three or more routing points remain', () => {
    const path = elkSectionsToPath(
      [
        {
          startPoint: { x: 0, y: 0 },
          bendPoints: [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
          ],
          endPoint: { x: 3, y: 3 },
        },
      ],
      { x: 0, y: 0 },
    );

    expect(path).toBe('M 0 0 C 1 1 2 2 3 3');
  });

  it('joins multiple sections with straight leftovers', () => {
    const path = elkSectionsToPath(
      [
        { startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
        { startPoint: { x: 2, y: 2 }, endPoint: { x: 3, y: 3 } },
      ],
      { x: 0, y: 0 },
    );

    expect(path).toBe('M 0 0 L 1 1 M 2 2 L 3 3');
  });
});
