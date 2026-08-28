export interface FolderNodeData {
  label: string;
  path: string;
  expanded: boolean;
  highlighted?: boolean;
  circular?: boolean;
  backgroundColor: string;
  [key: string]: unknown;
}

export interface FolderGroupNodeData {
  label: string;
  path: string;
  expanded: boolean;
  highlighted?: boolean;
  backgroundColor: string;
  [key: string]: unknown;
}
