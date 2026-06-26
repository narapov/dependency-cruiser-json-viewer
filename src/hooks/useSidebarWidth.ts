import { clampWidth, useResizableWidth } from './useResizableWidth'

export const DEFAULT_WIDTH = 280
export const MIN_WIDTH = 150
export const MIN_MAIN_WIDTH = 200
export const STORAGE_KEY = 'deps-viewer.sidebar-width'

export function clampSidebarWidth(width: number, maxWidth: number): number {
  return clampWidth(width, MIN_WIDTH, maxWidth)
}

export function useSidebarWidth() {
  const { width: sidebarWidth, onResizePointerDown } = useResizableWidth({
    storageKey: STORAGE_KEY,
    defaultWidth: DEFAULT_WIDTH,
    minWidth: MIN_WIDTH,
    side: 'left',
  })

  return {
    sidebarWidth,
    onResizePointerDown,
  }
}
