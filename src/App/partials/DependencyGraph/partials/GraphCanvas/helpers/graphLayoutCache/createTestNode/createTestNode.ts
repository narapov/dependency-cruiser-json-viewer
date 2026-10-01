import type { Node } from '@xyflow/react';

/** Test-only node factory for graphLayoutCache suites. Not exported from index. */
export function createTestNode(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    type: 'file',
    position: { x: 0, y: 0 },
    data: {},
    width: 120,
    height: 32,
    ...overrides,
  };
}
