import { CROSSING_JUMP_RADIUS, ORTHOGONAL_CORNER_RADIUS } from '../../constants';
import type { AvoidRoute, EdgePoint } from '../../types';

const COORD_EPSILON = 0.5;

function pointToCommand(point: EdgePoint): string {
  return `${point.x} ${point.y}`;
}

function isNearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= COORD_EPSILON;
}

function distance(a: EdgePoint, b: EdgePoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function isStrictlyBetween(value: number, a: number, b: number): boolean {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return value > min + COORD_EPSILON && value < max - COORD_EPSILON;
}

function isCollinear(a: EdgePoint, b: EdgePoint, c: EdgePoint): boolean {
  return (isNearlyEqual(a.x, b.x) && isNearlyEqual(b.x, c.x)) || (isNearlyEqual(a.y, b.y) && isNearlyEqual(b.y, c.y));
}

function jumpsOnHorizontalSegment(start: EdgePoint, end: EdgePoint, crossingJumps: readonly EdgePoint[]): EdgePoint[] {
  const travelingRight = end.x >= start.x;

  return crossingJumps
    .filter(
      jump =>
        isNearlyEqual(jump.y, start.y) && isNearlyEqual(jump.y, end.y) && isStrictlyBetween(jump.x, start.x, end.x),
    )
    .toSorted((a, b) => (travelingRight ? a.x - b.x : b.x - a.x));
}

/**
 * Appends SVG commands that follow a horizontal segment, inserting upward
 * semicircle jumps at each crossing.
 */
function appendHorizontalWithJumps(
  commands: string[],
  start: EdgePoint,
  end: EdgePoint,
  crossingJumps: readonly EdgePoint[],
  jumpRadius: number,
): void {
  const travelingRight = end.x >= start.x;
  const direction = travelingRight ? 1 : -1;
  // L→R: sweep 0 arcs toward smaller y; R→L: sweep 1 keeps the same "up" side.
  const sweepFlag = travelingRight ? 0 : 1;
  const jumps = jumpsOnHorizontalSegment(start, end, crossingJumps);

  let cursorX = start.x;
  jumps.forEach(jump => {
    const approachX = jump.x - direction * jumpRadius;
    const leaveX = jump.x + direction * jumpRadius;
    const roomBefore = Math.abs(jump.x - cursorX);
    const roomAfter = Math.abs(end.x - jump.x);
    if (roomBefore < jumpRadius + COORD_EPSILON || roomAfter < jumpRadius + COORD_EPSILON) {
      return;
    }

    commands.push(`L ${approachX} ${start.y}`);
    commands.push(`A ${jumpRadius} ${jumpRadius} 0 0 ${sweepFlag} ${leaveX} ${start.y}`);
    cursorX = leaveX;
  });

  commands.push(`L ${pointToCommand(end)}`);
}

/** Draws from `from` to `to`, inserting hops when the drawable segment is horizontal. */
function appendSegment(
  commands: string[],
  from: EdgePoint,
  to: EdgePoint,
  crossingJumps: readonly EdgePoint[],
  jumpRadius: number,
): void {
  if (isNearlyEqual(from.y, to.y) && crossingJumps.length > 0) {
    appendHorizontalWithJumps(commands, from, to, crossingJumps, jumpRadius);
    return;
  }

  commands.push(`L ${pointToCommand(to)}`);
}

/**
 * SmoothStep-style quadratic corner at `b` for orthogonal polyline a→b→c.
 * Returns approach and leave points; `bendSize` is clamped to half of each adjacent segment.
 */
function cornerPoints(
  a: EdgePoint,
  b: EdgePoint,
  c: EdgePoint,
  radius: number,
): { approach: EdgePoint; leave: EdgePoint } {
  const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, radius);

  if (isNearlyEqual(a.y, b.y)) {
    const xDir = a.x < c.x ? -1 : 1;
    const yDir = a.y < c.y ? 1 : -1;
    return {
      approach: { x: b.x + bendSize * xDir, y: b.y },
      leave: { x: b.x, y: b.y + bendSize * yDir },
    };
  }

  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return {
    approach: { x: b.x, y: b.y + bendSize * yDir },
    leave: { x: b.x + bendSize * xDir, y: b.y },
  };
}

/** Converts an absolute libavoid route into an SVG path, with optional crossing jumps. */
export function avoidRouteToPath(
  route: AvoidRoute,
  crossingJumps: readonly EdgePoint[] = [],
  jumpRadius: number = CROSSING_JUMP_RADIUS,
  cornerRadius: number = ORTHOGONAL_CORNER_RADIUS,
): string {
  const points = [route.sourcePoint, ...route.bendPoints, route.targetPoint];
  if (points.length === 0) {
    return '';
  }

  const commands = [`M ${pointToCommand(points[0]!)}`];
  let cursor = points[0]!;

  for (let i = 1; i < points.length - 1; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const c = points[i + 1]!;

    if (isCollinear(a, b, c)) {
      appendSegment(commands, cursor, b, crossingJumps, jumpRadius);
      cursor = b;
      continue;
    }

    const { approach, leave } = cornerPoints(a, b, c, cornerRadius);
    appendSegment(commands, cursor, approach, crossingJumps, jumpRadius);
    commands.push(`Q ${b.x} ${b.y} ${leave.x} ${leave.y}`);
    cursor = leave;
  }

  const last = points[points.length - 1]!;
  appendSegment(commands, cursor, last, crossingJumps, jumpRadius);

  return commands.join(' ');
}
