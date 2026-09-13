import { type Layout, type LayoutChangedMeta } from 'react-resizable-panels';
import { useLocalStorage } from 'react-use';

import { appStorageKey } from '@/Shared';

export const STORAGE_KEY = appStorageKey('app-panels-layout');

/** Persist the resizable panels group layout after user-driven resizes. */
export function useAppPanelsLayout() {
  const [layout, setLayout] = useLocalStorage<Layout>(STORAGE_KEY);

  const onLayoutChanged = (nextLayout: Layout, meta: LayoutChangedMeta) => {
    if (!meta.isUserInteraction) {
      return;
    }
    setLayout(nextLayout);
  };

  return {
    defaultLayout: layout,
    onLayoutChanged,
  };
}
