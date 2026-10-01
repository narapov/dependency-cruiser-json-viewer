import { getEdgesForVisibleTree } from '@/domain';

import type { BuildGraphInput, BuildGraphResult, VisibleTreeLayoutedNode } from '../../types';
import { assignEdgePorts } from '../assignEdgePorts';
import { collectVisibleGroupLayouts } from '../groupLayoutCache/mergeVisibleGroupLayouts';
import { deserializeLayoutCache, serializeLayoutCache } from '../groupLayoutCache/serializeLayoutCache';
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

/** Build parent map from layouted-node children links (roots stay `null`). */
function buildParentByNode(nodes: ReadonlyMap<string, VisibleTreeLayoutedNode>): Map<string, string | null> {
  const parentByNode = new Map<string, string | null>([...nodes.keys()].map(path => [path, null]));

  nodes.forEach(node => {
    node.children?.forEach(child => {
      parentByNode.set(child.path, node.path);
    });
  });

  return parentByNode;
}

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

  profiler.start('nodes');
  const rootNodes = createLayoutedTree(visibleTree, cruiseSnapshot);
  profiler.end('nodes');

  profiler.start('edges');
  const edges = getEdgesForVisibleTree(cruiseSnapshot, visibleTree, selectedFilePaths);
  profiler.end('edges');

  const cache = layoutCache ? deserializeLayoutCache(layoutCache) : null;

  profiler.start('layout');
  await layoutChildren(rootNodes, cruiseSnapshot, selectedFilePaths, profiler, cache, null);
  profiler.end('layout');

  const nodes = indexLayoutedNodes(rootNodes);
  const tree = new Map(rootNodes.map(node => [node.path, node]));
  const visibleGroupLayouts = serializeLayoutCache(collectVisibleGroupLayouts(rootNodes));

  profiler.start('ports');
  const parentByNode = buildParentByNode(nodes);
  const edgePortsById = assignEdgePorts({
    nodes: [...nodes.values()].map(node => ({
      id: node.path,
      position: node.position,
      width: node.width,
      height: node.height,
    })),
    edges: edges.map(edge => ({
      id: edge.key,
      source: edge.source,
      target: edge.target,
    })),
    parentByNode,
  });
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
    edgePortsById,
  };
}
