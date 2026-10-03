# Proposal

## Why

The command palette action that opens the graph edges-type picker is wired through `DependencyGraphHandle` on `GraphCanvas`. When no files are selected, `DependencyGraph` shows the empty state and does not mount the canvas, so `graphRef` has no handle and the dialog never opens. Users cannot change the edges type for the next graph view without first selecting files.

## What Changes

- Move `EdgesTypePickerDialog` (and its open hook) from `GraphCanvas` to `DependencyGraph/partials`, and re-export the public hook from `DependencyGraph/index`.
- Mount and open the dialog from `App`, following the same pattern as theme/language pickers, so opening does not depend on canvas mount or graph selection.
- Remove `openEdgesTypePicker` from `DependencyGraphHandle` and from `useAppOrchestration`'s graph-ref delegation; pass `openEdgesTypePicker` into `useAppCommands` as a direct App-owned opener.
- Keep dialog behavior unchanged: selecting a type still updates `workspaceStore.graphSettings.edgesType`.

## Capabilities

### New Capabilities

- `graph-edges-type-picker`: Command-driven selection of the graph edges rendering type, available regardless of whether the dependency graph canvas is mounted.

### Modified Capabilities

- (none)

## Impact

- `src/App/App.tsx` — own dialog lifecycle like other command dialogs.
- `src/App/hooks/useAppCommands` / `useAppOrchestration` — opener moves off orchestration/graph handle.
- `src/App/partials/DependencyGraph` — module owns dialog code and barrel export; `DependencyGraphHandle` drops `openEdgesTypePicker`.
- `src/App/partials/DependencyGraph/partials/GraphCanvas` — stop hosting dialog and imperative open.
- Tests for GraphCanvas handle, orchestration, and App commands that assume graph-ref delegation.
