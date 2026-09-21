import type { Edge } from '@xyflow/react';

import type { DependencyEdgeData, ElkEdgeSection } from '../../../types';

/**
 * Attaches ELK edge sections onto matching React Flow edges by `source->target` key.
 */
export function applyElkEdgeSections(edges: Edge[], elkEdgeSections: Map<string, ElkEdgeSection[]>): Edge[] {
  return edges.map(edge => {
    const sections = elkEdgeSections.get(`${edge.source}->${edge.target}`);
    if (!sections) {
      return edge;
    }

    return {
      ...edge,
      data: {
        ...(edge.data as DependencyEdgeData | undefined),
        elkSections: sections,
      },
    };
  });
}
