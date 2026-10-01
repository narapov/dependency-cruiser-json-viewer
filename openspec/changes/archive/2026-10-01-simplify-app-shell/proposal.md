# Proposal

## Why

`App.tsx` was a composition root that mixed workspace hydration, file loading, dialog open-state, command wiring, empty/loading UI, and the main shell. Phases 1–4 thinned the shell, colocated dialog openers, split cruise-result gates, and pushed store-backed display data into leaves. `CruiseSnapshotContext` still mirrors `store.cruiseSnapshot` for most consumers, with a nested provider only in `HighlightEdgeDialog`’s target step—a second channel for the same ambient data.

## What Changes

**Phase 1 (done):**

- Extract cruise/settings/CLI file load, drop, merged errors, and main-overlay file UI into `useAppFileLoading`.
- Extract watch-mode “cruise result updated” snackbar into `useCruiseResultUpdatedNotice`.
- Extract pending / error / empty full-screen UI into interim `AppBootstrap`.
- Thin `App.tsx`; no `AppOverlays` partial.
- Interim: `useAppDialogs` bag (removed in phase 2).

**Phase 2 (done):**

- Replace `useAppDialogs` with meaning-named sibling openers on dialog partials + barrel exports.
- `useJsonDialog` for cruise + module JSON; delete `useAppDialogs` / empty cruise placeholder.

**Phase 3 (done):**

- Split `AppBootstrap` into `CruiseResultLoading` and `CruiseResultEmptyState`; delete `AppBootstrap`.

**Phase 4 (done):**

- Push store-derived display data into `AppHeader`, `AppLayout`, and dialog openers; thin App props; command flags sourced inside `useAppCommands`.

**Phase 5 (remaining):**

- Delete `CruiseSnapshotContext` / `CruiseSnapshotProvider`; ambient cruise snapshot comes from `useWorkspaceStore`.
- Rewrite `HighlightEdgeDialogContent` around the workspace snapshot: related targets via domain helpers; target search uses `PathSearchBody` `allowedPaths` (related module sources **plus ancestor folder paths** so folder rows remain).
- Do **not** add a `cruiseSnapshot` override prop to `PathSearchBody`; keep filtering to `allowedPaths` only.
- Drop nested filtered `buildCruiseSnapshot` + nested provider in HighlightEdge.
- Migrate consumers/tests from context to store seeding; remove `src/App/contexts/CruiseSnapshotContext/`.
- Behavior-preserving for highlight-edge target search (files + ancestor folders).

## Capabilities

### New Capabilities

- (none — pure structural refactor; no new user-facing capability)

### Modified Capabilities

- (none — no requirement-level behavior change; `skip_specs: true` in `.openspec.yaml`)

## Impact

- Remove `src/App/contexts/CruiseSnapshotContext/` (+ barrel export from `contexts`)
- `HighlightEdgeDialog`, `PathSearchDialog` / `usePathSearchState`, `DependencyPanel`, `RulesPanel`, `CircularPanel`, `ApplicableRulesPanel`, `QuickPick` (+ tests)
- `App.tsx` drops `CruiseSnapshotProvider` wrapper (may still read `cruiseSnapshot` only if needed for something else—prefer not)
- Optional small domain/App helper to expand paths with ancestors for `allowedPaths`
- No i18n / schema changes
