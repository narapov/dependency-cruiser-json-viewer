# Proposal

## Why

Graph layout today is a fragile post-process pipeline on top of ELK (`useGraphLayoutNodes` + `graphLayoutCache`): fingerprints of child ids only, positions without sizes, and sibling reflow heuristics that reshuffle restored layouts. Workspace load therefore fails to restore nested child positions reliably. Layout memory needs to live with `buildGraph` (ELK interactive) and survive collapse/expand without rebuilding on every drag.

## What Changes

- Introduce a **group layout cache** (ref on the main thread) whose entries are `{ id, width, height, children: { id, position, width, height } }`, including groups that are currently collapsed or otherwise not visible.
- Pass a serializable cache snapshot into `buildGraph` (worker). During layout, apply cached geometry via ELK **interactive** strategies when a group's child-id set still matches; otherwise invalidate that group entry and cold-layout it.
- After each successful build, merge visible group geometry back into the cache; leave entries for non-visible groups untouched.
- On drag-and-drop: update React Flow nodes and the cache in place (cascading vertical overlap settle with the dragged node fixed + recursive parent grow); **do not** rebuild the graph.
- After applying cached positions during build (including when a child's size grew under the same membership), run the same cascading top-down overlap settle among siblings so expanded/grown nodes do not leave lower siblings overlapped; parent growth bubbles naturally because layout is bottom-up.
- Auto layout on a folder: invalidate that folder's cache entry (recursive action also invalidates descendant group entries), then rebuild.
- **BREAKING** (workspace settings): replace position-only `nodePositions` with a richer group-layout snapshot (sizes included). Migrate legacy `nodePositions` by seeding positions and treating missing sizes as incomplete (first rebuild fills sizes / may cold-layout incomplete groups).
- Remove or sharply shrink the post-build layout pipeline in `useGraphLayoutNodes` / `graphLayoutCache` that currently re-applies cache and reflows after ELK.

## Capabilities

### New Capabilities

- `graph-layout-cache`: Group-oriented layout cache integrated with `buildGraph` (ELK interactive), DnD without rebuild, invalidate rules, and workspace persistence of group layouts including sizes.

### Modified Capabilities

- (none — project has no existing main specs yet)

## Impact

- `src/App/partials/DependencyGraph/helpers/buildGraph/` (`buildGraph`, `layoutGroup`, worker request/response types)
- `src/App/partials/DependencyGraph/hooks/useBuildGraph/`, `useGraphLayoutNodes/`
- `src/App/partials/DependencyGraph/helpers/graphLayoutCache/` (replace or gut post-process helpers)
- `src/App/partials/DependencyGraph/DependencyGraph.tsx` (layout snapshot apply/save)
- Workspace domain: `ViewerWorkspaceSettings`, Zod schema, normalize/prune/reconcile helpers, `workspaceStore`, CLI/orchestration save/load paths
- Tests for buildGraph layout, layout hook, workspace parse/migrate
