import { useMemo } from 'react';

import type { Node } from '@xyflow/react';

import { applyActivePathNodeHighlight } from '../../helpers';

interface UseHighlightedNodesInput {
  nodes: Node[];
  activePath?: string | null;
}

interface UseHighlightedNodesResult {
  highlightedNodes: Node[];
}

export function useHighlightedNodes({ nodes, activePath }: UseHighlightedNodesInput): UseHighlightedNodesResult {
  const highlightedNodes = useMemo(() => applyActivePathNodeHighlight(nodes, activePath ?? null), [nodes, activePath]);

  return { highlightedNodes };
}
