import type { ElkEdgeSection } from '../../../../../types';
import { GROUP_HEADER, GROUP_PADDING } from '../../../layoutConstants';

interface ElkLayoutPoint {
  x: number;
  y: number;
}

interface ElkLayoutEdge {
  sources?: string[];
  targets?: string[];
  sections?: Array<{
    startPoint: ElkLayoutPoint;
    endPoint: ElkLayoutPoint;
    bendPoints?: ElkLayoutPoint[];
  }>;
}

function offsetPoint(point: ElkLayoutPoint): ElkLayoutPoint {
  return {
    x: point.x + GROUP_PADDING,
    y: point.y + GROUP_HEADER + GROUP_PADDING,
  };
}

/** Strips `:E` / `:W` / `:E0` / `:W1` port suffixes so keys match React Flow node ids. */
function toNodeId(portOrNodeId: string): string {
  return portOrNodeId.replace(/:[EW]\d*$/, '');
}

/**
 * Maps ELK layout edges to offset sections keyed by `source->target`.
 * Offsets match the padding applied to child node positions.
 */
export function extractElkEdgeSections(edges: readonly ElkLayoutEdge[] | undefined): Map<string, ElkEdgeSection[]> {
  return (edges ?? []).reduce((map, edge) => {
    const source = edge.sources?.[0];
    const target = edge.targets?.[0];
    if (!source || !target || !edge.sections?.length) {
      return map;
    }

    const sections: ElkEdgeSection[] = edge.sections.map(section => ({
      startPoint: offsetPoint(section.startPoint),
      endPoint: offsetPoint(section.endPoint),
      bendPoints: section.bendPoints?.map(offsetPoint),
    }));

    map.set(`${toNodeId(source)}->${toNodeId(target)}`, sections);
    return map;
  }, new Map<string, ElkEdgeSection[]>());
}
