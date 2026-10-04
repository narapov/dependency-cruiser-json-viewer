# Tasks

## 1. Orchestration path topology

- [x] 1.1 In `useAppOrchestration`, replace `getAncestorKeys` in `activatePath`, `showPathsOnly`, and `showRelatedModules` with `cruiseSnapshot.nodes.get(path)?.ancestors ?? []`; verify `useAppOrchestration.test.ts` still covers activate/expand-related behavior and no import of `getAncestorKeys` remains in the hook
- [x] 1.2 In `useAppOrchestration`, resolve active folder via `nodes.get(activePath)?.parent` (drop `getParentPath`) and path membership via `cruiseSnapshot.nodes.has` (drop `isPathInSources` / `getCruiseSources` for those checks); verify active-folder and panel/active-path resolution tests pass
- [x] 1.3 In `focusPath`, call `isPathVisibleInSelectionRecord` with `selectedFilePaths` and `nodes.get(path)?.descendantFiles` (no `presenceRecordToPaths` for visibility); verify focus-path / quick-pick tests still pass

## 2. Graph actions and HighlightEdgeDialog

- [x] 2.1 In `useGraphWorkspaceActions`, replace `getAncestorKeys` in `activatePath` and `showRelatedModules` with snapshot `ancestors` the same way as orchestration; verify no `getAncestorKeys` import remains and related graph action tests (if any) or dependent NodeContextMenu tests still pass
- [x] 2.2 In `expandPathsWithAncestors`, remove the `getAncestorKeys` fallback so only `cruiseSnapshot.nodes.get(path)?.ancestors` is used; update `expandPathsWithAncestors.test.ts` for missing-node = no invented ancestors and verify the test file passes

## 3. Status / panel membership and cleanup

- [x] 3.1 In `AppStatusBar` and `ApplicableRulesPanel`, resolve paths with `cruiseSnapshot.nodes.has` instead of `isPathInSources`; verify their component tests (or add a focused assertion) still treat indexed paths as valid and absent paths as unset
- [x] 3.2 Delete `isPathVisibleInSelection` (module, barrel export, tests) after no production callers remain; verify `rg isPathVisibleInSelection` finds only `isPathVisibleInSelectionRecord` and `npm run test` covers the touched suites
- [x] 3.3 Run `npm run lint`, `npm run format:check`, and `npm run test` for the change; verify all three succeed
