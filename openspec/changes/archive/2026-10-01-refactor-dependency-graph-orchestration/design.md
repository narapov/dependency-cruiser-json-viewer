# Design

## Context

See proposal.md for motivation. Phase 1 extracted layout sync, imperative handle, dialog open-state, and marker cleanup into hooks/helpers. Phase 2 renames/extracts the former `DependencyGraphInner` and moves the empty-selection gate to the shell so React Flow is not mounted without a selection.

## Goals / Non-Goals

**Goals:**

- Move each agreed concern into its own hook (or helpers) with the same runtime behavior (phase 1 — done).
- Match existing dialog-owner and `hooks/<name>/<name>.ts` (+ barrel) conventions under DependencyGraph.
- Keep `DependencyGraphHandle` and App orchestration call sites compatible (optional chaining; no-op when canvas unmounted).
- Extract a named `GraphCanvas` partial; shell owns provider, dialog, empty gate, and container CSS.

**Non-Goals:**

- Introducing Graph React context.
- Changing layout-cache semantics or workspace persistence formats.
- Stubbing a minimal shell-level handle so edges-type picker works with empty selection (explicitly **no-op**).
- Refactoring FileTree/QuickPick handles for consistency (out of scope).

## Decisions

### 1. Layout converters as pure helpers

- **Choice:** Extract `legacyPositionsToLayouts` and `layoutsToLegacyPositions` under `helpers/layoutStateConverters/`, re-exported from `helpers/index.ts`.
- **Why:** Used by both apply-sync and `get/setLayoutState`; unit-testable without React.
- **Status:** Done.

### 2. `useApplyWorkspaceLayout`

- **Choice:** Hook owns layout-apply key / last-applied ref / effect; parent still owns `layoutCacheRef`, `layoutRevision`, and `requestRebuild`.
- **Status:** Done.

### 3. `useDependencyGraphImperativeRef`

- **Choice:** Hook wrapping `useImperativeHandle` for `DependencyGraphHandle` (`UseDependencyGraphImperativeRefConfig`); preserve prior dependency style.
- **Status:** Done.

### 4. `useEdgesTypePickerDialog`

- **Choice:** Mirror `useThemePickerDialog`; owned by outer `DependencyGraph`; opener passed into canvas handle.
- **Status:** Done.
- **Follow-up:** When canvas is unmounted (empty selection), handle is absent → `openEdgesTypePicker` via orchestration is a no-op by design.

### 5. Markers cleanup hook

- **Choice:** `useClearGraphMarkersOnEmptySelection({ hasSelection })` clears when empty and on unmount.
- **Follow-up:** After empty gate moves to the shell, canvas unmount already clears via cleanup. Prefer simplifying to unmount-only (or keep `hasSelection` as belt-and-suspenders if cheap). Adjust the hook test accordingly.

### 6. Specs

- **Choice:** `skip_specs: true` — no requirement deltas.

### 7. `GraphCanvas` partial (phase 2)

- **Choice:** Move former `DependencyGraphInner` to `partials/GraphCanvas/` as `GraphCanvas`. Prefer `ref` over `imperativeRef` (React 19). Hooks stay under `DependencyGraph/hooks/`; canvas imports them from there. Public barrel still exports only `DependencyGraph` + types.
- **Why:** `Inner` is an implementation leak; `Graph*` naming matches `GraphLegend` / `GraphLoader` / `GraphMarkers`. Shell vs canvas split exists because `useReactFlow` consumers must sit under `ReactFlowProvider`.
- **Alternative:** Keep co-located `Inner` in the same file — rejected.

### 8. Empty selection gate on the shell (phase 2)

- **Choice:** `DependencyGraph` reads selection presence; if empty, render container + `GraphEmptySelection` (+ dialog node if desired) and **do not** mount `ReactFlowProvider` / `GraphCanvas`.
- **Why:** Today hooks still run before the Inner early return; lifting the gate avoids wasted build/layout work and makes empty state a shell concern.
- **Handle:** Accept no-op while unmounted (orchestration already uses `?.`). No stub handle for picker-when-empty.
- **Alternative:** Keep canvas mounted and only swap JSX — rejected (does not save work).

## Risks / Trade-offs

- **[Risk] Handle hook prop surface grows large** → Mitigation: single `config` object (repo convention); no context.
- **[Risk] Accidental dependency/effect order change during moves** → Mitigation: move code mechanically; keep existing tests green.
- **[Trade-off] Edges-type picker command no-ops with empty selection** → Accepted; reopen only after a selection mounts the canvas.
- **[Trade-off] First `useXxxImperativeRef` in the codebase** → Acceptable for this fat imperative API; do not retrofit thinner handles elsewhere.

## Migration Plan

Internal-only refactor. Ship as one PR (or stacked commits); no data migration. Rollback = revert.

## Open Questions

None blocking — markers hook may drop the `!hasSelection` branch at apply time if unmount cleanup alone is enough.
