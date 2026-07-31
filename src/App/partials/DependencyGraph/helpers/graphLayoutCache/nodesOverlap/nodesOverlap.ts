import type { NodeSize } from '../types';

/** Returns true when axis-aligned rectangles overlap (including edges). */
export function nodesOverlap(
  aPos: { x: number; y: number },
  aSize: NodeSize,
  bPos: { x: number; y: number },
  bSize: NodeSize,
): boolean {
  return (
    aPos.x < bPos.x + bSize.width &&
    aPos.x + aSize.width > bPos.x &&
    aPos.y < bPos.y + bSize.height &&
    aPos.y + aSize.height > bPos.y
  );
}
