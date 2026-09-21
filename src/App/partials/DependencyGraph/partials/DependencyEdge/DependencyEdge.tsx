import { BaseEdge, useInternalNode, type EdgeProps } from '@xyflow/react';

import { SELECTED_EDGE_COLOR } from '@/Shared';

import type { DependencyEdgeData } from '../../types';
import { elkSectionsToPath } from './helpers/elkSectionsToPath';
import { getDependencyEdgePath } from './helpers/getDependencyEdgePath';

export function DependencyEdge(props: EdgeProps) {
  const {
    id,
    source,
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

  const sourceNode = useInternalNode(source);
  const edgeData = data as DependencyEdgeData | undefined;
  const elkSections = edgeData?.elkSections;
  const isSelected = style?.stroke === SELECTED_EDGE_COLOR;

  const [path] = getDependencyEdgePath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const elkPath =
    elkSections?.length && sourceNode
      ? elkSectionsToPath(elkSections, {
          x: sourceNode.internals.positionAbsolute.x - sourceNode.position.x,
          y: sourceNode.internals.positionAbsolute.y - sourceNode.position.y,
        })
      : null;

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
      {elkPath && (
        <BaseEdge
          id={`${id}-elk`}
          path={elkPath}
          style={{ stroke: isSelected ? '#f00' : '#000', strokeWidth: isSelected ? 2 : 1 }}
        />
      )}
      <path d={path} fill="none" stroke="transparent" strokeWidth={interactionWidth}>
        {!!title && <title>{title}</title>}
      </path>
    </>
  );
}
