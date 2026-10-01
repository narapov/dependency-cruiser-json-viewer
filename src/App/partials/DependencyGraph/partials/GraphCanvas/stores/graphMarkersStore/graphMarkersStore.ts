import { create } from 'zustand';

import {
  CIRCULAR_EDGE_COLOR,
  DEFAULT_EDGE_COLOR,
  ERROR_EDGE_COLOR,
  INCOMING_EDGE_COLOR,
  OUTGOING_EDGE_COLOR,
  SELECTED_EDGE_COLOR,
  TYPE_ONLY_CIRCULAR_EDGE_COLOR,
  WARNING_EDGE_COLOR,
} from '@/Shared';

const SEEDED_STROKES = [
  DEFAULT_EDGE_COLOR,
  CIRCULAR_EDGE_COLOR,
  TYPE_ONLY_CIRCULAR_EDGE_COLOR,
  ERROR_EDGE_COLOR,
  WARNING_EDGE_COLOR,
  SELECTED_EDGE_COLOR,
  INCOMING_EDGE_COLOR,
  OUTGOING_EDGE_COLOR,
] as const;

const pendingStrokes = new Set<string>();

/** Build a DOM-safe marker id from a stroke value. */
export function toGraphMarkerId(stroke: string): string {
  return `graph-arrow-${stroke.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function toMarkerUrl(id: string): string {
  return `url('#${id}')`;
}

function createSeededMarkers(): Record<string, string> {
  return Object.fromEntries(SEEDED_STROKES.map(stroke => [stroke, toGraphMarkerId(stroke)]));
}

interface GraphMarkersState {
  markers: Readonly<Record<string, string>>;
  getOrCreateGraphMarkerUrl: (stroke: string) => string;
  clearGraphMarkers: () => void;
}

/** Ephemeral stroke→marker-id registry for shared graph arrow defs. */
export const useGraphMarkersStore = create<GraphMarkersState>((set, get) => ({
  markers: createSeededMarkers(),
  getOrCreateGraphMarkerUrl(stroke) {
    const existing = get().markers[stroke];
    if (existing) {
      return toMarkerUrl(existing);
    }

    const id = toGraphMarkerId(stroke);
    if (!pendingStrokes.has(stroke)) {
      pendingStrokes.add(stroke);
      queueMicrotask(() => {
        pendingStrokes.delete(stroke);
        if (get().markers[stroke]) {
          return;
        }
        set(state => ({ markers: { ...state.markers, [stroke]: id } }));
      });
    }
    return toMarkerUrl(id);
  },
  clearGraphMarkers() {
    pendingStrokes.clear();
    set({ markers: createSeededMarkers() });
  },
}));
