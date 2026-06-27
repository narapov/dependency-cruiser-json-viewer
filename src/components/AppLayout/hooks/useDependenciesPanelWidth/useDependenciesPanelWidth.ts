import { useResizableWidth } from '../../../../Shared'

export const DEFAULT_WIDTH = 360
export const MIN_WIDTH = 200
export const STORAGE_KEY = 'deps-viewer.dependencies-panel-width'

export function useDependenciesPanelWidth(leftSidebarWidth: number) {
  return useResizableWidth({
    storageKey: STORAGE_KEY,
    defaultWidth: DEFAULT_WIDTH,
    minWidth: MIN_WIDTH,
    side: 'right',
    oppositeWidth: leftSidebarWidth,
  })
}
