// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { renderHook } from '@testing-library/react';

import { CIRCULAR_EDGE_COLOR, DEFAULT_EDGE_COLOR } from '@/Shared';

import { toGraphMarkerId, useGraphMarkersStore } from '../../stores/graphMarkersStore';
import { useClearGraphMarkersOnEmptySelection } from './useClearGraphMarkersOnEmptySelection';

describe('useClearGraphMarkersOnEmptySelection', () => {
  beforeEach(() => {
    useGraphMarkersStore.getState().clearGraphMarkers();
  });

  afterEach(() => {
    useGraphMarkersStore.getState().clearGraphMarkers();
  });

  it('clears dynamic markers on unmount', async () => {
    const stroke = '#fedcba';

    const { unmount } = renderHook(() => useClearGraphMarkersOnEmptySelection());

    useGraphMarkersStore.getState().getOrCreateGraphMarkerUrl(stroke);
    await Promise.resolve();
    expect(useGraphMarkersStore.getState().markers[stroke]).toBe(toGraphMarkerId(stroke));

    unmount();

    expect(useGraphMarkersStore.getState().markers[stroke]).toBeUndefined();
    expect(useGraphMarkersStore.getState().markers[DEFAULT_EDGE_COLOR]).toBe(toGraphMarkerId(DEFAULT_EDGE_COLOR));
    expect(useGraphMarkersStore.getState().markers[CIRCULAR_EDGE_COLOR]).toBe(toGraphMarkerId(CIRCULAR_EDGE_COLOR));
  });
});
