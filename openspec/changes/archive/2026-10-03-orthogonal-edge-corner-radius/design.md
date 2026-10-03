# Design

## Context

See proposal.md for motivation. Today:

- `avoidRouteToPath` turns absolute libavoid polylines into SVG with sharp `L` corners; only crossing hops use arcs (`CROSSING_JUMP_RADIUS = 1.5`).
- `getDependencyEdgePath` uses `getSmoothStepPath` for `simpleOrthogonal` and `libavoidOrthogonal` fallback without passing `borderRadius` (React Flow default is 5).
- During drag / in-flight, `useLibavoidEdgeRouting` clears routes so `DependencyEdge` falls through to that SmoothStep path.

## Goals / Non-Goals

**Goals:**

- One shared radius constant (`3`) for every orthogonal presentation path.
- Fillet libavoid bends with the same visual language as SmoothStep (quadratic bends, clamped on short segments).
- Keep hop insertion logic correct alongside fillets.

**Non-Goals:**

- Changing libavoid routing, ports, worker boundary, or layout cache.
- Re-routing during drag or keeping stale libavoid paths while dragging.
- Changing hop radius, hop suppression rules, or bezier/straight styles.
- Matching React Flow's default radius of 5 (product choice is 3).

## Decisions

### 1. Shared constant `ORTHOGONAL_CORNER_RADIUS = 3`

- **Choice:** Keep `ORTHOGONAL_CORNER_RADIUS` and `CROSSING_JUMP_RADIUS` in `GraphCanvas/constants/edgePathConstants.ts`. `avoidRouteToPath` and `getDependencyEdgePath` both import from there.
- **Alternatives:** Colocate next to `avoidRouteToPath` (couples presentation constants to one helper); duplicate literal `3` in both files (drift risk).

### 2. Fillet in `avoidRouteToPath`, not in the router

- **Choice:** Keep bend points orthogonal; when building SVG, for each interior vertex apply SmoothStep-style `getBend`: `bendSize = min(|prev→v|/2, |v→next|/2, radius)`, emit `L approach Q corner leave`. Collinear triples stay plain `L`.
- **Alternatives:** Circular `A` 90° arcs (different silhouette from SmoothStep); post-process after hop insertion as a separate pass (harder to keep hop midpoints and fillet endpoints consistent).

### 3. Hops and fillets on the same segment

- **Choice:** Walk the polyline by geometric segments as today. For a horizontal segment with jumps: fillet only at the segment's **endpoints** (corners with previous/next segments); keep hop arcs mid-segment with existing skip-if-no-room rules. Vertical segments get endpoint fillets only (no hops).
- **Practical shape:** corner approach → straight mid → hop arcs → straight → corner leave. If a hop cannot fit after fillets consume ends, existing skip behavior applies.

### 4. Explicit SmoothStep `borderRadius`

- **Choice:** `getDependencyEdgePath` passes `borderRadius: ORTHOGONAL_CORNER_RADIUS` whenever it calls `getSmoothStepPath` (`simpleOrthogonal` and `libavoidOrthogonal`).
- **Alternatives:** Rely on RF default 5 (conflicts with product choice of 3).

## Risks / Trade-offs

- **[Risk] Short segments + hops skip more often** → Acceptable; hops already skip when room is insufficient; radius 3 is modest.
- **[Risk] Slight path length / label-anchor drift** → Labels still come from SmoothStep tuple for fallback; libavoid paths do not use that label tuple today — no change.
- **[Risk] Test golden strings for polylines break** → Update `avoidRouteToPath` / `mergeAvoidRoutes` / `getDependencyEdgePath` expectations to include `Q` and `borderRadius: 3`.

## Migration Plan

None. Presentation-only; no persisted settings or cache format changes.
