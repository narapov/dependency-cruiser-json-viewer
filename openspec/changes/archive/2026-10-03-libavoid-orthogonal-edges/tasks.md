# Tasks

## 1. Dependency and wasm packaging

- [x] 1.1 Add `@mr_mint/elkjs-libavoid` to package.json and install; verify the package resolves and `libavoid.wasm` exists under its `dist/`
- [x] 1.2 Add Vite copy of `libavoid.wasm` into app output (dev + build) without postinstall or committing wasm; verify `npm run build` emits the wasm next to the bundle and a smoke import/init path can locate it via `BASE_URL`

## 2. Domain edges type and UI surface

- [x] 2.1 Extend `GraphEdgesType` and Zod workspace schema with `libavoidOrthogonal` (default remains `bezier`); verify schema tests accept round-trip of the new value and reject nothing that previously worked
- [x] 2.2 Add i18n keys for the new edges type (label conveying slow) in `en`, `fr`, `de`, `ru`, `es`; verify keys resolve via `t('…')` in a renderHook smoke or typecheck against locale files
- [x] 2.3 Wire `libavoidOrthogonal` into `EdgesTypePickerDialog`, `GraphLayoutToggle`, and any set-edges-type app command; verify picker/toggle can select it and workspace store updates `edgesType` without rebuilding the graph

## 3. Port libavoid routing helpers (from branch)

- [x] 3.1 Port `assignLibavoidPorts` / `nodesToLibavoidGraph` (hierarchical + opaque collapse) under GraphCanvas helpers with unit tests from the branch adapted to new paths; verify collapse-of-non-endpoint-folder and port-ordering tests pass
- [x] 3.2 Port `collectRoutingLevels`, `routeLibavoidGraph` batching, `collectOverlappingEdgeIds`, and `routeEdgesWithLibavoid` multi-pass orchestrator; verify level partition, batching, and overlap re-route unit tests pass
- [x] 3.3 Port `avoidRouteToPath`, `collectCrossingJumps`, `mergeAvoidRoutes`, and `isEdgeEmphasized`; verify hop radius 1.5, hop suppression for emphasized strokes/selection, and merge path tests pass

## 4. Web Worker integration

- [x] 4.1 Add `routeEdges.worker` + `runRouteEdgesInWorker` (mirror `runBuildGraphInWorker`: postMessage DTO, ok/error/progress responses, `terminate`); verify a unit/integration test can mock the worker or run a tiny graph and receive route map entries plus progress events
- [x] 4.2 Move libavoid init + `routeEdgesWithLibavoid` execution into the worker; emit `{ phase: 'primary' | 'overlap', completed, total }` as batches finish (overlap is a separate phase with its own totals); verify the UI thread entrypoint only schedules/transfers/handles progress and does not call `routeEdges` directly

## 5. Layout hook scheduling, progress UI, and edge render

- [x] 5.1 In the graph layout/nodes hook: when `edgesType === 'libavoidOrthogonal'`, schedule worker routing after layout settle / edges-type switch / drag stop with a generation counter; clear routes and progress and skip scheduling during drag; discard stale generations and stale progress; verify hook tests cover cancel-on-newer-generation, progress updates, and no route apply mid-drag
- [x] 5.2 Show MUI `LinearProgress` (determinate) for the active routing phase using worker `completed/total`; hide when idle, cancelled, or dragging; add i18n if a visible label is shown; verify the bar advances in primary then resets/switches for overlap phase
- [x] 5.3 Merge applied routes into edge data for render; in `DependencyEdge`, prefer libavoid path (with hops unless emphasized), else smooth-step when mode is libavoid and no route, else existing bezier/straight/simpleOrthogonal behavior; verify component/path tests for fallback and hop suppression
- [x] 5.4 Confirm changing to/from `libavoidOrthogonal` does not call graph rebuild or reset live layout cache; verify with existing or new orchestration/layout tests aligned to `graph-layout-cache` delta scenarios

## 6. Verification

- [x] 6.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; fix regressions introduced by this change
- [x] 6.2 Run `npm run depcruise` if new cross-layer imports were added; verify no rule violations
