export interface FileNodeData {
  label: string;
  path: string;
  highlighted?: boolean;
  circular?: boolean;
  couldNotResolve?: boolean;
  [key: string]: unknown;
}
