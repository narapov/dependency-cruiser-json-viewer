# Proposal

## Why

Users need to expand or collapse folder trees to a chosen depth (not only one level or fully recursive). Today expand/collapse logic is split across soft single-key toggles and source-string subtree walks (`getSubtreeFolderKeys`), so level-limited actions and a shared soft model are hard to express consistently across the command palette, FileTree, and graph.

## What Changes

- Add domain helpers that soft-expand / soft-collapse folders by walking `CruisePathNode` trees to a depth limit (`level >= 1` or `Infinity`), taking an array of starting nodes (no path/string recomputation from sources).
- Refactor existing Expand / Expand Recursive / Collapse Recursive (and All Recursive) to call those helpers; Collapse Recursive = soft-collapse root + collapse-to-level 1 on that root.
- Add **Expand to level** / **Collapse to level** for the active folder (commands) and for the folder under the FileTree / graph context menus, each opening a shared level-input dialog (min `1`).
- Add **File Tree: Expand roots to level** / **Collapse roots to level** commands over `snapshot.tree.values().filter(n => n.isFolder).toArray()`.
- Add **Collapse Recursive** to FileTree and graph context menus (parity with Expand Recursive and QuickPick).
- Replace `getSubtreeFolderKeys` / `removeSubtreeFolderKeys` (sources-based) with snapshot-tree walks.

## Capabilities

### New Capabilities

- `folder-expansion`: Soft expand/collapse of cruise folder nodes by relative depth (including recursive as depth-limited soft walks), plus user actions to expand/collapse to a prompted level for an active folder, context-menu folder, or all tree roots.

### Modified Capabilities

- (none)

## Impact

- Domain: `src/domain/helpers/folderExpansion/` — new level helpers; retire or reimplement sources-based subtree helpers.
- App orchestration / commands: `useAppOrchestration`, `useAppCommands`, i18n locales.
- UI: FileTree and Graph context menus; new shared level prompt dialog (`useXxxDialog` + `AppDialog`).
- Graph workspace actions that call `getSubtreeFolderKeys`.
- Unit tests for domain helpers; orchestration / command / menu tests as needed.
