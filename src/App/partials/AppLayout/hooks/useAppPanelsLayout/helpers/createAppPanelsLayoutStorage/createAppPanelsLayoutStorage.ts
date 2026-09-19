import { type LayoutStorage } from 'react-resizable-panels';

const LIBRARY_KEY_PREFIX = 'react-resizable-panels:';

/**
 * Map react-resizable-panels storage keys onto the app localStorage namespace
 * so workspace reset still clears panel layouts.
 * Library key `react-resizable-panels:{groupId}:sidebar:graph` → `{prefix}:sidebar:graph`.
 */
export function createAppPanelsLayoutStorage(storageKeyPrefix: string, groupId: string): LayoutStorage {
  const groupPrefix = `${groupId}:`;

  const toAppKey = (libraryKey: string) => {
    const withoutLibrary = libraryKey.startsWith(LIBRARY_KEY_PREFIX)
      ? libraryKey.slice(LIBRARY_KEY_PREFIX.length)
      : libraryKey;
    const panelIds = withoutLibrary.startsWith(groupPrefix) ? withoutLibrary.slice(groupPrefix.length) : withoutLibrary;
    return `${storageKeyPrefix}:${panelIds}`;
  };

  return {
    getItem: key => localStorage.getItem(toAppKey(key)),
    setItem: (key, value) => {
      localStorage.setItem(toAppKey(key), value);
    },
  };
}
