import type { AvoidRoute, EdgePoint } from '../../../types';
import { routeToSegments } from '../collectCrossingJumps';

/** Max perpendicular distance (px) for two collinear segments to count as overlapping. */
export const OVERLAP_TOLERANCE_PX = 2;

interface RouteSegment {
  edgeId: string;
  start: EdgePoint;
  end: EdgePoint;
  orientation: 'horizontal' | 'vertical';
}

function rangesOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  const aMin = Math.min(a0, a1);
  const aMax = Math.max(a0, a1);
  const bMin = Math.min(b0, b1);
  const bMax = Math.max(b0, b1);
  return Math.min(aMax, bMax) - Math.max(aMin, bMin) > OVERLAP_TOLERANCE_PX;
}

function segmentsOverlap(a: RouteSegment, b: RouteSegment): boolean {
  if (a.orientation !== b.orientation) {
    return false;
  }

  if (a.orientation === 'horizontal') {
    if (Math.abs(a.start.y - b.start.y) > OVERLAP_TOLERANCE_PX) {
      return false;
    }
    return rangesOverlap(a.start.x, a.end.x, b.start.x, b.end.x);
  }

  if (Math.abs(a.start.x - b.start.x) > OVERLAP_TOLERANCE_PX) {
    return false;
  }
  return rangesOverlap(a.start.y, a.end.y, b.start.y, b.end.y);
}

class UnionFind {
  private readonly parent = new Map<string, string>();

  find(id: string): string {
    const existing = this.parent.get(id);
    if (existing === undefined) {
      this.parent.set(id, id);
      return id;
    }
    if (existing === id) {
      return id;
    }
    const root = this.find(existing);
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }
}

/**
 * Groups edge ids whose orthogonal avoid routes share nearly coincident collinear segments.
 * Singleton edges (no overlap with others) are omitted. Used by the п6 re-route pass.
 */
export function collectOverlappingEdgeIds(routes: ReadonlyMap<string, AvoidRoute>): string[][] {
  const segments = [...routes.entries()].flatMap(([edgeId, route]) => routeToSegments(edgeId, route));
  const unionFind = new UnionFind();

  routes.forEach((_route, edgeId) => {
    unionFind.find(edgeId);
  });

  segments.forEach((a, index) => {
    segments.slice(index + 1).forEach(b => {
      if (a.edgeId === b.edgeId) {
        return;
      }
      if (segmentsOverlap(a, b)) {
        unionFind.union(a.edgeId, b.edgeId);
      }
    });
  });

  const groups = new Map<string, string[]>();
  routes.forEach((_route, edgeId) => {
    const root = unionFind.find(edgeId);
    const group = groups.get(root);
    if (group) {
      group.push(edgeId);
    } else {
      groups.set(root, [edgeId]);
    }
  });

  return [...groups.values()]
    .filter(group => group.length >= 2)
    .map(group => group.toSorted((a, b) => a.localeCompare(b)))
    .toSorted((a, b) => a[0]!.localeCompare(b[0]!));
}
