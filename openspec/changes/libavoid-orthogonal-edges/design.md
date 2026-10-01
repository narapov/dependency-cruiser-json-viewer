# Design

## Context

See proposal.md for motivation. On `main`, `GraphEdgesType` is `bezier | straight | simpleOrthogonal`, persisted via workspace settings; `DependencyEdge` builds paths synchronously. Graph builds already run in `buildGraph.worker`. Experimental branch `feat/libavoid-orthogonal-edges` implements multi-pass libavoid routing on the main thread with live rAF re-route during drag — that UX is rejected here in favor of worker + smooth-step during drag/in-flight. Port algorithm code from the branch onto current `GraphCanvas` layout; do not merge the branch wholesale (naming and tree layout differ: `edgesType` vs `edgeStyle`, folder moves under `GraphCanvas/`).

## Goals / Non-Goals

**Goals:**

- Reuse the branch’s routing algorithm (ports, LCA levels, hierarchical+opaque collapse, batching, collinear-overlap re-route, hops).
- Isolate wasm/libavoid CPU work in a Web Worker with generation cancellation.
- Keep UI interactive: smooth-step during in-flight route and entire DnD; resume libavoid after drag stop / layout settle; show determinate linear progress per routing phase.
- Preserve `graph-layout-cache` invariants (no rebuild on edges-type change or route apply).

**Non-Goals:**

- Live libavoid `RoutingSession` / per-frame re-route during drag.
- Changing ELK node-placement quality as a primary goal of this change (optional light cleanup only if needed for compile/integration).
- Making `libavoidOrthogonal` the default edges type.
- Merging unrelated commits from `feat/libavoid` / `feat/elk-edges`.

## Decisions

### 1. Port algorithm from branch; integrate on main’s edgesType

- **Choice:** Copy/adapt `routeEdgesWithLibavoid/*`, `avoidRouteToPath`, `mergeAvoidRoutes`, `isEdgeEmphasized`, types under `GraphCanvas/helpers/` (and related), wire through existing `edgesType` / workspace schema / pickers.
- **Why:** Algorithm is already validated on the branch; main’s product surface is `edgesType`.
- **Alternatives:** Merge branch → painful rename conflicts. Rewrite from scratch → waste.

### 2. Hierarchical obstacles with opaque collapse (as on branch)

- **Choice:** `buildHierarchicalLibavoidGraph` expands only subtrees that contain endpoints of the current edge batch; other folder groups are opaque rectangles (example: batch `a/index.ts → c/index.ts` → `b` is one box).
- **Why:** Confirmed in explore; avoids searching irrelevant interiors while keeping nested coords along endpoint ancestry.
- **Alternatives:** Fully flat absolute children — deferred; higher risk of diverging from known-good branch behavior.

### 3. Web Worker for routing (mirror buildGraph)

- **Choice:** `routeEdges.worker.ts` + `runRouteEdgesInWorker` posting serializable `{ nodes, edges, parentByNode }` (or a thin DTO of geometry/ids), returning `Map`-serializable route records. Main thread holds generation counter; ignore stale replies. Init wasm inside the worker (`ensureLibavoidInit` with `BASE_URL` / copied wasm). Worker posts progress messages of the form `{ type: 'progress', phase, completed, total }` in addition to the final result.
- **Why:** Spec requires off-UI-thread; existing worker pattern is familiar; progress keeps long jobs observable.
- **Alternatives:** `yieldToMain` batching on UI thread (branch) — rejected. SharedWorker — unnecessary.

### 4. Phased progress + LinearProgress

- **Choice:** Two determinate phases with independent totals:
  1. **primary** — flat leaf + hierarchical cross-folder routing; `total` = routable edge count for the job; `completed` increments as batches finish.
  2. **overlap** — separate phase after primary; `total` = number of edges in overlap re-route groups (0 → skip phase / leave bar hidden or jump straight to done); `completed` increments as overlap batches finish.
     Main thread stores `{ phase, completed, total } | null`; render MUI `LinearProgress` determinate (`value = total === 0 ? 0 : (completed / total) * 100`) while non-null and not dragging. Clear progress on apply, cancel, drag start.
- **Why:** User asked for completed/total from the worker and a linear bar; overlap as its own phase avoids a fake “stuck at 100%” primary bar.
- **Alternatives:** Single combined total across both passes — harder to explain. Overlap keeps bar at 100% — rejected.

### 5. DnD and in-flight: clear routes → smooth-step; route after stop

- **Choice:** On drag start (or first drag move): bump generation, cancel pending worker expectation, clear `avoidRoutes` so `DependencyEdge` falls through to `getSmoothStepPath`. Do not schedule libavoid on drag move. On drag stop / layout apply / switch to libavoid: schedule worker. While `avoidRoute` missing under libavoid mode → smooth-step (covers in-flight too).
- **Why:** Confirmed product decision; cheaper and more predictable than live sessions.
- **Alternatives:** Keep last routes during drag (looks wrong as nodes move). Live session (branch plan) — out of scope.

### 6. Overlap re-route vs hops

- **Choice:** Collinear segment overlap groups → hierarchical re-route pass (branch п6), exposed as the **overlap** progress phase. H×V crossings → visual hops only (`collectCrossingJumps`, radius 1.5), suppressed via `isEdgeEmphasized`.
- **Why:** Confirmed; matches branch split of concerns; progress phase aligns with the pass.

### 7. Wasm packaging

- **Choice:** Depend on `@mr_mint/elkjs-libavoid`; copy `libavoid.wasm` via Vite plugin into build/dev output (no git-committed wasm, no postinstall script) — same intent as branch plan.
- **Why:** Keeps install simple and matches Vite app model.

### 8. Path merge location

- **Choice:** Keep numeric routes in hook state; merge into edge `data` (`avoidPath` / `avoidPathWithJumps`) before render, or compute path in `DependencyEdge` from `avoidRoute` + jumps. Prefer precomputed paths in merge helper (branch) to keep edge render cheap.
- **Why:** Branch already does this cleanly with emphasis choosing jumped vs plain path.

## Risks / Trade-offs

- **[Risk] Worker + wasm init cost / transfer size** → Mitigation: init once per worker lifetime; send compact geometry DTOs; generation cancel; batch size ~30 as on branch.
- **[Risk] Hierarchical containment still can stall rare graphs** → Mitigation: keep opaque collapse + batching + overlap pass from branch; profile with existing bench script if ported.
- **[Risk] Smooth-step during every drag feels like a “flash”** → Accepted trade-off vs jank; document in UI label that mode is slow.
- **[Risk] Port drift from branch** → Mitigation: bring unit tests from branch (`nodesToLibavoidGraph`, levels, overlap, hops, merge) and adapt imports.

## Migration Plan

- Additive enum value; old workspaces unchanged (default bezier).
- No data migration beyond schema allowing the new enum member.
- Rollback: remove edges-type option / dependency; users with saved `libavoidOrthogonal` fall back via schema default or coerce to `simpleOrthogonal` if needed at load — prefer accepting unknown → default only if Zod rejects; otherwise keep round-trip.

## Open Questions

- Exact worker DTO shape (full RF nodes vs stripped `{id,x,y,w,h,type,parentId}`) — implementer’s choice as long as transfer stays structured-clone friendly and tests cover the public scheduling behavior.
