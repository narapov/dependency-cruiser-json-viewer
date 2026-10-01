import { useCallback, useMemo, type MouseEvent } from 'react';

import type { Edge } from '@xyflow/react';

import { applyHighlightKeys, getEdgeHighlightColor } from '@/domain';

import { getDependencyKeysFromEdgeData } from '../../helpers/dependencyEdgeMembership';
import { useSelectedDependencyEdgeStore } from '../../stores/selectedDependencyEdgeStore';
import type { DependencyEdgeData } from '../../types';

interface UseHighlightedEdgesInput {
  baseEdges: Edge[];
  userEdgeHighlights: ReadonlyMap<string, string>;
  onUserEdgeHighlightsChange: (next: ReadonlyMap<string, string>) => void;
}

interface UseHighlightedEdgesResult {
  highlightedEdges: Edge[];
  getEdgeHighlight: (edge: Edge) => string | undefined;
  setUserEdgeHighlight: (edge: Edge, color: string | null) => void;
  onEdgeClick: (_: MouseEvent, edge: Edge) => void;
  selectEdge: (edgeId: string) => void;
  clearSelectedEdge: () => void;
}

/** Valid dependency keys present on current visible edges. */
function collectVisibleEdgeDependencyKeys(edges: readonly Edge[]): Set<string> {
  return new Set(edges.flatMap(edge => getDependencyKeysFromEdgeData(edge.data as DependencyEdgeData | undefined)));
}

export function useHighlightedEdges(config: UseHighlightedEdgesInput): UseHighlightedEdgesResult {
  const { baseEdges, userEdgeHighlights, onUserEdgeHighlightsChange } = config;

  const validDependencyKeys = useMemo(() => collectVisibleEdgeDependencyKeys(baseEdges), [baseEdges]);

  const effectiveUserEdgeHighlights = useMemo(
    () => new Map([...userEdgeHighlights.entries()].filter(([key]) => validDependencyKeys.has(key))),
    [userEdgeHighlights, validDependencyKeys],
  );

  const setUserEdgeHighlight = useCallback(
    (edge: Edge, color: string | null) => {
      const dependencyKeys = getDependencyKeysFromEdgeData(edge.data as DependencyEdgeData | undefined);
      if (dependencyKeys.length === 0) {
        return;
      }
      onUserEdgeHighlightsChange(applyHighlightKeys(userEdgeHighlights, dependencyKeys, color));
    },
    [onUserEdgeHighlightsChange, userEdgeHighlights],
  );

  const getEdgeHighlight = useCallback(
    (edge: Edge) => {
      const dependencyKeys = getDependencyKeysFromEdgeData(edge.data as DependencyEdgeData | undefined);
      return getEdgeHighlightColor(dependencyKeys, effectiveUserEdgeHighlights);
    },
    [effectiveUserEdgeHighlights],
  );

  const onEdgeClick = (_: MouseEvent, edge: Edge) => {
    useSelectedDependencyEdgeStore.getState().setSelectedEdgeId(edge.id);
  };

  const selectEdge = (edgeId: string) => {
    useSelectedDependencyEdgeStore.getState().setSelectedEdgeId(edgeId);
  };

  const clearSelectedEdge = () => {
    useSelectedDependencyEdgeStore.getState().setSelectedEdgeId(null);
  };

  return {
    highlightedEdges: baseEdges,
    getEdgeHighlight,
    setUserEdgeHighlight,
    onEdgeClick,
    selectEdge,
    clearSelectedEdge,
  };
}
