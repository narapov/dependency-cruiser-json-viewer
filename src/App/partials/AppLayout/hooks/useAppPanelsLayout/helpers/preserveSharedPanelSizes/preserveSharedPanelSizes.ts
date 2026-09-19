import { type Layout } from 'react-resizable-panels';

const GRAPH_PANEL_ID = 'graph';

/** True when the two layouts list different panel id sets. */
export function layoutsHaveDifferentPanelSets(a: Layout, b: Layout): boolean {
  const aIds = Object.keys(a);
  const bIds = Object.keys(b);
  if (aIds.length !== bIds.length) {
    return true;
  }
  const aSet = new Set(aIds);
  return bIds.some(id => !aSet.has(id));
}

/**
 * When the visible panel set changes, keep non-graph panel sizes from the previous
 * layout and give leftover space to the graph so shared panels (e.g. sidebar) do not jump.
 */
export function preserveSharedPanelSizes(previous: Layout, next: Layout): Layout | null {
  if (!layoutsHaveDifferentPanelSets(previous, next)) {
    return null;
  }
  if (!(GRAPH_PANEL_ID in previous) || !(GRAPH_PANEL_ID in next)) {
    return null;
  }

  const preserved: Layout = { ...next };
  const nextIds = Object.keys(next);
  let changed = false;

  nextIds
    .filter(id => id !== GRAPH_PANEL_ID)
    .forEach(id => {
      if (id in previous && previous[id] !== next[id]) {
        preserved[id] = previous[id];
        changed = true;
      }
    });

  if (!changed) {
    return null;
  }

  const othersSum = nextIds.filter(id => id !== GRAPH_PANEL_ID).reduce((sum, id) => sum + preserved[id], 0);
  preserved[GRAPH_PANEL_ID] = 100 - othersSum;

  return preserved;
}
