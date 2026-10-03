# Design

## Context

See proposal.md for motivation and `specs/graph-pure-layout/spec.md` for behavior.

Today `buildGraph` calls `createLayoutedTree` (deep clone + leaf sizes + zero geometry) then `layoutChildren`, which mutates `position` / `width` / `height` in place. Ports use `buildParentByNode` + `assignEdgePorts` with a flattened `{ id, position, width, height }[]` adapter. `VisibleTreeNode` already carries `ancestors` (snapshot reference) and `descendants` (visible walk) from the `libavoid-routing-tree` work; layouted nodes extend that type.

## Goals / Non-Goals

**Goals:**

- One pure layout entry: visible tree in → new layouted nodes out.
- `getEdgesPorts(layoutedTree, edges)` → `edgesPorts` with no parent-map / DTO reshaping.
- Delete mutate-prep `createLayoutedTree`; stop in-place writes in layout.
- Thin or remove `enrichLayoutedVisibleTree` once layouted nodes are enough for routing.

**Non-Goals:**

- Changing ELK options, cache membership rules, or settle/overlap algorithm semantics (`graph-layout-cache` stays).
- Geometry-as-separate-`Map` as the primary layout output.
- Libavoid WASM / edges-type UX / hop rendering.
- Re-deriving `ancestors` (remain snapshot references on visible/layouted nodes).

## Decisions

### 1. Pure layout API

- **Choice:**

  ```
  layoutVisibleTree(visibleTree, cruiseSnapshot, selectedFilePaths, profiler?, cache?)
    -> VisibleTreeLayoutedNode[]
  ```

  Recurse bottom-up: layout children → new sized folder children → ELK/cache positions → return **new** nodes with geometry. Leaf sizes via `getLeafNodeSize`. Share `ancestors` / `descendants` / circular flags from the input visible node by reference.

- **Why:** Locked in explore; removes clone-for-mutation.
- **Alternatives:** Mutate clone (status quo). Geometry `Map` beside immutable tree — rejected for this change.

### 2. Remove `createLayoutedTree`

- **Choice:** Leaf sizing and object creation happen inside the pure layout recursion, not a prior pass.
- **Why:** The prior pass only existed to allocate mutable slots.
- **Alternatives:** Keep createLayoutedTree as immutable mapper then pure “place” step — extra stage with little gain.

### 3. `getEdgesPorts(layoutedTree, edges)`

- **Choice:** Rename/replace `assignEdgePorts`. Signature takes layouted roots (or indexed layouted map built once inside) and domain/layout edges; returns `Map<edgeKey, EdgePorts>`. Absolute Y via ancestors + relative positions (reuse pattern from `absolutePositionFromEnriched`). Store on `BuildGraphResult` as `edgesPorts`.
- **Why:** Explore naming; drops `parentByNode` and intermediate DTOs.
- **Alternatives:** Keep `assignEdgePorts` name — rejected (`assign` implies side effects).

### 4. Routing enrich

- **Choice:** Prefer using layouted tree directly for worker DTO mapping (strip non-routing fields if needed). Remove recomputation of ancestors/descendants in `enrichLayoutedVisibleTree`.
- **Why:** Indexes already on visible/layouted nodes.
- **Alternatives:** Keep enrich as structuredClone-only — acceptable if needed for worker isolation, not for index math.

### 5. `buildGraph` orchestration

- **Choice:**

  ```
  rootNodes = await layoutVisibleTree(...)
  edgesPorts = getEdgesPorts(rootNodes, edges)
  routingTree = toRoutingTree(rootNodes) // thin or identity
  ```

  Index `nodes` / `tree` from `rootNodes` as today.

- **Why:** Matches locked call shape.

## Risks / Trade-offs

- **[Risk] More allocations per rebuild** → Accept; layout already off hot path / in worker. Assert no shared mutation bugs via tests that freeze input trees.
- **[Risk] Missed mutate call sites** (cache apply, settle) → Grep for `.position =` / `.width =` under layout helpers; rewrite to return new objects.
- **[Risk] Rename churn (`edgePortsById` → `edgesPorts`)** → Update all GraphCanvas consumers in the same change; tests fail loudly if missed.

## Migration Plan

- Internal GraphCanvas/build helpers only; no workspace schema.
- Single PR-sized change: layout purity + ports rename together so `buildGraph` never straddles both APIs.
- Rollback: revert helpers; no user-facing migration.

## Open Questions

- Exact export name of the layout entry (`layoutVisibleTree` vs keep `layoutChildren` but pure) — implementer’s choice if signature matches the spec.
- Whether `getEdgesPorts` lives under `helpers/getEdgesPorts/` (rename folder) or beside buildGraph — prefer rename folder to match public name.
