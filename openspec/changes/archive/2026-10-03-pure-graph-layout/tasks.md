# Tasks

## 1. Pure layout returns new nodes

- [x] 1.1 Rewrite layout recursion so it takes `visibleTree` (+ cruise snapshot, selection, profiler, cache) and returns **new** `VisibleTreeLayoutedNode` trees with leaf sizes and positions; share `ancestors`/`descendants` by reference; verify unit tests that the input visible-tree objects are unchanged after layout and that layouted nodes have finite geometry
- [x] 1.2 Remove `createLayoutedTree` and all in-place geometry writes in layout helpers (including cache apply / settle paths used by build); verify no remaining `.position =` / `.width =` / `.height =` assignments on layouted nodes under `buildGraph`/`layoutGroup` and that existing layout/cache scenarios still pass
- [x] 1.3 Wire `buildGraph` to the pure layout entry only; verify `buildGraph` tests still produce correct node indexes, edges, and group layouts

## 2. getEdgesPorts from layouted tree

- [x] 2.1 Replace `assignEdgePorts` with `getEdgesPorts(layoutedTree, edges)` that uses ancestors for absolute Y (no `parentByNode`, no flattened node DTO list); verify port-ordering unit tests pass on layouted-tree fixtures
- [x] 2.2 Rename `BuildGraphResult.edgePortsById` → `edgesPorts` and update GraphCanvas / `toReactFlowEdges` / tests; verify consumers read `edgesPorts` and TypeScript build succeeds

## 3. Thin routing tree mapping

- [x] 3.1 Stop recomputing ancestors/descendants in `enrichLayoutedVisibleTree` (map geometry + shared indexes only, or use layouted tree directly for `routingTree`); verify routing/libavoid hook tests still receive a tree with ports on thin edges and correct geometry

## 4. Verification

- [x] 4.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; fix regressions from this change
- [x] 4.2 Run `npm run depcruise` if import boundaries changed; verify no rule violations
