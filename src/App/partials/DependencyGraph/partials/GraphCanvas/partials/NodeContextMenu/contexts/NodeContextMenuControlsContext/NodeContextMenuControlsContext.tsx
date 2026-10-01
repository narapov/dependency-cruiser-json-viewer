import { createContext, useContext, type MouseEvent } from 'react';

export interface NodeContextMenuControls {
  openContextMenu: (event: MouseEvent, path: string) => void;
  openAtElement: (el: HTMLElement, path: string) => void;
}

const NodeContextMenuControlsContext = createContext<NodeContextMenuControls | null>(null);

export function NodeContextMenuControlsProvider(props: { value: NodeContextMenuControls; children: React.ReactNode }) {
  const { value, children } = props;

  return <NodeContextMenuControlsContext.Provider value={value}>{children}</NodeContextMenuControlsContext.Provider>;
}

export function useNodeContextMenuControls(): NodeContextMenuControls {
  const context = useContext(NodeContextMenuControlsContext);
  if (!context) {
    throw new Error('useNodeContextMenuControls must be used within NodeContextMenuControlsProvider');
  }
  return context;
}
