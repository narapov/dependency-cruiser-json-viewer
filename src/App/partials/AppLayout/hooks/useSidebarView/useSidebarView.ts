import { useLocalStorage } from 'react-use';

import { appStorageKey } from '@/Shared';

export type SidebarView = 'files' | 'rules';

export const STORAGE_KEY = appStorageKey('sidebar-view');

const DEFAULT_VIEW: SidebarView = 'files';

function isSidebarView(value: unknown): value is SidebarView {
  return value === 'files' || value === 'rules';
}

export function useSidebarView() {
  const [storedSidebarView, setSidebarView] = useLocalStorage<SidebarView>(STORAGE_KEY, DEFAULT_VIEW);
  const sidebarView = isSidebarView(storedSidebarView) ? storedSidebarView : DEFAULT_VIEW;

  return {
    sidebarView,
    setSidebarView,
  };
}
