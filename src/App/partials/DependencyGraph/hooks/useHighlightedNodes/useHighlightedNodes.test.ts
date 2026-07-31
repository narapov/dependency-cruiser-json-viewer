// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { renderHook } from '@testing-library/react';
import type { Node } from '@xyflow/react';

import { useHighlightedNodes } from './useHighlightedNodes';

const nodes: Node[] = [
  { id: 'a.ts', position: { x: 0, y: 0 }, data: { label: 'a.ts' } },
  { id: 'b.ts', position: { x: 0, y: 0 }, data: { label: 'b.ts', highlighted: true } },
];

describe('useHighlightedNodes', () => {
  it('returns nodes unchanged when activePath is null', () => {
    const { result } = renderHook(() => useHighlightedNodes({ nodes, activePath: null }));

    expect(result.current.highlightedNodes).toBe(nodes);
  });

  it('marks the active path node as highlighted', () => {
    const { result } = renderHook(() => useHighlightedNodes({ nodes, activePath: 'a.ts' }));

    expect(result.current.highlightedNodes[0]?.data.highlighted).toBe(true);
    expect(result.current.highlightedNodes[1]).toBe(nodes[1]);
  });

  it('keeps already highlighted active node identity', () => {
    const { result } = renderHook(() => useHighlightedNodes({ nodes, activePath: 'b.ts' }));

    expect(result.current.highlightedNodes[1]).toBe(nodes[1]);
  });
});
