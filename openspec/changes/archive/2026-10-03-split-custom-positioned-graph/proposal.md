# Proposal

## Why

GraphCanvas layout orchestration mixes React Flow node state, group layout cache, drag reflow, and libavoid routing in one tangled path (`useGraphLayoutNodes` + misnamed `graphLayoutCache` / `groupLayoutCache`). Live geometry is stored as RF `Node[]`, so helpers depend on `@xyflow/react` and folder boundaries invite cycles with `buildGraph`. After pure layout and thin routing, the remaining seam is to make a custom-positioned graph (cache + live positions + routing) independent of the React Flow adapter.

## What Changes

- Split orchestration into two hooks:
  - `useCustomPositionedGraph` — owns live positioned graph copy, layout cache writes, libavoid; exposes `applyPositions(positions, { commitToCache })`
  - `useReactFlowGraph` — projects that result into React Flow (nodes/edges/handlers); drives drag by setting Canvas-owned `isDragging` and calling `applyPositions`
- Keep `useBuildGraph` in `GraphCanvas`
- Rename/restructure helpers:
  - `layoutCache` — serialize / merge / invalidate (persistence only)
  - `customPositionedGraph` — reflow / `applyPositions` / update cache from positions (no `@xyflow`)
  - Move shared sibling settle (`settleOverlapsTopDown` + overlap helpers) under `buildGraph` so custom reflow depends on build, not the reverse
- Remove unused remnants (`getAbsoluteNodePosition`, `isDescendantOf`, and RF-only test helpers that exist only for them)
- External drag / workspace / auto-layout UX stays the same; source of truth for live positions becomes the custom-positioned model, not RF nodes

## Capabilities

### New Capabilities

- `graph-custom-positioned`: Custom-positioned graph hook and helpers separate from React Flow; `applyPositions` with optional cache commit; RF adapter consumes the positioned result

### Modified Capabilities

- `graph-layout-cache`: Clarify that during drag the live geometry updates continuously while durable cache entries are committed when positions are applied with `commitToCache: true` (drag stop), without a rebuild

## Impact

- `GraphCanvas.tsx` wiring (`isDragging`, hook composition)
- `useGraphLayoutNodes` → replaced by `useCustomPositionedGraph` + `useReactFlowGraph`
- `useLibavoidEdgeRouting` consumed inside (or tightly by) `useCustomPositionedGraph`; geometry overlay from live positioned model instead of RF `Node[]`
- Helpers: `groupLayoutCache`, `graphLayoutCache` → `layoutCache` + `customPositionedGraph`; settle move into `buildGraph`
- Unit tests for reflow, cache update, hooks; depcruise folder rules must stay acyclic (`customPositionedGraph` → `buildGraph` / `layoutCache`, never reverse)
