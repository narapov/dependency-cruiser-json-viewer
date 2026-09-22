import { BaseEdge, type EdgeProps } from '@xyflow/react';

import type { DependencyEdgeData } from '../../types';
import { avoidRouteToPath } from './helpers/avoidRouteToPath';
import { getDependencyEdgePath } from './helpers/getDependencyEdgePath';

export function DependencyEdge(props: EdgeProps) {
  const {
    id,
    data,
    style,
    markerStart,
    markerEnd,
    interactionWidth = 3,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  } = props;

  const edgeData = data as DependencyEdgeData | undefined;
  const avoidRoute = edgeData?.avoidRoute;
  const title = edgeData?.title;

  const path = avoidRoute
    ? avoidRouteToPath(avoidRoute, edgeData?.crossingJumps)
    : getDependencyEdgePath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      })[0];

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        markerStart={markerStart}
        markerEnd={markerEnd}
        interactionWidth={interactionWidth}
      />
      <path d={path} fill="none" stroke="transparent" strokeWidth={interactionWidth}>
        {!!title && <title>{title}</title>}
      </path>
    </>
  );
}
