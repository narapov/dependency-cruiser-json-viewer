# Tasks

## 1. Types and projection helpers

- [x] 1.1 Add `RoutableEdge` (and barrel export) under `GraphCanvas/types` with id/source/target, dependency flags, ports, and optional avoid/SVG fields; verify TypeScript compiles for the new type via `npm run build` or targeted tsc on the module
- [x] 1.2 Implement `toRoutableEdges(visibleEdges, edgesPorts)` and rewrite `toReactFlowEdges` to accept `RoutableEdge[]` only; verify `toReactFlowGraph` unit tests cover ports, flags, and late RF projection
- [x] 1.3 Add a pure `toThinRoutingEdges(routableEdges)` helper (field pick to `ThinRoutingEdge`); verify a small unit test that ports survive without any `@xyflow` Edge input

## 2. Routing and merge on App edges

- [x] 2.1 Change `mergeAvoidRoutes` to take/return `RoutableEdge[]` and update its tests; verify avoidRoute/path/jumps attach on App edges
- [x] 2.2 Update `useLibavoidEdgeRouting` to accept/return `RoutableEdge[]`, use `toThinRoutingEdges` (no RF cast), and merge on App edges; verify hook tests still cover apply/clear/drag generations

## 3. Hook and canvas wiring

- [x] 3.1 Update `useCustomPositionedGraph` to build `RoutableEdge[]` via `toRoutableEdges`, pass them to libavoid, and expose routed App edges (no early `Edge[]`); verify hook tests/mocks compile and assert App edge shape
- [x] 3.2 In `GraphCanvas` (and any thin RF bridge), call late `toReactFlowEdges` once before `useHighlightedEdges`, `<ReactFlow edges>`, and imperative DOT/`useDependencyGraphImperativeRef`; verify GraphCanvas tests/mocks wire the new return fields
- [x] 3.3 Confirm `useHighlightedEdges` / `serializeGraphToDot` still receive post-projection RF `Edge[]` only; verify existing highlight and DOT tests pass without teaching them `RoutableEdge`

## 4. Integration checks

- [x] 4.1 Run `npm run test`, `npm run lint`, and `npm run format:check` for the touched GraphCanvas surface and fix regressions
- [x] 4.2 Manually smoke-check libavoid on/off, drag → smooth-step → re-route, and DOT export still works
