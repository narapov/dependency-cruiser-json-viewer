import { useEffect } from 'react';

import { useGraphMarkersStore } from '../../stores/graphMarkersStore';

/**
 * Clears dynamic graph markers when the canvas unmounts (e.g. empty selection gate).
 */
export function useClearGraphMarkersOnEmptySelection(): void {
  useEffect(() => {
    return () => {
      useGraphMarkersStore.getState().clearGraphMarkers();
    };
  }, []);
}
