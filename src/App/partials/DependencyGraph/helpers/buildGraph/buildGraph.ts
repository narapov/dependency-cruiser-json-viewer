import { getCruiseModules } from '@/domain';
import { NEED_PROFILE } from '@/Shared';

import type { BuildGraphInput, BuildGraphResult } from '../../types';
import { sortNodesByDepth } from '../sortNodesByDepth';
import { buildGraphEdges } from './buildGraphEdges';
import { buildGraphNodes } from './buildGraphNodes';
import { buildVisibleNodes } from './buildVisibleNodes';
import { createBuildGraphProfiler } from './createBuildGraphProfiler';
import { layoutGroup } from './layoutGroup';
import type { NodeSize } from './types';

/** Builds visible nodes, edges, and ELK layout for the dependency graph. */
export async function buildGraph({
  cruiseSnapshot,
  selectedFilePaths,
  expandedFolderPaths,
  folderColors,
}: BuildGraphInput): Promise<BuildGraphResult> {
  const profiler = createBuildGraphProfiler(NEED_PROFILE);
  profiler.start('total');

  const modules = getCruiseModules(cruiseSnapshot);

  profiler.start('visibleNodes');
  const {
    selectedSet,
    expandedFolders,
    childrenIndex,
    circularModules,
    unresolvedModules,
    visibleNodes,
    visibleNodeIds,
    parentByNode,
  } = buildVisibleNodes(cruiseSnapshot, selectedFilePaths, expandedFolderPaths);
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
    profiler,
  );
  profiler.end('layout');

  profiler.start('sort');
  const nodes = sortNodesByDepth([...nodeMap.values()]);
  profiler.end('sort');

  profiler.end('total');
  profiler.log({
    selected: selectedSet.size,
    nodes: nodes.length,
    edges: edges.length,
  });

  return {
    nodes,
    edges,
    visibleNodeIds,
    parentByNode,
  };
}
