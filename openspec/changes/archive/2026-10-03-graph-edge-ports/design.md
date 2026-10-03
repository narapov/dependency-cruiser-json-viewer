# Design

## Context

See proposal.md for motivation. Today each file/folder node renders one Left target and one Right source Handle; all edges share mid-side attachment. Libavoid’s `assignLibavoidPorts` recomputes EAST/WEST slots at route time from absolute centers. `libavoid-orthogonal-edges` already ships that assigner — this change moves assignment to `buildGraph` and makes RF paths + libavoid consume one frozen map (variant A from explore).

## Goals / Non-Goals

**Goals:**

- Single build-time `edgeId → { sourcePort, targetPort }` map with relative `y`.
- Edge rendering reads map + absolute node position (no per-port Handle DOM).
- Libavoid skips re-assign when map present.
- Drag does not recompute slots.

**Non-Goals:**

- Live port re-sort during drag.
- Visible port UI / debugging overlays (optional later).
- Changing ELK layout or layout-cache semantics.
- Persisting the port map in workspace files (recomputed on each build is enough).

## Decisions

### 1. Map as source of truth (not node-only lists)

- **Choice:** Primary structure is `Record`/`Map` keyed by edge id:

```ts
type EdgePort = { side: 'east' | 'west'; index: number; y: number };
type EdgePorts = { source: EdgePort; target: EdgePort };
// edgePortsById: Map<string, EdgePorts> | Record<string, EdgePorts>
```

Merge onto RF `edge.data` when creating edges (`sourcePort` / `targetPort` or nested `ports`) so `DependencyEdge` does not need a parallel store. Keep the map on `BuildGraphResult` too if worker/main needs it before RF conversion.

- **Why:** Edge is the natural consumer for path + libavoid linkage; explore settled on map.
- **Alternatives:** Node-only slot arrays — rejected as primary; can be derived if needed.

### 2. Freeze at build (variant A)

- **Choice:** Assign once after layout sizes/positions are known in `buildGraph` (worker). DnD updates node positions only; relative `y` stays.
- **Why:** Most stable; matches product decision in explore.
- **Alternatives:** Recompute on drag stop — deferred.

### 3. Assignment algorithm

- **Choice:** Same as current `assignLibavoidPorts`: group by source/target; sort by opposite absolute center Y; `y = (i+1)/(n+1)*height`. EAST on source, WEST on target.
- **Why:** Proven; libavoid already expects it.
- **Implementation note:** Prefer extracting shared pure helper used by buildGraph; libavoid path calls it only if map missing (legacy/tests).

### 4. Path endpoints without Handles

- **Choice:** In `DependencyEdge` (or helper), resolve source/target nodes from RF store, compute absolute position (reuse `getAbsoluteNodePosition`), then:

  - source: `(abs.x + width, abs.y + sourcePort.y)`
  - target: `(abs.x, abs.y + targetPort.y)`

  Prefer these over RF `sourceX/Y` when ports exist. Keep a single Left/Right Handle on nodes if RF still requires handles for interaction/hit-testing — but do not add one Handle per port; optional later to remove default handles if unused.

- **Why:** Explore rejected invisible-per-port Handles as primary.
- **Alternatives:** Invisible multi-Handle — fallback if store absolute coords prove awkward.

### 5. Libavoid intake

- **Choice:** Convert map → `LibavoidPortAssignment` (or pass explicit port coords into `buildFlat`/`buildHierarchical`) instead of `assignLibavoidPorts` when map covers all routed edges.
- **Why:** Spec requires reuse.

## Risks / Trade-offs

- **[Risk] After large drag, opposite-Y order looks wrong** → Accepted for A; document; future B = recompute on drag stop.
- **[Risk] Parent groups + absolute coords bugs** → Reuse existing absolute helpers; add unit tests with nested parents.
- **[Risk] RF still supplies default handle midpoints if ports missing** → Always attach ports in build for visible edges.

## Migration Plan

- Additive data on edges/build result; no workspace migration.
- Rollback: stop writing map / stop reading in edge + libavoid.

## Open Questions

- Whether to leave a single decorative/default Handle on nodes for RF internals — implementer’s choice as long as path endpoints come from the map when present.
