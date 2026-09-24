import { BaseEdge, type EdgeProps } from '@xyflow/react';

import { useEdgesType } from '../../contexts';
import type { DependencyEdgeData } from '../../types';
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

  const edgesType = useEdgesType();

  const [path] = getDependencyEdgePath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    edgesType,
  });

  const title = (data as DependencyEdgeData | undefined)?.title;

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
