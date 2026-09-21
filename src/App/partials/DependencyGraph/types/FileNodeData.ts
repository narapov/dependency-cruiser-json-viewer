export interface FileNodeData {
  label: string;
  path: string;
  incomingHandleCount: number;
  outgoingHandleCount: number;
  highlighted?: boolean;
  circular?: boolean;
  couldNotResolve?: boolean;
  [key: string]: unknown;
}
