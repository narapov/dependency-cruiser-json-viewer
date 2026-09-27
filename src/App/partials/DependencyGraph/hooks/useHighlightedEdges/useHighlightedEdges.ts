import type { IModule } from 'dependency-cruiser';
import { useCallback, useMemo, useState, type MouseEvent } from 'react';

import type { Edge } from '@xyflow/react';

import { applyHighlightKeys, getEdgeHighlightColor } from '@/domain';

import {
  applyActivePathEdgeStyle,
  applySelectedEdgeStyle,
  applyUserEdgeHighlightStyle,
  buildEdgeDependencyKeyMap,
  collectValidDependencyKeys,
} from '../../helpers';
import type { PresenceRecord } from '../../types';

interface UseHighlightedEdgesInput {
  modules: IModule[];
  selectedFilePaths: PresenceRecord;
  expandedFolderPaths: PresenceRecord;
  baseEdges: Edge[];
  visibleNodeIds: ReadonlySet<string>;
  activePath?: string | null;
  userEdgeHighlights: ReadonlyMap<string, string>;
  onUserEdgeHighlightsChange: (next: ReadonlyMap<string, string>) => void;
}

interface UseHighlightedEdgesResult {
  highlightedEdges: Edge[];
  getEdgeHighlight: (edgeId: string) => string | undefined;
  setUserEdgeHighlight: (edgeId: string, color: string | null) => void;
  onEdgeClick: (_: MouseEvent, edge: Edge) => void;
  selectEdge: (edgeId: string) => void;
  clearSelectedEdge: () => void;
}

export function useHighlightedEdges(config: UseHighlightedEdgesInput): UseHighlightedEdgesResult {
  const {
    modules,
    selectedFilePaths,
    expandedFolderPaths,
    baseEdges,
    visibleNodeIds,
    activePath,
    userEdgeHighlights,
    onUserEdgeHighlightsChange,
  } = config;

  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const activeEdgeId =
    selectedEdgeId != null && baseEdges.some(edge => edge.id === selectedEdgeId) ? selectedEdgeId : null;

  const edgeDependencyKeyMap = useMemo(
    () => buildEdgeDependencyKeyMap(modules, selectedFilePaths, expandedFolderPaths, visibleNodeIds, baseEdges),
    [modules, selectedFilePaths, expandedFolderPaths, visibleNodeIds, baseEdges],
  );

  const validDependencyKeys = useMemo(
    () => collectValidDependencyKeys(modules, selectedFilePaths),
    [modules, selectedFilePaths],
  );

  const effectiveUserEdgeHighlights = useMemo(
    () => new Map([...userEdgeHighlights.entries()].filter(([key]) => validDependencyKeys.has(key))),
    [userEdgeHighlights, validDependencyKeys],
  );

  const highlightedEdges = useMemo(
    () =>
      applySelectedEdgeStyle(
        applyUserEdgeHighlightStyle(
          applyActivePathEdgeStyle(baseEdges, activePath ?? null),
          effectiveUserEdgeHighlights,
          edgeDependencyKeyMap,
        ),
        activeEdgeId,
      ),
    [baseEdges, activePath, activeEdgeId, effectiveUserEdgeHighlights, edgeDependencyKeyMap],
  );

  const setUserEdgeHighlight = useCallback(
    (edgeId: string, color: string | null) => {
      const dependencyKeys = edgeDependencyKeyMap.get(edgeId) ?? [];
      if (dependencyKeys.length === 0) {
        return;
      }

      onUserEdgeHighlightsChange(applyHighlightKeys(userEdgeHighlights, dependencyKeys, color));
    },
    [edgeDependencyKeyMap, onUserEdgeHighlightsChange, userEdgeHighlights],
  );

  const getEdgeHighlight = useCallback(
    (edgeId: string) => {
      const dependencyKeys = edgeDependencyKeyMap.get(edgeId) ?? [];
      return getEdgeHighlightColor(dependencyKeys, effectiveUserEdgeHighlights);
    },
    [edgeDependencyKeyMap, effectiveUserEdgeHighlights],
  );

  const onEdgeClick = (_: MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
  };

  const selectEdge = (edgeId: string) => {
    setSelectedEdgeId(edgeId);
  };

  const clearSelectedEdge = () => {
    setSelectedEdgeId(null);
  };

  return {
    highlightedEdges,
    getEdgeHighlight,
    setUserEdgeHighlight,
    onEdgeClick,
    selectEdge,
    clearSelectedEdge,
  };
}
