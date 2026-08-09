import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { isCruiseResultDragAllowed, pickCruiseResultDropFile } from '../../helpers';

interface UseCruiseResultFileDropOptions {
  enabled: boolean;
  onFile: (file: File) => void;
  onInvalidFile?: () => void;
}

/** Whether the drag event carries file payloads (not in-app node drags). */
function dataTransferHasFiles(dataTransfer: DataTransfer | null): boolean {
  if (dataTransfer == null) {
    return false;
  }
  return Array.from(dataTransfer.types).includes('Files');
}

/** App-wide file drop for cruise-result JSON: drag depth + overlay flag. */
export function useCruiseResultFileDrop(options: UseCruiseResultFileDropOptions) {
  const { enabled, onFile, onInvalidFile } = options;
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDropAllowed, setIsDropAllowed] = useState(true);
  const depthRef = useRef(0);

  const handleFile = useEffectEvent(onFile);
  const handleInvalidFile = useEffectEvent(() => {
    onInvalidFile?.();
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const resetDrag = () => {
      depthRef.current = 0;
      setIsDraggingFile(false);
      setIsDropAllowed(true);
    };

    const syncDropAllowed = (dataTransfer: DataTransfer | null) => {
      if (dataTransfer == null) {
        return;
      }
      const allowed = isCruiseResultDragAllowed(dataTransfer);
      setIsDropAllowed(allowed);
      dataTransfer.dropEffect = allowed ? 'copy' : 'none';
    };

    const onDragEnter = (event: DragEvent) => {
      if (!dataTransferHasFiles(event.dataTransfer)) {
        return;
      }
      event.preventDefault();
      depthRef.current += 1;
      setIsDraggingFile(true);
      syncDropAllowed(event.dataTransfer);
    };

    const onDragLeave = (event: DragEvent) => {
      if (!dataTransferHasFiles(event.dataTransfer)) {
        return;
      }
      depthRef.current -= 1;
      if (depthRef.current <= 0) {
        resetDrag();
      }
    };

    const onDragOver = (event: DragEvent) => {
      if (!dataTransferHasFiles(event.dataTransfer)) {
        return;
      }
      event.preventDefault();
      syncDropAllowed(event.dataTransfer);
    };

    const onDrop = (event: DragEvent) => {
      if (!dataTransferHasFiles(event.dataTransfer)) {
        return;
      }
      event.preventDefault();
      resetDrag();

      const files = event.dataTransfer?.files;
      if (files == null || files.length === 0) {
        return;
      }

      const file = pickCruiseResultDropFile(files);
      if (file) {
        handleFile(file);
        return;
      }
      handleInvalidFile();
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
      depthRef.current = 0;
      setIsDraggingFile(false);
      setIsDropAllowed(true);
    };
  }, [enabled]);

  return {
    isDraggingFile: enabled && isDraggingFile,
    isDropAllowed: !enabled || !isDraggingFile || isDropAllowed,
  };
}
