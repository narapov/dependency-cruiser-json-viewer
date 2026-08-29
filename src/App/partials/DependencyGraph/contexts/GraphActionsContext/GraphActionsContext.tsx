import { createContext, useContext } from 'react';

export interface GraphActionsContextValue {
  onToggleFolder: (path: string) => void;
  onExpandRecursive: (path: string) => void;
  onShowInFileTree: (path: string) => void;
  onShowDependenciesPanel: (path: string) => void;
  onHideOthers: (path: string) => void;
  onShowDirectDependencies: (path: string) => void;
  onShowDirectDependents: (path: string) => void;
  onAutoLayoutGroup?: (groupId: string) => void;
  onAutoLayoutGroupRecursive?: (groupId: string) => void;
}

const GraphActionsContext = createContext<GraphActionsContextValue | null>(null);

export function GraphActionsProvider({
  value,
  children,
}: {
  value: GraphActionsContextValue;
  children: React.ReactNode;
}) {
  return <GraphActionsContext.Provider value={value}>{children}</GraphActionsContext.Provider>;
}

export function useGraphActions(): GraphActionsContextValue {
  const context = useContext(GraphActionsContext);
  if (!context) {
    throw new Error('useGraphActions must be used within GraphActionsProvider');
  }
  return context;
}
