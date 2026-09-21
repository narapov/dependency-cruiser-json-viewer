import { describe, expect, it } from 'vitest';

import type { Edge } from '@xyflow/react';

import { applyElkEdgeSections } from './applyElkEdgeSections';

describe('applyElkEdgeSections', () => {
  it('attaches matching sections onto edge data', () => {
    const edges = [
      { id: 'a->b', source: 'a', target: 'b', data: { title: 'a → b' } },
      { id: 'c->d', source: 'c', target: 'd', data: { title: 'c → d' } },
    ] as Edge[];

    const sections = [
      {
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 },
      },
    ];

    const result = applyElkEdgeSections(edges, new Map([['a->b', sections]]));

    expect(result[0]?.data).toEqual({ title: 'a → b', elkSections: sections });
    expect(result[1]?.data).toEqual({ title: 'c → d' });
  });
});
