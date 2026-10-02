import { getEdgesForVisibleTree, indexTreeByKey } from '@/domain';

import type { BuildGraphInput, BuildGraphResult } from '../../types';
import { getEdgesPorts } from '../getEdgesPorts';
import { collectVisibleGroupLayouts } from '../layoutCache/mergeVisibleGroupLayouts';
import { deserializeLayoutCache, serializeLayoutCache } from '../layoutCache/serializeLayoutCache';
import { createBuildGraphProfiler } from './createBuildGraphProfiler';
import { layoutVisibleTree } from './layoutGroup';

/** Builds a layouted visible tree, flat node index, domain edges, and frozen edge ports. */
export async function buildGraph({
  cruiseSnapshot,
  selectedFilePaths,
  visibleTree,
  options,
  layoutCache,
}: BuildGraphInput): Promise<BuildGraphResult> {
  const profiler = createBuildGraphProfiler(options.debug);
  profiler.start('total');

  profiler.start('edges');
  const edges = getEdgesForVisibleTree(cruiseSnapshot, visibleTree, selectedFilePaths);
  profiler.end('edges');

  const cache = layoutCache ? deserializeLayoutCache(layoutCache) : null;

  profiler.start('layout');
  const rootNodes = await layoutVisibleTree(visibleTree, cruiseSnapshot, selectedFilePaths, profiler, cache);
  profiler.end('layout');

  const nodes = indexTreeByKey(rootNodes, node => node.path);
  const tree = new Map(rootNodes.map(node => [node.path, node]));
  const visibleGroupLayouts = serializeLayoutCache(collectVisibleGroupLayouts(rootNodes));

  profiler.start('ports');
  const edgesPorts = getEdgesPorts(rootNodes, edges);
  profiler.end('ports');

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
    visibleGroupLayouts,
    edgesPorts,
  };
}
