# Proposal

## Why

Custom-positioned nodes already treat React Flow as a late view adapter, but edges convert to RF `Edge` before libavoid routing and then strip thin worker DTOs back out of `edge.data`. That breaks the symmetry promised by `graph-custom-positioned` (“consume … routed edges, project into React Flow nodes and edges”) and couples scheduling/merge code to `@xyflow/react`. Closing the gap now keeps the recent layout/routing split coherent before more consumers lock onto early RF edges.

## What Changes

- Introduce an App-only routable edge DTO (built from domain `VisibleTreeEdge` + frozen ports) as the edge source of truth through routing and route merge.
- Project thin routing edges for the libavoid worker from that DTO (no cast from RF `Edge`).
- Project React Flow `Edge` once after routes are applied (or when libavoid is inactive / cleared).
- Keep SVG path fields on the App DTO / `DependencyEdgeData` for this change (moving path computation into the edge component is out of scope).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `graph-custom-positioned`: Require App routable edges through routing/merge; React Flow edges only after late projection from routed (or unrouted) App edges.
- `graph-thin-routing-worker`: Require thin routing edges to be projected from the App routable edge model, not from React Flow edges.

## Impact

- GraphCanvas hooks: `useCustomPositionedGraph`, `useLibavoidEdgeRouting`, `useHighlightedEdges` wiring, `useDependencyGraphImperativeRef` (DOT still uses post-projection RF edges).
- Helpers: `toReactFlowGraph` (`toRoutableEdges` + late `toReactFlowEdges`), `mergeAvoidRoutes`.
- Types under `GraphCanvas/types` (`RoutableEdge` or equivalent).
- Tests for the above; no workspace schema, domain API, or user-facing edge-style behavior changes.
