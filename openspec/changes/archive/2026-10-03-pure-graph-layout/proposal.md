# Proposal

## Why

Graph build still prepares a mutable layouted clone (`createLayoutedTree`) and then writes `position` / `width` / `height` in place inside `layoutChildren`. That clone exists only to enable mutation, mixes domain identity with ephemeral geometry, and forces awkward adapters (`buildParentByNode`, `assignEdgePorts` with flattened DTOs). Layout should be a pure transform to new nodes; edge ports should be derived directly from that tree.

## What Changes

- Replace `createLayoutedTree` + mutating `layoutChildren` with a pure layout entry: inputs `visibleTree`, `cruiseSnapshot`, `selectedFilePaths`, optional profiler/cache → **new** layouted node(s) with sizes and positions (share `ancestors` / `descendants` references from the visible tree).
- Replace `assignEdgePorts` + `parentByNode` + intermediate node DTOs with `getEdgesPorts(layoutedTree, edges)` returning `edgesPorts`.
- Rename `BuildGraphResult.edgePortsById` → `edgesPorts`.
- Drop or thin `enrichLayoutedVisibleTree` so routing no longer recomputes indexes already on `VisibleTreeNode` / layouted nodes.
- Keep ELK/cache algorithms and libavoid worker intake behavior; this is an internal build/layout API cleanup with stable external UX.

## Capabilities

### New Capabilities

- `graph-pure-layout`: Pure layout from visible tree to new layouted nodes; `getEdgesPorts(layoutedTree, edges)` without parent maps or DTO reshaping.

### Modified Capabilities

- (none — `graph-layout-cache` behavior stays; implementation of how positions are produced becomes pure/immutable without changing cache contracts.)

## Impact

- `buildGraph`, `createLayoutedTree` (remove), `layoutGroup` / `layoutChildren`
- `assignEdgePorts` → `getEdgesPorts` (rename/move folder)
- `BuildGraphResult`, `toReactFlowEdges` / GraphCanvas consumers of `edgePortsById`
- `enrichLayoutedVisibleTree` / `routingTree` wiring
- Unit tests for layout immutability and port computation
