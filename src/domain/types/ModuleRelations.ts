export interface ModuleRelation {
  path: string;
  circular: boolean;
  typeOnly: boolean;
  typeOnlyCircular: boolean;
  /** Real file endpoints collapsed into this representative; omit for leaf files. */
  children?: ModuleRelation[];
}

export interface ModuleRelations {
  dependencies: ModuleRelation[];
  dependents: ModuleRelation[];
  hiddenDependencies: ModuleRelation[];
  hiddenDependents: ModuleRelation[];
}
