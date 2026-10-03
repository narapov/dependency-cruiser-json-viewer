# Design

## Context

See proposal.md — Why. Today `useCustomPositionedGraph` calls `toReactFlowEdges(VisibleTreeEdge[], edgesPorts)` early, passes `Edge[]` into `useLibavoidEdgeRouting`, which strips `ThinRoutingEdge[]` from `edge.data` and merges routes back onto RF edges via `mergeAvoidRoutes`. Nodes already stay App-shaped (`VisibleTreeLayoutedNode` map) until `useReactFlowGraph` / `toReactFlowNodes`. Constraints: stay inside GraphCanvas; no UX change; keep SVG path fields on edge data for this change; depcruise folder rules unchanged.

## Goals / Non-Goals

**Goals:**

- App `RoutableEdge` (name bikeshed-ok) as edge SoT from build ports attach through routing/merge
- Thin worker edges projected by field pick from `RoutableEdge`, not from RF
- Single late `toReactFlowEdges(RoutableEdge[]) → Edge[]` for canvas / DOT / highlight presentation consumers
- Keep hook ownership: custom-positioned owns App edges + libavoid; RF adapter remains presentation/drag bridge

**Non-Goals:**

- Moving `avoidPath` / hop SVG computation into `DependencyEdge` (separate change)
- Unifying `getEdgesPorts` vs libavoid port fallback assigners
- Changing worker protocol beyond edge input source (still `ThinRoutingEdge[]` + thin tree)
- Domain-layer types for routable edges
- Reworking `serializeGraphToDot` to accept App DTOs (keep RF edges after projection)

## Decisions

### D1: `RoutableEdge` shape

App type in `GraphCanvas/types`, no `@xyflow` import:

- Identity: `id` (= domain edge `key`), `source`, `target`
- Flags / aggregated / ports currently copied into `DependencyEdgeData` before avoid fields
- Optional after merge: `avoidRoute`, `crossingJumps`, `avoidPath`, `avoidPathWithJumps`

**Why:** Mirrors what RF `data` already carries; late projection is a thin map.  
**Alternative:** Keep `VisibleTreeEdge` + parallel `Map<id, ports|routes>` — more join sites; rejected for this cut.

### D2: Build / project helpers

- `toRoutableEdges(visibleEdges, edgesPorts) → RoutableEdge[]` (new; lives with `toReactFlowGraph` helpers)
- `toReactFlowEdges(routableEdges) → Edge[]` rewritten to accept App DTO only (late use)
- `toThinRoutingEdges(routableEdges) → ThinRoutingEdge[]` as a pure helper (hook or helper folder), field pick only

**Why:** Clear names at each boundary.  
**Alternative:** One mega `projectEdges(stage)` — less explicit.

### D3: Hook wiring

```
useCustomPositionedGraph
  routableEdges = toRoutableEdges(graphResult.edges, graphResult.edgesPorts)
  useLibavoidEdgeRouting({ edges: routableEdges, positionedNodes, ... })
    -> routedRoutableEdges, routingProgress
  return { routableEdges: routedRoutableEdges, ... }  // no Edge[] here

GraphCanvas / useReactFlowGraph path
  rfEdges = toReactFlowEdges(routableEdges)
  useHighlightedEdges({ baseEdges: rfEdges, ... })  // keep RF for click/export
  <ReactFlow edges={highlightedEdges} />
  imperative DOT: same rfEdges (or post-highlight list)
```

**Why:** Highlights and DOT already speak RF `Edge`; forcing them onto `RoutableEdge` expands scope without layering gain. Late projection once before those consumers is enough.  
**Alternative:** Teach highlights/DOT App DTO — deferred.

### D4: `mergeAvoidRoutes`

Change signature to `RoutableEdge[]` in/out; attach avoid fields on the App object. SVG precompute stays here (non-goal to move).

**Why:** Merge belongs with App edge SoT.  
**Alternative:** Merge returns `Map<id, AvoidRoute>` only and leave attachment to projection — nicer long-term, more churn now; rejected for this cut.

## Risks / Trade-offs

- [Rename churn in tests/mocks] → Grep `baseEdges`/`routedEdges`/`toReactFlowEdges`; update GraphCanvas mocks deliberately.
- [Highlight hook still RF-typed] → Acceptable; document that RF edges are post-projection only.
- [Accidental second early `toReactFlowEdges` call] → Keep the function next to routable builders; custom-positioned must not import RF `Edge` for its edge return type.

## Migration Plan

Pure refactor on `feat/libavoid-edges` (or current branch). No workspace migration. Rollback = revert commit. Verify libavoid on/off, drag fallback, DOT export.

## Open Questions

None — SVG-on-data and DOT-on-RF are explicit deferred choices recorded above.
