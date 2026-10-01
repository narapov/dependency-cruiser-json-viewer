import type { EdgePoint, EdgePort } from '../../types';

/**
 * Absolute canvas endpoint for an edge port on a node's EAST or WEST side.
 * EAST attaches at `abs.x + width`; WEST at `abs.x`.
 */
export function resolveEdgePortEndpoint(input: {
  absolutePosition: EdgePoint;
  nodeWidth: number;
  port: EdgePort;
}): EdgePoint {
  const { absolutePosition, nodeWidth, port } = input;

  return {
    x: port.side === 'east' ? absolutePosition.x + nodeWidth : absolutePosition.x,
    y: absolutePosition.y + port.y,
  };
}
