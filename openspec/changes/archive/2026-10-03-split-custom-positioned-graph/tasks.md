# Tasks

## 1. Helper module restructure

- [x] 1.1 Move `settleOverlapsTopDown` (and `nodesOverlap` if only used by settle) under `helpers/buildGraph/`; update `layoutGroup` and existing settle tests; verify `npm run test -- settleOverlapsTopDown layoutGroup` passes and imports no longer come from `groupLayoutCache`
- [x] 1.2 Rename `groupLayoutCache` → `layoutCache` (persistence only: types, serialize, merge, invalidate, groupMembership); remove reflow from that package; update barrels/imports; verify affected unit tests pass
- [x] 1.3 Create `helpers/customPositionedGraph/` and move reflow + cache-from-positions into it; rewrite them to operate on layouted-tree geometry (no `@xyflow/react` `Node`); verify reflow unit tests pass without RF node factories
- [x] 1.4 Port size/depth helpers needed by reflow into `customPositionedGraph` (RF-free); delete unused `getAbsoluteNodePosition`, `isDescendantOf`, and obsolete RF `createTestNode` if unreferenced; verify `rg` shows no remaining references and tests pass
- [x] 1.5 Add `applyPositions(positions, { commitToCache })` helper (or hook-local wrapper over reflow + optional cache write); verify unit tests cover commit false (no cache mutation) vs true (cache entries updated) and dragged node stays fixed

## 2. Hooks split

- [x] 2.1 Implement `useCustomPositionedGraph` (merge build layouts into cache, maintain live positioned graph, snapshots, auto-layout invalidate + rebuild request, integrate libavoid using live geometry + `isDragging`); verify hook tests cover build refresh, applyPositions commit flag, and routing suppressed while dragging
- [x] 2.2 Implement `useReactFlowGraph` as RF projection + drag bridge (`setIsDragging`, `applyPositions` with commit false/true); verify hook tests cover projection from positioned graph and drag start/move/stop calling apply with the correct commit flag
- [x] 2.3 Remove or thin `useGraphLayoutNodes` after callers migrate; verify no remaining imports of the old hook

## 3. GraphCanvas wiring

- [x] 3.1 Rewire `GraphCanvas` to: `useBuildGraph` → Canvas `isDragging` → `useCustomPositionedGraph` → `useReactFlowGraph`; pass results into existing highlights/fit/menus; verify TypeScript build for GraphCanvas and component/hook tests that wrap the canvas still pass
- [x] 3.2 Ensure `useLibavoidEdgeRouting` (inlined or called from custom-positioned hook) no longer requires RF `Node[]` for geometry overlay; verify libavoid hook/worker tests still pass with layouted-tree geometry

## 4. Integration verification

- [x] 4.1 Run `npm run lint`, `npm run format:check`, `npm run test`, `npm run depcruise`, and `npm run build`; fix any regressions from the rename/split
- [x] 4.2 Manually smoke-check (or document in PR): drag settles siblings without rebuild, cache persists after drag stop / workspace save, auto-layout invalidate still rebuilds, libavoid clears during drag and restores after
