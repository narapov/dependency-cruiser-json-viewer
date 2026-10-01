# Tasks

## 1. Nest canvas UI partials

- [x] 1.1 `git mv` canvas-only UI folders into `partials/GraphCanvas/partials/` (DependencyEdge, EdgeContextMenuHeader, FileNode, FolderExpandToggle, FolderGroupNode, FolderNode, GraphLayoutToggle, GraphLegend, GraphLoader, GraphMarkers, NodeContextMenu), leave shell partials (`EdgesTypePickerDialog`, `GraphEmptySelection`, `GraphCanvas`) in place, fix relative imports inside moved modules and `GraphCanvas.tsx`, and verify TypeScript resolves those imports (`npx tsc -b --pretty false` or affected IDE diagnostics clear)
- [x] 1.2 Run co-located tests for moved UI partials (`npm run test --` scoped to `GraphCanvas/partials` or the moved folders) and verify they pass

## 2. Nest hooks, stores, and helpers

- [x] 2.1 Move all of `DependencyGraph/hooks/` under `partials/GraphCanvas/hooks/` (including barrels), update `GraphCanvas` and any remaining consumers, remove the empty feature-root `hooks/`, and verify hook unit tests under the new path pass
- [x] 2.2 Move `stores/graphMarkersStore` and `stores/selectedDependencyEdgeStore` under `partials/GraphCanvas/stores/`, update imports in canvas modules/tests, remove empty feature-root `stores/`, and verify store + dependent hook/component tests pass
- [x] 2.3 Move all of `DependencyGraph/helpers/` under `partials/GraphCanvas/helpers/`, update imports (including worker/buildGraph paths), remove empty feature-root `helpers/`, and verify helper unit tests under the new path pass

## 3. Split types and provider ownership

- [x] 3.1 Move canvas-internal types (`BuildGraph`, `FileNodeData`, `FolderNodeData`, `FolderChildren`, `DependencyEdgeData`) into `partials/GraphCanvas/types/` with a barrel; keep shell `types/` limited to `DependencyGraphHandle` (+ `GraphLayoutState`) and `SerializedLayoutCache`; update imports so App still gets handle types only from `DependencyGraph`; verify `DependencyGraph/index.ts` does not re-export canvas internals
- [x] 3.2 Move `ReactFlowProvider` into `GraphCanvas`, simplify shell to selection gate + dialog + container CSS only, update `DependencyGraph.test.tsx` mocks/expectations if needed, and verify empty-selection and selected-graph DependencyGraph tests still pass

## 4. Integration check

- [x] 4.1 Run `npm run lint`, `npm run format:check`, `npm run test`, `npm run depcruise`, and `npm run build`; confirm feature-root no longer has `hooks/`, `helpers/`, or `stores/`, and `partials/` only contains `EdgesTypePickerDialog`, `GraphEmptySelection`, and `GraphCanvas`
