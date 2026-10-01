# Proposal

## Why

Simple orthogonal edges (`simpleOrthogonal`) ignore obstacles and often overlap. A slower libavoid-based orthogonal mode can route around nodes with better readability, but it is expensive enough that it must not block the UI thread or run during drag.

## What Changes

- Add a fourth graph edges type: `libavoidOrthogonal` (UI label conveys it is slow).
- Port and adapt the optimized multi-pass libavoid routing from `feat/libavoid-orthogonal-edges` onto current `main` (ports, LCA levels, hierarchical graph with opaque collapse for non-endpoint folders, batching, collinear-overlap re-route, crossing hops).
- Run routing in a dedicated Web Worker (pattern aligned with `buildGraph.worker`).
- While routing, the worker MUST report progress (`completed` / `total` edge counts) for distinct phases (primary route, then overlap re-route); the main thread SHALL show a determinate MUI `LinearProgress` for the active phase and hide it when idle, cancelled, or mid-drag.
- While routing is in flight, and for the whole duration of node drag: render edges with React Flow smooth-step (same visual fallback as `simpleOrthogonal` path building), not stale libavoid paths.
- After drag ends (and after layout settles / edges-type switch to libavoid): schedule a fresh worker route and apply results when the generation is still current.
- Draw schematic hops (radius 1.5) at H×V crossings on libavoid paths; suppress hops on emphasized/colored/selected edges.
- Persist `libavoidOrthogonal` in workspace `edgesType`; default remains `bezier`.
- Changing edges type still must not rebuild the graph or reset the live layout cache (existing `graph-layout-cache` contract).

## Capabilities

### New Capabilities

- `graph-libavoid-edges`: Libavoid orthogonal edge routing as a selectable edges type — worker-backed routing with phased progress UI, DnD/in-flight smooth-step fallback, hops, and presentation merge onto laid-out nodes without affecting layout cache semantics.

### Modified Capabilities

- `graph-layout-cache`: Clarify that selecting or applying `libavoidOrthogonal` is a presentation-only concern (async route apply / clear) and MUST NOT rebuild the graph or reset the live layout cache; drag still updates cache without rebuild while libavoid is suspended.

## Impact

- **Domain / workspace:** extend `GraphEdgesType` and Zod workspace schema; i18n in all five locales; edges-type picker, layout toggle, app commands.
- **DependencyGraph / GraphCanvas:** new `routeEdgesWithLibavoid/*` helpers (ported from branch), worker + runner with progress events, linear progress bar in the graph UI, layout-hook scheduling, `DependencyEdge` path selection, merge of avoid routes/jumps into edge data.
- **Dependencies:** `@mr_mint/elkjs-libavoid` (+ Vite wasm copy, no postinstall); mirror existing worker patterns under `helpers/buildGraph/`.
- **Tests:** unit tests for ports/levels/flat-hier collapse/overlap/hops/merge; hook tests for DnD suspend and generation cancel; no merge of the experimental branch wholesale.
