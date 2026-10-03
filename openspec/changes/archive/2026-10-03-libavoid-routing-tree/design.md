# Design

## Context

See proposal.md for motivation and `specs/graph-libavoid-routing-tree/spec.md` for behavior.

**Current code (partially applied):** libavoid routing already takes an enriched tree + thin edges (no RF in the worker core). `VisibleTreeNode` now carries `ancestors` (from `cruiseSnapshot.nodes[path].ancestors`) and `descendants` (visible children walk in `getVisibleTree`).

**Still wrong:** `buildGraph` still does `createLayoutedTree` (clone with empty geometry) then `layoutChildren` **mutates** `position` / `width` / `height` in place. That clone exists only to enable mutation. Layout must become a pure transform instead.

## Goals / Non-Goals

**Goals:**

- Domain visible tree owns hierarchy indexes: `ancestors` from cruise snapshot, `descendants` from visible expansion.
- Layout is a pure function: `visibleTree` (+ snapshot, selection, profiler, cache) → **new** layouted node(s) with sizes and positions. No in-place writes. No pre-clone “slots for mutation”.
- Libavoid worker intake remains tree + thin edges; flatten → Map; LCA via `ancestors`; opaque collapse via `descendants`.
- Keep multi-pass libavoid behavior, progress, smooth-step during drag/in-flight, and port assignment on edges.

**Non-Goals:**

- Changing ELK quality, edges-type UX, wasm packaging, or hop rendering.
- Separate geometry `Map` overlay as the primary layout output (rejected in explore — output is new nodes).
- Live per-frame libavoid during drag.
- Archiving prior libavoid / edge-ports changes into main specs (orthogonal concern).

## Decisions

### 1. Indexes live on `VisibleTreeNode` (getVisibleTree)

- **Choice:** `ancestors` = `cruiseSnapshot.nodes.get(path).ancestors` (same array reference, no copy). `descendants` = paths of visible nodes strictly below (folders + files), computed while building the visible tree.
- **Why:** Visible child ⇒ visible parents; FS ancestry from snapshot is the routing LCA chain. Descendants must be visible-only (not cruise `descendantFiles`).
- **Alternatives:** Recompute ancestors while walking layouted children — rejected; snapshot is the source of truth for ancestry.

### 2. Layout returns new nodes (no mutate, no createLayoutedTree)

- **Choice:** Replace `createLayoutedTree` + mutating `layoutChildren` with a single pure layout entry, conceptually:

  ```
  layout(visibleTree, cruiseSnapshot, selectedFilePaths, profiler?, cache?)
    -> VisibleTreeLayoutedNode[]   // new objects: sizes + positions
  ```

  Recurse: layout children first (get sized nodes) → ELK/cache positions → return **new** parent/children with `position` / `width` / `height`. Leaf sizes from `getLeafNodeSize`. Share `ancestors` / `descendants` references from the input visible node.

- **Why:** Layout is a value transform. Mutation forced a meaningless clone step and mixed domain identity with ephemeral geometry on the same object lifecycle.
- **Alternatives:** Geometry `Map<path, {x,y,w,h}>` beside an immutable tree — pure, but every consumer joins by path; explore locked new nodes as the output shape.

### 3. Drop / thin `enrichLayoutedVisibleTree`

- **Choice:** After pure layout, layouted nodes already have indexes + geometry. Worker DTO is either the layouted tree (minus fields worker ignores) or a thin map that only strips non-routing fields — not a second “enrichment” walk that recomputes ancestors/descendants.
- **Why:** Enrich-after-layout was the old plan; indexes moved to `getVisibleTree`. A third clone pass is noise.
- **Alternatives:** Keep enrich as structuredClone for the worker — only if needed for clone safety, not for computing indexes.

### 4. Worker wire format: tree + thin edges

- **Choice:** `{ tree, edges }` structured-clone-friendly; no RF types; no `parentByNode` on the wire. Unchanged from applied work.
- **Why:** Single hierarchy source for the worker.

### 5. Flatten → Map inside worker; LCA / opaque

- **Choice:** Flatten tree → `Map<path, node>`; LCA via path ∪ `ancestors`; opaque folders via `descendants`. Unchanged intent from applied work.
- **Why:** Spec + architecture (prefer Map after one tree walk).

### 6. Hook / DnD geometry

- **Choice:** Schedule from layouted/routing tree + thin edges. After drag stop, produce **new** tree nodes (or patch helper that returns new objects) with updated relative geometry — still no cruise visible-tree rebuild; still no in-place mutation of the build result if that result is treated as immutable.
- **Why:** Same product behavior; consistent with pure layout.

### 7. buildGraph orchestration

- **Choice:** `buildGraph` calls pure layout once, indexes the returned roots into `nodes` / `tree`, assigns ports, builds worker-facing tree from that result. Delete `createLayoutedTree` as a separate mutate-prep step.
- **Why:** One pipeline stage for geometry.

## Risks / Trade-offs

- **[Risk] Allocating new trees each layout pass** → Acceptable; layout already runs in a worker / off hot path; clearer than hidden mutation. Measure if needed.
- **[Risk] DnD / layout-cache paths still mutate elsewhere (RF nodes, cache)** → Out of scope for this decision except routing-tree patch must return new objects.
- **[Risk] Spec text still says “enrich after layout”** → Update delta spec / proposal / tasks to match (see open follow-ups).
- **[Risk] Behavioral drift while rewriting layoutChildren to return values** → Keep existing layout tests; assert input `visibleTree` is untouched after layout.

## Migration Plan

- Internal API only within GraphCanvas build/layout helpers.
- Incremental: rewrite `layoutChildren` to return new nodes → delete `createLayoutedTree` → simplify enrich → adjust `buildGraph`.
- Rollback: revert to clone+mutate layout (not desired long-term).

## Open Questions

- Whether worker posts `VisibleTreeLayoutedNode[]` directly or a dedicated thin routing DTO without `valueCircular` / `typeOnlyCircular` — either is fine if clone stays cheap.
- Whether root-level positions are assigned inside the same pure layout call as nested groups (preferred: one function) or a thin wrapper around today’s per-group recursion.
