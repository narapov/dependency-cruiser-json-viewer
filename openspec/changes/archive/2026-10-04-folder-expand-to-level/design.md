# Design

## Context

See proposal.md for motivation. Expanded folders live in `workspaceStore.expandedFolderPaths` (presence record). Soft expand/collapse today add or remove a single path (`toggleExpandedKey`, Active Expand/Collapse). Recursive expand/collapse use `getSubtreeFolderKeys` / `removeSubtreeFolderKeys`, which rebuild folder sets from file `sources` via parent-path walks instead of `CruisePathNode.children`. FileTree and Graph context menus expose Expand Recursive but not Collapse Recursive. There is no shared numeric prompt dialog; other dialogs follow `useXxxDialog` + `AppDialog`.

## Goals / Non-Goals

**Goals:**

- One soft depth-walk model for expand/collapse to level, recursive shortcuts, and roots actions.
- Domain helpers take `CruisePathNode[]` + level and walk snapshot children only.
- Wire commands, FileTree menu, Graph menu, and a shared level dialog.
- Retire sources-based subtree folder-key helpers.

**Non-Goals:**

- Changing how visibility / selection / `resolveActivePathAfterCollapse` work beyond using the same expanded-key set.
- Replacing soft single-level toggle Expand/Collapse with exact-depth semantics.
- Persisting last-used level or adding keyboard shortcuts beyond existing QuickPick.
- Bulk-migrating unrelated `[...map.values()]` call sites to iterator helpers (convention already in AGENTS.md).

## Decisions

### 1. Soft-only model; recursive is soft over a walk

Every expand/collapse mutation adds or removes individual folder paths. Recursive expand = soft-expand all folders with `relativeDepth < Infinity`. Recursive collapse = soft-collapse the start node plus soft-collapse all folders with `relativeDepth >= 1` under it (no separate `level = 0`).

**Alternative considered:** Exact-depth set (expand and collapse both force subtree to depth N). Rejected — user chose directional soft add/remove.

### 2. Domain API shape

Pure helpers under `src/domain/helpers/folderExpansion/`, roughly:

- `collectFolderPathsToExpand(nodes, level) → string[]` — paths with `relativeDepth < level` under each start (start depth `0`).
- `collectFolderPathsToCollapse(nodes, level) → string[]` — paths with `relativeDepth >= level`.
- Orchestration merges: expand → union into expanded keys; collapse → filter out collected paths; recursive collapse → also remove each start path.

Callers resolve nodes from paths via `cruiseSnapshot.nodes.get(path)`, then **filter out missing entries** so the array has no `undefined` (e.g. `paths.map(p => nodes.get(p)).filter((n): n is CruisePathNode => n?.isFolder === true)` or equivalent). A path absent from the snapshot is a no-op for that entry — do not throw. Roots use `snapshot.tree.values().filter(n => n.isFolder).toArray()` (already concrete nodes).

**Alternative considered:** Keep `getSubtreeFolderKeys(path, sources)`. Rejected — duplicates ancestry already on the snapshot.

### 3. Level budget (countdown)

Walk passes a remaining `level` and always continues with `level - 1` (not an ascending depth counter). Expand: include while `remaining >= 1`, then recurse with `remaining - 1`. Collapse: while `remaining >= 1` only descend; once `remaining < 1`, soft-collapse that node and the rest of its subtree. Dialog min `1`; `Infinity` only via Recursive shortcuts.

### 4. Shared level dialog

App-owned `useFolderLevelDialog` (or similar) returning `promptLevel(): Promise<number | null>`, mounted like other App dialogs. Commands and context menus await the prompt then call orchestration. Validate integer `>= 1`; invalid input stays in dialog or disables OK (follow existing dialog patterns).

**Alternative considered:** Inline QuickPick numeric mode. Rejected — existing dialog pattern is clearer for a single number.

### 5. Surface wiring

| Action                             | QuickPick               | FileTree menu | Graph menu |
| ---------------------------------- | ----------------------- | ------------- | ---------- |
| Expand / Collapse (soft one level) | Active*                 | toggle        | toggle     |
| Expand / Collapse Recursive        | Active* + All Recursive | both          | both       |
| Expand / Collapse to level         | Active* + Roots         | yes           | yes        |

\*Active actions resolve folder via existing `resolveActiveFolderPath`.

Refactor `expandRecursive` / `collapseActiveRecursive` / `expandAllRecursive` / `collapseAllRecursive` onto the new helpers. Graph `useGraphWorkspaceActions.expandRecursive` same.

### 6. Migration of old helpers

Remove or replace `getSubtreeFolderKeys` / `removeSubtreeFolderKeys` with snapshot walks; update all call sites and tests in the same change.

## Risks / Trade-offs

- [Stale expanded keys under soft collapse] → Accept; matches current soft Collapse and is intentional for “remember” on re-expand. Recursive collapse still clears the walked set.
- [Large trees + Infinity walk] → Same order as today’s full subtree collect; walk children maps instead of all sources.
- [Dialog from context menu after menu close] → Open prompt after menu closes (existing `handleAction` pattern) so focus/portal order stays sane.

## Migration Plan

Land as one PR: domain helpers + call-site refactor + UI/commands/i18n + tests. No persisted schema change. Rollback = revert commit.

## Open Questions

- Default value in the level input (e.g. empty vs `1`) — decide at implement time to match other TextField dialogs.
