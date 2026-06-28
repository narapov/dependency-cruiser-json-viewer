export interface ModuleRelation {
  path: string
  circular: boolean
  typeOnly: boolean
  typeOnlyCircular: boolean
}

export interface ModuleRelations {
  dependencies: ModuleRelation[]
  dependents: ModuleRelation[]
}
