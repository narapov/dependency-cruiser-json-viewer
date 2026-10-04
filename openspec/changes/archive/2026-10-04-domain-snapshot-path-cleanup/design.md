# Design

## Context

See proposal.md for motivation. Orchestration (`useAppOrchestration`) already resolves ancestors, parent, panel membership, and selection visibility from `cruiseSnapshot.nodes`. The remaining string/prefix topology sits on the store load path:

- `applySettingsToCruiseResult` → `replaceWorkspaceSettings({ sources, modules, ... })`
- `softReset` / `setIgnorePatterns` → `reconcileWorkspaceAgainstSnapshot` → `isPathInSources`
- `setExpandedFolderPaths` → `resolveActivePathAfterCollapse(active, collapsed)` with `startsWith`

Architecture rule: after load, prefer snapshot topology; `pathUtils` parent walks stay for snapshot build.

## Goals / Non-Goals

**Goals:**

- One membership source for settings apply, soft reconcile, and post-load UI: `cruiseSnapshot.nodes` (plus snapshot dependency index for highlight keys).
- Collapse active-path adjustment shares the same ancestor model orchestration uses for expand-on-activate.
- Remove dead domain exports that only exist for the old string world (`getRepresentative`, unused array `toggleExpandedKey`).

**Non-Goals:**

- Changing expanded-folder presence-record merge/replace semantics.
- Rewriting build-time `getAncestorKeys` / `getParentPath` usage inside `buildCruiseSnapshot` / `buildModulesDependencies`.
- Unifying RelationList's local `Set` toggle helper with domain.
- Broader orchestration refactors beyond membership/selectedFiles consistency.

## Decisions

### 1. `replaceWorkspaceSettings` takes `cruiseSnapshot`

**Choice:** `ReplaceWorkspaceSettingsInput = { cruiseSnapshot, settings, defaultFolderColors }`.

**Rationale:** The only production caller already builds the snapshot before calling. Snapshot already has file nodes, folder nodes, and `dependencies.byDependencyKey`. Passing `sources`/`modules` forces re-deriving folders via `getParentPath` and membership via prefix.

**Alternatives considered:**

- Keep `sources`/`modules` and only swap check implementations → still invites prefix helpers and duplicates indexes the snapshot already has.
- Pass `nodes` Map alone → loses dependency-key index needed for highlight filtering.

**Implementation sketch:**

- Membership: `cruiseSnapshot.nodes.has(path)`
- Folder keys for colors: nodes with `isFolder`
- Valid layout paths: all `nodes` keys (+ root group `''` as today)
- Highlight keys: `cruiseSnapshot.dependencies.byDependencyKey.has(key)`
- Selected files: keep file-only filtering (`!nodes.get(path)?.isFolder` or equivalent via existing selected-files rules)
- Delete `isPathInSources`, `isFolderPath`, `collectFolderPaths`, and `collectAllDependencyKeys` once unused (or keep `collectAllDependencyKeys` only if still needed elsewhere — prefer snapshot keys)

### 2. Soft reconcile uses the same index

**Choice:** `isValidPath = path => cruiseSnapshot.nodes.has(path)`; `pruneNodeLayouts` valid set = `cruiseSnapshot.nodes.keys()` (plus empty group id).

**Rationale:** Reconcile already receives `cruiseSnapshot`. Prefix/`getCruiseSources` + segment slicing is redundant and diverges from orchestration getters.

### 3. Collapse helper takes snapshot

**Choice:** `resolveActivePathAfterCollapse(activePath, collapsedFolders, cruiseSnapshot)`.

Algorithm when `activePath` is indexed:

1. Resolve `node = nodes.get(activePath)`
2. Among `collapsedFolders`, pick the first hit in `node.ancestors` (nearest → root) — that is the deepest collapsed ancestor
3. If none, keep `activePath`
4. If active equals a collapsed folder, ancestors exclude self → keep active (matches current tests)

If active path is not in the index, leave it unchanged (no invented hierarchy).

**Call site:** `setExpandedFolderPaths` passes `get().cruiseSnapshot`.

**Alternatives considered:** Move collapse adjustment into orchestration — rejected; every collapse already goes through the store action, so one store fix covers all callers.

### 4. Orchestration consistency (same change)

**Choice:** Include small cleanups:

- `getCurrentWorkspaceSettings.selectedFiles`: filter with snapshot file-node membership instead of `cruiseResult.modules.some`
- Where `getCruiseSources` is only used to build a membership `Set`, prefer filtering against file nodes / snapshot helpers without implying a second topology

**Rationale:** Keeps save→load and UI resolution on one model; low churn.

### 5. Dead code deletion

Delete with barrel updates:

- `src/domain/helpers/pathUtils/getRepresentative/`
- `src/domain/helpers/folderExpansion/toggleExpandedKey/` (array API)

Do not touch RelationList's local helper.

## Risks / Trade-offs

- [Behavior nuance for unindexed active path on collapse] → Spec: leave unchanged; add/adjust a unit test if current prefix behavior would have moved an unknown path.
- [replace tests live under `parseViewerFileJson.test.ts`] → Update fixtures to build a snapshot (or call `buildCruiseSnapshot`) instead of raw `sources`/`modules`.
- [Slightly different folder-color key set] → Snapshot folder nodes should match previous `collectFolderPaths(sources)` for the same cruise; verify with existing replace tests.

## Migration Plan

Internal-only API break. Update store call site and domain tests in the same PR. No persisted workspace schema change.

## Open Questions

None — API shape (`cruiseSnapshot` input) confirmed in exploration.
