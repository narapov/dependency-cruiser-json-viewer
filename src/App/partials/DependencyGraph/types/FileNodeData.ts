export interface FileNodeData {
  label: string;
  path: string;
  highlighted?: boolean;
  circular?: boolean;
  onShowInFileTree: (path: string) => void;
  onShowDependencies?: (path: string) => void;
  [key: string]: unknown;
}
