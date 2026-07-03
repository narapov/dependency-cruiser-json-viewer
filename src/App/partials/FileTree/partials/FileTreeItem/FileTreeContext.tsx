import { createContext, useContext } from 'react';

import type { TreeIndex } from '../../helpers';

export interface FileTreeContextValue {
  activePath: string | null;
  selectedKeys: string[];
  expandedKeys: string[];
  treeIndex: TreeIndex;
  canShowInGraph: (key: string) => boolean;
  onExpandRecursive?: (path: string) => void;
  onShowDependencies?: (path: string) => void;
  onShowInGraph?: (path: string) => void;
  onToggleExpand: (key: string) => void;
}

const FileTreeContext = createContext<FileTreeContextValue | null>(null);

export function FileTreeProvider({ value, children }: { value: FileTreeContextValue; children: React.ReactNode }) {
  return <FileTreeContext.Provider value={value}>{children}</FileTreeContext.Provider>;
}

export function useFileTreeContext(): FileTreeContextValue {
  const context = useContext(FileTreeContext);
  if (!context) {
    throw new Error('useFileTreeContext must be used within FileTreeProvider');
  }
  return context;
}
