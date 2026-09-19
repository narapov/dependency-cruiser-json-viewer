import { createContext, useContext } from 'react';

export interface NodeContextMenuControls {
  openAtElement: (el: HTMLElement) => void;
}

const NodeContextMenuControlsContext = createContext<NodeContextMenuControls | null>(null);

export function NodeContextMenuControlsProvider({
  value,
  children,
}: {
  value: NodeContextMenuControls;
  children: React.ReactNode;
}) {
  return <NodeContextMenuControlsContext.Provider value={value}>{children}</NodeContextMenuControlsContext.Provider>;
}

export function useNodeContextMenuControls(): NodeContextMenuControls {
  const context = useContext(NodeContextMenuControlsContext);
  if (!context) {
    throw new Error('useNodeContextMenuControls must be used within NodeContextMenu');
  }
  return context;
}
