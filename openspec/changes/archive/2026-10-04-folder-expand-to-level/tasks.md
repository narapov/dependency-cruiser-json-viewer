# Tasks

## 1. Domain soft expand/collapse by level

- [x] 1.1 Add folderExpansion helpers that collect paths to soft-expand (`relativeDepth < level`) and soft-collapse (`relativeDepth >= level`) from `CruisePathNode[]` + level (`number | Infinity`), walking only `children` / `isFolder`, and verify unit tests cover level 1, level 2, Infinity, multi-root starts, and non-folder skips
- [x] 1.2 Replace `getSubtreeFolderKeys` / `removeSubtreeFolderKeys` (and their tests/exports) with the new helpers or thin wrappers over them, and verify no remaining sources-based subtree folder-key API in `src/domain`

## 2. Orchestration and command wiring

- [x] 2.1 Refactor `useAppOrchestration` expand/collapse recursive and all-recursive (and single-level expand where applicable) onto the new helpers; add expand/collapse active-to-level and roots-to-level actions, and verify orchestration tests cover recursive, to-level, and roots cases
- [x] 2.2 Wire QuickPick commands + i18n keys in all five locales for Active Expand/Collapse to level and File Tree Expand/Collapse roots to level, and verify `useAppCommands` tests list the new command ids

## 3. Level dialog

- [x] 3.1 Add shared App-owned level prompt dialog (`useXxxDialog` + `AppDialog` + number input, min `1`, cancel = no-op) and verify opening, cancel, and confirm with a valid integer behave as specified
- [x] 3.2 Connect to-level orchestration actions to the prompt and verify cancel leaves `expandedFolderPaths` unchanged while confirm applies the level

## 4. Context menus

- [x] 4.1 Update FileTree context menu: Expand/Collapse to level (via prompt), Collapse Recursive, and refactor Expand Recursive onto the new helpers; verify menu items and actions in FileTree context-menu tests
- [x] 4.2 Update Graph context menu / `useGraphWorkspaceActions` the same way (to-level, Collapse Recursive, expandRecursive refactor) and verify NodeContextMenu tests

## 5. Integration check

- [x] 5.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`, and verify all pass
