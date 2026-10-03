import { memo } from 'react';

import { BaseEdge, Position, useInternalNode, type EdgeProps, type InternalNode } from '@xyflow/react';

import { getEdgeHighlightColor } from '@/domain';
import { INCOMING_EDGE_COLOR, OUTGOING_EDGE_COLOR, SELECTED_EDGE_COLOR } from '@/Shared';

import { useWorkspaceStore } from '../../../../../../stores/workspaceStore';
import { isPathOnDependencyEdge } from '../../helpers/dependencyEdgeMembership';
import {
  getDependencyEdgeVisualStyle,
  isProtectedDependencyEdge,
  type DependencyEdgeVisualStyle,
} from '../../helpers/getDependencyEdgeVisualStyle';
import { isEdgeEmphasized } from '../../helpers/isEdgeEmphasized';
import { resolveEdgePortEndpoint } from '../../helpers/resolveEdgePortEndpoint';
import { useGraphMarkersStore } from '../../stores/graphMarkersStore';
import { useSelectedDependencyEdgeStore } from '../../stores/selectedDependencyEdgeStore';
import type { DependencyEdgeData, EdgePort } from '../../types';
import { getDependencyEdgePath } from './helpers/getDependencyEdgePath';

import styles from './DependencyEdge.module.css';

/** Dash pattern for libavoid smooth-step fallback while routes are pending. */
const LIBAVOID_FALLBACK_DASH = '8 6';

function resolvePortAnchors(input: {
  sourcePort: EdgePort;
  targetPort: EdgePort;
  sourceNode: InternalNode;
  targetNode: InternalNode;
}): {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
} {
  const { sourcePort, targetPort, sourceNode, targetNode } = input;
  const sourceEndpoint = resolveEdgePortEndpoint({
    absolutePosition: sourceNode.internals.positionAbsolute,
    nodeWidth: sourceNode.measured.width ?? sourceNode.width ?? 0,
    port: sourcePort,
  });
  const targetEndpoint = resolveEdgePortEndpoint({
    absolutePosition: targetNode.internals.positionAbsolute,
    nodeWidth: targetNode.measured.width ?? targetNode.width ?? 0,
    port: targetPort,
  });

  return {
    sourceX: sourceEndpoint.x,
    sourceY: sourceEndpoint.y,
    targetX: targetEndpoint.x,
    targetY: targetEndpoint.y,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  };
}

function resolveEdgeStrokeStyle(input: {
  base: DependencyEdgeVisualStyle;
  edgeData: DependencyEdgeData | undefined;
  userEdgeHighlights: ReadonlyMap<string, string>;
  activePathSide: 'source' | 'target' | null;
  isSelected: boolean;
}): { stroke: string; strokeWidth: number; strokeDasharray?: string } {
  const { base, edgeData, userEdgeHighlights, activePathSide, isSelected } = input;
  const protectedEdge = isProtectedDependencyEdge(edgeData);

  let stroke = base.stroke;
  let strokeWidth = base.strokeWidth;

  const userHighlight = getEdgeHighlightColor(edgeData?.aggregated?.map(dep => dep.id) ?? [], userEdgeHighlights);
  if (userHighlight) {
    stroke = userHighlight;
    strokeWidth = 2;
  } else if (activePathSide === 'target' && !protectedEdge) {
    stroke = INCOMING_EDGE_COLOR;
    strokeWidth = 2;
  } else if (activePathSide === 'source' && !protectedEdge) {
    stroke = OUTGOING_EDGE_COLOR;
    strokeWidth = 2;
  }

  if (isSelected) {
    stroke = SELECTED_EDGE_COLOR;
    strokeWidth = 3;
  }

  return {
    stroke,
    strokeWidth,
    ...(base.strokeDasharray ? { strokeDasharray: base.strokeDasharray } : {}),
  };
}

export const DependencyEdge = memo(function DependencyEdge(props: EdgeProps) {
  const {
    id,
    source,
    target,
    data,
    interactionWidth = 3,
    sourceX: handleSourceX,
    sourceY: handleSourceY,
    targetX: handleTargetX,
    targetY: handleTargetY,
    sourcePosition: handleSourcePosition,
    targetPosition: handleTargetPosition,
    selected,
  } = props;

  const edgeData = data as DependencyEdgeData | undefined;
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const edgesType = useWorkspaceStore(state => state.graphSettings.edgesType);
  const activePathSide = useWorkspaceStore(state => {
    const { activePath } = state;
    if (!activePath) {
      return null;
    }
    return isPathOnDependencyEdge(activePath, source, target, edgeData?.aggregated);
  });
  const userEdgeHighlights = useWorkspaceStore(state => state.userEdgeHighlights);
  const isSelected = useSelectedDependencyEdgeStore(state => state.selectedEdgeId === id);

  const base = getDependencyEdgeVisualStyle(source, target, edgeData);
  const strokeStyle = resolveEdgeStrokeStyle({
    base,
    edgeData,
    userEdgeHighlights,
    activePathSide,
    isSelected,
  });

  const isLibavoidFallback = edgesType === 'libavoidOrthogonal' && !edgeData?.avoidPath;
  const style = {
    ...strokeStyle,
    ...(isLibavoidFallback && !strokeStyle.strokeDasharray ? { strokeDasharray: LIBAVOID_FALLBACK_DASH } : {}),
  };

  const portAnchors =
    edgeData?.sourcePort && edgeData.targetPort && sourceNode && targetNode
      ? resolvePortAnchors({
          sourcePort: edgeData.sourcePort,
          targetPort: edgeData.targetPort,
          sourceNode,
          targetNode,
        })
      : null;

  const sourceX = portAnchors?.sourceX ?? handleSourceX;
  const sourceY = portAnchors?.sourceY ?? handleSourceY;
  const targetX = portAnchors?.targetX ?? handleTargetX;
  const targetY = portAnchors?.targetY ?? handleTargetY;
  const sourcePosition = portAnchors?.sourcePosition ?? handleSourcePosition;
  const targetPosition = portAnchors?.targetPosition ?? handleTargetPosition;

  let path: string;
  if (edgesType === 'libavoidOrthogonal' && edgeData?.avoidPath) {
    const emphasized = isEdgeEmphasized(style, selected || isSelected);
    path = !emphasized && edgeData.avoidPathWithJumps ? edgeData.avoidPathWithJumps : edgeData.avoidPath;
  } else {
    [path] = getDependencyEdgePath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      edgesType,
    });
  }

  const getOrCreateGraphMarkerUrl = useGraphMarkersStore(state => state.getOrCreateGraphMarkerUrl);
  const markerEnd = getOrCreateGraphMarkerUrl(style.stroke);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        className={isLibavoidFallback ? styles.pendingRoute : undefined}
        markerEnd={markerEnd}
        interactionWidth={interactionWidth}
      />
      <path d={path} fill="none" stroke="transparent" strokeWidth={interactionWidth}>
        {!!base.title && <title>{base.title}</title>}
      </path>
    </>
  );
});
