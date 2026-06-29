import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useLocalStorage, useWindowSize } from 'react-use';

export const MIN_MAIN_WIDTH = 200;

export type ResizableSide = 'left' | 'right';

const RESIZING_CLASSES: Record<ResizableSide, string> = {
  left: 'resizingSidebar',
  right: 'resizingPanel',
};

export function clampWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.min(Math.max(width, minWidth), maxWidth);
}

interface UseResizableWidthOptions {
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  side: ResizableSide;
  oppositeWidth?: number;
}

export function useResizableWidth({
  storageKey,
  defaultWidth,
  minWidth,
  side,
  oppositeWidth = 0,
}: UseResizableWidthOptions) {
  const [width, setWidth] = useLocalStorage<number>(storageKey, defaultWidth);
  const { width: windowWidth = 0 } = useWindowSize();
  const maxWidth =
    windowWidth > 0 ? Math.max(minWidth, windowWidth - oppositeWidth - MIN_MAIN_WIDTH) : Number.POSITIVE_INFINITY;

  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const resizingClass = RESIZING_CLASSES[side];

  useEffect(() => {
    if (windowWidth === 0 || width == null) return;
    const clamped = clampWidth(width, minWidth, maxWidth);
    if (clamped !== width) {
      setWidth(clamped);
    }
  }, [maxWidth, minWidth, setWidth, width, windowWidth]);

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const handle = event.currentTarget;
      dragRef.current = {
        startX: event.clientX,
        startWidth: width ?? defaultWidth,
      };
      handle.setPointerCapture(event.pointerId);
      document.body.classList.add(resizingClass);

      const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
        if (!dragRef.current) return;
        const delta =
          side === 'left' ? moveEvent.clientX - dragRef.current.startX : dragRef.current.startX - moveEvent.clientX;
        setWidth(clampWidth(dragRef.current.startWidth + delta, minWidth, maxWidth));
      };

      const onPointerUp = (upEvent: globalThis.PointerEvent) => {
        dragRef.current = null;
        document.body.classList.remove(resizingClass);
        handle.releasePointerCapture(upEvent.pointerId);
        handle.removeEventListener('pointermove', onPointerMove);
        handle.removeEventListener('pointerup', onPointerUp);
        handle.removeEventListener('pointercancel', onPointerUp);
      };

      handle.addEventListener('pointermove', onPointerMove);
      handle.addEventListener('pointerup', onPointerUp);
      handle.addEventListener('pointercancel', onPointerUp);
    },
    [defaultWidth, maxWidth, minWidth, resizingClass, setWidth, side, width],
  );

  return {
    width: width ?? defaultWidth,
    onResizePointerDown,
  };
}
