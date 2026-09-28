import { MarkerType, type Edge } from '@xyflow/react';

import type { VisibleTreeEdge } from '@/domain';
import { DEFAULT_EDGE_COLOR } from '@/Shared';

import type { DependencyEdgeData } from '../../../types';

/** Map domain visible-tree edges to lightweight React Flow edges (data flags only). */
export function visibleTreeEdgesToReactFlowEdges(visibleEdges: readonly VisibleTreeEdge[]): Edge[] {
  return visibleEdges.map(edge => {
    const data: DependencyEdgeData = {
      typeOnly: edge.typeOnly,
      valueCircular: edge.valueCircular,
      typeOnlyCircular: edge.typeOnlyCircular,
      couldNotResolve: edge.violations.couldNotResolve,
      severity: edge.violations.severity ?? undefined,
      ruleNames: edge.violations.ruleNames.size > 0 ? [...edge.violations.ruleNames].sort() : undefined,
      aggregated: edge.aggregated.map(dep => ({
        id: dep.id,
        source: dep.source,
        target: dep.target,
      })),
    };

    return {
      id: edge.key,
      type: 'dependency',
      source: edge.source,
      target: edge.target,
      interactionWidth: 3,
      // Marker defs are created from edge.markerEnd in the store, not from BaseEdge props alone.
      markerEnd: { type: MarkerType.ArrowClosed, color: DEFAULT_EDGE_COLOR },
      data,
    };
  });
}
