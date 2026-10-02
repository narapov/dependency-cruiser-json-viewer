# Tasks

## 1. Domain: layouts-only merge view

- [x] 1.1 Remove `nodePositions` from `MergedViewerWorkspaceView`; keep deprecated inbound field on `ViewerWorkspaceSettings` / Zod; verify TypeScript callers of the merged view no longer expect positions
- [x] 1.2 Update `replaceWorkspaceSettings` to return only `nodeLayouts` (via `resolveNodeLayouts` + filter); drop parallel position filtering/derivation from the merge result; verify `parseViewerFileJson` / replace tests: legacy positions-only files still load into `nodeLayouts`, and modern files keep layouts
- [x] 1.3 Stop using `nodeLayoutsToNodePositions` on save/merge happy path (delete if unused); keep `nodePositionsToNodeLayouts` for inbound migrate; verify unit coverage for migrate helper remains

## 2. Workspace store: drop positions state

- [x] 2.1 Remove `nodePositions` / `setNodePositions` from `WorkspaceOwnState`, actions, `initialWorkspaceState`, reset/reconcile/`mapMergedViewToWorkspaceFields`; verify `workspaceStore` tests pass without position fields
- [x] 2.2 Delete `normalizeNodePositions` / `pruneNodePositions` (and barrel exports) once unused; keep `pruneNodeLayouts` as the sole layout prune; verify store reconcile still drops orphan layout entries against sources

## 3. Graph + orchestration: layouts-only bridge

- [x] 3.1 Strip `nodePositions` from `GraphLayoutState` / `DependencyGraphHandle`; update `useDependencyGraphImperativeRef` get/set to `nodeLayouts` only; verify graph handle tests / TypeScript compile
- [x] 3.2 Simplify `useApplyWorkspaceLayout` to apply `nodeLayouts` only (no legacy fallback); update `GraphCanvas` wiring; verify layout restore still rebuilds from store `nodeLayouts`
- [x] 3.3 Update `useAppOrchestration` `getCurrentWorkspaceSettings` to persist `nodeLayouts` and write empty/`{}` `nodePositions` (no dual-write of layout geometry); verify save/settings tests assert layouts present and positions empty when custom layout exists
- [x] 3.4 Delete `layoutStateConverters` (and tests) if unused after the above; verify no remaining imports of `legacyPositionsToLayouts` / `layoutsToLegacyPositions`

## 4. Integration check

- [x] 4.1 Run `npm run lint`, `npm run format:check`, and `npm run test`; fix any fallout from the layouts-only cutover
- [x] 4.2 Run `npm run build` and confirm type-check succeeds with positions removed from store/graph APIs
