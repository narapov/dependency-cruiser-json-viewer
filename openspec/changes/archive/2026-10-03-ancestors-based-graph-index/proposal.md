# Proposal

## Why

Layouted visible-tree nodes already carry `ancestors` (nearest → root), but React Flow conversion and drag reflow still rebuild parent chains by walking `children` / climbing `parentByNode`, and depth sorting re-looks up the cruise snapshot. That duplicates precomputed ancestry and makes sibling lookups scan the full node set on each group visit.

## What Changes

- Derive React Flow `parentId`, parent index entries, and parent-before-child ordering from each layouted node's `ancestors` (not from children DFS or snapshot ancestor lookups).
- In custom-positioned drag reflow / cache update / group depth, use `ancestors` for upward climbs and deepest-first ancestor work instead of reconstructing chains via `parentByNode` + `getGroupDepth` walks.
- Keep an **id-based** downward index for siblings (`parentByNode` and/or `childrenByParent`), built from `ancestors[0]` in one pass over the flat node map — do not repair or rely on `node.children` object links after shallow copies.
- Leave user-visible layout/drag behavior unchanged (`graph-layout-cache` requirements stay as-is).

## Capabilities

### New Capabilities

<!-- none — pure internal refactor; skip_specs: true -->

### Modified Capabilities

<!-- none — no requirement-level behavior change -->

## Impact

- Code: `toReactFlowGraph`, `sortNodesByDepth`, `customPositionedGraph` (`buildParentByNode`, `getGroupDepth`, `reflowDragPushDown`, `updateCacheFromPositions`, `getDirectChildren` call sites), possibly align with libavoid's `ancestors[0]` parent pattern.
- Public behavior: unchanged (RF nesting, drag settle/compact/resize, cache updates).
- Tests: update unit tests that assert parent-map construction / depth sort inputs; keep drag/reflow behavioral tests green.
- Specs: none (`skip_specs: true`).
