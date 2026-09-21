import type { ElkEdgePoint, ElkEdgeSection } from '../../../../types';

export interface ElkSectionsToPathOrigin {
  x: number;
  y: number;
}

function toAbsolute(point: ElkEdgePoint, origin: ElkSectionsToPathOrigin): string {
  return `${point.x + origin.x} ${point.y + origin.y}`;
}

/**
 * Builds an SVG path from ELK spline control points (start + bendPoints + end).
 * Bend points are piecewise cubic Bezier controls; leftover 1–2 points use L / Q.
 */
function pointsToSplinePath(points: readonly ElkEdgePoint[], origin: ElkSectionsToPathOrigin): string {
  if (points.length === 0) {
    return '';
  }

  const commands = [`M ${toAbsolute(points[0]!, origin)}`];
  let index = 1;

  while (index < points.length) {
    const remaining = points.length - index;
    if (remaining === 1) {
      commands.push(`L ${toAbsolute(points[index]!, origin)}`);
      index += 1;
    } else if (remaining === 2) {
      commands.push(`Q ${toAbsolute(points[index]!, origin)} ${toAbsolute(points[index + 1]!, origin)}`);
      index += 2;
    } else {
      commands.push(
        `C ${toAbsolute(points[index]!, origin)} ${toAbsolute(points[index + 1]!, origin)} ${toAbsolute(points[index + 2]!, origin)}`,
      );
      index += 3;
    }
  }

  return commands.join(' ');
}

/**
 * Converts ELK edge sections (parent-relative) into an absolute SVG spline path.
 */
export function elkSectionsToPath(sections: readonly ElkEdgeSection[], origin: ElkSectionsToPathOrigin): string {
  return sections
    .map(section => pointsToSplinePath([section.startPoint, ...(section.bendPoints ?? []), section.endPoint], origin))
    .join(' ');
}
