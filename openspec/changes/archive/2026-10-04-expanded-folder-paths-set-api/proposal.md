# Proposal

## Why

`expandedFolderPaths` is a presence record for O(1) lookups, but mutations round-trip through path arrays via `replaceExpandedFolderPaths`. That defeats the record model and taxes every new expand/collapse action. Unify on one record-native setter before more folder actions build on the noisy API.

## What Changes

- **BREAKING:** Remove `replaceExpandedFolderPaths(paths: readonly string[])`.
- Extend `setExpandedFolderPaths` to accept an optional `{ replace?: boolean }`:
  - default: merge `{ ...current, ...patch }`
  - `replace: true`: replace the record with the given object
- Treat `true` as present; `false` and `undefined` as absent (callers may set either).
- Keep moving `activePath` out of collapsed subtrees when any path goes from present to absent.
- Migrate all callers (orchestration, FileTree, graph actions, context menus, tests) to the record API; use `replace: true` only where a full snapshot is required (e.g. MUI TreeView expanded items).

## Capabilities

### New Capabilities

- `workspace-expanded-folder-paths`: Workspace store contract for the expanded-folder presence record — merge/replace updates, presence semantics (`true` vs `false`/`undefined`), and `activePath` adjustment on collapse.

### Modified Capabilities

- (none) — soft expand/collapse depth walks in `folder-expansion` stay unchanged; only how the workspace applies resulting path sets changes.

## Impact

- `src/App/stores/workspaceStore/` — action types, `workspaceStore.ts`, tests
- Callers: `useAppOrchestration`, `FileTree`, `FileTreeItem`, `useFileTreeContextMenu`, `useGraphWorkspaceActions`, related tests
- Domain helpers such as `toggleExpandedKey(string[])` may stay for array math at UI boundaries, or callers may toggle via `{ [path]: !current[path] }`
- No change to cruise snapshot / soft-walk domain helpers (`collectFolderPathsToExpand` / `Collapse`)
- Out of scope: same refactor for `selectedFilePaths`; new active-element UI menu items
