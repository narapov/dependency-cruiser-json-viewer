import { useCallback } from 'react';
import { useLocalStorage } from 'react-use';

import { appStorageKey } from '@/Shared';

export const STORAGE_KEY = appStorageKey('sidebar-open');

export function useSidebarOpen() {
  const [storedSidebarOpen, setSidebarOpen] = useLocalStorage<boolean>(STORAGE_KEY, true);
  const sidebarOpen = storedSidebarOpen ?? true;

  const toggleSidebarOpen = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [setSidebarOpen, sidebarOpen]);

  return {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebarOpen,
  };
}
