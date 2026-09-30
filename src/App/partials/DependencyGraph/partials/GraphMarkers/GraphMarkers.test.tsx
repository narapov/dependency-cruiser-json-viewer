// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { waitFor } from '@testing-library/react';

import { CIRCULAR_EDGE_COLOR } from '@/Shared';
import { renderWithTheme } from '@/testsUtils';

import { toGraphMarkerId, useGraphMarkersStore } from '../../stores/graphMarkersStore';
import { GraphMarkers } from './GraphMarkers';

describe('GraphMarkers', () => {
  beforeEach(() => {
    useGraphMarkersStore.getState().clearGraphMarkers();
  });

  afterEach(() => {
    useGraphMarkersStore.getState().clearGraphMarkers();
  });

  it('renders one closed-arrow marker per registered stroke', () => {
    const { container } = renderWithTheme(<GraphMarkers />);

    const circularId = toGraphMarkerId(CIRCULAR_EDGE_COLOR);
    const marker = container.querySelector(`marker[id="${circularId}"]`);
    const arrow = marker?.querySelector('polyline.arrowclosed');

    expect(marker).not.toBeNull();
    expect(arrow).toHaveStyle({ fill: CIRCULAR_EDGE_COLOR, stroke: CIRCULAR_EDGE_COLOR });
  });

  it('adds a marker when a new stroke is registered', async () => {
    const stroke = '#e6194b';
    const { container } = renderWithTheme(<GraphMarkers />);

    useGraphMarkersStore.getState().getOrCreateGraphMarkerUrl(stroke);

    await waitFor(() => {
      const marker = container.querySelector(`marker[id="${toGraphMarkerId(stroke)}"]`);
      const arrow = marker?.querySelector('polyline.arrowclosed');
      expect(arrow).toHaveStyle({ fill: stroke, stroke });
    });
  });
});
