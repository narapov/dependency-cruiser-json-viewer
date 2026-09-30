import { getEdgesForVisibleTree } from '@/domain';

import type { BuildGraphInput, BuildGraphResult, VisibleTreeLayoutedNode } from '../../types';
import { createBuildGraphProfiler } from './createBuildGraphProfiler';
import { createLayoutedTree } from './createLayoutedTree';
import { layoutChildren } from './layoutGroup';

/** Index every layouted node (shared object refs) into a flat path map. */
function indexLayoutedNodes(roots: readonly VisibleTreeLayoutedNode[]): Map<string, VisibleTreeLayoutedNode> {
  const nodes = new Map<string, VisibleTreeLayoutedNode>();

  const visit = (node: VisibleTreeLayoutedNode) => {
    nodes.set(node.path, node);
    node.children?.forEach(visit);
  };

  roots.forEach(visit);
  return nodes;
}

/** Builds a layouted visible tree, flat node index, and domain edges. */
export async function buildGraph({
  cruiseSnapshot,
  selectedFilePaths,
  visibleTree,
  options,
}: BuildGraphInput): Promise<BuildGraphResult> {
  const profiler = createBuildGraphProfiler(options.debug);
  profiler.start('total');

  profiler.start('nodes');
  const rootNodes = createLayoutedTree(visibleTree, cruiseSnapshot);
  profiler.end('nodes');

  profiler.start('edges');
  const edges = getEdgesForVisibleTree(cruiseSnapshot, visibleTree, selectedFilePaths);
  profiler.end('edges');

  profiler.start('layout');
  await layoutChildren(rootNodes, cruiseSnapshot, selectedFilePaths, profiler);
  profiler.end('layout');

  const nodes = indexLayoutedNodes(rootNodes);
  const tree = new Map(rootNodes.map(node => [node.path, node]));

  profiler.end('total');
  profiler.log({
    selected: Object.values(selectedFilePaths).filter(present => present).length,
    nodes: nodes.size,
    edges: edges.length,
  });

  return {
    nodes,
    tree,
    edges,
  };
}
