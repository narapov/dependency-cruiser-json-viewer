# Proposal

## Why

Libavoid edge routing currently consumes React Flow `Node[]` / `Edge[]` and rebuilds lookup structures (parent maps, children lists, absolute positions) on every flat/hierarchical batch. That couples a pure geometry algorithm to the UI model, fights `docs/architecture.md` (prefer `Map` indexes; avoid linear scans), and makes LCA and opaque-folder collapse more expensive than necessary. An enriched layouted visible tree already has the hierarchy; it should carry ancestors, descendants, and geometry so the worker can route without RF types.

## What Changes

- After graph layout, enrich each layouted visible-tree node with `ancestors` (nearest → root), `descendants` (all visible folders and files below), and keep relative `position` / `width` / `height`.
- Post to the libavoid worker that enriched tree plus thin edges (id, source, target, optional ports) — not React Flow nodes.
- Inside the worker: flatten the tree to a `Map<path, node>`, compute edge routing levels via LCA on `ancestors`, derive children indexes from the tree, and keep the existing multi-pass libavoid algorithm (flat / hierarchical / overlap) on that model.
- Stop importing `@xyflow/react` node types into the routing core / worker request path (thin DTOs only).
- After DnD, refresh geometry on the enriched tree (or equivalent overlay) before re-posting; do not rebuild the cruise visible tree solely for routing.

## Capabilities

### New Capabilities

- `graph-libavoid-routing-tree`: Enriched layouted visible tree as the libavoid worker input; Map flatten + ancestors-based LCA for edge levels; opaque collapse via descendants.

### Modified Capabilities

- (none on main specs; existing `graph-libavoid-edges` / `graph-edge-ports` live only in completed changes until archive — this change assumes those behaviors remain and replaces their RF-shaped worker intake.)

## Impact

- `buildGraph` / layouted node types (`VisibleTreeLayoutedNode` or a routing-specific enrich step)
- `routeEdgesWithLibavoid`, `collectRoutingLevels`, `nodesToLibavoidGraph`, worker request/response types, `runRouteEdgesInWorker`, `useLibavoidEdgeRouting`
- Tests for LCA, flatten→Map, and worker payload shape
- No change to libavoid WASM packaging or edges-type UX (`libavoidOrthogonal` still smooth-step during drag / in-flight)
