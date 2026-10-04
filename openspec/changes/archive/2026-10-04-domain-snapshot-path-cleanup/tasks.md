# Tasks

## 1. Dead domain helpers

- [x] 1.1 Delete `pathUtils/getRepresentative` (module, barrel export, tests) and verify `rg getRepresentative` finds no remaining references
- [x] 1.2 Delete domain `folderExpansion/toggleExpandedKey` (module, barrel export, tests) and verify RelationList still uses its local `Set` helper while `rg toggleExpandedKey src/domain` is empty

## 2. Collapse via snapshot ancestors

- [x] 2.1 Update `resolveActivePathAfterCollapse` to take `cruiseSnapshot` and pick the deepest collapsed ancestor from `nodes.get(activePath)?.ancestors`; update unit tests for indexed paths, self-collapse, and unindexed active path unchanged; verify the helper test file passes
- [x] 2.2 Pass `get().cruiseSnapshot` from `setExpandedFolderPaths` into `resolveActivePathAfterCollapse` and verify workspace store tests that cover collapse → activePath still pass (add a focused case if none assert ancestor-based move)

## 3. replaceWorkspaceSettings on snapshot

- [x] 3.1 Change `replaceWorkspaceSettings` to accept `cruiseSnapshot` (drop `sources`/`modules`); implement membership via `nodes.has`, folder color keys via folder nodes, highlight keys via `dependencies.byDependencyKey`; remove unused `isPathInSources` / `isFolderPath` / `collectFolderPaths` / `collectAllDependencyKeys` if nothing else imports them; verify `rg isPathInSources` is empty outside docs/history
- [x] 3.2 Update `applySettingsToCruiseResult` to pass `cruiseSnapshot` only and drop `getCruiseSources` / `getCruiseModules` at that call site; verify hard-reset / `syncWorkspaceSettings` store tests still pass
- [x] 3.3 Rewrite `replaceWorkspaceSettings` cases in `parseViewerFileJson.test.ts` to build a snapshot and call the new API; verify that describe block passes

## 4. Soft reconcile on snapshot

- [x] 4.1 In `reconcileWorkspaceAgainstSnapshot`, replace `isPathInSources` / source-list folder walks with `cruiseSnapshot.nodes.has` and layout pruning against snapshot node keys; update or add tests for stale panel/active clear and layout prune; verify reconcile and related store tests pass

## 5. Orchestration consistency

- [x] 5.1 In `getCurrentWorkspaceSettings`, filter `selectedFiles` with snapshot file-node membership instead of `cruiseResult.modules.some`; verify any save/settings tests covering selected files still pass
- [x] 5.2 Where `useAppOrchestration` builds a membership set only via `getCruiseSources`, switch to snapshot file-node membership (keep `getCruiseSourcesUnder` for under-folder file lists); verify orchestration tests for showPathsOnly / related / circular still pass

## 6. Verification

- [x] 6.1 Run `npm run lint`, `npm run format:check`, and `npm run test` and verify all three succeed
