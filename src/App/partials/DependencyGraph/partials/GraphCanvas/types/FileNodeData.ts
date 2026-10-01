export interface FileNodeData {
  label: string;
  path: string;
  circular?: boolean;
  couldNotResolve?: boolean;
  [key: string]: unknown;
}
