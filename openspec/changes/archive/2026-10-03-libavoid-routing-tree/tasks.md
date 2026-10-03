# Tasks

## 1. Enriched routing tree types and helper

- [x] 1.1 Add an enriched layouted visible-tree node type (`ancestors`, `descendants`, relative geometry, nested `children`) under GraphCanvas types/helpers and implement `enrichLayoutedVisibleTree` (or equivalent) that walks layouted roots; verify unit tests for root empty ancestors, nested folder ancestors nearest→root, and descendants containing all visible folders+files below without self
- [x] 1.2 Optionally attach the enriched tree on `BuildGraphResult` (or a dedicated field filled when layout completes) without requiring React Flow conversion to use it; verify build/layout tests still pass and RF graph building does not depend on ancestors/descendants

## 2. Retarget routing core off React Flow

- [x] 2.1 Rewrite `lowestCommonAncestor` / `overlapGroupParentId` / `collectRoutingLevels` to use path→enriched-node `Map` + thin edges and ancestors-based LCA; verify existing level-partition scenarios rewritten against enriched fixtures still pass (leaf vs cross-folder, virtual root)
- [x] 2.2 Rewrite `nodesToLibavoidGraph` (flat + hierarchical opaque collapse) to take the enriched Map/tree and thin edges, using `descendants` for opaque membership and folder detection without RF `type`; verify opaque-sibling and port-ordering unit tests pass on enriched fixtures
- [x] 2.3 Change `routeEdgesWithLibavoid` entry to accept `{ tree, edges }` (flatten tree→Map once per job; build session-local children index as needed); remove `@xyflow/react` imports from the routing core path; verify multi-pass / overlap orchestrator unit tests pass with the new input shape

## 3. Worker DTO and hook wiring

- [x] 3.1 Replace `RouteEdgesWorkerRequest` with structured-clone-friendly `{ tree, edges }` (thin edges keep optional ports); update `toRouteEdgesWorkerRequest` / worker `onmessage` / drop RF `fromRouteEdgesWorkerRequest`; verify serialization helper tests and a mocked worker session receive tree+thin edges and return routes/progress
- [x] 3.2 Update `useLibavoidEdgeRouting` (and GraphCanvas call sites) to schedule from enriched tree + thin edges instead of RF nodes/`parentByNode`; preserve generation cancel, smooth-step while dragging/in-flight, and progress UI; verify hook tests for schedule/cancel/stale generation and no RF node array in the posted payload
- [x] 3.3 After drag stop, patch relative geometry on the enriched tree (or overlay) from layout cache / measured positions before posting; verify a unit or hook test that post-drag geometry is reflected without rebuilding the domain cruise visible tree

## 4. Verification

- [x] 4.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; fix regressions from this change
- [x] 4.2 Run `npm run depcruise` if import boundaries changed; verify no rule violations
