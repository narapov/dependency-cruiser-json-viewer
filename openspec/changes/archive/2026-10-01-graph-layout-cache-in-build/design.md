# Design

## Context

See proposal.md — Why. Today layout memory lives in `useGraphLayoutNodes` (`positionCacheRef` + fingerprint of child ids only) and is applied _after_ ELK via `applyPositionCache` / `reflowParentSiblings`. `buildGraph` / `layoutGroup` always cold-layouts; the worker request has no layout cache field. Workspace `nodePositions` is `groupId → childId → {x,y}` with no sizes (`viewerWorkspaceSettingsSchema`).

Constraints that shape this design:

- `buildGraph` runs in a dedicated worker (`runBuildGraphInWorker`); React refs cannot cross the boundary — only structured-cloneable snapshots.
- Per-folder layout is recursive sibling ELK in `layoutChildren` — the natural cache unit is one group’s direct children.
- DnD must stay on the main thread and must not enqueue a rebuild.

## Goals / Non-Goals

**Goals:**

- Single authoritative group layout cache used by build (interactive ELK) and DnD.
- Stable restore across collapse/expand and workspace load when membership matches.
- Cascading top-down vertical overlap settle after cache apply and on DnD (dragged fixed)—no sibling teleport under the stack.
- Delete the post-ELK “heal with reflow” pipeline as the primary layout path.

**Non-Goals:**

- Changing ELK algorithm family (stays layered / RIGHT) beyond interactive strategies and position seeding.
- Redesigning selection, edges, or folder coloring.
- Perfect pixel-identity with pre-change manual layouts from legacy position-only files.

## Decisions

### 1. Cache model: group entries, not flat node map

```
LayoutCache = Map<GroupId, GroupLayoutEntry>
GroupId = string | null   // serialize null root as ""

GroupLayoutEntry {
  id: GroupId
  width: number
  height: number
  children: Map<childId, {
    id: string
    position: { x: number; y: number }  // parent-relative
    width: number
    height: number
  }>
}
```

**Why:** Matches `layoutChildren` scope; membership invalidate is `Set(child ids) !== Set(entry.children.keys())`.  
**Alternative considered:** Flat `path → geometry` — weaker invalidate story; rejected in exploration.

### 2. Invalidate rules

| Condition                   | Action                                             |
| --------------------------- | -------------------------------------------------- |
| No entry for group          | Cold ELK                                           |
| Child-id set ≠ entry keys   | Drop entry, cold ELK                               |
| Same ids, child w/h changed | Keep entry; seed new size + cached position        |
| Auto layout on folder F     | Drop F’s entry                                     |
| Auto layout recursive on F  | Drop F + descendant group entries                  |
| `autoLayoutOnly`            | Ignore cache for seed/write (treat builds as cold) |

### 3. Build path: snapshot in → apply/cold ELK → overlap settle → merge out

```
Main: layoutCacheRef
  | serialize snapshot
  v
Worker buildGraph(input, layoutCache)
  layoutChildren(..., cache):
    recurse expanded children first (sizes)
    if membershipOk(group, cache):
      apply cached child positions (current child sizes)
      resolveOverlapsTopDown(siblings)   // no fixed ids
    else:
      invalidate + cold elk
    write positions/sizes onto tree (parent bounds from settled children)
  return visible geometry for main merge
  v
Main: mergeVisibleGroups(cacheRef, result); preserve hidden entries
```

Implementation note: exact-membership groups currently apply cache geometry directly (ELK interactive optional). Overlap settle is mandatory after cache apply whenever sibling rectangles can collide—especially when a child's width/height grew while positions stayed cached.

**Why worker snapshot:** unavoidable with current worker architecture.  
**Alternative:** move layout to main thread — rejected; keep worker for heavy ELK.

### 4. Shared cascading settle; DnD keeps dragged fixed

**Settle algorithm** (shared helper; tree nodes or RF nodes):

```
sort siblings by y, then x
settled = []
for each node in order:
  if id in fixedIds:
    keep position
  else:
    y = node.y
    for s in settled:
      if overlaps(node at (x,y), s):
        y = max(y, s.bottom + GRID_GAP_Y)
    node.y = y   // x unchanged; only push down
  settled.push(node)
```

