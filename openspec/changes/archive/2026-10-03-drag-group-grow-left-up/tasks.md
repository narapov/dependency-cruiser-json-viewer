# Tasks

## 1. Remove parent extent clamp

- [x] 1.1 Remove `extent: 'parent'` from nested React Flow nodes in `toReactFlowGraph` (including any commented remnant) and update `toReactFlowGraph` tests so they no longer expect `extent: 'parent'`; verify with `npm run test -- toReactFlowGraph`

## 2. Content-origin normalize helper

- [x] 2.1 Add `normalizeGroupContentOrigin` (or equivalent) under `helpers/customPositionedGraph/` that, for an expanded folder group, computes shift to `(GROUP_PADDING, GROUP_HEADER + GROUP_PADDING)`, applies it to all direct children, and applies the opposite shift to the group's position when the group has a parent; verify with unit tests covering left overflow, up/header overflow, no-op when already at origin, and world-position preservation (`npm run test -- normalizeGroupContentOrigin`)
- [x] 2.2 Export the helper from the custom-positioned-graph barrel and verify `npm run depcruise` passes if import edges changed

## 3. Wire normalize into drag reflow

- [x] 3.1 Integrate normalize into `reflowDragPushDown` after sibling settle and before/with ancestor resize (deepest-first), skipping the synthetic root group; verify existing reflow tests still pass and add cases for drag left growing width + moving the group, drag up clearing header origin, and nested bubble into a sibling group (`npm run test -- reflowDragPushDown applyPositions`)
- [x] 3.2 Confirm `updateCacheFromPositions` / apply path persists updated child positions and ancestor group position/size after left/up normalize; extend `applyPositions` or cache tests if coverage is missing (`npm run test -- applyPositions updateCacheFromPositions`)

## 4. Verification

- [x] 4.1 Run `npm run lint`, `npm run format:check`, and `npm run test` for the touched GraphCanvas helpers; fix any regressions from the reflow/extent changes

## 5. Bidirectional left/top compact (signed shift)

- [x] 5.1 Change `normalizeGroupContentOrigin` to use signed `Sx/Sy = origin - min` (remove `Math.max(0, …)`); replace the “does not pull children left when past origin” test with leftmost-right and topmost-down shrink cases that assert content origin, world-position preservation, and group translation; verify `npm run test -- normalizeGroupContentOrigin`
- [x] 5.2 Add `reflowDragPushDown` (and cache via `applyPositions` if useful) cases for leftmost child dragged right and topmost child dragged down; verify ancestor bubble still compacts; run `npm run test -- reflowDragPushDown applyPositions` then `npm run lint` and `npm run format:check`
