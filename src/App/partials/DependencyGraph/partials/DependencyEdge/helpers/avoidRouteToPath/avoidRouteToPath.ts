import type { AvoidRoute, EdgePoint } from '../../../../types';

function pointToCommand(point: EdgePoint): string {
  return `${point.x} ${point.y}`;
}

/** Converts an absolute libavoid route into an SVG polyline path. */
export function avoidRouteToPath(route: AvoidRoute): string {
  const points = [route.sourcePoint, ...route.bendPoints, route.targetPoint];
  if (points.length === 0) {
    return '';
  }

  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${pointToCommand(point)}`).join(' ');
}
