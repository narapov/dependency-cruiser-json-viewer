# Tasks

## 1. Port map types and assignment helper

- [x] 1.1 Define `EdgePort` / `EdgePorts` types and place them on `BuildGraphResult` (and/or edge data shape); verify TypeScript compiles with the new fields optional where needed
- [x] 1.2 Extract or add `assignEdgePorts` (same ordering as current libavoid assign: opposite absolute center Y, `y = (i+1)/(n+1)*height`); verify unit tests cover multi-out EAST order and multi-in WEST order

## 2. Build and RF wiring

- [x] 2.1 Call assignment at end of `buildGraph` after layout and attach the map to the result; verify buildGraph tests assert ports exist for sample edges
- [x] 2.2 Merge port entries into React Flow edges in `toReactFlowEdges` (or equivalent); verify edges expose source/target port `y` + side in `data`

## 3. Edge path endpoints from map

- [x] 3.1 Add helper to resolve absolute endpoint from node abs position + port; verify nested-parent absolute tests pass
- [x] 3.2 Update `DependencyEdge` / path building to prefer port-derived endpoints when present (all edges types); verify path tests use port `y` instead of mid-handle defaults
- [x] 3.3 Keep at most a single Left/Right Handle per node (no per-port Handles); verify node components do not render one Handle per edge

## 4. Libavoid reuse

- [x] 4.1 Teach `nodesToLibavoidGraph` / routing to build ports from the edge port map when present; verify libavoid graph tests use map `y` values and do not re-order against the map
- [x] 4.2 Remove or gate redundant `assignLibavoidPorts` when the map covers routed edges; verify routing still succeeds in unit tests with mocked map

## 5. Verification

- [x] 5.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; fix regressions
- [x] 5.2 Run `npm run depcruise` if import layout changed; verify no violations
