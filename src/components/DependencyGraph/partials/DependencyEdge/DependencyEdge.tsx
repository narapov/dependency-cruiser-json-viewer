import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'
import type { DependencyEdgeData } from '../../DependencyGraph.types'

export function DependencyEdge({
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
}: EdgeProps) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const title = (data as DependencyEdgeData | undefined)?.title

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
  )
}
