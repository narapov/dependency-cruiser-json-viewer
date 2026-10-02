# Design

## Context

See proposal.md for motivation. Layouted nodes already carry `ancestors` / `descendants` from `getVisibleTree` and geometry from pure layout (`pure-graph-layout`). Today `buildGraph` still calls `enrichLayoutedVisibleTree` → `routingTree`, then `useLibavoidEdgeRouting` patches geometry and `toRouteEdgesWorkerRequest` `structuredClone`s again.

Related in-flight deltas (`libavoid-routing-tree`, `pure-graph-layout`) still describe “enriched” trees; this change supersedes the build-time enrichment projection for runtime wiring.

## Goals / Non-Goals

**Goals:**

- Drop `BuildGraphResult.routingTree` completely.
- One boundary walk: layouted tree (+ optional live RF geometry) → `ThinRoutingNode` tree for `postMessage`.
- Rename `EnrichedRoutingNode` → `ThinRoutingNode` (and related helper names) in the same change.
- Keep worker algorithms (flatten, LCA, opaque folders, ports on thin edges) behaviorally the same.

**Non-Goals:**

- Changing ELK layout, port assignment (`getEdgesPorts`), or libavoid WASM options.
- Replacing `structuredClone` / worker transfer mechanics beyond folding projection into the request builder.
- Archiving or rewriting sibling change artifacts in this PR (call out supersession in tasks/docs only if needed).

## Decisions

### 1. Source of truth on main thread = layouted tree

- **Choice:** `useLibavoidEdgeRouting` takes layouted roots / `graphResult.tree` values (or equivalent array of `VisibleTreeLayoutedNode`), not a separate routing tree.
- **Why:** Indexes and geometry already live there; avoids duplicate field on build result.
- **Alternatives:** Keep `routingTree` as alias of `rootNodes` — rejected (user: remove completely).

### 2. Single boundary projection in `toRouteEdgesWorkerRequest`

- **Choice:** Extend the worker-request builder to accept layouted tree + optional `geometryByPath` overlay; walk once to emit `ThinRoutingNode[]` (copy geometry, share or copy ancestors/descendants as needed for clone-safety) and thin edges. Absorb `patchEnrichedRoutingTreeGeometry` into that walk; delete standalone enrich helper used by build.
- **Why:** Matches locked explore outcome; edges already thin at the same boundary (`toThinRoutingEdges`).
- **Alternatives:** Keep enrich + patch as two pre-worker steps — rejected (triple copy).

### 3. Rename wire type now

- **Choice:** `EnrichedRoutingNode` → `ThinRoutingNode`; file rename; `flattenEnrichedRoutingTree` → `flattenThinRoutingTree`; `absolutePositionFromEnriched` → `absolutePositionFromThin` (or `…FromThinRoutingNode`). Worker request/response types use `ThinRoutingNode`.
- **Why:** Locked; pairs with `ThinRoutingEdge`; stops lying about “enrichment”.
- **Alternatives:** `RoutingTreeNode` — fine but weaker pairing with thin edges.

### 4. What to delete vs keep

- **Choice:** Remove `enrichLayoutedVisibleTree` from `buildGraph`; delete or relocate flatten helper next to libavoid/worker modules if still needed inside the worker path. `patchEnrichedRoutingTreeGeometry` removed as a public pre-pass once folded into request building.
- **Why:** Folder name and API only existed for the false enrich step.

## Risks / Trade-offs

- **[Risk] Hook deps / identity churn** if layouted tree reference changes every build while RF nodes also change → Mitigation: same generation/cancel pattern as today; accept rebuild on either input.
- **[Risk] Ancestor array sharing across `postMessage`** → Mitigation: boundary walk must produce structured-clone-safe plain data (copy arrays if shared mutable refs could race; prefer copying indexes at the boundary for isolation).
- **[Risk] Rename churn across many libavoid files** → Mitigation: mechanical rename in one change; tests fail loudly on leftover `Enriched*` symbols.

## Migration Plan

- Internal GraphCanvas/build/libavoid only; no workspace schema.
- Single PR-sized change: drop field + boundary project + rename together.
- Rollback: revert helpers; no user-facing migration.

## Open Questions

- Exact export home for `flattenThinRoutingTree` (stay under former enrich folder vs move under `routeEdgesWithLibavoid`) — implementer’s choice if call sites stay coherent.
