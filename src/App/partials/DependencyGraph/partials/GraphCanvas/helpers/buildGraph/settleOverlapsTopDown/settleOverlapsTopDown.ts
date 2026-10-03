import { GRID_GAP_Y } from '../layoutConstants';
import { nodesOverlap } from '../nodesOverlap';

/** Mutable sibling geometry for cascading vertical overlap settle. */
export interface OverlapSettleItem {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

/**
 * Cascading top-down vertical overlap settle among siblings.
 * Sorts by y then x; pushes non-fixed items down just enough to clear already settled
 * (and all fixed) rectangles. Does not change x. Mutates `position.y` on items.
 */
export function settleOverlapsTopDown(items: OverlapSettleItem[], fixedIds: ReadonlySet<string> = new Set()): void {
  if (items.length <= 1) {
    return;
  }

  const fixed = items.filter(item => fixedIds.has(item.id));
  const movable = items
    .filter(item => !fixedIds.has(item.id))
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x || a.id.localeCompare(b.id));

  const settled: OverlapSettleItem[] = [...fixed];

  movable.forEach(item => {
    const nextY = settled.reduce((y, other) => {
      return nodesOverlap({ x: item.position.x, y }, { width: item.width, height: item.height }, other.position, {
        width: other.width,
        height: other.height,
      })
        ? Math.max(y, other.position.y + other.height + GRID_GAP_Y)
        : y;
    }, item.position.y);

    item.position.y = nextY;
    settled.push(item);
  });
}
