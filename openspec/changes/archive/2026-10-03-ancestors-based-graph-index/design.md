# Design

## Context

See proposal.md for motivation. `VisibleTreeLayoutedNode` already extends `VisibleTreeNode` with `ancestors: string[]` (nearest parent → root, shared from the visible tree / cruise snapshot). Libavoid routing already treats `ancestors[0]` as the parent. Live graph path is `useCustomPositionedGraph` → `customPositionedGraph/*` + `toReactFlowGraph`; shallow copies during reflow keep map entries fresh but leave `node.children` object links stale.

## Goals / Non-Goals

**Goals:**

- Single source for upward navigation: each node's `ancestors`.
- One flat-map pass to build the id-based sibling index from `ancestors[0]`.
- Remove redundant climb/`getGroupDepth` sorting where the ancestor list is already ordered.
- Keep drag settle → content-origin compact → resize behavior identical.

**Non-Goals:**

- Repairing or relying on `node.children` after copies for sibling access.
- Changing `graph-layout-cache` requirements or cache wire format.
- Reworking legacy `groupLayoutCache/reflowDragPushDown` unless it remains on a live call path (prefer leave dead/legacy alone).
- Changing visible-tree construction or making `ancestors` mean "visible-only" (still FS ancestry; valid for current no-skip-level visible tree).

## Decisions

### 1. Upward: use `ancestors` directly

- **Choice:** `parentId = node.ancestors[0] ?? null`; depth = `node.ancestors.length`; ancestor groups deepest-first = iterate `node.ancestors` in order (nearest first).
- **Why:** List is already nearest → root; no climb, no `getGroupDepth` sort.
- **Alternative:** Keep climbing `parentByNode` — rejected (duplicates precomputed data).

### 2. Downward: id index from `ancestors[0]`, not tree DFS

- **Choice:** Build `parentByNode` (and, where sibling fan-out is hot, `childrenByParent`) with one pass over the flat `nodes` map: parent = `ancestors[0] ?? null`. Prefer upgrading `getDirectChildren` to read `childrenByParent` so drag reflow stops scanning all node ids per group.
- **Why:** Matches libavoid's `buildChildrenByParentFromThin`; survives shallow position copies; avoids stale `children` arrays.
- **Alternative:** Repair `node.children` on every copy — rejected (easy to miss a copy site).
- **API churn:** Keep existing function signatures that take `parentByNode` where cheap; introduce/share a `childrenByParent` helper for sibling lists. Collapse duplicate `buildParentByNode` implementations (`toReactFlowGraph` vs `customPositionedGraph`) into one helper that indexes from `ancestors`.

### 3. `sortNodesByDepth` drops cruise snapshot lookup

- **Choice:** Sort RF nodes using layouted-node `ancestors.length` (pass lengths via the nodes map or sort before dropping layout metadata). Remove `CruiseSnapshot` dependency from depth sort if nothing else needs it there.
- **Why:** Same depths as snapshot for visible paths; avoids N map lookups during comparator.

### 4. `getGroupDepth` fate

- **Choice:** Delete or reduce to `nodesByPath.get(id)?.ancestors.length` (plus null → 0) wherever depth is still needed; stop using parent-climb depth for ordering ancestor work.
- **Why:** Depth is `ancestors.length` for non-null group ids.

### 5. Specs

- **Choice:** `skip_specs: true` — observable layout/drag behavior unchanged; this is an index/derivation refactor.

## Risks / Trade-offs

- **[Risk] `ancestors[0]` ≠ RF parent if visible tree ever skips FS levels** → Mitigation: current `getVisibleTree` does not skip; document the invariant next to the shared builder; any future skip-level visible tree must redefine parent derivation.
- **[Risk] Behavioral drift in drag reflow while changing indexes** → Mitigation: keep existing reflow/normalize/applyPositions tests; add a focused unit test that parent index equals `ancestors[0]` for a nested fixture.
- **[Trade-off] Still carry `parentByNode` in some APIs** → Acceptable for minimal churn; `childrenByParent` is the perf win for siblings.

## Migration Plan

Internal-only. Ship as one PR; no workspace/data migration. Rollback = revert.

## Open Questions

None — approach and task shape are fixed from explore.
