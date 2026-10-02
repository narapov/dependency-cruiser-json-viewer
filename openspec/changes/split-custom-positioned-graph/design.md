# Design

## Context

See proposal.md — Why. Today `useGraphLayoutNodes` merges cache, converts `BuildGraphResult` to RF `Node[]` via `toReactFlowNodes`, owns `useNodesState`, runs `reflowDragPushDown` / `updateCacheFromReactFlowNodes` on RF nodes, and GraphCanvas wraps drag with `isDragging` for `useLibavoidEdgeRouting` (which overlays RF geometry onto the layouted tree). Helpers are split awkwardly: `graphLayoutCache` (geometry, RF-typed) vs `groupLayoutCache` (real cache + reflow). `reflowDragPushDown` already imports `buildGraph/getDirectChildren` and `layoutConstants`; `layoutGroup` imports `settleOverlapsTopDown` from the cache folder — a cycle risk if settle moves under a custom-positioned package that also owns reflow.

Constraints: keep `useBuildGraph` in GraphCanvas; Canvas owns `isDragging`; no new UX; stay within GraphCanvas helpers/hooks; depcruise folder rules must remain acyclic.

## Goals / Non-Goals

**Goals:**

- Two hooks with clear ownership: custom-positioned model (+ libavoid) vs React Flow projection/drag bridge
- Live geometry as layouted-tree-shaped data (no `@xyflow` inside reflow/cache-update)
- Helper folders: `layoutCache` (persistence) + `customPositionedGraph` (live apply); settle under `buildGraph`
- `applyPositions(positions, { commitToCache })` as the single mutation API for drag

**Non-Goals:**

- Changing ELK/build algorithms or workspace JSON schema
- Moving highlights, context menus, or fit-view into the RF adapter beyond what is needed for a thin bridge (keep those hooks separate unless wiring forces a tiny passthrough)
- Reworking libavoid worker protocol (reuse thin-routing boundary; only change where geometry is sourced)

## Decisions

### D1: Hook split and Canvas wiring

```
GraphCanvas
  useBuildGraph(...)
  isDragging state
  useCustomPositionedGraph({ graphResult, layoutCacheRef, isDragging, ... })
    -> positioned graph, edges (+ routes), routingProgress, applyPositions, snapshots, autoLayout*
  useReactFlowGraph({ positioned graph, edges, applyPositions, setIsDragging, ... })
    -> RF nodes/edges handlers for <ReactFlow>
```

**Why:** Matches the exploration contract; keeps rebuild and drag-flag ownership at Canvas.  
**Alternative:** One mega-hook — rejected (status quo). Nested hook where RF owns dragging internally — rejected (`isDragging` must stay on Canvas for clarity and for feeding custom-positioned/libavoid).

### D2: `applyPositions(positions, { commitToCache })`

- `commitToCache: false` — reflow settle + ancestor resize into live custom-positioned state only (drag move)
- `commitToCache: true` — same, then write affected group entries into `layoutCache` (drag stop)

**Why:** One API; matches current behavior (live every move, cache on stop).  
**Alternative:** `previewPositions` / `commitPositions` pair — deferred; flag is enough.

### D3: Helper module layout (dependency direction)

```
customPositionedGraph  -->  buildGraph (settle, getDirectChildren, layoutConstants)
customPositionedGraph  -->  layoutCache (types, buildGroupLayoutEntry / write helpers)
buildGraph             -/-> customPositionedGraph   (FORBIDDEN)
layoutCache            -/-> customPositionedGraph   (FORBIDDEN)
```

- Move `settleOverlapsTopDown` (+ `nodesOverlap` if only used there) under `buildGraph`
- Rename `groupLayoutCache` → `layoutCache` (drop reflow)
- Create `customPositionedGraph` for reflow / applyPositions / updateCacheFromPositions / size helpers needed by reflow (RF-free)
- Delete unused `getAbsoluteNodePosition`, `isDescendantOf`, and RF `createTestNode` if unused after that

**Why:** Avoids folder cycle; names match roles.  
**Alternative:** Shared `layoutOverlap` top-level folder — extra package for little gain; settle already belongs to build's sibling-resolve story.

### D4: Live model shape

Keep `VisibleTreeLayoutedNode` / `BuildGraphResult`-compatible maps (or a thin mutable/immutable copy thereof) as the custom-positioned state. Libavoid receives that tree (plus drag overlay already expressed in the live copy) instead of RF `Node[]`.

**Why:** Aligns with pure-graph-layout and thin-routing-worker.  
**Alternative:** New DTO parallel to layouted nodes — unnecessary duplication.

### D5: `useReactFlowGraph` scope

Thin: `toReactFlowNodes` / `toReactFlowEdges`, `useNodesState` sync from custom-positioned output, `onNodesChange`, drag handlers → `setIsDragging` + `applyPositions`. Do not absorb `useHighlightedEdges` / menus / fit into this hook in the first cut.

**Why:** Avoid recreating a god-hook under a new name.

## Risks / Trade-offs

- [Double state sync] Live model + RF `useNodesState` can drift → Mitigation: RF nodes always replaced/projected from custom-positioned output after apply and after build merge; drag path must not keep a second long-lived geometry store in RF beyond what RF needs for interaction.
- [Perf on drag] Full settle + tree copy every move → Mitigation: keep current algorithm cost; measure only if regressions appear; commit flag already avoids cache serialize work mid-drag.
- [Large rename churn] Many imports → Mitigation: move/rename in tasks with tests green between steps; update barrels carefully for depcruise.
- [buildGraph owning settle] Name stretch for a pure settle helper → Mitigation: document as shared sibling-position toolkit used by cold layout and custom reflow.

## Migration Plan

Internal refactor only. No workspace format change. Feature-flag not required. Rollback = revert the change branch.

## Open Questions

None that block specs or tasks — hook file names (`useReactFlowGraph` vs synonym) can be chosen during apply as long as roles match D1/D5.
