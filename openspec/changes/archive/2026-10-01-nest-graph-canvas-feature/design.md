# Design

## Context

See proposal.md for motivation. Today `DependencyGraph` is already a thin shell (`ReactFlowProvider` + empty gate + edges-type dialog + `GraphCanvas`). Canvas-only modules still live as feature-root siblings (`hooks/`, `helpers/`, `stores/`, most of `partials/`, most of `types/`). Folder-import rules allow nesting under `partials/GraphCanvas/` (same pattern as `NodeContextMenu` and `FileTree`).

Public consumers (`App.tsx`, `useAppOrchestration`) only import `DependencyGraph` and `DependencyGraphHandle` / `GraphLayoutState` from the feature barrel.

## Goals / Non-Goals

**Goals:**

- Nest every canvas-only module under `partials/GraphCanvas/` so ownership matches usage.
- Keep the shell public surface stable (component + handle types).
- Move `ReactFlowProvider` into `GraphCanvas` so React Flow requirements co-locate with the canvas.
- Mechanical move: `git mv` + relative import updates; no logic edits.

**Non-Goals:**

- Behavior, layout-cache semantics, or workspace persistence format changes.
- Unifying the existing dual `SerializedLayoutCache` definitions (feature `types/` vs `groupLayoutCache/types`) — leave as-is.
- Archiving `refactor-dependency-graph-orchestration` (separate workflow).
- Introducing Graph React context or changing dialog ownership (`EdgesTypePickerDialog` stays shell-owned).

## Decisions

### 1. Target tree (C+)

```
DependencyGraph/
  DependencyGraph.tsx
  DependencyGraph.module.css
  index.ts                          # DependencyGraph + public types
  types/
    DependencyGraphHandle.ts       # GraphLayoutState
    SerializedLayoutCache.ts        # part of public GraphLayoutState
    index.ts
  partials/
    EdgesTypePickerDialog/
    GraphEmptySelection/
    GraphCanvas/
      GraphCanvas.tsx
      index.ts
      hooks/                        # all current DependencyGraph/hooks
      helpers/                      # all current DependencyGraph/helpers
      stores/                       # graphMarkers + selectedDependencyEdge
      types/                        # BuildGraph*, node/edge data, FolderChildren, …
      partials/                     # canvas UI only
```

**Why:** Matches nested-feature conventions; shell folder no longer hosts canvas-private code.

**Alternative:** Move only UI partials (A) or partials+hooks/stores without helpers (C) — rejected; helpers are canvas-only and would leave the same ownership lie.

### 2. Public vs internal types

- **Stay on shell `types/`:** `DependencyGraphHandle`, `GraphLayoutState`, `SerializedLayoutCache` (orchestration persists `nodeLayouts` via handle).
- **Move into `GraphCanvas/types/`:** `BuildGraph.ts` (incl. `PresenceRecord`), `FileNodeData`, `FolderNodeData`, `FolderChildren`, `DependencyEdgeData`.
- Shell `types/index.ts` and feature `index.ts` continue to export only the public handle surface (same as today for App).

**Alternative:** Re-export all canvas types from the feature barrel — rejected; leaks internals.

### 3. `ReactFlowProvider` ownership

- **Choice:** `GraphCanvas` wraps its own tree in `ReactFlowProvider` (or owns the provider at the top of its render).
- Shell becomes: `{hasSelection ? <GraphCanvas …/> : <GraphEmptySelection/>}` plus dialog + container CSS.
- **Why:** Provider is a canvas prerequisite; shell should not know React Flow.
- **Alternative:** Keep provider on shell — works, but keeps a canvas concern outside the nested feature.

### 4. Dialog opener wiring

- Keep `useEdgesTypePickerDialog` on the shell; pass `onOpenEdgesTypePicker` into `GraphCanvas` (unchanged contract).
- Canvas imperative handle still receives the opener; empty selection still no-ops the handle.

### 5. Import path strategy

- Prefer `git mv` preserving internal relative structure inside moved trees where possible.
- Update cross-boundary imports:
  - Canvas modules → shell public types via `../../types` (from `GraphCanvas/` depth) or equivalent.
  - Canvas partials → `GraphCanvas/helpers|hooks|stores|types` via branch-local paths (`../../helpers`, etc.).
  - Shell → only `./partials/GraphCanvas`, `./partials/GraphEmptySelection`, `./partials/EdgesTypePickerDialog`, `./types`.
- Remove emptied feature-root `hooks/`, `helpers/`, `stores/` (and their barrels) once moves complete.
- Respect folder-import / depcruise rules; run `npm run depcruise` after moves.

### 6. Specs

- `skip_specs: true` — structure-only refactor.

## Risks / Trade-offs

- **[Risk] Large mechanical diff / missed import** → Mitigation: move by area (partials → hooks → stores → helpers → types), run lint/test/depcruise/build after each major batch or once at end if tooling is fast; fix path depth carefully (`workspaceStore` climbs one more level from nested paths).
- **[Risk] Accidental deep export of canvas internals from feature barrel** → Mitigation: keep `DependencyGraph/index.ts` exporting only component + public types; do not re-export `GraphCanvas`.
- **[Trade-off] Deeper paths for canvas modules** → Accepted; ownership clarity over flatter folders.
- **[Trade-off] Shell still owns edges-type dialog** → Intentional; dialog is usable from shell wiring and not React Flow–bound.

## Migration Plan

Internal-only. Ship as one PR (or stacked commits by batch). Rollback = revert. No data migration.

## Open Questions

None blocking — archive of the prior orchestration change is optional and out of this change's tasks.
