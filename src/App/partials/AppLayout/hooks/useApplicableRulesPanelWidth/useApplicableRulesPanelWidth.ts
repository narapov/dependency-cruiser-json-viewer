import { appStorageKey, useResizableWidth } from '@/Shared';

export const DEFAULT_WIDTH = 360;
export const MIN_WIDTH = 200;
export const STORAGE_KEY = appStorageKey('applicable-rules-panel-width');

/** Persist and resize the applicable-rules right column width. */
export function useApplicableRulesPanelWidth(oppositeWidth: number) {
  return useResizableWidth({
    storageKey: STORAGE_KEY,
    defaultWidth: DEFAULT_WIDTH,
    minWidth: MIN_WIDTH,
    side: 'right',
    oppositeWidth,
  });
}
