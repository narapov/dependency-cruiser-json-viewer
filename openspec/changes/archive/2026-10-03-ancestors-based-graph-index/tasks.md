# Tasks

## 1. Shared parent / children index from ancestors

- [x] 1.1 Replace duplicate `buildParentByNode` implementations with one helper that builds `parentByNode` (and optionally `childrenByParent`) from a flat layouted-node map using `ancestors[0] ?? null`; document the no-skip-level visible-tree invariant in its JSDoc; verify a unit test that nested fixtures match expected parent/sibling ids
- [x] 1.2 Wire `useCustomPositionedGraph` / `toReactFlowNodes` to the shared helper; remove DFS/`children`-walk builders; verify existing parentByNode assertions in `toReactFlowGraph` / custom-positioned tests still pass

## 2. React Flow conversion and depth sort

- [x] 2.1 Set RF `parentId` from `ancestors[0]` (via the shared index or directly) in `toReactFlowNodes`; verify folder/file nesting tests still pass
- [x] 2.2 Change `sortNodesByDepth` to order by layouted `ancestors.length` without `cruiseSnapshot.nodes` lookups; update its tests; verify `toReactFlowNodes` still returns parents before children

## 3. Reflow and group helpers use ancestors upward

- [x] 3.1 In `customPositionedGraph/reflowDragPushDown`, walk `node.ancestors` for bubble-up and deepest-first normalize/resize (no climb + `getGroupDepth` sort); verify reflow / normalize / applyPositions tests still pass
- [x] 3.2 Update `updateCacheFromPositions` (and any remaining live climb sites) to advance via `ancestors` / shared index; remove or slim `getGroupDepth` if unused; verify cache-update tests still pass
- [x] 3.3 Point hot `getDirectChildren` call sites at `childrenByParent` (or equivalent O(1) sibling list from the shared builder); verify `getDirectChildren` / normalize / resolveGroupSize tests still pass

## 4. Verification

- [x] 4.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; fix regressions from this change
