# Tasks

## 1. Workspace store API

- [x] 1.1 Update `WorkspaceStateActions.setExpandedFolderPaths` to `(next, options?: { replace?: boolean })` and remove `replaceExpandedFolderPaths`; verify TypeScript surfaces the new signature only
- [x] 1.2 Implement merge/replace + collapse→`activePath` in `workspaceStore.ts` per design (no array round-trip); verify `workspaceStore` tests cover merge expand, merge collapse with peers kept, replace clear, and activePath move / no-op on expand-only (`npm run test -- src/App/stores/workspaceStore`)

## 2. Caller migration

- [x] 2.1 Migrate `useAppOrchestration` expand/collapse/toggle/clear paths to `setExpandedFolderPaths` merge/replace records (retire or narrow `updateExpandedKeys`); verify `useAppOrchestration` tests still pass for active/root expand-collapse flows
- [x] 2.2 Migrate `FileTree` MUI `onExpandedItemsChange` to `setExpandedFolderPaths(pathsToPresenceRecord(keys), { replace: true })` and `FileTreeItem` toggle to a record patch; verify `FileTree` tests pass
- [x] 2.3 Migrate `useFileTreeContextMenu` and `useGraphWorkspaceActions` soft expand/collapse/toggle to merge patches (`true`/`false`); verify their related tests pass
- [x] 2.4 Grep for `replaceExpandedFolderPaths` and leftover array-replace patterns; verify zero matches outside archive/docs

## 3. Verification

- [x] 3.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; verify all succeed
