import { useEffect, useState } from 'react';

import type { CruiseSnapshot, VisibleTreeNode } from '@/domain';
import { NEED_PROFILE } from '@/Shared';

import { runBuildGraphInWorker } from '../../helpers/buildGraph';
import type { BuildGraphResult, PresenceRecord } from '../../types';

function createEmptyGraphResult(): BuildGraphResult {
  return {
    nodes: new Map(),
    tree: new Map(),
    edges: [],
  };
}

function hasAnyPresent(record: PresenceRecord): boolean {
  return Object.values(record).some(present => present === true);
}

interface UseBuildGraphInput {
  cruiseSnapshot: CruiseSnapshot;
  selectedFilePaths: PresenceRecord;
  visibleTree: readonly VisibleTreeNode[];
}

interface UseBuildGraphResult {
  graphResult: BuildGraphResult;
  isBuildingGraph: boolean;
  buildFailed: boolean;
  clearBuildFailed: () => void;
}

export function useBuildGraph(config: UseBuildGraphInput): UseBuildGraphResult {
  const { cruiseSnapshot, selectedFilePaths, visibleTree } = config;

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

    const session = runBuildGraphInWorker({
      cruiseSnapshot,
      selectedFilePaths,
      visibleTree,
      options: { debug: NEED_PROFILE },
    });

    void session.promise
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
      session.terminate();
    };
  }, [cruiseSnapshot, selectedFilePaths, visibleTree]);

  const clearBuildFailed = () => {
    setBuildFailed(false);
  };

  return { graphResult, isBuildingGraph, buildFailed, clearBuildFailed };
}
