import { BaseEdge, type EdgeProps } from '@xyflow/react';

import { SELECTED_EDGE_COLOR } from '@/Shared';

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
  const isSelected = style?.stroke === SELECTED_EDGE_COLOR;

  const [path] = getDependencyEdgePath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const avoidPath = avoidRoute ? avoidRouteToPath(avoidRoute) : null;

  const title = edgeData?.title;

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
      {avoidPath && (
        <BaseEdge
          id={`${id}-avoid`}
          path={avoidPath}
          style={{ stroke: isSelected ? '#f00' : '#000', strokeWidth: isSelected ? 2 : 1 }}
        />
      )}
      <path d={path} fill="none" stroke="transparent" strokeWidth={interactionWidth}>
        {!!title && <title>{title}</title>}
      </path>
    </>
  );
}
