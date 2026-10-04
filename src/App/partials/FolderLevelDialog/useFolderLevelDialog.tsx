import { useRef, useState, type ReactNode } from 'react';

import { FolderLevelDialog } from './FolderLevelDialog';

/**
 * Owns folder-level prompt dialog and returns a promise-based prompt plus dialog node.
 */
export function useFolderLevelDialog(): {
  promptFolderLevel: (paths: readonly string[]) => Promise<number | null>;
  folderLevelDialog: ReactNode;
} {
  const [open, setOpen] = useState(false);
  const [paths, setPaths] = useState<readonly string[]>([]);
  const resolverRef = useRef<((level: number | null) => void) | null>(null);

  const settle = (level: number | null) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    setPaths([]);
    resolve?.(level);
  };

  const promptFolderLevel = (nextPaths: readonly string[]) => {
    if (resolverRef.current) {
      resolverRef.current(null);
      resolverRef.current = null;
    }
    setPaths(nextPaths);
    setOpen(true);
    return new Promise<number | null>(resolve => {
      resolverRef.current = resolve;
    });
  };

  const folderLevelDialog = (
    <FolderLevelDialog open={open} paths={paths} onClose={() => settle(null)} onConfirm={level => settle(level)} />
  );

  return { promptFolderLevel, folderLevelDialog };
}
