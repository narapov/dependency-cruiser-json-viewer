# Proposal

## Why

UI orchestration already reads hierarchy and membership from `cruiseSnapshot.nodes`, but the workspace store load/reconcile/collapse path still rebuilds folders with path-prefix helpers (`isPathInSources`, `collectFolderPaths`, `startsWith`). That keeps dead string-walking helpers alive in `domain` and makes save→load validation diverge from how the UI resolves paths after load.

## What Changes

- **BREAKING** (internal domain API): `replaceWorkspaceSettings` takes `cruiseSnapshot` instead of `sources` + `modules`; membership, folder set, and dependency-key validity come from the snapshot index.
- Soft reconcile (`reconcileWorkspaceAgainstSnapshot`) validates paths with `cruiseSnapshot.nodes.has` and prunes layouts against snapshot node keys (no path-segment slicing / prefix checks).
- Active-path adjustment after collapse uses the active path's snapshot `ancestors` (deepest collapsed ancestor), not `startsWith(`${folder}/`)`.
- Delete unused domain helpers: `getRepresentative`, array-based `folderExpansion/toggleExpandedKey`.
- Align orchestration edges that still bypass the snapshot for file-list/membership (`getCruiseSources` intermediates where only membership is needed; `getCurrentWorkspaceSettings.selectedFiles` via snapshot file nodes instead of scanning `cruiseResult.modules`).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `cruise-snapshot-path-topology`: Extend path-membership / hierarchy rules to workspace settings apply and soft reconcile (replace/reconcile MUST use the snapshot index, not source-array prefix walks).
- `workspace-expanded-folder-paths`: Clarify that “lies under a collapsed folder” is decided from the active path node's snapshot `ancestors`.

## Impact

- Domain: `replaceWorkspaceSettings` (+ tests in `parseViewerFileJson.test.ts`), `resolveActivePathAfterCollapse`, delete `getRepresentative` and domain `toggleExpandedKey`; remove `isPathInSources` / `isFolderPath` / `collectFolderPaths` string helpers once unused
- App store: `applySettingsToCruiseResult`, `setExpandedFolderPaths`, `reconcileWorkspaceAgainstSnapshot`
- App orchestration: small consistency cleanups for selected-files export and source-set membership
- Callers outside store: none for `replaceWorkspaceSettings` beyond its tests
- Out of scope: build-time `pathUtils` (`getAncestorKeys` / `getParentPath` inside `buildCruiseSnapshot`); RelationList's local `Set` `toggleExpandedKey`; QuickPick search-tier tests that call `getAncestorKeys` as a test fixture
