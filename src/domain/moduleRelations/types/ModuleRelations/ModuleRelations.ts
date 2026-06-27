export interface ModuleRelation {
  path: string
  circular: boolean
}

export interface ModuleRelations {
  dependencies: ModuleRelation[]
  dependents: ModuleRelation[]
}
