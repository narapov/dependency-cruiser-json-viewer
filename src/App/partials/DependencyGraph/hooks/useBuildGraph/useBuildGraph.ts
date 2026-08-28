import type { IModule } from 'dependency-cruiser';
import { useEffect, useMemo, useState } from 'react';

import { buildGraph } from '../../helpers';
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
  folderColors: ReadonlyMap<string, string>;
}

interface UseBuildGraphResult {
  graphResult: BuildGraphResult;
  isBuildingGraph: boolean;
  buildFailed: boolean;
  clearBuildFailed: () => void;
  expandedFolders: Set<string>;
}

export function useBuildGraph({
  modules,
  selectedPaths,
  expandedKeys,
  folderColors,
}: UseBuildGraphInput): UseBuildGraphResult {
  const expandedFolders = useMemo(() => new Set(expandedKeys), [expandedKeys]);

  const [graphResult, setGraphResult] = useState<BuildGraphResult>(createEmptyGraphResult);
  const [isBuildingGraph, setIsBuildingGraph] = useState(() => selectedPaths.length > 0);
  const [buildFailed, setBuildFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (selectedPaths.length === 0) {
      //synchronous update is fine here
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGraphResult(createEmptyGraphResult());
      setIsBuildingGraph(false);
      setBuildFailed(false);
      return;
    }

    //synchronous update is fine here
    setIsBuildingGraph(true);

    void buildGraph({
      modules,
      selectedPaths,
      expandedFolders,
      folderColors,
    })
      .then(result => {
        if (cancelled) {
          return;
        }
        setGraphResult(result);
        setBuildFailed(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setGraphResult(createEmptyGraphResult());
        setBuildFailed(true);
      })
      .finally(() => {
        if (!cancelled) {
          setIsBuildingGraph(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [modules, selectedPaths, expandedFolders, folderColors]);

  const clearBuildFailed = () => {
    setBuildFailed(false);
  };

  return { graphResult, isBuildingGraph, buildFailed, clearBuildFailed, expandedFolders };
}
