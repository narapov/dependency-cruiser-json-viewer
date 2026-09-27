import { useEffect, useState } from 'react';

import type { CruiseSnapshot } from '@/domain';

import { buildGraph } from '../../helpers';
import type { BuildGraphResult, PresenceRecord } from '../../types';

function createEmptyGraphResult(): BuildGraphResult {
  return {
    nodes: [],
    edges: [],
    visibleNodeIds: new Set(),
    parentByNode: new Map(),
  };
}

function hasAnyPresent(record: PresenceRecord): boolean {
  return Object.values(record).some(present => present === true);
}

interface UseBuildGraphInput {
  cruiseSnapshot: CruiseSnapshot;
  selectedFilePaths: PresenceRecord;
  expandedFolderPaths: PresenceRecord;
  folderColors: ReadonlyMap<string, string>;
}

interface UseBuildGraphResult {
  graphResult: BuildGraphResult;
  isBuildingGraph: boolean;
  buildFailed: boolean;
  clearBuildFailed: () => void;
}

export function useBuildGraph(config: UseBuildGraphInput): UseBuildGraphResult {
  const { cruiseSnapshot, selectedFilePaths, expandedFolderPaths, folderColors } = config;

  const [graphResult, setGraphResult] = useState<BuildGraphResult>(createEmptyGraphResult);
  const [isBuildingGraph, setIsBuildingGraph] = useState(() => hasAnyPresent(selectedFilePaths));
  const [buildFailed, setBuildFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!hasAnyPresent(selectedFilePaths)) {
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
      cruiseSnapshot,
      selectedFilePaths,
      expandedFolderPaths,
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
  }, [cruiseSnapshot, selectedFilePaths, expandedFolderPaths, folderColors]);

  const clearBuildFailed = () => {
    setBuildFailed(false);
  };

  return { graphResult, isBuildingGraph, buildFailed, clearBuildFailed };
}
