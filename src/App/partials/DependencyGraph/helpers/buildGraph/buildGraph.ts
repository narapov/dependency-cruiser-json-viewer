import { getEdgesForVisibleTree } from '@/domain';

import type { BuildGraphInput, BuildGraphResult } from '../../types';
import { sortNodesByDepth } from '../sortNodesByDepth';
import { visibleTreeEdgesToReactFlowEdges } from './buildGraphEdges';
import { buildGraphNodes } from './buildGraphNodes';
import { createBuildGraphProfiler } from './createBuildGraphProfiler';
import { deriveGraphVisibilityFromVisibleTree } from './deriveGraphVisibilityFromVisibleTree';
import { layoutGroup } from './layoutGroup';
import type { NodeSize } from './types';

/** Builds visible nodes, edges, and ELK layout for the dependency graph. */
export async function buildGraph({
  cruiseSnapshot,
  selectedFilePaths,
  visibleTree,
  folderColors,
  options,
}: BuildGraphInput): Promise<BuildGraphResult> {
  const profiler = createBuildGraphProfiler(options.debug);
  profiler.start('total');

  profiler.start('visibleNodes');
  const {
    visibleNodes,
    parentByNode,
    visibleNodeIds,
    expandedFolders,
    circularByPath,
    unresolvedModules,
    selectedSet,
  } = deriveGraphVisibilityFromVisibleTree(cruiseSnapshot, visibleTree, selectedFilePaths);
  profiler.end('visibleNodes');

  profiler.start('edges');
  const edges = visibleTreeEdgesToReactFlowEdges(
    getEdgesForVisibleTree(cruiseSnapshot, visibleTree, selectedFilePaths),
  );
  profiler.end('edges');

  profiler.start('nodes');
  const nodeMap = buildGraphNodes({
    visibleNodes,
    parentByNode,
    expandedFolders,
    circularByPath,
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
    cruiseSnapshot,
    selectedFilePaths,
    profiler,
  );
  profiler.end('layout');

  profiler.start('sort');
  const nodes = sortNodesByDepth([...nodeMap.values()], cruiseSnapshot);
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
