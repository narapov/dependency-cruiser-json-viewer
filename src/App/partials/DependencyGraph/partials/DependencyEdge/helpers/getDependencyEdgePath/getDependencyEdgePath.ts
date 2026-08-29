import { getBezierPath, type Position } from '@xyflow/react';

/** Max |sourceY - targetY| treated as the same horizontal row. */
const SAME_Y_EPSILON = 100;
/** Minimum vertical control-point offset for reverse edges. */
const BULGE_MIN = 24;
/** Maximum vertical control-point offset for reverse edges. */
const BULGE_MAX = 72;
/** Scales vertical bulge with horizontal distance between handles. */
const BULGE_FACTOR = 0.2;

export type GetDependencyEdgePathParams = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Cubic bezier that arches downward for reverse same-Y edges.
 * `getBezierPath` only offsets Left/Right controls on X, so equal Y stays collinear (a straight line).
 */
function getReverseHorizontalPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number] {
  const bulge = clamp(Math.abs(sourceX - targetX) * BULGE_FACTOR, BULGE_MIN, BULGE_MAX);
  // Horizontal exit from Right / entry toward Left so the curve keeps handle direction.
  const hOffset = Math.max(20, bulge * 0.5);
  const sourceControlX = sourceX + hOffset;
  const sourceControlY = sourceY + bulge;
  const targetControlX = targetX - hOffset;
  const targetControlY = targetY + bulge;

  const labelX = sourceX * 0.125 + sourceControlX * 0.375 + targetControlX * 0.375 + targetX * 0.125;
  const labelY = sourceY * 0.125 + sourceControlY * 0.375 + targetControlY * 0.375 + targetY * 0.125;
  const offsetX = Math.abs(labelX - sourceX);
  const offsetY = Math.abs(labelY - sourceY);

  return [
    `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
    labelX,
    labelY,
    offsetX,
    offsetY,
  ];
}

/**
 * Builds an SVG path for a dependency edge.
 * Reverse near-horizontal edges (target left of source) use a custom downward bulge;
 * otherwise delegates to React Flow `getBezierPath`.
 *
 * @example
 * getDependencyEdgePath({
 *   sourceX: 100, sourceY: 50, sourcePosition: Position.Right,
 *   targetX: 20, targetY: 50, targetPosition: Position.Left,
 * })
 */
export function getDependencyEdgePath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: GetDependencyEdgePathParams): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number] {
  if (Math.abs(sourceY - targetY) <= SAME_Y_EPSILON && targetX < sourceX) {
    return getReverseHorizontalPath(sourceX, sourceY, targetX, targetY);
  }

  return getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
}
