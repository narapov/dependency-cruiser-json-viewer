# Tasks

## 1. Cache model and helpers

- [x] 1.1 Define `GroupLayoutEntry` / `LayoutCache` types (group id, width/height, children map with position+size) under DependencyGraph helpers and verify TypeScript compiles for the new module
- [x] 1.2 Implement serialize/deserialize (root `null` ↔ `""`) and membership-match / invalidate helpers; verify unit tests cover round-trip and child-id set mismatch
- [x] 1.3 Implement merge-visible / preserve-hidden cache update from a laid-out node tree; verify unit tests keep collapsed group entries across a merge

## 2. BuildGraph + ELK interactive

- [x] 2.1 Extend `BuildGraphInput` / worker request with a serializable layout-cache snapshot; verify worker message types still type-check
- [x] 2.2 Spike in `layoutChildren`: for membership-matched groups, either apply cache geometry directly or seed ELK interactive positions; for mismatch, invalidate and cold-layout; verify `buildGraph` tests restore positions on re-expand with matching children and cold-layout when membership changes
- [x] 2.3 After layout, return enough data for main thread to merge visible groups into the cache; verify a buildGraph (or helper) test that merge updates visible entries only

## 3. Wire hooks (build + layout ownership)

- [x] 3.1 Hold `layoutCacheRef` on the main thread; pass snapshot into `useBuildGraph` / worker and merge on success; verify hook/integration test that expand→collapse→expand keeps child positions from cache
- [x] 3.2 Strip post-build `applyPositionCache` / fingerprint / `reflowParentSiblings` rebuild pipeline from `useGraphLayoutNodes` (or successor) so RF nodes come from build (+ DnD); verify existing layout hook tests updated or removed accordingly and `npm run test` passes for DependencyGraph layout suites
- [x] 3.3 Wire auto-layout folder / recursive to invalidate the folder entry (± descendants) then trigger rebuild; verify tests assert which cache keys are dropped

## 4. DnD without rebuild

- [x] 4.1 Implement drag overlap resolution: push overlapping siblings down, grow ancestors recursively, write affected group entries into the cache; verify unit tests for overlap push-down and parent grow
- [x] 4.2 Ensure drag/drag-stop updates RF nodes + cache and does not start a graph build; verify hook test spies that build is not invoked on drag

## 5. Workspace persistence

- [x] 5.1 Add workspace schema field for group layouts (sizes included); dual-read legacy `nodePositions` into the new cache shape; verify Zod parse tests for new shape and legacy positions-only files
- [x] 5.2 Update normalize/prune/reconcile/store/orchestration save-load to use the new snapshot; verify workspace store and parse/replace tests cover prune and round-trip
- [x] 5.3 Bridge `DependencyGraph` get/set layout state to the new cache snapshot; verify load-workspace restores nested layouts when expansions match (hook or component-level test)

## 6. Cleanup and verification

- [x] 6.1 Remove obsolete `graphLayoutCache` helpers that only served the old post-process path; verify no unused exports and `npm run depcruise` passes if import boundaries moved
- [x] 6.2 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; verify all succeed

## 7. Cascading overlap settle (build + DnD)

- [x] 7.1 Extract shared top-down vertical settle helper (`fixedIds` optional; only push down with `GRID_GAP_Y`); verify unit tests for stack `a > b > c` when `a` grows into `b` (cascade, no teleport under `c`)
- [x] 7.2 After `applyCachedGroupLayout` in `layoutChildren`, run settle with no fixed ids and recompute parent size from settled children; verify build/layoutGroup test: expand above a manually moved sibling clears overlap without jumping order
- [x] 7.3 Replace DnD `pushOverlappingSiblingsDown` teleport logic with the shared settle (`fixedIds = { dragged }`); verify reflow tests cover `a > b > c` drag/grow cascade and existing parent-grow behavior still holds
- [x] 7.4 Re-run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; verify all succeed
