# Design

## Context

See proposal.md — Why. Today `getModuleRelations` already reads `node.externalDependencies` / `externalDependents`, while `getFolderRelations` reconstructs the same leave/enter set by pulling `originModule`s and walking `IModule.dependencies` with `getRepresentative` + `expandedFolders`. `getDependencyKeysBetweenPaths` and `collectRelatedModuleSources` likewise take `IModule[]`, which forces App code through `getCruiseModules`. DependencyPanel therefore threads modules, selection arrays, and expand state into domain helpers even though panel semantics should be path-centric and collapse-agnostic (`docs/architecture.md`: prefer snapshot indexes; React Compiler — avoid memo churn around that bridge).

## Goals / Non-Goals

**Goals:**

- One relations algorithm for file and folder nodes on `external*`.
- Snapshot-first APIs for keys-between-paths and related sources.
- Thin DependencyPanel / highlight call sites (no modules bridge, no `expandedFolderPaths` for relations).
- Keep existing path-tree shaping (`buildRelationPathTree`) and flag aggregation behavior for visible/hidden lists.

**Non-Goals:**

- Changing how the graph builds visible trees or uses `internal*`.
- Removing `getCruiseModules` entirely from the codebase.
- Broader DependencyPanel UI restructure (context providers, section partials) beyond what the API cleanup unlocks.
- Changing ApplicableRulesPanel path validation.

## Decisions

### 1. Unify folder relations onto `external*` (drop collapse from API)

- **Choice:** Single public API `getNodeRelations(path, snapshot, selectedFilePaths)` reads the path node's `externalDependencies` / `externalDependents`. Selection is the store presence `Record<string, boolean | undefined>` (same as `getVisibleTree`). No separate file/folder helpers; no `expandedFolders` / `getRepresentative`.
- **Why:** Leave/enter edges are already on every node; collapse is graph layout state, not panel truth. File vs folder was only a dispatch wrapper.
- **Alternatives:** Keep `getModuleRelations` / `getFolderRelations` thin wrappers — rejected as noise. Pass `ReadonlySet` instead of store presence `Record` — rejected; use the same `Record<string, boolean | undefined>` as `getVisibleTree` / store.

### 1b. Simplify hidden split

- **Choice:** Selected endpoint → visible list; otherwise → hidden. Drop `hiddenPolicy` and per-call `getCruiseSources` membership checks.
- **Why:** Snapshot `external*` endpoints are already module paths in the snapshot; the old deps-vs-dependents policy asymmetry was leftover from IModule walks.

### 2. Keys and related-sources read snapshot edges

- **Choice:**
  - `getDependencyKeysBetweenPaths(snapshot, sourcePath, targetPath, direction)` filters edges whose endpoints match file equality or folder `descendantFiles` membership; return `ModuleDependency.id`.
  - Prefer filtering the focused node's `externalDependencies` / `externalDependents` (or `dependencies.bySource` / `byTarget` when both sides are files) over scanning all modules.
  - `collectRelatedModuleSources(snapshot, path, direction)` returns distinct opposite endpoints of that node's `external*` maps.
- **Why:** Same indexes as relations; deletes the `IModule[]` contract at the boundary.
- **Alternatives:** Keep modules-array overloads for compatibility — rejected; few call sites, cleaner break.

### 3. Call-site cleanup is part of this change

- **Choice:** Update DependencyPanel, RelationRow, HighlightEdgeDialog, `useAppOrchestration`, and `useGraphWorkspaceActions` in the same change as the domain API break.
- **Why:** Leaving broken callers is not viable; the proposal's value is end-to-end removal of the bridge.
- **Alternatives:** Domain-only PR then UI PR — unnecessary given the small caller set.

### 4. Thin the relations module surface

- **Choice:** Delete `getModuleRelations`, `getFolderRelations`, `buildExternalPathRelations`, and unused `mergeRelation` / `buildFolderSet`. Keep `buildRelationPathTree` + `collectRelatedModuleSources` beside `getNodeRelations`.
- **Why:** After unification those modules were pure indirection or dead leftover from the IModule folder walk.

## Risks / Trade-offs

- **[Risk] Subtle flag differences vs old dual-candidate merge** → Mitigation: compare aggregated flags from `deriveRelationFlagsFromAggregated` on external buckets against current fixtures; update fixtures where expand-only duplication was the sole difference.
- **[Risk] Hidden-policy asymmetry (deps vs dependents) regresses** → Mitigation: preserve `getModuleRelations` policies when unifying (`selected-modules-only` vs `all-unselected`); cover with existing module + folder hidden tests.
- **[Risk] Folder matching for keys uses `descendantFiles` / path-under rules inconsistently** → Mitigation: mirror current `matchesPathOrUnder` semantics using snapshot node `isFolder` + `descendantFiles` (architecture: no fresh path walks when the node exists).
- **[Trade-off] BREAKING domain signatures** → Acceptable; all in-repo callers updated in this change.

## Migration Plan

1. Land domain API + tests (relations unify, keys, related sources).
2. Update App callers; remove modules/`expandedFolderPaths` from DependencyPanel relations path.
3. Run domain + panel/dialog tests, `depcruise`, lint, build.
4. No data/workspace migration; runtime state shape unchanged aside from unused expand reads in the panel.

## Open Questions

- None that block implementation. Exact helper file split (keep `getFolderRelations` as thin wrapper vs merge into one `getNodeRelations` body) can be chosen during apply for minimal diff.
