import { createContext, useContext, type MouseEvent } from 'react';

export interface FileTreeActionsContextValue {
  openContextMenu: (event: MouseEvent, path: string) => void;
  onShowInGraph: (path: string) => void;
}

const FileTreeActionsContext = createContext<FileTreeActionsContextValue | null>(null);

export function FileTreeActionsProvider(props: { value: FileTreeActionsContextValue; children: React.ReactNode }) {
  const { value, children } = props;

  return <FileTreeActionsContext.Provider value={value}>{children}</FileTreeActionsContext.Provider>;
}

export function useFileTreeActions(): FileTreeActionsContextValue {
  const context = useContext(FileTreeActionsContext);
  if (!context) {
    throw new Error('useFileTreeActions must be used within FileTreeActionsProvider');
  }
  return context;
}
