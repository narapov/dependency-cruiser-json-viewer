import type { VisibleTreeEdge } from '@/domain';

import type { EdgePorts, RoutableEdge } from '../../types';

/** Map domain visible-tree edges + frozen ports to App routable edges (no React Flow). */
export function toRoutableEdges(
  visibleEdges: readonly VisibleTreeEdge[],
  edgesPorts?: ReadonlyMap<string, EdgePorts>,
): RoutableEdge[] {
  return visibleEdges.map(edge => {
    const ports = edgesPorts?.get(edge.key);

    return {
      id: edge.key,
      source: edge.source,
      target: edge.target,
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
      sourcePort: ports?.source,
      targetPort: ports?.target,
    };
  });
}
