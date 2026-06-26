import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useLocalStorage, useWindowSize } from 'react-use'

export const DEFAULT_WIDTH = 280
export const MIN_WIDTH = 150
export const MIN_MAIN_WIDTH = 200
export const STORAGE_KEY = 'deps-viewer.sidebar-width'

const RESIZING_CLASS = 'resizingSidebar'

export function clampSidebarWidth(width: number, maxWidth: number): number {
  return Math.min(Math.max(width, MIN_WIDTH), maxWidth)
}

export function useSidebarWidth() {
  const [sidebarWidth, setSidebarWidth] = useLocalStorage<number>(STORAGE_KEY, DEFAULT_WIDTH)
  const { width: windowWidth = 0 } = useWindowSize()
  const maxWidth =
    windowWidth > 0 ? Math.max(MIN_WIDTH, windowWidth - MIN_MAIN_WIDTH) : Number.POSITIVE_INFINITY

  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    if (windowWidth === 0 || sidebarWidth == null) return
    const clamped = clampSidebarWidth(sidebarWidth, maxWidth)
    if (clamped !== sidebarWidth) {
      setSidebarWidth(clamped)
    }
  }, [maxWidth, sidebarWidth, setSidebarWidth, windowWidth])

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const handle = event.currentTarget
      dragRef.current = {
        startX: event.clientX,
        startWidth: sidebarWidth ?? DEFAULT_WIDTH,
      }
      handle.setPointerCapture(event.pointerId)
      document.body.classList.add(RESIZING_CLASS)

      const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
        if (!dragRef.current) return
        const next =
          dragRef.current.startWidth + (moveEvent.clientX - dragRef.current.startX)
        setSidebarWidth(clampSidebarWidth(next, maxWidth))
      }

      const onPointerUp = (upEvent: globalThis.PointerEvent) => {
        dragRef.current = null
        document.body.classList.remove(RESIZING_CLASS)
        handle.releasePointerCapture(upEvent.pointerId)
        handle.removeEventListener('pointermove', onPointerMove)
        handle.removeEventListener('pointerup', onPointerUp)
        handle.removeEventListener('pointercancel', onPointerUp)
      }

      handle.addEventListener('pointermove', onPointerMove)
      handle.addEventListener('pointerup', onPointerUp)
      handle.addEventListener('pointercancel', onPointerUp)
    },
    [maxWidth, setSidebarWidth, sidebarWidth],
  )

  return {
    sidebarWidth: sidebarWidth ?? DEFAULT_WIDTH,
    onResizePointerDown,
  }
}
