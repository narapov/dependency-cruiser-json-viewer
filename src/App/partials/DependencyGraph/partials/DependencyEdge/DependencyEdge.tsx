import { memo } from 'react';

import { BaseEdge, type EdgeProps } from '@xyflow/react';

import { getEdgeHighlightColor } from '@/domain';
import { INCOMING_EDGE_COLOR, OUTGOING_EDGE_COLOR, SELECTED_EDGE_COLOR } from '@/Shared';

import { useWorkspaceStore } from '../../../../stores/workspaceStore';
import { isPathOnDependencyEdge } from '../../helpers/dependencyEdgeMembership';
import { getDependencyEdgeVisualStyle, isProtectedDependencyEdge } from '../../helpers/getDependencyEdgeVisualStyle';
import { useGraphMarkersStore } from '../../stores/graphMarkersStore';
import { useSelectedDependencyEdgeStore } from '../../stores/selectedDependencyEdgeStore';
import type { DependencyEdgeData } from '../../types';
import { getDependencyEdgePath } from './helpers/getDependencyEdgePath';

export const DependencyEdge = memo(function DependencyEdge(props: EdgeProps) {
  const {
    id,
    source,
    target,
    data,
    interactionWidth = 3,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  } = props;

  const edgeData = data as DependencyEdgeData | undefined;
  const edgesType = useWorkspaceStore(state => state.graphSettings.edgesType);
  const activePathSide = useWorkspaceStore(state => {
    const { activePath } = state;
    if (activePath == null) {
      return null;
    }
    return isPathOnDependencyEdge(activePath, source, target, edgeData?.aggregated);
  });
  const userEdgeHighlights = useWorkspaceStore(state => state.userEdgeHighlights);
  const isSelected = useSelectedDependencyEdgeStore(state => state.selectedEdgeId === id);

  const [path] = getDependencyEdgePath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    edgesType,
  });

  const base = getDependencyEdgeVisualStyle(source, target, edgeData);
  const protectedEdge = isProtectedDependencyEdge(edgeData);

  let stroke = base.stroke;
  let strokeWidth = base.strokeWidth;

  const userHighlight = getEdgeHighlightColor(edgeData?.aggregated?.map(dep => dep.id) ?? [], userEdgeHighlights);
  if (userHighlight != null) {
    stroke = userHighlight;
    strokeWidth = 2;
  } else if (activePathSide != null && !protectedEdge) {
    if (activePathSide === 'target') {
      stroke = INCOMING_EDGE_COLOR;
      strokeWidth = 2;
    } else if (activePathSide === 'source') {
      stroke = OUTGOING_EDGE_COLOR;
      strokeWidth = 2;
    }
  }

  if (isSelected) {
    stroke = SELECTED_EDGE_COLOR;
    strokeWidth = 3;
  }

  const style = {
    stroke,
    strokeWidth,
    ...(base.strokeDasharray != null ? { strokeDasharray: base.strokeDasharray } : {}),
  };

  const getOrCreateGraphMarkerUrl = useGraphMarkersStore(state => state.getOrCreateGraphMarkerUrl);
  const markerEnd = getOrCreateGraphMarkerUrl(stroke);

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} interactionWidth={interactionWidth} />
      <path d={path} fill="none" stroke="transparent" strokeWidth={interactionWidth}>
        {!!base.title && <title>{base.title}</title>}
      </path>
    </>
  );
});