- **Build (after cache apply):** `fixedIds = ∅` — pure top-down cascade.
- **DnD:** `fixedIds = { draggedId }` after applying the drag position; then same settle among siblings; grow ancestors; bubble by re-settling the grown parent against its siblings (existing ancestor walk).

Do **not** teleport an overlapped sibling to `max(other.bottom)` among all siblings in one shot—that jumps `B` under `C` when `A > B > C` and `A` grows into `B`. Cascade only.

Do **not** call `buildGraph` / `useBuildGraph` invalidate for drag.

Horizontal push remains out of the primary path (vertical-first only).

### 5. Hook responsibilities after the change

- `useBuildGraph`: accept cache snapshot (or read from a shared ref owned by a thin layout controller), pass into worker; on result, merge cache.
- `useGraphLayoutNodes` (or successor): own `layoutCacheRef`, wire DnD, expose get/set snapshot for workspace, call invalidate APIs for auto-layout actions; **stop** running `applyPositionCache` / `reflowParentSiblings` / fingerprint invalidate on every `graphResult` change as the merge layer — geometry comes from the build (plus live DnD).
- `DependencyGraph`: continue bridging workspace ↔ layout snapshot; update types from `nodePositions` to group-layout snapshot.

### 6. Workspace persistence

- Prefer new field (e.g. `nodeLayouts`) with full group entries; keep reading legacy `nodePositions` for migration (seed child positions; omit sizes → incomplete entry handling on first build).
- Bump or extend schema carefully: Zod + `replaceWorkspaceSettings` / prune / normalize / reconcile / orchestration save path.
- Prune cache entries whose group or child paths are no longer in the cruise snapshot (same spirit as today’s `pruneNodePositions`).

**Alternative:** overload `nodePositions` nested shape with sizes — possible but messier for migration typing; prefer explicit `nodeLayouts` (or rename with dual-read).

### 7. Retirement of post-process graphLayoutCache

Remove or reduce to:

- shared geometry helpers still needed for DnD (overlap test, gaps, resize parent from children),
- serialize/deserialize for the new cache shape,
- tests rewritten around build+cache and DnD.

Delete fingerprint-only invalidate, `preserveExpandedGroupPositions` pipeline, `migrateReparentedNodePositions`, `reflowParentSiblings` iteration loop as the rebuild merge path once build-side cache is in place.

## Risks / Trade-offs

- [ELK interactive does not perfectly honor coordinates] → Mitigation: for fully matching groups, optionally bypass ELK and apply cache geometry directly, using interactive only when mixed with new siblings inside a still-valid membership… (membership mismatch already cold-layouts whole group). Prefer apply-cache-directly for exact membership match if interactive drifts in practice; keep interactive for partial cases only if we ever reintroduce them (currently we don’t).
- [Cache apply without settle leaves overlaps when child sizes grow] → Mitigation: mandatory cascading top-down settle after cache apply in `layoutChildren`; same helper for DnD with dragged fixed.
- [Naive “push to clear all others” teleports siblings under the stack] → Mitigation: settle in y-order; only push relative to already-settled nodes above.
- [Worker payload size for large caches] → Mitigation: send only entries needed for visible groups + ancestors, or full cache if typically small; measure on real cruise JSON.
- [Schema break for saved workspaces] → Mitigation: dual-read legacy `nodePositions`; document in changelog.
- [Race: DnD updates cache while rebuild in flight] → Mitigation: rebuild merge must not clobber hidden entries; visible merge should prefer latest cache generation token or ignore stale worker results (existing cancel/terminate pattern in `useBuildGraph`).

## Migration Plan

1. Land cache types + serialize/deserialize + build wiring behind the new snapshot shape.
2. Switch DnD to cache updates; strip post-process rebuild merge.
3. Add workspace field + migration from `nodePositions`.
4. Add cascading overlap settle on build (after cache) and fix DnD push to use the same settle (dragged fixed).
5. Update tests; remove obsolete helpers.
6. Rollback: revert change; legacy files still readable if dual-read kept until a later removal of `nodePositions`.

## Open Questions

- Exact ELK option set for reliable interactive restore vs “apply cache directly when membership matches” — decided in implementation toward apply-cache-directly for exact membership; settle covers size-growth collisions.
- Whether root group (`""`) stores meaningful width/height for persistence or only children (root size may be derived); implement as stored bounds from layout for consistency.
