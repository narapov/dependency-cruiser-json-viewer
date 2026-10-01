import { memo } from 'react';

import { useGraphMarkersStore } from '../../stores/graphMarkersStore';

/**
 * Matches React Flow's built-in ArrowClosedSymbol geometry.
 * Shared defs by stroke color (not EdgeMarker on the edges array) —
 * @see https://github.com/xyflow/xyflow/discussions/4300
 */
const ARROW_CLOSED_POINTS = '-5,-4 0,0 -5,4 -5,-4';

/** Renders one closed-arrow SVG marker per registered edge stroke color. */
export const GraphMarkers = memo(function GraphMarkers() {
  const markers = useGraphMarkersStore(state => state.markers);

  return (
    <svg
      className="react-flow__marker"
      aria-hidden
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {Object.entries(markers).map(([stroke, id]) => (
          <marker
            key={id}
            className="react-flow__arrowhead"
            id={id}
            markerWidth="12.5"
            markerHeight="12.5"
            viewBox="-10 -10 20 20"
            markerUnits="strokeWidth"
            orient="auto-start-reverse"
            refX="0"
            refY="0"
          >
            <polyline
              className="arrowclosed"
              points={ARROW_CLOSED_POINTS}
              style={{ stroke, fill: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' }}
            />
          </marker>
        ))}
      </defs>
    </svg>
  );
});
