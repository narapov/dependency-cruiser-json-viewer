export interface DependencyEdgeData {
  title: string;
  typeOnly?: boolean;
  circular?: boolean;
  couldNotResolve?: boolean;
  severity?: 'error' | 'warn';
  ruleNames?: string[];
}
