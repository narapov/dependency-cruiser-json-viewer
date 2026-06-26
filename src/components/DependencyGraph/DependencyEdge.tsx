import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'
import type { DependencyEdgeData } from '../../lib/dependencyGraph/types'

export function DependencyEdge({
  id,
  data,
  interactionWidth = 3,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  ...rest
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
      <BaseEdge id={id} path={path} {...rest} />
      <path d={path} fill="none" stroke="transparent" strokeWidth={interactionWidth}>
        {!!title && <title>{title}</title>}
      </path>
    </>
  )
}
