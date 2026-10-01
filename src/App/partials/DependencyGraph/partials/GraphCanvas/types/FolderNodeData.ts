export interface FolderNodeData {
  label: string;
  path: string;
  expanded: boolean;
  circular?: boolean;
  backgroundColor: string;
  [key: string]: unknown;
}

export interface FolderGroupNodeData {
  label: string;
  path: string;
  expanded: boolean;
  backgroundColor: string;
  [key: string]: unknown;
}
