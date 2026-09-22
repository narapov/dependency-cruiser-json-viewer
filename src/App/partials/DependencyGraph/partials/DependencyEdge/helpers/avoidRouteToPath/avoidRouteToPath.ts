import type { AvoidRoute, EdgePoint } from '../../../../types';

/** Radius of the schematic semicircle drawn at orthogonal edge crossings. */
export const CROSSING_JUMP_RADIUS = 1.5;

const COORD_EPSILON = 0.5;

function pointToCommand(point: EdgePoint): string {
  return `${point.x} ${point.y}`;
}

function isNearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= COORD_EPSILON;
}

function isStrictlyBetween(value: number, a: number, b: number): boolean {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return value > min + COORD_EPSILON && value < max - COORD_EPSILON;
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

/** Converts an absolute libavoid route into an SVG path, with optional crossing jumps. */
export function avoidRouteToPath(
  route: AvoidRoute,
  crossingJumps: readonly EdgePoint[] = [],
  jumpRadius: number = CROSSING_JUMP_RADIUS,
): string {
  const points = [route.sourcePoint, ...route.bendPoints, route.targetPoint];
  if (points.length === 0) {
    return '';
  }

  const commands = [`M ${pointToCommand(points[0]!)}`];

  points.slice(0, -1).forEach((start, index) => {
    const end = points[index + 1];
    if (!end) {
      return;
    }

    const horizontal = isNearlyEqual(start.y, end.y);
    if (horizontal && crossingJumps.length > 0) {
      appendHorizontalWithJumps(commands, start, end, crossingJumps, jumpRadius);
      return;
    }

    commands.push(`L ${pointToCommand(end)}`);
  });

  return commands.join(' ');
}
