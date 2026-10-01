# Design

## Context

See proposal.md — Why. Phases 1–4 landed shell thinning and store push-down. Phase 5 removes `CruiseSnapshotContext`, which mostly mirrored the workspace store, and replaces HighlightEdge’s nested filtered snapshot with `allowedPaths` (related sources + ancestors).

Constraints: App root imports partials only via each partial’s `index.ts`. `useAppOrchestration` continues to avoid hot-field subscriptions via `getState()` where intended.

## Goals / Non-Goals

**Goals:**

- Single ambient source for cruise snapshot: workspace store.
- HighlightEdge target step stays useful: searchable related modules **and** their ancestor folders via `allowedPaths`.
- PathSearch stays a filter over ambient snapshot (`allowedPaths` only)—no snapshot override API.
- Preserve user-visible highlight-edge / path-search behavior as closely as practical.

**Non-Goals:**

- No new Context for cruise data.
- No `cruiseSnapshot` prop on `PathSearchBody` / `usePathSearchState`.
- No redesign of path-search chrome or highlight-edge step UX beyond data sourcing.
- No command-id or orchestration semantic changes.

## Decisions

### 1. Phase 1–4 pieces (landed)

| Area                                        | Role                                                          |
| ------------------------------------------- | ------------------------------------------------------------- |
| File loading / notice / gate screens        | Slot hooks + `CruiseResultLoading` / `CruiseResultEmptyState` |
| Colocated dialog openers                    | Sibling `useXxxDialog` + barrels                              |
| Store push-down (Header / Layout / openers) | Leaves and openers read store; App is composer                |

### 2. Phase 5: remove CruiseSnapshotContext

```
BEFORE                                      AFTER
------                                      -----
App → CruiseSnapshotProvider(store snap)
  consumers → useCruiseSnapshotRequired()   consumers → useWorkspaceStore(...cruiseSnapshot)
  HighlightEdge:
    buildCruiseSnapshot(subset)
    nested Provider → PathSearchBody        PathSearchBody allowedPaths={sources+ancestors}
```

#### 2a. Ambient snapshot = store

Replace `useCruiseSnapshot` / `useCruiseSnapshotRequired` with store reads. Required semantics: throw or early-return only where the UI is already only mounted under a loaded cruise (same as today’s provider-with-data assumption). Prefer selecting `state.cruiseSnapshot` (and `cruiseResult != null` checks where needed) without inventing a new required-hook unless many call sites need the throw.

Delete `CruiseSnapshotContext` module and stop exporting it from `App/contexts`.

#### 2b. HighlightEdgeDialogContent: snapshot-centric, PathSearch via allowedPaths

Content reads `cruiseSnapshot` from the store (not context). Keep domain work on that snapshot:

- `modules = getCruiseModules(cruiseSnapshot)`
- `targetSources = collectRelatedModuleSources(sourcePath, modules, 'dependencies')`
- `allowedPaths = targetSources ∪ ancestors(each target)` using `nodes.get(path)?.ancestors` and/or `getAncestorKeys`
- `dependencyKeys` / highlight color unchanged in spirit

Target step:

```
<PathSearchBody allowedPaths={allowedPaths} onSelect={selectTarget} />
```

Source step stays unrestricted `<PathSearchBody onSelect={selectSource} />`.

Remove: `buildCruiseSnapshot` for the target subset, nested `CruiseSnapshotProvider`.

**Why:** Nested provider existed only to shrink PathSearch’s tree; `allowedPaths` is the API for that. Ancestors must be included so folder rows remain (parity with filtered-tree walk).  
**Alternative:** Pass override `cruiseSnapshot` into PathSearch — rejected; keeps a second snapshot channel and widens PathSearch API.  
**Alternative:** `allowedPaths = targetSources` only — rejected; drops ancestor folder rows the filtered snapshot showed.

#### 2c. Helper placement

Prefer a tiny pure helper (domain or HighlightEdge `helpers/`) e.g. `expandPathsWithAncestors(paths, snapshot)` used when building `allowedPaths`. Inline in Content is acceptable if used once; extract if tests want the union logic alone.

#### 2d. Tests

- Seed `useWorkspaceStore` (reset / setState) instead of wrapping `CruiseSnapshotProvider`.
- HighlightEdge / path-search: assert target step with related files **and** an ancestor folder path present when `allowedPaths` includes ancestors; confirm no nested provider imports remain.

### 3. What stays in App (composer)

- `useCruiseResult` + hydrate `resetWorkspace` + gates
- refs, orch, commands wiring, sidebar local state, cross-feature handlers
- mounting opener dialog nodes + file overlay + notice
- **No** `CruiseSnapshotProvider`

### 4. Naming / API notes from earlier phases (still apply)

- Public opener names describe the dialog, not the slot pattern.
- Controlled dialogs keep `open` / `onClose`.
- No `AppOverlays` / public `useDialogSlot`.

## Risks / Trade-offs

- **[Risk] allowedPaths without ancestors drops folders** → Mitigate: explicitly union ancestors; cover in HighlightEdge or helper test.
- **[Risk] Sibling files under an allowed ancestor folder still hidden** → Same as filtered snapshot (only related modules were in the subset); acceptable.
- **[Risk] Tests still import deleted context** → Grep for `CruiseSnapshotProvider` / `useCruiseSnapshot` after migration; fix wrappers to seed store.
- **[Risk] Empty snapshot when dialog opens without cruise** → Dialog already only opens with cruise loaded; keep guards if any code path differs.

## Migration Plan

- Same change / branch; implement after phase 4.
- Order: HighlightEdge `allowedPaths` (+ ancestors) → migrate context consumers to store → delete context → verify.
- Rollback = revert; no data migration.

## Open Questions

- None blocking: helper in domain vs HighlightEdge `helpers/` — prefer HighlightEdge-local unless another call site appears during apply.
