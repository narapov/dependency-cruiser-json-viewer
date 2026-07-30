import type { IModule } from 'dependency-cruiser';
import { useCallback, useMemo, useState, type MouseEvent } from 'react';

import type { Edge } from '@xyflow/react';

import {
  applyActivePathEdgeStyle,
  applySelectedEdgeStyle,
  applyUserEdgeHighlightStyle,
  buildEdgeDependencyKeyMap,
  collectValidDependencyKeys,
  getEdgeHighlightColor,
} from '../../helpers';

interface UseHighlightedEdgesInput {
  modules: IModule[];
  selectedPaths: string[];
  expandedFolders: Set<string>;
  baseEdges: Edge[];
  visibleNodeIds: ReadonlySet<string>;
  activePath?: string | null;
}

interface UseHighlightedEdgesResult {
  highlightedEdges: Edge[];
  getEdgeHighlight: (edgeId: string) => string | undefined;
  setUserEdgeHighlight: (edgeId: string, color: string | null) => void;
  clearAllHighlights: () => void;
  onEdgeClick: (_: MouseEvent, edge: Edge) => void;
  clearSelectedEdge: () => void;
}

export function useHighlightedEdges({
  modules,
  selectedPaths,
  expandedFolders,
  baseEdges,
  visibleNodeIds,
  activePath,
}: UseHighlightedEdgesInput): UseHighlightedEdgesResult {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [userEdgeHighlights, setUserEdgeHighlights] = useState<ReadonlyMap<string, string>>(() => new Map());

  const activeEdgeId =
    selectedEdgeId != null && baseEdges.some(edge => edge.id === selectedEdgeId) ? selectedEdgeId : null;

  const edgeDependencyKeyMap = useMemo(
    () => buildEdgeDependencyKeyMap(modules, selectedPaths, expandedFolders, visibleNodeIds, baseEdges),
    [modules, selectedPaths, expandedFolders, visibleNodeIds, baseEdges],
  );

  const validDependencyKeys = useMemo(
    () => collectValidDependencyKeys(modules, selectedPaths),
    [modules, selectedPaths],
  );

  const effectiveUserEdgeHighlights = useMemo(() => {
    const next = new Map<string, string>();
    for (const [key, color] of userEdgeHighlights) {
      if (validDependencyKeys.has(key)) {
        next.set(key, color);
      }
    }
    return next;
  }, [userEdgeHighlights, validDependencyKeys]);

  const highlightedEdges = useMemo(
    () =>
      applyUserEdgeHighlightStyle(
        applySelectedEdgeStyle(applyActivePathEdgeStyle(baseEdges, activePath ?? null), activeEdgeId),
        effectiveUserEdgeHighlights,
        edgeDependencyKeyMap,
      ),
    [baseEdges, activePath, activeEdgeId, effectiveUserEdgeHighlights, edgeDependencyKeyMap],
  );

  const setUserEdgeHighlight = useCallback(
    (edgeId: string, color: string | null) => {
      const dependencyKeys = edgeDependencyKeyMap.get(edgeId) ?? [];
      if (dependencyKeys.length === 0) return;

      setUserEdgeHighlights(prev => {
        const next = new Map(prev);
        for (const key of dependencyKeys) {
          if (color == null) {
            next.delete(key);
          } else {
            next.set(key, color);
          }
        }
        return next;
      });
    },
    [edgeDependencyKeyMap],
  );

  const getEdgeHighlight = useCallback(
    (edgeId: string) => {
      const dependencyKeys = edgeDependencyKeyMap.get(edgeId) ?? [];
      return getEdgeHighlightColor(dependencyKeys, effectiveUserEdgeHighlights);
    },
    [edgeDependencyKeyMap, effectiveUserEdgeHighlights],
  );

  const clearAllHighlights = useCallback(() => {
    setUserEdgeHighlights(new Map());
  }, []);

  const onEdgeClick = (_: MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
  };

  const clearSelectedEdge = () => {
    setSelectedEdgeId(null);
  };

  return {
    highlightedEdges,
    getEdgeHighlight,
    setUserEdgeHighlight,
    clearAllHighlights,
    onEdgeClick,
    clearSelectedEdge,
  };
}
