import type { Node } from '@xyflow/react';

export function applyActivePathNodeHighlight(nodes: Node[], activePath: string | null): Node[] {
  if (activePath == null) return nodes;

  return nodes.map(node => {
    if (node.id !== activePath) return node;
    if (node.data.highlighted === true) return node;

    return {
      ...node,
      data: {
        ...node.data,
        highlighted: true,
      },
    };
  });
}
