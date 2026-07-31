import type { IModule } from 'dependency-cruiser';
import { useEffect, useMemo, useState } from 'react';

import { assignFolderColors, buildGraph, type FolderColorMode } from '../../helpers';
import type { BuildGraphResult } from '../../types';

function createEmptyGraphResult(): BuildGraphResult {
  return {
    nodes: [],
    edges: [],
    visibleNodeIds: new Set(),
    parentByNode: new Map(),
  };
}

interface UseBuildGraphInput {
  modules: IModule[];
  selectedPaths: string[];
  expandedKeys: string[];
  colorMode: FolderColorMode;
  onToggleFolder: (path: string) => void;
  onExpandRecursive: (path: string) => void;
  onShowInFileTree: (path: string) => void;
  onShowDependencies?: (path: string) => void;
}

interface UseBuildGraphResult {
  graphResult: BuildGraphResult;
  isBuildingGraph: boolean;
  expandedFolders: Set<string>;
}

export function useBuildGraph({
  modules,
  selectedPaths,
  expandedKeys,
  colorMode,
  onToggleFolder,
  onExpandRecursive,
  onShowInFileTree,
  onShowDependencies,
}: UseBuildGraphInput): UseBuildGraphResult {
  const sources = useMemo(() => modules.map(module => module.source), [modules]);
  const folderColors = useMemo(() => assignFolderColors(sources, colorMode), [sources, colorMode]);
  const expandedFolders = useMemo(() => new Set(expandedKeys), [expandedKeys]);

  const [graphResult, setGraphResult] = useState<BuildGraphResult>(createEmptyGraphResult);
  const [isBuildingGraph, setIsBuildingGraph] = useState(() => selectedPaths.length > 0);

  useEffect(() => {
    let cancelled = false;

    if (selectedPaths.length === 0) {
      //synchronous update is fine here
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGraphResult(createEmptyGraphResult());
      setIsBuildingGraph(false);
      return;
    }

    //synchronous update is fine here
    setIsBuildingGraph(true);

    void buildGraph({
      modules,
      selectedPaths,
      expandedFolders,
      folderColors,
      onToggleFolder,
      onExpandRecursive,
      onShowInFileTree,
      onShowDependencies,
    })
      .then(result => {
        if (cancelled) return;
        setGraphResult(result);
      })
      .catch(() => {
        if (cancelled) return;
        setGraphResult(createEmptyGraphResult());
      })
      .finally(() => {
        if (!cancelled) setIsBuildingGraph(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    modules,
    selectedPaths,
    expandedFolders,
    folderColors,
    onToggleFolder,
    onExpandRecursive,
    onShowInFileTree,
    onShowDependencies,
  ]);

  return { graphResult, isBuildingGraph, expandedFolders };
}
