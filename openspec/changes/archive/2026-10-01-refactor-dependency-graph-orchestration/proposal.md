# Proposal

## Why

`DependencyGraph.tsx` is already split into node/edge partials and domain hooks, but the orchestration root still mixes layout sync, imperative API, dialog open-state, and marker cleanup. That density makes the file harder to read and change without improving behavior. Extracting those concerns into focused hooks (and matching the existing dialog-owner pattern) keeps the feature root as thin wiring.

A follow-on split also removes the anonymous `DependencyGraphInner` name and moves the empty-selection gate to the shell so the React Flow tree is not mounted (and expensive hooks do not run) when nothing is selected.

## What Changes

- Extract workspace layout apply (cache deserialize + rebuild bump) into `useApplyWorkspaceLayout`.
- Move `legacyPositionsToLayouts` / `layoutsToLegacyPositions` into pure helpers shared by layout sync and the graph handle.
- Extract `useImperativeHandle` into `useDependencyGraphImperativeRef`.
- Add `useEdgesTypePickerDialog` following the Theme/Language/About dialog pattern (`openX` + dialog node).
- Extract graph-markers clear-on-empty-selection / unmount into a dedicated hook (e.g. `useClearGraphMarkersOnEmptySelection`).
- Optionally dedupe `hasAnyPresent` with the copy already local to `useBuildGraph` if it falls out naturally; not a hard requirement.
- Extract `DependencyGraphInner` into `partials/GraphCanvas/` as **`GraphCanvas`**; keep `DependencyGraph` as the thin shell (`ReactFlowProvider`, dialog, container CSS).
- Move the empty-selection early return into the shell: when nothing is selected, render `GraphEmptySelection` and **do not mount** `ReactFlowProvider` / `GraphCanvas`. Imperative handle methods (including edges-type picker via the handle) are **no-ops** while the canvas is unmounted (`graphRef.current?.…` already optional-chains).
- **No** React context layer; **no** new user-facing features beyond the empty-state mount behavior above.

## Capabilities

### New Capabilities

<!-- none — pure internal refactor; skip_specs: true -->

### Modified Capabilities

<!-- none — graph-layout-cache and other specs keep the same requirements; only code structure / mount behavior changes -->

## Impact

- Code: `src/App/partials/DependencyGraph/DependencyGraph.tsx`, new hooks under `hooks/`, helpers under `helpers/`, `useEdgesTypePickerDialog` beside `EdgesTypePickerDialog`, new `partials/GraphCanvas/`.
- Public behavior: unchanged for selected graphs (`DependencyGraphHandle`, workspace layout restore, marker cleanup). With **no selection**, canvas unmounts so handle calls no-op (edges-type picker command included until something is selected).
- Tests: existing `DependencyGraph` / orchestration tests should still pass; empty-selection test should assert empty UI without requiring a live canvas; add unit tests for layout converters; dialog hook can follow Theme/Language test style if useful.
- Specs: none (`skip_specs: true`).
