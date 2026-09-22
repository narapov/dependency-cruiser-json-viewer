import type { AvoidRoute, EdgePoint } from '../../../types';

const COORD_EPSILON = 0.5;

interface RouteSegment {
  edgeId: string;
  start: EdgePoint;
  end: EdgePoint;
  orientation: 'horizontal' | 'vertical';
}

function isNearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= COORD_EPSILON;
}

function routePoints(route: AvoidRoute): EdgePoint[] {
  return [route.sourcePoint, ...route.bendPoints, route.targetPoint];
}

/** Splits an absolute orthogonal route into non-degenerate H/V segments. */
export function routeToSegments(edgeId: string, route: AvoidRoute): RouteSegment[] {
  const points = routePoints(route);

  return points.slice(0, -1).flatMap((start, index) => {
    const end = points[index + 1];
    if (!end) {
      return [];
    }

    const horizontal = isNearlyEqual(start.y, end.y);
    const vertical = isNearlyEqual(start.x, end.x);
    if ((!horizontal && !vertical) || (horizontal && vertical)) {
      return [];
    }

    return [
      {
        edgeId,
        start,
        end,
        orientation: horizontal ? ('horizontal' as const) : ('vertical' as const),
      },
    ];
  });
}

function isStrictlyBetween(value: number, a: number, b: number): boolean {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return value > min + COORD_EPSILON && value < max - COORD_EPSILON;
}

function segmentCrossing(horizontal: RouteSegment, vertical: RouteSegment): EdgePoint | null {
  const y = horizontal.start.y;
  const x = vertical.start.x;

  if (!isStrictlyBetween(x, horizontal.start.x, horizontal.end.x)) {
    return null;
  }
  if (!isStrictlyBetween(y, vertical.start.y, vertical.end.y)) {
    return null;
  }

  return { x, y };
}

function pointKey(point: EdgePoint): string {
  return `${Math.round(point.x)},${Math.round(point.y)}`;
}

/**
 * Finds proper H×V crossings across orthogonal avoid routes and assigns a jump
 * point to the horizontal edge at each crossing (schematic wire-bridge style).
 */
export function collectCrossingJumps(routes: ReadonlyMap<string, AvoidRoute>): Map<string, EdgePoint[]> {
  const segments = [...routes.entries()].flatMap(([edgeId, route]) => routeToSegments(edgeId, route));
  const jumpsByEdge = new Map<string, EdgePoint[]>();
  const seenByEdge = new Map<string, Set<string>>();

  segments.forEach((a, index) => {
    segments.slice(index + 1).forEach(b => {
      if (a.edgeId === b.edgeId) {
        return;
      }
      if (a.orientation === b.orientation) {
        return;
      }

      const horizontal = a.orientation === 'horizontal' ? a : b;
      const vertical = a.orientation === 'vertical' ? a : b;
      const crossing = segmentCrossing(horizontal, vertical);
      if (!crossing) {
        return;
      }

      const existing = jumpsByEdge.get(horizontal.edgeId) ?? [];
      const seen = seenByEdge.get(horizontal.edgeId) ?? new Set<string>();
      const key = pointKey(crossing);
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      seenByEdge.set(horizontal.edgeId, seen);
      jumpsByEdge.set(horizontal.edgeId, [...existing, crossing]);
    });
  });

  return jumpsByEdge;
}
