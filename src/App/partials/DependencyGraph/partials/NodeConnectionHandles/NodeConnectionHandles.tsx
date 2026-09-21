import { Handle, Position } from '@xyflow/react';

export type NodeConnectionHandlesProps = {
  incomingHandleCount: number;
  outgoingHandleCount: number;
  className?: string;
};

/** Vertical top% for the i-th handle in a list of `count` handles. */
function handleTopPercent(index: number, count: number): string {
  return `${((index + 1) / (count + 1)) * 100}%`;
}

/**
 * Renders dumb index-based Left target / Right source Handles (`in-i` / `out-i`).
 */
export function NodeConnectionHandles(props: NodeConnectionHandlesProps) {
  const { incomingHandleCount, outgoingHandleCount, className } = props;

  return (
    <>
      {Array.from({ length: incomingHandleCount }, (_, index) => (
        <Handle
          key={`in-${index}`}
          id={`in-${index}`}
          type="target"
          position={Position.Left}
          className={className}
          style={{
            top: handleTopPercent(index, incomingHandleCount),
            transform: 'translateY(-50%)',
            pointerEvents: 'auto',
          }}
        />
      ))}
      {Array.from({ length: outgoingHandleCount }, (_, index) => (
        <Handle
          key={`out-${index}`}
          id={`out-${index}`}
          type="source"
          position={Position.Right}
          className={className}
          style={{
            top: handleTopPercent(index, outgoingHandleCount),
            transform: 'translateY(-50%)',
            pointerEvents: 'auto',
          }}
        />
      ))}
    </>
  );
}
