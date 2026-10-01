# Proposal

## Why

Node relation helpers and dependency-key lookups still walk raw `IModule[]` (and folder relations re-derive leave/enter edges with `getRepresentative` + graph expand/collapse). The cruise snapshot already stores `externalDependencies` / `externalDependents` (and global `bySource` / `byTarget`) on every path node. Reading those indexes removes the modules bridge, aligns folder relations with file relations, and lets DependencyPanel ignore graph collapse — which is the correct panel semantics.

## What Changes

- Derive module/folder relations for a path solely from that node's `externalDependencies` / `externalDependents`, split by selected vs hidden file endpoints — via a single `getNodeRelations` API (no separate file/folder wrappers).
- **BREAKING (domain API):** drop `expandedFolders` from relations; selection is the store presence record; remove `getModuleRelations` / `getFolderRelations` public exports.
- **BREAKING (domain API):** `getDependencyKeysBetweenPaths` and `collectRelatedModuleSources` take `CruiseSnapshot` (+ paths) instead of `IModule[]`.
- Update DependencyPanel, RelationRow, HighlightEdgeDialog, and orchestration/graph callers to use the snapshot APIs and stop calling `getCruiseModules` for these flows.
- DependencyPanel MUST NOT read `expandedFolderPaths` when computing relations.

## Capabilities

### New Capabilities

- `cruise-snapshot-node-relations`: Path-node relations, related sources, and dependency keys between paths, all derived from cruise-snapshot edge indexes (`external*` / dependency maps), independent of graph collapse.

### Modified Capabilities

- (none)

## Impact

- Domain: `getModuleRelations`, `getFolderRelations`, `getNodeRelations`, `getDependencyKeysBetweenPaths`, `collectRelatedModuleSources`; possibly shared merge helpers.
- App: `DependencyPanel`, `RelationList`/`RelationRow`, `HighlightEdgeDialog`, `useAppOrchestration`, `useGraphWorkspaceActions`.
- User-facing: folder DependencyPanel lists always reflect full leave/enter edges for that path (no longer gated by expand/collapse). Graph collapse behavior unchanged.
- Out of scope: redesigning `internal*` usage in the graph; rewriting `getCruiseModules` away for unrelated callers; ApplicableRulesPanel path-resolve cleanup; DependencyPanel UI-only refactors beyond dropping the modules/collapse bridge.
