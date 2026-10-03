import { describe, expect, it } from 'vitest';

import type { RoutableEdge } from '../../types';
import { toThinRoutingEdges } from './toThinRoutingEdges';

describe('toThinRoutingEdges', () => {
  it('picks id/source/target/ports without React Flow edges', () => {
    const edges: RoutableEdge[] = [
      {
        id: 'a->b',
        source: 'a',
        target: 'b',
        typeOnly: true,
        valueCircular: false,
        aggregated: [{ id: 'a->b', source: 'a', target: 'b' }],
        sourcePort: { side: 'east', index: 0, y: 12 },
        targetPort: { side: 'west', index: 1, y: 24 },
      },
    ];

    expect(toThinRoutingEdges(edges)).toEqual([
      {
        id: 'a->b',
        source: 'a',
        target: 'b',
        sourcePort: { side: 'east', index: 0, y: 12 },
        targetPort: { side: 'west', index: 1, y: 24 },
      },
    ]);
  });

  it('omits missing ports', () => {
    const edges: RoutableEdge[] = [{ id: 'a->b', source: 'a', target: 'b' }];

    expect(toThinRoutingEdges(edges)).toEqual([{ id: 'a->b', source: 'a', target: 'b' }]);
  });
});
