# Tasks

## 1. Domain relations on external edges

- [x] 1.1 Change `getModuleRelations` / `getFolderRelations` / `getNodeRelations` to take `selectedFilePaths: ReadonlySet<string>` (no `expandedFolders`); implement folder relations via the same `externalDependencies` / `externalDependents` bucket merge as files; verify existing module-relations tests pass after signature updates and folder tests assert collapse-invariant leave/enter lists (drop expand-only dual-candidate expectations)
- [x] 1.2 Add/adjust unit tests for unknown path → empty relations and selected vs hidden split on file endpoints; verify `npm run test -- src/domain/helpers/moduleRelations` passes

## 2. Domain keys and related sources

- [x] 2.1 Rewrite `getDependencyKeysBetweenPaths` to take `CruiseSnapshot` and match endpoints via node `isFolder` / `descendantFiles` (or file equality), returning `ModuleDependency.id`; verify `getDependencyKeysBetweenPaths` tests cover file↔file, folder↔path, and dependents direction without an `IModule[]` argument
- [x] 2.2 Rewrite `collectRelatedModuleSources` to take `CruiseSnapshot` and read distinct opposite endpoints from the path node's `external*`; verify its unit tests cover file and folder for both directions

## 3. App call sites

- [x] 3.1 Update `DependencyPanel` (and RelationRow props as needed) to build a selected-file `Set`, call snapshot-based `getNodeRelations` without `expandedFolderPaths` / `getCruiseModules`, and pass snapshot (not modules) into key lookup; verify `DependencyPanel` / `RelationList` tests pass and the panel no longer imports expand state for relations
- [x] 3.2 Update `HighlightEdgeDialog`, `useAppOrchestration`, and `useGraphWorkspaceActions` to the snapshot APIs; verify their tests pass and these flows no longer call `getCruiseModules` solely for related sources or keys-between-paths

## 4. Integration verification

- [x] 4.1 Run `npm run lint`, `npm run format:check`, `npm run test`, `npm run depcruise`, and `npm run build`; verify all succeed

## 5. Collapse leftover indirection

- [x] 5.1 Fold relations into a single `getNodeRelations` (delete file/folder wrappers + `buildExternalPathRelations`); use plain selected→visible / else→hidden; remove dead `mergeRelationGroups` helpers; verify `npm run test -- src/domain/helpers/moduleRelations` and full verification still pass
- [x] 5.2 Replace hand-rolled flag merge in `getNodeRelations` with grouping deps by endpoint then a single `deriveRelationFlagsFromAggregated` per path; verify moduleRelations tests pass
