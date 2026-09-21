import { NEED_PROFILE } from '@/Shared';

import type { BuildGraphInput, BuildGraphResult, ElkEdgeSection } from '../../types';
import { sortNodesByDepth } from '../sortNodesByDepth';
import { applyElkEdgeSections } from './applyElkEdgeSections';
import { buildGraphEdges } from './buildGraphEdges';
import { buildGraphNodes } from './buildGraphNodes';
import { buildVisibleNodes } from './buildVisibleNodes';
import { createBuildGraphProfiler } from './createBuildGraphProfiler';
import { layoutGroup } from './layoutGroup';
import type { NodeSize } from './types';

/** Builds visible nodes, edges, and ELK layout for the dependency graph. */
export async function buildGraph({
  modules,
  selectedPaths,
  expandedFolders,
  folderColors,
}: BuildGraphInput): Promise<BuildGraphResult> {
  const profiler = createBuildGraphProfiler(NEED_PROFILE);
  profiler.start('total');

  profiler.start('visibleNodes');
  const { selectedSet, childrenIndex, circularModules, unresolvedModules, visibleNodes, visibleNodeIds, parentByNode } =
    buildVisibleNodes(modules, selectedPaths, expandedFolders);
  profiler.end('visibleNodes');

  profiler.start('edges');
  const edges = buildGraphEdges(modules, selectedSet, expandedFolders, visibleNodeIds);
  profiler.end('edges');

  profiler.start('nodes');
  const nodeMap = buildGraphNodes({
    visibleNodes,
    parentByNode,
    expandedFolders,
    selectedSet,
    childrenIndex,
    circularModules,
    unresolvedModules,
    folderColors,
  });
  const groupSizes = new Map<string, NodeSize>();
  const elkEdgeSections = new Map<string, ElkEdgeSection[]>();
  profiler.end('nodes');

  profiler.start('layout');
  await layoutGroup(
    null,
    nodeMap,
    groupSizes,
    visibleNodes,
    expandedFolders,
    visibleNodeIds,
    parentByNode,
    modules,
    selectedSet,
    elkEdgeSections,
    profiler,
  );
  const edgesWithElkPaths = applyElkEdgeSections(edges, elkEdgeSections);
  profiler.end('layout');

  profiler.start('sort');
  const nodes = sortNodesByDepth([...nodeMap.values()]);
  profiler.end('sort');

  profiler.end('total');
  profiler.log({
    selected: selectedPaths.length,
    nodes: nodes.length,
    edges: edgesWithElkPaths.length,
  });

  return {
    nodes,
    edges: edgesWithElkPaths,
    visibleNodeIds,
    parentByNode,
  };
}
