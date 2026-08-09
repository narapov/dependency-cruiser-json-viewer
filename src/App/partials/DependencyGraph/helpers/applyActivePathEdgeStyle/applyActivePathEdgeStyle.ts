import type { Edge } from '@xyflow/react';

import { INCOMING_EDGE_COLOR, OUTGOING_EDGE_COLOR } from '@/Shared';

import type { DependencyEdgeData } from '../../types';
import { withEdgeStrokeStyle } from '../withEdgeStrokeStyle';

function isProtectedEdge(edge: Edge): boolean {
  const data = edge.data as DependencyEdgeData | undefined;
  return (
    data?.circular === true || data?.couldNotResolve === true || data?.severity === 'error' || data?.severity === 'warn'
  );
}

/** Styles non-protected edges that enter or leave the active path node. */
export function applyActivePathEdgeStyle(edges: Edge[], activePath: string | null): Edge[] {
  if (activePath == null) {
    return edges;
  }

  return edges.map(edge => {
    if (isProtectedEdge(edge)) {
      return edge;
    }

    if (edge.target === activePath) {
      return withEdgeStrokeStyle(edge, { color: INCOMING_EDGE_COLOR, strokeWidth: 2 });
    }

    if (edge.source === activePath) {
      return withEdgeStrokeStyle(edge, { color: OUTGOING_EDGE_COLOR, strokeWidth: 2 });
    }

    return edge;
  });
}
