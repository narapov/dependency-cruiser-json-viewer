# Tasks

## 1. Drop build-time routingTree

- [x] 1.1 Remove `routingTree` / `enrichLayoutedVisibleTree` from `buildGraph` and `BuildGraphResult`; update empty-result stubs and build/hook tests so TypeScript and unit tests no longer expect the field
- [x] 1.2 Wire `GraphCanvas` / `useLibavoidEdgeRouting` to pass layouted tree roots (from `graphResult.tree` or equivalent) instead of `routingTree`; verify hook tests compile and still schedule routing when libavoid mode is active

## 2. Thin projection at worker boundary

- [x] 2.1 Extend `toRouteEdgesWorkerRequest` (or the single handoff used by `runRouteEdgesInWorker`) to accept layouted tree + optional live geometry map, project to thin tree + thin edges in one walk, and absorb `patchEnrichedRoutingTreeGeometry`; verify unit tests that the worker request tree has only thin fields and reflects overlaid geometry
- [x] 2.2 Delete obsolete enrich/patch helpers (and empty folders) that only existed for build-time projection; verify no remaining imports of `enrichLayoutedVisibleTree` / `patchEnrichedRoutingTreeGeometry` outside relocated flatten utilities

## 3. Rename EnrichedRoutingNode → ThinRoutingNode

- [x] 3.1 Rename type file and symbols (`EnrichedRoutingNode` → `ThinRoutingNode`, `flattenEnrichedRoutingTree` → `flattenThinRoutingTree`, `absolutePositionFromEnriched` → thin-named equivalent) across libavoid helpers, worker types, and tests; verify `rg Enriched` under GraphCanvas is empty and tests pass for nodesToLibavoid / collectRoutingLevels / worker request

## 4. Verification

- [x] 4.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; fix regressions from this change
- [x] 4.2 Run `npm run depcruise` if import boundaries or barrel exports changed; verify no rule violations
