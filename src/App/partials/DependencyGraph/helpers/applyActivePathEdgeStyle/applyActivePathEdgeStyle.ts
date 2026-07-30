import type { Edge } from '@xyflow/react';

import { INCOMING_EDGE_COLOR, OUTGOING_EDGE_COLOR } from '@/Shared';

import type { DependencyEdgeData } from '../../types';
import { withEdgeStrokeStyle } from '../withEdgeStrokeStyle';

function isCircularEdge(edge: Edge): boolean {
  const data = edge.data as DependencyEdgeData | undefined;
  return data?.circular === true;
}

export function applyActivePathEdgeStyle(edges: Edge[], activePath: string | null): Edge[] {
  if (activePath == null) return edges;

  return edges.map(edge => {
    if (isCircularEdge(edge)) return edge;

    if (edge.target === activePath) {
      return withEdgeStrokeStyle(edge, { color: INCOMING_EDGE_COLOR, strokeWidth: 2 });
    }

    if (edge.source === activePath) {
      return withEdgeStrokeStyle(edge, { color: OUTGOING_EDGE_COLOR, strokeWidth: 2 });
    }

    return edge;
  });
}
