import { useRef } from 'react';
import { useDefaultLayout, useGroupRef, type Layout, type LayoutChangedMeta } from 'react-resizable-panels';

import { appStorageKey } from '@/Shared';

import { createAppPanelsLayoutStorage } from './helpers/createAppPanelsLayoutStorage';
import { layoutsHaveDifferentPanelSets, preserveSharedPanelSizes } from './helpers/preserveSharedPanelSizes';

/** Prefix for per-combination panel layout keys in localStorage. */
export const STORAGE_KEY = appStorageKey('panels');

/** Must match the `Group` `id` in AppLayout. */
export const APP_PANELS_GROUP_ID = 'app-panels';

const layoutStorage = createAppPanelsLayoutStorage(STORAGE_KEY, APP_PANELS_GROUP_ID);

/** Persist panel layouts per visible combination and keep shared panel sizes stable across open/close. */
export function useAppPanelsLayout(panelIds: string[]) {
  const groupRef = useGroupRef();
  const prevLayoutRef = useRef<Layout | null>(null);

  const { defaultLayout, onLayoutChanged: persistLayout } = useDefaultLayout({
    id: APP_PANELS_GROUP_ID,
    panelIds,
    storage: layoutStorage,
    onlySaveAfterUserInteractions: true,
  });

  const onLayoutChanged = (nextLayout: Layout, meta: LayoutChangedMeta) => {
    const previous = prevLayoutRef.current;

    if (previous != null && layoutsHaveDifferentPanelSets(previous, nextLayout)) {
      const preserved = preserveSharedPanelSizes(previous, nextLayout);
      if (preserved != null) {
        prevLayoutRef.current = preserved;
        persistLayout(preserved, { isUserInteraction: true });
        queueMicrotask(() => {
          groupRef.current?.setLayout(preserved);
        });
        return;
      }
    }

    prevLayoutRef.current = nextLayout;
    persistLayout(nextLayout, meta);
  };

  return {
    defaultLayout,
    onLayoutChanged,
    groupRef,
  };
}
