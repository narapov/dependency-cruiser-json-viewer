# Proposal

## Why

After extracting `GraphCanvas`, most of `DependencyGraph/partials`, plus nearly all hooks, helpers, and feature stores, exist only for the canvas — yet they still live as siblings of the shell. That ownership lie makes the feature root look like a flat grab-bag and forces deep relative imports across a false boundary. Nesting canvas internals under `GraphCanvas/` makes the shell vs canvas split match the real dependency graph.

## What Changes

- Move canvas-only UI partials under `partials/GraphCanvas/partials/` (nodes, edges, legend, loader, markers, layout toggle, context menus, etc.).
- Move canvas-only hooks under `partials/GraphCanvas/hooks/`.
- Move canvas-only helpers under `partials/GraphCanvas/helpers/`.
- Move canvas-only stores (`graphMarkersStore`, `selectedDependencyEdgeStore`) under `partials/GraphCanvas/stores/`.
- Move canvas-internal types under `partials/GraphCanvas/types/`; keep public handle API types on the shell (`DependencyGraphHandle`, `GraphLayoutState`, `SerializedLayoutCache`).
- Keep shell-owned partials at `DependencyGraph/partials/`: `EdgesTypePickerDialog`, `GraphEmptySelection`, `GraphCanvas`.
- Move `ReactFlowProvider` into `GraphCanvas` so the shell only gates selection and mounts canvas vs empty state.
- **No** behavior changes; **no** public API changes for App / orchestration.

## Capabilities

### New Capabilities

<!-- none — pure internal refactor; skip_specs: true -->

### Modified Capabilities

<!-- none — graph-layout-cache and other specs keep the same requirements; only folder ownership changes -->

## Impact

- Code: large mechanical move under `src/App/partials/DependencyGraph/` (`git mv` + relative import fixes); shell `DependencyGraph.tsx` / public `index.ts` / `types/` stay thin.
- Public behavior: unchanged (`DependencyGraphHandle`, layout restore, markers, empty-selection gate).
- Tests: co-located tests move with their modules; import paths update; suites should stay green without assertion churn.
- Specs: none (`skip_specs: true`).
- Related: builds on completed `refactor-dependency-graph-orchestration` (shell already exists).
