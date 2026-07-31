import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useLocalStorage, useWindowSize } from 'react-use';

import { clampWidth } from '../../helpers';

export const MIN_MAIN_WIDTH = 200;

export type ResizableSide = 'left' | 'right';

const RESIZING_CLASSES: Record<ResizableSide, string> = {
  left: 'resizingSidebar',
  right: 'resizingPanel',
};

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

  const dragRef = useRef<{ startX: number; startWidth: number; pointerId: number } | null>(null);
  const resizingClass = RESIZING_CLASSES[side];

  useEffect(() => {
    if (windowWidth === 0 || width == null) {
      return;
    }
    const clamped = clampWidth(width, minWidth, maxWidth);
    if (clamped !== width) {
      setWidth(clamped);
    }
  }, [maxWidth, minWidth, setWidth, width, windowWidth]);

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const handle = event.currentTarget;
      const pointerId = event.pointerId;
      dragRef.current = {
        startX: event.clientX,
        startWidth: width ?? defaultWidth,
        pointerId,
      };
      handle.setPointerCapture(pointerId);
      document.body.classList.add(resizingClass);

      const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
        if (!dragRef.current || moveEvent.pointerId !== dragRef.current.pointerId) {
          return;
        }
        moveEvent.preventDefault();
        const delta =
          side === 'left' ? moveEvent.clientX - dragRef.current.startX : dragRef.current.startX - moveEvent.clientX;
        setWidth(clampWidth(dragRef.current.startWidth + delta, minWidth, maxWidth));
      };

      const onPointerUp = (upEvent: globalThis.PointerEvent) => {
        if (!dragRef.current || upEvent.pointerId !== dragRef.current.pointerId) {
          return;
        }
        dragRef.current = null;
        document.body.classList.remove(resizingClass);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);
        if (handle.hasPointerCapture(upEvent.pointerId)) {
          handle.releasePointerCapture(upEvent.pointerId);
        }
      };

      document.addEventListener('pointermove', onPointerMove, { passive: false });
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
    },
    [defaultWidth, maxWidth, minWidth, resizingClass, setWidth, side, width],
  );

  const onResizeContextMenu = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return {
    width: width ?? defaultWidth,
    onResizePointerDown,
    onResizeContextMenu,
  };
}
