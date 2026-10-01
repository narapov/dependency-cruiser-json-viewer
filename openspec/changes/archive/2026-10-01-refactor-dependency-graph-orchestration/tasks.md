# Tasks

## 1. Layout converters and apply hook

- [x] 1.1 Extract `legacyPositionsToLayouts` and `layoutsToLegacyPositions` into `helpers/layoutStateConverters/` (or equivalent), re-export from `helpers/index.ts`, and verify unit tests cover legacy↔serialized round-trips and null/empty inputs
- [x] 1.2 Add `useApplyWorkspaceLayout` under `hooks/`, wire it from `DependencyGraphInner` in place of the inline layout-apply effect, export from `hooks/index.ts`, and verify existing DependencyGraph / layout restore behavior still passes (`npm run test` for affected suites)

## 2. Markers and edges-type dialog

- [x] 2.1 Add markers cleanup hook (`useClearGraphMarkersOnEmptySelection` or shorter agreed name), replace the inline effect in Inner, export from `hooks/index.ts`, and verify empty selection / unmount still clears markers (existing markers store / DependencyGraph tests, or a small hook test)
- [x] 2.2 Add `useEdgesTypePickerDialog` beside `EdgesTypePickerDialog` (ThemePicker pattern), use it in outer `DependencyGraph`, re-export from the dialog barrel, and verify opener opens the dialog and close works (component or hook test, or existing graph handle `openEdgesTypePicker` path)

## 3. Imperative handle hook

- [x] 3.1 Add `useDependencyGraphImperativeRef`, move the current `useImperativeHandle` body into it (including converter usage for get/set layout), pass `openEdgesTypePicker` from the dialog hook, remove the inline handle from Inner, and verify `DependencyGraph` handle tests plus `useAppOrchestration` openEdgesTypePicker / layout state paths still pass

## 4. Integration check (phase 1)

- [x] 4.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; confirm `DependencyGraph.tsx` no longer defines the extracted helpers/effects/handle/dialog state inline

## 5. GraphCanvas extract and empty gate

- [x] 5.1 Extract `DependencyGraphInner` to `partials/GraphCanvas/` as `GraphCanvas` (prefer `ref` over `imperativeRef`), wire it from `DependencyGraph` inside `ReactFlowProvider`, and verify DependencyGraph / handle tests still pass
- [x] 5.2 Move empty-selection rendering into the `DependencyGraph` shell so `ReactFlowProvider` / `GraphCanvas` do not mount when nothing is selected; accept handle no-op (including edges-type picker via handle); verify the empty-selection test still passes and selected-graph tests still mount the canvas
- [x] 5.3 Adjust `useClearGraphMarkersOnEmptySelection` if unmount-only cleanup is enough after the shell gate, update its tests, and verify markers still clear when selection becomes empty (canvas unmount) and on unmount

## 6. Integration check (phase 2)

- [x] 6.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; confirm `DependencyGraph.tsx` is shell-only (no `Inner`, no canvas JSX) and `GraphCanvas` lives under `partials/GraphCanvas/`
