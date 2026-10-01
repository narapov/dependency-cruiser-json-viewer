import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CIRCULAR_EDGE_COLOR, DEFAULT_EDGE_COLOR } from '@/Shared';

import { toGraphMarkerId, useGraphMarkersStore } from './graphMarkersStore';

describe('graphMarkersStore', () => {
  beforeEach(() => {
    useGraphMarkersStore.getState().clearGraphMarkers();
  });

  afterEach(() => {
    useGraphMarkersStore.getState().clearGraphMarkers();
  });

  it('seeds known theme edge colors', () => {
    expect(useGraphMarkersStore.getState().markers[DEFAULT_EDGE_COLOR]).toBe(toGraphMarkerId(DEFAULT_EDGE_COLOR));
    expect(useGraphMarkersStore.getState().markers[CIRCULAR_EDGE_COLOR]).toBe(toGraphMarkerId(CIRCULAR_EDGE_COLOR));
  });

  it('returns a stable url for seeded strokes without changing markers', () => {
    const first = useGraphMarkersStore.getState().getOrCreateGraphMarkerUrl(CIRCULAR_EDGE_COLOR);
    const second = useGraphMarkersStore.getState().getOrCreateGraphMarkerUrl(CIRCULAR_EDGE_COLOR);

    expect(first).toBe(`url('#${toGraphMarkerId(CIRCULAR_EDGE_COLOR)}')`);
    expect(second).toBe(first);
  });

  it('registers a new stroke after a microtask', async () => {
    const stroke = '#e6194b';
    const url = useGraphMarkersStore.getState().getOrCreateGraphMarkerUrl(stroke);

    expect(url).toBe(`url('#${toGraphMarkerId(stroke)}')`);
    expect(useGraphMarkersStore.getState().markers[stroke]).toBeUndefined();

    await Promise.resolve();

    expect(useGraphMarkersStore.getState().markers[stroke]).toBe(toGraphMarkerId(stroke));
  });

  it('clearGraphMarkers drops dynamic strokes and re-seeds theme colors', async () => {
    const stroke = '#4363d8';
    useGraphMarkersStore.getState().getOrCreateGraphMarkerUrl(stroke);
    await Promise.resolve();
    expect(useGraphMarkersStore.getState().markers[stroke]).toBeDefined();

    useGraphMarkersStore.getState().clearGraphMarkers();

    expect(useGraphMarkersStore.getState().markers[stroke]).toBeUndefined();
    expect(useGraphMarkersStore.getState().markers[DEFAULT_EDGE_COLOR]).toBe(toGraphMarkerId(DEFAULT_EDGE_COLOR));
  });
});
