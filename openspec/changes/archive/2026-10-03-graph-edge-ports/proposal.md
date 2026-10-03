# Proposal

## Why

React Flow currently attaches every dependency edge to a single Left/Right handle (node mid-side), while libavoid assigns its own EAST/WEST slots at route time. Those attachment points diverge, so fallback paths and libavoid routes disagree. Computing a frozen per-edge port map once during graph build gives one source of truth for path endpoints and for libavoid.

## What Changes

- After layout in `buildGraph`, assign EAST/WEST port slots per node (top-to-bottom by opposite endpoint absolute center Y) and publish a `Map`-like structure keyed by edge id with relative port `y` (and side/index) for source and target.
- Carry that map through to React Flow edges (e.g. merge into `edge.data`) without rendering per-port DOM Handles.
- `DependencyEdge` computes attachment points from the stored ports + absolute node geometry (not from RF handle measurement).
- Libavoid routing reuses the same port assignments instead of re-running `assignLibavoidPorts`.
- Port map is frozen at build (variant A): node drag does not recompute slots; absolute endpoints move with the node via `absPosition + relative y`.
- Default edges types (bezier / straight / simpleOrthogonal) and libavoid fallback all use the same port-derived endpoints when ports are present.

## Capabilities

### New Capabilities

- `graph-edge-ports`: Build-time per-edge EAST/WEST port map, edge path attachment without DOM Handles, and reuse by libavoid routing.

### Modified Capabilities

- (none on main specs yet; `graph-libavoid-edges` lives only in the in-flight/complete change until archive — this change assumes the libavoid implementation already on the branch and adjusts its port intake.)

## Impact

- `buildGraph` / layout result types / `toReactFlowEdges`
- `DependencyEdge` / `getDependencyEdgePath` (or parallel port-aware endpoint helper)
- `routeEdgesWithLibavoid` / `nodesToLibavoidGraph` (consume map; drop or bypass re-assign)
- Possibly FileNode/FolderNode/FolderGroupNode: keep a single invisible/default handle for RF compatibility or none if endpoints are fully custom
- Unit tests for port assignment ordering and path endpoint calculation
