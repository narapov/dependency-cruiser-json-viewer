export interface FolderNodeData {
  label: string;
  path: string;
  expanded: boolean;
  highlighted: boolean;
  circular?: boolean;
  backgroundColor: string;
  onToggle: (path: string) => void;
  onExpandRecursive: (path: string) => void;
  onShowInFileTree: (path: string) => void;
  onShowDependencies?: (path: string) => void;
  [key: string]: unknown;
}

export interface FolderGroupNodeData {
  label: string;
  path: string;
  expanded: boolean;
  highlighted: boolean;
  backgroundColor: string;
  onToggle: (path: string) => void;
  onExpandRecursive: (path: string) => void;
  onShowInFileTree: (path: string) => void;
  onShowDependencies?: (path: string) => void;
  [key: string]: unknown;
}
