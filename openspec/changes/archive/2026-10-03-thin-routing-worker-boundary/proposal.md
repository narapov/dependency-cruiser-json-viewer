# Proposal

## Why

`buildGraph` still projects layouted nodes into a separate `routingTree` via `enrichLayoutedVisibleTree` — a misnamed **narrowing** that copies the tree before routing. The same tree is then patched again for live RF geometry and `structuredClone`d again at the worker boundary. Thin DTO projection belongs only at the worker handoff so the main thread keeps the layouted tree as source of truth and avoids triple-copying.

## What Changes

- **BREAKING (internal):** Remove `BuildGraphResult.routingTree` entirely; GraphCanvas / libavoid hook consume layouted `tree` / roots instead.
- Delete `enrichLayoutedVisibleTree` as a build-time step; fold narrowing (+ optional live geometry overlay) into `toRouteEdgesWorkerRequest` (or equivalent single walk at `postMessage`).
- Rename `EnrichedRoutingNode` → `ThinRoutingNode` (worker/wire DTO alongside `ThinRoutingEdge`); rename related helpers (`flattenEnrichedRoutingTree`, `absolutePositionFromEnriched`, `patchEnrichedRoutingTreeGeometry`) accordingly or absorb patch into the worker-request walk.
- Keep libavoid routing behavior and ports; this is an API/cleanup change with stable UX.

## Capabilities

### New Capabilities

- `graph-thin-routing-worker`: Layouted visible/layouted tree stays on the main thread; thin routing tree DTO (`ThinRoutingNode`) is produced only when posting to the libavoid worker, with geometry overlay applied in that same boundary walk.

### Modified Capabilities

- (none — main `openspec/specs/` has no archived libavoid routing capability yet; `libavoid-routing-tree` / `pure-graph-layout` deltas remain separate in-flight changes.)

## Impact

- `buildGraph` / `BuildGraphResult`
- `enrichLayoutedVisibleTree` folder (remove or reduce to flatten/helpers used by worker path)
- `useLibavoidEdgeRouting`, `GraphCanvas` wiring
- `toRouteEdgesWorkerRequest` / `runRouteEdgesInWorker`
- `EnrichedRoutingNode` → `ThinRoutingNode` type file and all libavoid consumers/tests
