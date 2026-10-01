# Tasks

## 1. Decouple edge style from layout apply

- [x] 1.1 Remove `edgesType` from `layoutApplyKey` in `DependencyGraph.tsx` so the layout-restore effect keys only on `autoLayoutOnly` and persisted `nodeLayouts` / `nodePositions`; verify changing edge style in the UI updates paths without a loader / rebuild and that dragged (unsaved) positions remain
- [x] 1.2 Confirm `DependencyEdge` still reads `edgesType` from the workspace store (no prop/rebuild wiring needed) and that switching style still works for bezier / straight / simpleOrthogonal; verify with a quick manual check or existing path-helper unit coverage if no graph-level test is practical
- [x] 1.3 Run `npm run lint`, `npm run format:check`, and `npm run test`; fix any fallout from the `layoutApplyKey` edit
